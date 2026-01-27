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
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE TABLE IF NOT EXISTS otps (
		email TEXT PRIMARY KEY,
		code TEXT NOT NULL,
		expires_at TIMESTAMP NOT NULL
	);
	`
	_, err := db.Exec(query)
	if err != nil {
		log.Fatal("Failed to create schema:", err)
	}
	log.Println("Schema initialized")
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
	DOB       string    `json:"dob,omitempty"` // YYYY-MM-DD
	Gender    string    `json:"gender,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// --- Request/Response Types ---
type SendOTPRequest struct {
	Email string `json:"email"`
}

type VerifyOTPRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type VerifyOTPResponse struct {
	Success   bool   `json:"success"`
	Token     string `json:"token,omitempty"` // Mock token for now
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
func sendEmail(toEmail, otp string) error {
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

	subject := "Your Taaza OTP Code"
	body := fmt.Sprintf(`
Hello,

Your OTP code for Taaza is: %s

This code is valid for 5 minutes. Do not share it with anyone.

Best regards,
Team Taaza
`, otp)

	msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s",
		senderEmail, toEmail, subject, body))

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

	// Generate 6-digit OTP
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

	// Send email with OTP
	if err := sendEmail(req.Email, code); err != nil {
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

	// Check if user exists
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE email = $1", req.Email).Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Clean up OTP
	db.Exec("DELETE FROM otps WHERE email = $1", req.Email)

	isNewUser := count == 0
	token := "mock-jwt-token-" + req.Email // In production, generate real JWT

	json.NewEncoder(w).Encode(VerifyOTPResponse{
		Success:   true,
		Token:     token,
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

		err := db.QueryRow("SELECT id, email, mobile, name, dob, gender, created_at FROM users WHERE email = $1", email).
			Scan(&u.ID, &u.Email, &u.Mobile, &u.Name, &dob, &gender, &u.CreatedAt)
		
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if dob.Valid { u.DOB = dob.String }
		if gender.Valid { u.Gender = gender.String }

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

func main() {
	log.Println("Starting Auth Service...")
	
	initDB()
	initSchema()

	http.HandleFunc("/send-otp", enableCORS(sendOTPHandler))
	http.HandleFunc("/verify-otp", enableCORS(verifyOTPHandler))
	http.HandleFunc("/register", enableCORS(registerHandler))
	http.HandleFunc("/profile", enableCORS(profileHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Auth Service running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
