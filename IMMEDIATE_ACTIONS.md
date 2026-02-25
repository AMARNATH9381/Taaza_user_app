# 🚨 IMMEDIATE ACTION CHECKLIST

## Critical Security Fixes (Do This NOW Before Production)

### ✅ Step 1: Create .env File (5 minutes)

```bash
# In project root
touch .env
echo ".env" >> .gitignore
```

```env
# .env file content
DATABASE_URL=postgres://taaza_user:CHANGE_THIS_PASSWORD@postgres:5432/taaza_db?sslmode=disable
JWT_SECRET=GENERATE_64_CHAR_RANDOM_STRING_HERE
OTP_SALT=GENERATE_64_CHAR_RANDOM_STRING_HERE
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
ENV=development
```

**Generate secrets**:
```bash
# Run these commands to generate secure secrets
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for OTP_SALT
```

### ✅ Step 2: Update docker-compose.yml (2 minutes)

```yaml
services:
  auth-service:
    environment:
      - PORT=8080
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - OTP_SALT=${OTP_SALT}
      - SMTP_EMAIL=${SMTP_EMAIL}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - ENV=${ENV}
  
  postgres:
    environment:
      - POSTGRES_USER=taaza_user
      - POSTGRES_PASSWORD=${DB_PASSWORD:-taaza_pass}
      - POSTGRES_DB=taaza_db
```

### ✅ Step 3: Fix SMTP Password (2 minutes)

**Current Issue**: `SMTP_PASSWORD=eiustppewepd cuxz` (has space, invalid)

**Fix**:
1. Go to Google Account → Security → 2-Step Verification → App Passwords
2. Generate new app password (16 characters, no spaces)
3. Add to .env file: `SMTP_PASSWORD=abcdabcdabcdabcd`

### ✅ Step 4: Add Input Validation (10 minutes)

Create `services/auth-service/validation.go`:

```go
package main

import (
    "regexp"
    "strings"
)

var (
    emailRegex  = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
    mobileRegex = regexp.MustCompile(`^[6-9]\d{9}$`)
)

func isValidEmail(email string) bool {
    email = strings.TrimSpace(strings.ToLower(email))
    return len(email) > 0 && len(email) <= 254 && emailRegex.MatchString(email)
}

func isValidMobile(mobile string) bool {
    mobile = strings.TrimSpace(mobile)
    return mobileRegex.MatchString(mobile)
}

func isValidName(name string) bool {
    name = strings.TrimSpace(name)
    return len(name) >= 2 && len(name) <= 100
}
```

**Add to handlers**:
```go
// In sendOTPHandler
if !isValidEmail(req.Email) {
    http.Error(w, "Invalid email format", http.StatusBadRequest)
    return
}

// In registerHandler
if !isValidEmail(req.Email) {
    http.Error(w, "Invalid email format", http.StatusBadRequest)
    return
}
if !isValidMobile(req.Mobile) {
    http.Error(w, "Invalid mobile number. Must be 10 digits starting with 6-9", http.StatusBadRequest)
    return
}
if !isValidName(req.Name) {
    http.Error(w, "Invalid name. Must be 2-100 characters", http.StatusBadRequest)
    return
}
```

### ✅ Step 5: Add Audit Logging (15 minutes)

**Add to database schema** in `main.go`:

```go
// In initSchema() function, add:
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    target_user_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Add logging function**:
```go
func logAdminAction(adminEmail, action string, targetUserID int, details, ip string) {
    var adminID int
    db.QueryRow("SELECT id FROM users WHERE email = $1", adminEmail).Scan(&adminID)
    
    db.Exec(`
        INSERT INTO audit_logs (admin_id, action, target_user_id, details, ip_address)
        VALUES ($1, $2, $3, $4, $5)
    `, adminID, action, targetUserID, details, ip)
    
    log.Printf("[AUDIT] Admin %s performed %s on user %d from %s", adminEmail, action, targetUserID, ip)
}
```

**Use in handlers**:
```go
// In updateUserStatusHandler
adminEmail := r.Context().Value("email").(string)
logAdminAction(adminEmail, "UPDATE_USER_STATUS", req.ID, 
    fmt.Sprintf("Changed status to %s. Reason: %s", req.Status, req.Reason), 
    r.RemoteAddr)
```

### ✅ Step 6: Reduce JWT Expiration (2 minutes)

```go
// In verifyOTPHandler, change from 24 hours to 2 hours
claims := jwt.MapClaims{
    "sub": req.Email,
    "role": role,
    "exp": time.Now().Add(2 * time.Hour).Unix(),  // Changed from 24h
    "iat": time.Now().Unix(),
}
```

### ✅ Step 7: Add Security Headers to Nginx (5 minutes)

**Update both nginx.conf files**:

```nginx
# Add inside server block
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Remove server version
server_tokens off;
```

### ✅ Step 8: Add Database Backup Script (5 minutes)

Create `scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/taaza_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

docker exec taaza-postgres pg_dump -U taaza_user taaza_db > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "taaza_backup_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

```bash
chmod +x scripts/backup.sh
```

**Add to crontab** (daily at 2 AM):
```bash
crontab -e
# Add line:
0 2 * * * /path/to/Taaza_user_app/scripts/backup.sh
```

---

## 🔄 Rebuild & Deploy

After making changes:

```bash
# Stop containers
docker-compose down

# Rebuild with new changes
docker-compose up -d --build

# Verify
docker-compose ps
docker-compose logs -f auth-service
```

---

## ✅ Verification Checklist

- [ ] .env file created and added to .gitignore
- [ ] Strong JWT_SECRET and OTP_SALT generated
- [ ] SMTP password fixed (no spaces, 16 chars)
- [ ] docker-compose.yml uses environment variables
- [ ] Input validation added to all endpoints
- [ ] Audit logging implemented
- [ ] JWT expiration reduced to 2 hours
- [ ] Security headers added to nginx
- [ ] Backup script created and tested
- [ ] All containers running successfully
- [ ] OTP emails sending correctly
- [ ] Admin actions being logged

---

## 🎯 Testing After Implementation

### Test 1: Environment Variables
```bash
docker exec taaza-auth-service env | grep JWT_SECRET
# Should show your secret, not "replace-this-secret"
```

### Test 2: Input Validation
```bash
# Try invalid email
curl -X POST http://localhost:8080/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'
# Should return 400 Bad Request
```

### Test 3: Audit Logging
```bash
# Check audit logs after blocking a user
docker exec taaza-postgres psql -U taaza_user -d taaza_db \
  -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

### Test 4: Backup
```bash
./scripts/backup.sh
ls -lh backups/
# Should see backup file
```

---

## 📊 Estimated Time

- **Total Time**: ~45 minutes
- **Difficulty**: Easy to Medium
- **Impact**: HIGH (Critical security improvements)

---

## 🚨 BEFORE PRODUCTION DEPLOYMENT

### Additional Requirements:

1. **SSL/TLS Certificate**
   - Use Let's Encrypt (free)
   - Or purchase SSL certificate

2. **Domain Configuration**
   - Point domain to server IP
   - Update CORS_ORIGIN in .env

3. **Firewall Rules**
   - Only expose ports 80, 443
   - Block direct access to 8080, 5432

4. **Monitoring**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure error alerts

5. **Load Testing**
   - Test with 100+ concurrent users
   - Verify rate limiting works

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify .env file is loaded: `docker exec taaza-auth-service env`
3. Test database connection: `docker exec taaza-postgres psql -U taaza_user -d taaza_db -c "SELECT 1;"`

---

**Status**: Ready to implement ✅
**Priority**: CRITICAL 🚨
**Time Required**: 45 minutes ⏱️
