package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

// --- Configuration ---
const (
	OTPExpiration = 5 * time.Minute
)

// --- Database Connection ---
var db *sql.DB

func initDB() {
	var err error
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		// Fallback for local testing without docker compose env set yet
		connStr = "host=localhost user=postgres password=postgres dbname=taaza_auth sslmode=disable"
	}

	// Retry connection loop for Docker startup
	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", connStr)
		if err == nil {
			err = db.Ping()
			if err == nil {
				log.Println("Connected to Database")
				return
			}
		}
		log.Printf("Failed to connect to DB (attempt %d/10): %v. Retrying in 2s...", i+1, err)
		time.Sleep(2 * time.Second)
	}
	log.Fatal("Could not connect to database after retries")
}

func initSchema() {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email TEXT UNIQUE NOT NULL,
		mobile TEXT UNIQUE NOT NULL,
		name TEXT,
		dob DATE,
		gender TEXT,
		status TEXT DEFAULT 'Active',
		block_reason TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE TABLE IF NOT EXISTS otps (
		email TEXT PRIMARY KEY,
		code TEXT NOT NULL,
		expires_at TIMESTAMP NOT NULL
	);

	CREATE TABLE IF NOT EXISTS addresses (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		tag TEXT NOT NULL,
		house_no TEXT NOT NULL,
		landmark TEXT,
		full_address TEXT NOT NULL,
		latitude DECIMAL(10,8),
		longitude DECIMAL(11,8),
		receiver_name TEXT NOT NULL,
		receiver_phone TEXT NOT NULL,
		is_default BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Milk Subscriptions
	CREATE TABLE IF NOT EXISTS milk_subscriptions (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		address_id INTEGER REFERENCES addresses(id),
		status TEXT DEFAULT 'Active',
		auto_pay BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Subscription Slots (Morning/Evening)
	CREATE TABLE IF NOT EXISTS subscription_slots (
		id SERIAL PRIMARY KEY,
		subscription_id INTEGER REFERENCES milk_subscriptions(id) ON DELETE CASCADE,
		slot_type TEXT NOT NULL,
		milk_type TEXT NOT NULL,
		quantity DECIMAL(4,2) NOT NULL,
		time_slot TEXT NOT NULL,
		frequency TEXT NOT NULL,
		days TEXT[],
		is_enabled BOOLEAN DEFAULT true
	);

	-- Daily Deliveries
	CREATE TABLE IF NOT EXISTS deliveries (
		id SERIAL PRIMARY KEY,
		subscription_id INTEGER REFERENCES milk_subscriptions(id),
		slot_id INTEGER REFERENCES subscription_slots(id),
		user_id INTEGER REFERENCES users(id),
		delivery_date DATE NOT NULL,
		slot_type TEXT NOT NULL,
		quantity DECIMAL(4,2) NOT NULL,
		milk_type TEXT NOT NULL,
		address TEXT,
		customer_name TEXT,
		status TEXT DEFAULT 'Pending',
		delivered_at TIMESTAMP,
		delivered_by TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Inventory
	CREATE TABLE IF NOT EXISTS inventory (
		id SERIAL PRIMARY KEY,
		date DATE UNIQUE NOT NULL,
		buffalo_stock DECIMAL(8,2) DEFAULT 0,
		cow_stock DECIMAL(8,2) DEFAULT 0,
		buffalo_sold DECIMAL(8,2) DEFAULT 0,
		cow_sold DECIMAL(8,2) DEFAULT 0,
		wastage DECIMAL(8,2) DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Pricing
	CREATE TABLE IF NOT EXISTS pricing (
		id SERIAL PRIMARY KEY,
		milk_type TEXT UNIQUE NOT NULL,
		price DECIMAL(8,2) NOT NULL,
		previous_price DECIMAL(8,2),
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := db.Exec(query)
	if err != nil {
		log.Fatal("Failed to create schema:", err)
	}
	
	// Add status column if it doesn't exist (for existing tables)
	db.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active'")
	
	// Add block_reason column if it doesn't exist
	db.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS block_reason TEXT")
	
	// Add role column if it doesn't exist
	db.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'")

	// Seed Admin User (amarnathm9945@gmail.com)
	// Upsert: Create if not exists, or update role to admin if exists
	_, err = db.Exec(`
		INSERT INTO users (email, mobile, name, role, status) 
		VALUES ($1, $2, $3, 'admin', 'Active')
		ON CONFLICT (email) 
		DO UPDATE SET role = 'admin', status = 'Active', updated_at = NOW()
	`, "amarnathm9945@gmail.com", "0000000000", "Admin User")
	
	if err != nil {
		log.Println("Failed to seed/update admin:", err)
	} else {
		log.Println("Seeded/Updated admin user: amarnathm9945@gmail.com")
	}

	// Seed default pricing
	db.Exec(`INSERT INTO pricing (milk_type, price, previous_price) VALUES ('buffalo', 90, 85) ON CONFLICT (milk_type) DO NOTHING`)
	db.Exec(`INSERT INTO pricing (milk_type, price, previous_price) VALUES ('cow', 60, 55) ON CONFLICT (milk_type) DO NOTHING`)
	
	log.Println("Schema initialized with milk subscription tables")
}

// --- Models ---
type OTPEntry struct {
	Email     string    `json:"email"`
	Code      string    `json:"code"`
	ExpiresAt time.Time `json:"expires_at"`
}

type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Mobile    string    `json:"mobile"`
	Name      string    `json:"name"`
	DOB       string    `json:"dob,omitempty"`
	Gender    string    `json:"gender,omitempty"`
	Role      string    `json:"role"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Address struct {
	ID            int     `json:"id"`
	UserID        int     `json:"user_id"`
	Tag           string  `json:"tag"`
	HouseNo       string  `json:"house_no"`
	Landmark      string  `json:"landmark"`
	FullAddress   string  `json:"full_address"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	ReceiverName  string  `json:"receiver_name"`
	ReceiverPhone string  `json:"receiver_phone"`
	IsDefault     bool    `json:"is_default"`
	CreatedAt     string  `json:"created_at"`
}

// --- Milk Subscription Models ---
type MilkSubscription struct {
	ID           int                `json:"id"`
	UserID       int                `json:"user_id"`
	AddressID    int                `json:"address_id"`
	Status       string             `json:"status"`
	AutoPay      bool               `json:"auto_pay"`
	CustomerName string             `json:"customer_name,omitempty"`
	Address      string             `json:"address,omitempty"`
	Slots        []SubscriptionSlot `json:"slots,omitempty"`
	CreatedAt    string             `json:"created_at"`
	UpdatedAt    string             `json:"updated_at"`
}

type SubscriptionSlot struct {
	ID             int      `json:"id"`
	SubscriptionID int      `json:"subscription_id"`
	SlotType       string   `json:"slot_type"`
	MilkType       string   `json:"milk_type"`
	Quantity       float64  `json:"quantity"`
	TimeSlot       string   `json:"time_slot"`
	Frequency      string   `json:"frequency"`
	Days           []string `json:"days"`
	IsEnabled      bool     `json:"is_enabled"`
}

type Delivery struct {
	ID             int     `json:"id"`
	SubscriptionID int     `json:"subscription_id"`
	SlotID         int     `json:"slot_id"`
	UserID         int     `json:"user_id"`
	DeliveryDate   string  `json:"delivery_date"`
	SlotType       string  `json:"slot_type"`
	Quantity       float64 `json:"quantity"`
	MilkType       string  `json:"milk_type"`
	Address        string  `json:"address"`
	CustomerName   string  `json:"customer_name"`
	Status         string  `json:"status"`
	DeliveredAt    string  `json:"delivered_at,omitempty"`
	DeliveredBy    string  `json:"delivered_by,omitempty"`
}

type InventoryEntry struct {
	ID          int     `json:"id"`
	Date        string  `json:"date"`
	BuffaloStock float64 `json:"buffalo_stock"`
	CowStock    float64 `json:"cow_stock"`
	BuffaloSold float64 `json:"buffalo_sold"`
	CowSold     float64 `json:"cow_sold"`
	Wastage     float64 `json:"wastage"`
}

type Pricing struct {
	ID            int     `json:"id"`
	MilkType      string  `json:"milk_type"`
	Price         float64 `json:"price"`
	PreviousPrice float64 `json:"previous_price"`
	UpdatedAt     string  `json:"updated_at"`
}

// --- Request/Response Types ---
type SendOTPRequest struct {
	Email string `json:"email"`
	Type  string `json:"type,omitempty"` // "admin" or "user"
}

type VerifyOTPRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type VerifyOTPResponse struct {
	Success   bool   `json:"success"`
	Token     string `json:"token,omitempty"` // Mock token for now
	Role      string `json:"role"`
	IsNewUser bool   `json:"isNewUser"`
	Message   string `json:"message,omitempty"`
}

type RegisterRequest struct {
	Email  string `json:"email"`
	Mobile string `json:"mobile"`
	Name   string `json:"name"`
}

type UpdateProfileRequest struct {
	Email  string `json:"email"` // Used to identify user (in real app, use Token)
	Name   string `json:"name"`
	DOB    string `json:"dob"`
	Gender string `json:"gender"`
}

// --- Handlers ---

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// --- Email Sending ---
func sendEmail(toEmail, otp string, isAdmin bool) error {
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	// Get credentials from environment variables
	senderEmail := os.Getenv("SMTP_EMAIL")
	senderPassword := os.Getenv("SMTP_PASSWORD")

	if senderEmail == "" || senderPassword == "" {
		log.Println("SMTP credentials not configured, logging OTP instead")
		return nil
	}

	auth := smtp.PlainAuth("", senderEmail, senderPassword, smtpHost)

	var subject, body string

	if isAdmin {
		subject = "ACTION REQUIRED: Taaza Admin Access"
		body = fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        .container {
            font-family: 'Arial', sans-serif;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f4f4f4;
            padding: 20px;
        }
        .header {
            background-color: #B22222; /* Red for Admin */
            padding: 20px;
            text-align: center;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        .header h1 {
            color: #FFFFFF;
            margin: 0;
            font-size: 28px;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .content {
            background-color: #ffffff;
            padding: 30px;
            text-align: center;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #B22222;
            letter-spacing: 5px;
            margin: 20px 0;
            padding: 10px;
            background-color: #fff0f0;
            border-radius: 4px;
            display: inline-block;
            border: 1px dashed #B22222;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        p {
            color: #333;
            line-height: 1.6;
        }
        .warning {
            color: #B22222;
            font-weight: bold;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Admin Verification</h1>
        </div>
        <div class="content">
            <p><strong>Security Alert:</strong> Admin access requested.</p>
            <p>Use the code below to sign in to the Taaza Admin Console.</p>
            <div class="otp-code">%s</div>
            <p>Valid for 5 minutes.</p>
            <div class="warning">If you did not request this, please contact support immediately.</div>
        </div>
        <div class="footer">
            &copy; 2026 Taaza Systems. Secure Administrative Access.
        </div>
    </div>
</body>
</html>
`, otp)
	} else {
		subject = "Your Taaza OTP Code"
		body = fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        .container {
            font-family: 'Arial', sans-serif;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f4f4f4;
            padding: 20px;
        }
        .header {
            background-color: #0C2D57;
            padding: 20px;
            text-align: center;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        .header h1 {
            color: #FFD700;
            margin: 0;
            font-size: 28px;
            letter-spacing: 2px;
        }
        .content {
            background-color: #ffffff;
            padding: 30px;
            text-align: center;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #0C2D57;
            letter-spacing: 5px;
            margin: 20px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            display: inline-block;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        p {
            color: #333;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TAAZA</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You requested a login verification code for your Taaza account.</p>
            <div class="otp-code">%s</div>
            <p>This code is valid for 5 minutes.<br>Please do not share this code with anyone.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Best regards,<br>
                <strong>Team Taaza</strong>
            </p>
        </div>
        <div class="footer">
            &copy; 2026 Taaza. All rights reserved.<br>
            Fresh from Farm to Door
        </div>
    </div>
</body>
</html>
`, otp)
	}

	// MIME headers for HTML email
	headers := "MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		fmt.Sprintf("From: Taaza <%s>\r\n", senderEmail) +
		fmt.Sprintf("To: %s\r\n", toEmail) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"\r\n"

	msg := []byte(headers + body)

	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, senderEmail, []string{toEmail}, msg)
	if err != nil {
		log.Println("Failed to send email:", err)
		return err
	}

	log.Printf("Email sent to %s", toEmail)
	return nil
}

func sendOTPHandler(w http.ResponseWriter, r *http.Request) {
	var req SendOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Security Check: Restrict OTP sending for admin
	isAdmin := req.Type == "admin"
	if isAdmin {
		if req.Email != "amarnathm9945@gmail.com" {
			log.Printf("Blocked unauthorized admin OTP request for: %s", req.Email)
			http.Error(w, "Unauthorized access. Only designated admin can login.", http.StatusForbidden)
			return
		}
	}

	// Generate 6-digit OTP
	log.Printf("Received SendOTP Request: %+v", req)
	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	expires := time.Now().Add(OTPExpiration)

	// Upsert OTP
	_, err := db.Exec(`
		INSERT INTO otps (email, code, expires_at) 
		VALUES ($1, $2, $3)
		ON CONFLICT (email) 
		DO UPDATE SET code = $2, expires_at = $3`,
		req.Email, code, expires)

	if err != nil {
		log.Println("Error storing OTP:", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	// Send email with OTP (Admin or User template)
	if err := sendEmail(req.Email, code, isAdmin); err != nil {
		// Log error but don't fail the request (OTP is still stored)
		log.Println("Email send failed, but OTP stored:", err)
	}
	log.Printf(">>> OTP for %s: %s <<<", req.Email, code)

	json.NewEncoder(w).Encode(map[string]string{"message": "OTP sent successfully"})
}

func verifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	var req VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var storedCode string
	var expiresAt time.Time
	err := db.QueryRow("SELECT code, expires_at FROM otps WHERE email = $1", req.Email).Scan(&storedCode, &expiresAt)

	if err == sql.ErrNoRows || storedCode != req.Code || time.Now().After(expiresAt) {
		http.Error(w, "Invalid or expired OTP", http.StatusUnauthorized)
		return
	}

	// Check if user exists and get role and status
	var count int
	var role, status string
	err = db.QueryRow("SELECT COUNT(*), COALESCE(MAX(role), 'user'), COALESCE(MAX(status), 'Active') FROM users WHERE email = $1", req.Email).Scan(&count, &role, &status)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Check if user is blocked
	if count > 0 && status == "Blocked" {
		// Always show generic message to user, don't expose admin's reason
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Account Restricted",
			"blocked": true,
		})
		return
	}

	// Clean up OTP
	db.Exec("DELETE FROM otps WHERE email = $1", req.Email)

	isNewUser := count == 0
	token := "mock-jwt-token-" + req.Email // In production, generate real JWT

	json.NewEncoder(w).Encode(VerifyOTPResponse{
		Success:   true,
		Token:     token,
		Role:      role,
		IsNewUser: isNewUser,
	})
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Check for unique mobile constraint
	var existingMobile int
	db.QueryRow("SELECT COUNT(*) FROM users WHERE mobile = $1", req.Mobile).Scan(&existingMobile)
	if existingMobile > 0 {
		http.Error(w, "Mobile number already in use", http.StatusConflict)
		return
	}

	// Create user
	_, err := db.Exec("INSERT INTO users (email, mobile, name) VALUES ($1, $2, $3)", req.Email, req.Mobile, req.Name)
	if err != nil {
		log.Println("Error registering user:", err)
		http.Error(w, "Failed to register", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func profileHandler(w http.ResponseWriter, r *http.Request) {
	// In real app, extract Email from JWT in header. 
	// For now, we'll assume it's passed as a query param or we trust the client (DEV ONLY)
	// Let's use Query param ?email=... for simplicity in this demo phase
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Email required", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodGet {
		var u User
		var dob sql.NullString
		var gender sql.NullString
		var status, blockReason sql.NullString

		err := db.QueryRow("SELECT id, email, mobile, name, dob, gender, COALESCE(status, 'Active'), COALESCE(block_reason, ''), created_at FROM users WHERE email = $1", email).
			Scan(&u.ID, &u.Email, &u.Mobile, &u.Name, &dob, &gender, &status, &blockReason, &u.CreatedAt)
		
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		// Check if user is blocked
		if status.Valid && status.String == "Blocked" {
			// Always show generic message to user, don't expose admin's reason
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Account Restricted",
				"status":  "Blocked",
				"blocked": true,
			})
			return
		}

		if dob.Valid { u.DOB = dob.String }
		if gender.Valid { u.Gender = gender.String }
		if status.Valid { u.Status = status.String }

		json.NewEncoder(w).Encode(u)

	} else if r.Method == http.MethodPut {
		var req UpdateProfileRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Security: Ignore req.Email/Mobile for update if passed in body, 
		// BUT we use the query param/token 'email' to identify WHO to update.
		// We DO NOT update the email or mobile fields in the UPDATE query.
		
		// Note: req.Name, req.DOB, req.Gender are the only updated fields.
		query := "UPDATE users SET name = $1, dob = $2, gender = $3, updated_at = NOW() WHERE email = $4"
		
		// Handle empty dates for DOB if needed (logic to parse or set null)
		// For simplicity, passing string directly. Postgres can cast 'YYYY-MM-DD' to Date. 
		// If empty string, it might fail or store weirdly. Let's assume frontend sends valid string or null.
		// Simple NULL handling:
		var dobArg interface{} = req.DOB
		if req.DOB == "" { dobArg = nil }

		_, err := db.Exec(query, req.Name, dobArg, req.Gender, email)
		if err != nil {
			log.Println("Update error:", err)
			http.Error(w, "Failed to update profile", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

// --- Admin Handlers ---

type UpdateStatusRequest struct {
	ID     int    `json:"id"`
	Status string `json:"status"`
	Reason string `json:"reason"`
}

func listUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query(`
		SELECT id, email, mobile, COALESCE(name, ''), COALESCE(dob::text, ''), COALESCE(gender, ''), COALESCE(role, 'user'), COALESCE(status, 'Active'), created_at 
		FROM users 
		WHERE role != 'admin' OR role IS NULL
		ORDER BY created_at DESC
	`)
	if err != nil {
		log.Println("Error fetching users:", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		err := rows.Scan(&u.ID, &u.Email, &u.Mobile, &u.Name, &u.DOB, &u.Gender, &u.Role, &u.Status, &u.CreatedAt)
		if err != nil {
			log.Println("Error scanning user:", err)
			continue
		}
		users = append(users, u)
	}

	if users == nil {
		users = []User{} // Return empty array instead of null
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func updateUserStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Validate status
	if req.Status != "Active" && req.Status != "Blocked" {
		http.Error(w, "Invalid status. Must be 'Active' or 'Blocked'", http.StatusBadRequest)
		return
	}

	// Validate reason for blocking
	if req.Status == "Blocked" && req.Reason == "" {
		http.Error(w, "Reason is required when blocking a user", http.StatusBadRequest)
		return
	}

	var result sql.Result
	var err error

	if req.Status == "Blocked" {
		result, err = db.Exec("UPDATE users SET status = $1, block_reason = $2, updated_at = NOW() WHERE id = $3", req.Status, req.Reason, req.ID)
	} else {
		// Clear block reason when activating
		result, err = db.Exec("UPDATE users SET status = $1, block_reason = NULL, updated_at = NOW() WHERE id = $2", req.Status, req.ID)
	}
	if err != nil {
		log.Println("Error updating user status:", err)
		http.Error(w, "Failed to update status", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"status":  req.Status,
	})
}

// --- Address Handlers ---

func addressHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "GET":
		// List addresses for a user
		email := r.URL.Query().Get("email")
		userIDParam := r.URL.Query().Get("user_id")

		var userID int
		var err error

		if userIDParam != "" {
			// Admin fetching by user_id
			fmt.Sscanf(userIDParam, "%d", &userID)
		} else if email != "" {
			// Fetch user ID from email
			err = db.QueryRow("SELECT id FROM users WHERE email = $1", email).Scan(&userID)
			if err != nil {
				http.Error(w, "User not found", http.StatusNotFound)
				return
			}
		} else {
			http.Error(w, "Email or user_id is required", http.StatusBadRequest)
			return
		}



		rows, err := db.Query(`
			SELECT id, user_id, tag, house_no, COALESCE(landmark, ''), full_address, 
			       COALESCE(latitude, 0), COALESCE(longitude, 0), receiver_name, receiver_phone, 
			       is_default, created_at::text
			FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC
		`, userID)
		if err != nil {
			log.Println("Error fetching addresses:", err)
			http.Error(w, "Failed to fetch addresses", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var addresses []Address
		for rows.Next() {
			var addr Address
			rows.Scan(&addr.ID, &addr.UserID, &addr.Tag, &addr.HouseNo, &addr.Landmark,
				&addr.FullAddress, &addr.Latitude, &addr.Longitude, &addr.ReceiverName,
				&addr.ReceiverPhone, &addr.IsDefault, &addr.CreatedAt)
			addresses = append(addresses, addr)
		}

		if addresses == nil {
			addresses = []Address{}
		}
		json.NewEncoder(w).Encode(addresses)

	case "POST":
		// Create new address
		var req struct {
			Email         string  `json:"email"`
			Tag           string  `json:"tag"`
			HouseNo       string  `json:"house_no"`
			Landmark      string  `json:"landmark"`
			FullAddress   string  `json:"full_address"`
			Latitude      float64 `json:"latitude"`
			Longitude     float64 `json:"longitude"`
			ReceiverName  string  `json:"receiver_name"`
			ReceiverPhone string  `json:"receiver_phone"`
			IsDefault     bool    `json:"is_default"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Get user ID from email
		var userID int
		err := db.QueryRow("SELECT id FROM users WHERE email = $1", req.Email).Scan(&userID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		// If setting as default, unset other defaults
		if req.IsDefault {
			db.Exec("UPDATE addresses SET is_default = false WHERE user_id = $1", userID)
		}

		var newID int
		err = db.QueryRow(`
			INSERT INTO addresses (user_id, tag, house_no, landmark, full_address, latitude, longitude, receiver_name, receiver_phone, is_default)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
		`, userID, req.Tag, req.HouseNo, req.Landmark, req.FullAddress, req.Latitude, req.Longitude, req.ReceiverName, req.ReceiverPhone, req.IsDefault).Scan(&newID)

		if err != nil {
			log.Println("Error creating address:", err)
			http.Error(w, "Failed to create address", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"id":      newID,
		})

	case "PUT":
		// Update address
		var req struct {
			ID            int     `json:"id"`
			Tag           string  `json:"tag"`
			HouseNo       string  `json:"house_no"`
			Landmark      string  `json:"landmark"`
			FullAddress   string  `json:"full_address"`
			Latitude      float64 `json:"latitude"`
			Longitude     float64 `json:"longitude"`
			ReceiverName  string  `json:"receiver_name"`
			ReceiverPhone string  `json:"receiver_phone"`
			IsDefault     bool    `json:"is_default"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// If setting as default, unset other defaults for this user
		if req.IsDefault {
			var userID int
			db.QueryRow("SELECT user_id FROM addresses WHERE id = $1", req.ID).Scan(&userID)
			db.Exec("UPDATE addresses SET is_default = false WHERE user_id = $1", userID)
		}

		_, err := db.Exec(`
			UPDATE addresses SET tag=$1, house_no=$2, landmark=$3, full_address=$4, 
			latitude=$5, longitude=$6, receiver_name=$7, receiver_phone=$8, is_default=$9
			WHERE id=$10
		`, req.Tag, req.HouseNo, req.Landmark, req.FullAddress, req.Latitude, req.Longitude, req.ReceiverName, req.ReceiverPhone, req.IsDefault, req.ID)

		if err != nil {
			log.Println("Error updating address:", err)
			http.Error(w, "Failed to update address", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{"success": true})

	case "DELETE":
		// Delete address
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "Address ID is required", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("DELETE FROM addresses WHERE id = $1", id)
		if err != nil {
			log.Println("Error deleting address:", err)
			http.Error(w, "Failed to delete address", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{"success": true})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func adminUserAddressesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	rows, err := db.Query(`
		SELECT id, user_id, tag, house_no, COALESCE(landmark, ''), full_address, 
		       COALESCE(latitude, 0), COALESCE(longitude, 0), receiver_name, receiver_phone, 
		       is_default, created_at::text
		FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC
	`, userID)
	if err != nil {
		log.Println("Error fetching addresses:", err)
		http.Error(w, "Failed to fetch addresses", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var addresses []Address
	for rows.Next() {
		var addr Address
		rows.Scan(&addr.ID, &addr.UserID, &addr.Tag, &addr.HouseNo, &addr.Landmark,
			&addr.FullAddress, &addr.Latitude, &addr.Longitude, &addr.ReceiverName,
			&addr.ReceiverPhone, &addr.IsDefault, &addr.CreatedAt)
		addresses = append(addresses, addr)
	}

	if addresses == nil {
		addresses = []Address{}
	}
	json.NewEncoder(w).Encode(addresses)
}

// ============================================================================
// MILK SUBSCRIPTION HANDLERS
// ============================================================================

// --- User Subscription Handlers ---

func getSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Email required", http.StatusBadRequest)
		return
	}
	
	// Get user ID from email
	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE email = $1", email).Scan(&userID)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"subscription": nil})
		return
	}
	
	// Get subscription
	var sub MilkSubscription
	var createdAt, updatedAt time.Time
	err = db.QueryRow(`
		SELECT ms.id, ms.user_id, ms.address_id, ms.status, ms.auto_pay, 
		       COALESCE(u.name, ''), COALESCE(a.full_address, ''),
		       ms.created_at, ms.updated_at
		FROM milk_subscriptions ms
		LEFT JOIN users u ON ms.user_id = u.id
		LEFT JOIN addresses a ON ms.address_id = a.id
		WHERE ms.user_id = $1 AND ms.status != 'Cancelled'
		ORDER BY ms.created_at DESC LIMIT 1
	`, userID).Scan(&sub.ID, &sub.UserID, &sub.AddressID, &sub.Status, &sub.AutoPay,
		&sub.CustomerName, &sub.Address, &createdAt, &updatedAt)
	
	if err == sql.ErrNoRows {
		json.NewEncoder(w).Encode(map[string]interface{}{"subscription": nil})
		return
	} else if err != nil {
		log.Println("Error fetching subscription:", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	
	sub.CreatedAt = createdAt.Format("2006-01-02T15:04:05Z07:00")
	sub.UpdatedAt = updatedAt.Format("2006-01-02T15:04:05Z07:00")
	
	// Get slots
	rows, err := db.Query(`
		SELECT id, subscription_id, slot_type, milk_type, quantity, time_slot, frequency, days, is_enabled
		FROM subscription_slots WHERE subscription_id = $1
	`, sub.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var slot SubscriptionSlot
			var daysStr sql.NullString
			rows.Scan(&slot.ID, &slot.SubscriptionID, &slot.SlotType, &slot.MilkType,
				&slot.Quantity, &slot.TimeSlot, &slot.Frequency, &daysStr, &slot.IsEnabled)
			if daysStr.Valid && daysStr.String != "" {
				// Parse PostgreSQL array format {Mon,Tue,Wed}
				days := strings.Trim(daysStr.String, "{}")
				if days != "" {
					slot.Days = strings.Split(days, ",")
				}
			}
			sub.Slots = append(sub.Slots, slot)
		}
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{"subscription": sub})
}

func createSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		Email     string `json:"email"`
		AddressID int    `json:"address_id"`
		AutoPay   bool   `json:"auto_pay"`
		Slots     []struct {
			SlotType  string   `json:"slot_type"`
			MilkType  string   `json:"milk_type"`
			Quantity  float64  `json:"quantity"`
			TimeSlot  string   `json:"time_slot"`
			Frequency string   `json:"frequency"`
			Days      []string `json:"days"`
			IsEnabled bool     `json:"is_enabled"`
		} `json:"slots"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	// Get user ID
	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE email = $1", req.Email).Scan(&userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	// Cancel any existing active subscription
	db.Exec("UPDATE milk_subscriptions SET status = 'Cancelled', updated_at = NOW() WHERE user_id = $1 AND status != 'Cancelled'", userID)
	
	// Create subscription
	var subID int
	err = db.QueryRow(`
		INSERT INTO milk_subscriptions (user_id, address_id, auto_pay, status)
		VALUES ($1, $2, $3, 'Active') RETURNING id
	`, userID, req.AddressID, req.AutoPay).Scan(&subID)
	
	if err != nil {
		log.Println("Error creating subscription:", err)
		http.Error(w, "Failed to create subscription", http.StatusInternalServerError)
		return
	}
	
	// Create slots
	for _, s := range req.Slots {
		daysArr := "{" + strings.Join(s.Days, ",") + "}"
		_, err = db.Exec(`
			INSERT INTO subscription_slots (subscription_id, slot_type, milk_type, quantity, time_slot, frequency, days, is_enabled)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, subID, s.SlotType, s.MilkType, s.Quantity, s.TimeSlot, s.Frequency, daysArr, s.IsEnabled)
		if err != nil {
			log.Println("Error creating slot:", err)
		}
	}
	
	// Generate deliveries for next 7 days
	generateDeliveries(subID, userID, 7)
	
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "id": subID})
}

func updateSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		ID        int    `json:"id"`
		Status    string `json:"status"`
		AddressID int    `json:"address_id"`
		AutoPay   bool   `json:"auto_pay"`
		Slots     []struct {
			ID        int      `json:"id"`
			SlotType  string   `json:"slot_type"`
			MilkType  string   `json:"milk_type"`
			Quantity  float64  `json:"quantity"`
			TimeSlot  string   `json:"time_slot"`
			Frequency string   `json:"frequency"`
			Days      []string `json:"days"`
			IsEnabled bool     `json:"is_enabled"`
		} `json:"slots"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	// Update subscription
	_, err := db.Exec(`
		UPDATE milk_subscriptions SET status = $1, address_id = $2, auto_pay = $3, updated_at = NOW()
		WHERE id = $4
	`, req.Status, req.AddressID, req.AutoPay, req.ID)
	
	if err != nil {
		http.Error(w, "Failed to update subscription", http.StatusInternalServerError)
		return
	}
	
	// Update slots
	for _, s := range req.Slots {
		daysArr := "{" + strings.Join(s.Days, ",") + "}"
		if s.ID > 0 {
			db.Exec(`
				UPDATE subscription_slots SET milk_type = $1, quantity = $2, time_slot = $3, frequency = $4, days = $5, is_enabled = $6
				WHERE id = $7
			`, s.MilkType, s.Quantity, s.TimeSlot, s.Frequency, daysArr, s.IsEnabled, s.ID)
		} else {
			db.Exec(`
				INSERT INTO subscription_slots (subscription_id, slot_type, milk_type, quantity, time_slot, frequency, days, is_enabled)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			`, req.ID, s.SlotType, s.MilkType, s.Quantity, s.TimeSlot, s.Frequency, daysArr, s.IsEnabled)
		}
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}

func generateDeliveries(subID, userID, days int) {
	// Get subscription details
	var addressText, customerName string
	db.QueryRow(`
		SELECT COALESCE(a.full_address, ''), COALESCE(u.name, '')
		FROM milk_subscriptions ms
		LEFT JOIN addresses a ON ms.address_id = a.id
		LEFT JOIN users u ON ms.user_id = u.id
		WHERE ms.id = $1
	`, subID).Scan(&addressText, &customerName)
	
	// Get slots
	rows, _ := db.Query(`SELECT id, slot_type, milk_type, quantity, frequency, days FROM subscription_slots WHERE subscription_id = $1 AND is_enabled = true`, subID)
	defer rows.Close()
	
	type slotInfo struct {
		id        int
		slotType  string
		milkType  string
		quantity  float64
		frequency string
		days      string
	}
	var slots []slotInfo
	for rows.Next() {
		var s slotInfo
		rows.Scan(&s.id, &s.slotType, &s.milkType, &s.quantity, &s.frequency, &s.days)
		slots = append(slots, s)
	}
	
	// Generate for next N days
	for i := 0; i < days; i++ {
		date := time.Now().AddDate(0, 0, i)
		dayName := date.Weekday().String()[:3]
		
		for _, slot := range slots {
			shouldDeliver := false
			if slot.frequency == "daily" {
				shouldDeliver = true
			} else if slot.frequency == "alternate" {
				// Check if day is in the list
				shouldDeliver = strings.Contains(slot.days, dayName)
			}
			
			if shouldDeliver {
				// Check if delivery already exists
				var exists int
				db.QueryRow(`SELECT COUNT(*) FROM deliveries WHERE subscription_id = $1 AND slot_id = $2 AND delivery_date = $3`,
					subID, slot.id, date.Format("2006-01-02")).Scan(&exists)
				
				if exists == 0 {
					db.Exec(`
						INSERT INTO deliveries (subscription_id, slot_id, user_id, delivery_date, slot_type, quantity, milk_type, address, customer_name, status)
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
					`, subID, slot.id, userID, date.Format("2006-01-02"), slot.slotType, slot.quantity, slot.milkType, addressText, customerName)
				}
			}
		}
	}
}

func skipDeliveryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		DeliveryID int `json:"delivery_id"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	_, err := db.Exec("UPDATE deliveries SET status = 'Skipped' WHERE id = $1", req.DeliveryID)
	if err != nil {
		http.Error(w, "Failed to skip delivery", http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}

func getScheduleHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Email required", http.StatusBadRequest)
		return
	}
	
	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE email = $1", email).Scan(&userID)
	if err != nil {
		json.NewEncoder(w).Encode([]Delivery{})
		return
	}
	
	rows, err := db.Query(`
		SELECT id, subscription_id, slot_id, user_id, delivery_date::text, slot_type, quantity, milk_type, 
		       COALESCE(address, ''), COALESCE(customer_name, ''), status
		FROM deliveries 
		WHERE user_id = $1 AND delivery_date >= CURRENT_DATE AND delivery_date <= CURRENT_DATE + INTERVAL '7 days'
		ORDER BY delivery_date, slot_type
	`, userID)
	
	if err != nil {
		log.Println("Error fetching schedule:", err)
		json.NewEncoder(w).Encode([]Delivery{})
		return
	}
	defer rows.Close()
	
	var deliveries []Delivery
	for rows.Next() {
		var d Delivery
		rows.Scan(&d.ID, &d.SubscriptionID, &d.SlotID, &d.UserID, &d.DeliveryDate, &d.SlotType,
			&d.Quantity, &d.MilkType, &d.Address, &d.CustomerName, &d.Status)
		deliveries = append(deliveries, d)
	}
	
	if deliveries == nil {
		deliveries = []Delivery{}
	}
	json.NewEncoder(w).Encode(deliveries)
}

// --- Pricing Handler ---

func getPricingHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	rows, err := db.Query(`SELECT id, milk_type, price, COALESCE(previous_price, 0), updated_at::text FROM pricing`)
	if err != nil {
		log.Println("Error fetching pricing:", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	var prices []Pricing
	for rows.Next() {
		var p Pricing
		rows.Scan(&p.ID, &p.MilkType, &p.Price, &p.PreviousPrice, &p.UpdatedAt)
		prices = append(prices, p)
	}
	
	if prices == nil {
		prices = []Pricing{}
	}
	json.NewEncoder(w).Encode(prices)
}

// --- Admin Handlers ---

func adminListSubscriptionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	rows, err := db.Query(`
		SELECT ms.id, ms.user_id, ms.address_id, ms.status, ms.auto_pay,
		       COALESCE(u.name, 'Unknown'), COALESCE(a.full_address, ''),
		       ms.created_at::text, ms.updated_at::text
		FROM milk_subscriptions ms
		LEFT JOIN users u ON ms.user_id = u.id
		LEFT JOIN addresses a ON ms.address_id = a.id
		WHERE ms.status != 'Cancelled'
		ORDER BY ms.created_at DESC
	`)
	
	if err != nil {
		log.Println("Error fetching subscriptions:", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	var subscriptions []MilkSubscription
	for rows.Next() {
		var sub MilkSubscription
		rows.Scan(&sub.ID, &sub.UserID, &sub.AddressID, &sub.Status, &sub.AutoPay,
			&sub.CustomerName, &sub.Address, &sub.CreatedAt, &sub.UpdatedAt)
		
		// Get total quantity for this subscription
		slotRows, _ := db.Query(`SELECT slot_type, milk_type, quantity FROM subscription_slots WHERE subscription_id = $1 AND is_enabled = true`, sub.ID)
		for slotRows.Next() {
			var slot SubscriptionSlot
			slotRows.Scan(&slot.SlotType, &slot.MilkType, &slot.Quantity)
			sub.Slots = append(sub.Slots, slot)
		}
		slotRows.Close()
		
		subscriptions = append(subscriptions, sub)
	}
	
	if subscriptions == nil {
		subscriptions = []MilkSubscription{}
	}
	json.NewEncoder(w).Encode(subscriptions)
}

func adminUpdateSubscriptionStatusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		ID     int    `json:"id"`
		Status string `json:"status"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	_, err := db.Exec("UPDATE milk_subscriptions SET status = $1, updated_at = NOW() WHERE id = $2", req.Status, req.ID)
	if err != nil {
		http.Error(w, "Failed to update status", http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}

func adminDeliveriesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method == "GET" {
		dateStr := r.URL.Query().Get("date")
		if dateStr == "" {
			dateStr = time.Now().Format("2006-01-02")
		}
		
		rows, err := db.Query(`
			SELECT id, subscription_id, slot_id, user_id, delivery_date::text, slot_type, quantity, milk_type,
			       COALESCE(address, ''), COALESCE(customer_name, ''), status,
			       COALESCE(delivered_at::text, ''), COALESCE(delivered_by, '')
			FROM deliveries
			WHERE delivery_date = $1
			ORDER BY slot_type, customer_name
		`, dateStr)
		
		if err != nil {
			log.Println("Error fetching deliveries:", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		
		var deliveries []Delivery
		for rows.Next() {
			var d Delivery
			rows.Scan(&d.ID, &d.SubscriptionID, &d.SlotID, &d.UserID, &d.DeliveryDate, &d.SlotType,
				&d.Quantity, &d.MilkType, &d.Address, &d.CustomerName, &d.Status, &d.DeliveredAt, &d.DeliveredBy)
			deliveries = append(deliveries, d)
		}
		
		if deliveries == nil {
			deliveries = []Delivery{}
		}
		json.NewEncoder(w).Encode(deliveries)
		
	} else if r.Method == "PUT" {
		var req struct {
			ID          int    `json:"id"`
			Status      string `json:"status"`
			DeliveredBy string `json:"delivered_by"`
		}
		
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		
		if req.Status == "Delivered" {
			db.Exec("UPDATE deliveries SET status = $1, delivered_at = NOW(), delivered_by = $2 WHERE id = $3",
				req.Status, req.DeliveredBy, req.ID)
		} else {
			db.Exec("UPDATE deliveries SET status = $1 WHERE id = $2", req.Status, req.ID)
		}
		
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
	}
}

func adminInventoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	switch r.Method {
	case "GET":
		rows, err := db.Query(`
			SELECT id, date::text, buffalo_stock, cow_stock, buffalo_sold, cow_sold, wastage
			FROM inventory ORDER BY date DESC LIMIT 30
		`)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		
		var inventory []InventoryEntry
		for rows.Next() {
			var inv InventoryEntry
			rows.Scan(&inv.ID, &inv.Date, &inv.BuffaloStock, &inv.CowStock, &inv.BuffaloSold, &inv.CowSold, &inv.Wastage)
			inventory = append(inventory, inv)
		}
		
		if inventory == nil {
			inventory = []InventoryEntry{}
		}
		json.NewEncoder(w).Encode(inventory)
		
	case "POST":
		var req struct {
			Date         string  `json:"date"`
			BuffaloStock float64 `json:"buffalo_stock"`
			CowStock     float64 `json:"cow_stock"`
			Wastage      float64 `json:"wastage"`
		}
		
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		
		_, err := db.Exec(`
			INSERT INTO inventory (date, buffalo_stock, cow_stock, wastage)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (date) DO UPDATE SET 
				buffalo_stock = inventory.buffalo_stock + $2,
				cow_stock = inventory.cow_stock + $3,
				wastage = inventory.wastage + $4,
				updated_at = NOW()
		`, req.Date, req.BuffaloStock, req.CowStock, req.Wastage)
		
		if err != nil {
			log.Println("Error adding inventory:", err)
			http.Error(w, "Failed to add inventory", http.StatusInternalServerError)
			return
		}
		
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		
	case "PUT":
		var req struct {
			ID           int     `json:"id"`
			BuffaloStock float64 `json:"buffalo_stock"`
			CowStock     float64 `json:"cow_stock"`
			BuffaloSold  float64 `json:"buffalo_sold"`
			CowSold      float64 `json:"cow_sold"`
			Wastage      float64 `json:"wastage"`
		}
		
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		
		_, err := db.Exec(`
			UPDATE inventory SET buffalo_stock = $1, cow_stock = $2, buffalo_sold = $3, cow_sold = $4, wastage = $5, updated_at = NOW()
			WHERE id = $6
		`, req.BuffaloStock, req.CowStock, req.BuffaloSold, req.CowSold, req.Wastage, req.ID)
		
		if err != nil {
			http.Error(w, "Failed to update inventory", http.StatusInternalServerError)
			return
		}
		
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
	}
}

func adminPricingHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method == "GET" {
		getPricingHandler(w, r)
		return
	}
	
	if r.Method == "PUT" {
		var req struct {
			MilkType string  `json:"milk_type"`
			Price    float64 `json:"price"`
		}
		
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		
		_, err := db.Exec(`
			UPDATE pricing SET previous_price = price, price = $1, updated_at = NOW()
			WHERE milk_type = $2
		`, req.Price, req.MilkType)
		
		if err != nil {
			http.Error(w, "Failed to update pricing", http.StatusInternalServerError)
			return
		}
		
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
	}
}

func adminAnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	// Get subscription stats
	var activeCount, pausedCount int
	db.QueryRow("SELECT COUNT(*) FROM milk_subscriptions WHERE status = 'Active'").Scan(&activeCount)
	db.QueryRow("SELECT COUNT(*) FROM milk_subscriptions WHERE status = 'Paused'").Scan(&pausedCount)
	
	// Get daily demand
	var buffaloTotal, cowTotal float64
	db.QueryRow(`
		SELECT COALESCE(SUM(CASE WHEN milk_type = 'buffalo' THEN quantity ELSE 0 END), 0),
		       COALESCE(SUM(CASE WHEN milk_type = 'cow' THEN quantity ELSE 0 END), 0)
		FROM subscription_slots ss
		JOIN milk_subscriptions ms ON ss.subscription_id = ms.id
		WHERE ms.status = 'Active' AND ss.is_enabled = true
	`).Scan(&buffaloTotal, &cowTotal)
	
	// Get pricing for revenue calculation
	var buffaloPrice, cowPrice float64
	db.QueryRow("SELECT COALESCE(price, 90) FROM pricing WHERE milk_type = 'buffalo'").Scan(&buffaloPrice)
	db.QueryRow("SELECT COALESCE(price, 60) FROM pricing WHERE milk_type = 'cow'").Scan(&cowPrice)
	
	dailyRevenue := (buffaloTotal * buffaloPrice) + (cowTotal * cowPrice)
	
	// Today's deliveries
	var deliveredToday, pendingToday int
	today := time.Now().Format("2006-01-02")
	db.QueryRow("SELECT COUNT(*) FROM deliveries WHERE delivery_date = $1 AND status = 'Delivered'", today).Scan(&deliveredToday)
	db.QueryRow("SELECT COUNT(*) FROM deliveries WHERE delivery_date = $1 AND status = 'Pending'", today).Scan(&pendingToday)
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"active_subscriptions": activeCount,
		"paused_subscriptions": pausedCount,
		"total_subscriptions":  activeCount + pausedCount,
		"buffalo_demand":       buffaloTotal,
		"cow_demand":           cowTotal,
		"total_demand":         buffaloTotal + cowTotal,
		"buffalo_price":        buffaloPrice,
		"cow_price":            cowPrice,
		"daily_revenue":        dailyRevenue,
		"monthly_revenue":      dailyRevenue * 30,
		"delivered_today":      deliveredToday,
		"pending_today":        pendingToday,
	})
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

func main() {
	log.Println("Starting Auth Service...")
	
	initDB()
	initSchema()

	// Auth routes
	http.HandleFunc("/send-otp", enableCORS(sendOTPHandler))
	http.HandleFunc("/verify-otp", enableCORS(verifyOTPHandler))
	http.HandleFunc("/register", enableCORS(registerHandler))
	http.HandleFunc("/profile", enableCORS(profileHandler))
	http.HandleFunc("/addresses", enableCORS(addressHandler))
	
	// Admin user routes
	http.HandleFunc("/admin/users", enableCORS(listUsersHandler))
	http.HandleFunc("/admin/users/status", enableCORS(updateUserStatusHandler))
	http.HandleFunc("/admin/users/addresses", enableCORS(adminUserAddressesHandler))
	
	// User subscription routes
	http.HandleFunc("/api/subscription", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			getSubscriptionHandler(w, r)
		case "POST":
			createSubscriptionHandler(w, r)
		case "PUT":
			updateSubscriptionHandler(w, r)
		case "DELETE":
			// Cancel subscription
			idStr := r.URL.Query().Get("id")
			id, _ := strconv.Atoi(idStr)
			db.Exec("UPDATE milk_subscriptions SET status = 'Cancelled', updated_at = NOW() WHERE id = $1", id)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		case "OPTIONS":
			w.WriteHeader(http.StatusOK)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	http.HandleFunc("/api/subscription/skip", enableCORS(skipDeliveryHandler))
	http.HandleFunc("/api/subscription/schedule", enableCORS(getScheduleHandler))
	http.HandleFunc("/api/pricing", enableCORS(getPricingHandler))
	
	// Admin subscription routes
	http.HandleFunc("/api/admin/subscriptions", enableCORS(adminListSubscriptionsHandler))
	http.HandleFunc("/api/admin/subscriptions/status", enableCORS(adminUpdateSubscriptionStatusHandler))
	http.HandleFunc("/api/admin/deliveries", enableCORS(adminDeliveriesHandler))
	http.HandleFunc("/api/admin/inventory", enableCORS(adminInventoryHandler))
	http.HandleFunc("/api/admin/pricing", enableCORS(adminPricingHandler))
	http.HandleFunc("/api/admin/analytics", enableCORS(adminAnalyticsHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Auth Service running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
