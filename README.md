# Taaza - Fresh Milk Delivery App

A full-stack milk delivery application with user and admin interfaces, built with React and Go.

## 🏗️ Architecture

```
Taaza_user_app/
├── apps/
│   ├── user-app/          # Customer-facing React app (Port 3000)
│   └── admin-app/         # Admin dashboard React app (Port 3001)
├── services/
│   └── auth-service/      # Go authentication backend (Port 8080)
└── docker-compose.yml     # Container orchestration
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose

### Run with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Access the Applications

| Service | URL |
|---------|-----|
| User App | http://localhost:3000 |
| Admin App | http://localhost:3001 |
| Auth API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Go (Golang)
- **Database**: PostgreSQL 15
- **Containerization**: Docker, Docker Compose

## 📱 Features

### User App
- User authentication (OTP-based)
- Milk subscription management
- Address management with Google Maps
- Order tracking

### Admin App
- User management dashboard
- Milk inventory management
- Subscription management
- Delivery tracking

## 🔧 Development

### Run Individual Apps Locally

```bash
# User App
cd apps/user-app
npm install
npm run dev

# Admin App
cd apps/admin-app
npm install
npm run dev

# Auth Service
cd services/auth-service
go run main.go
```

## 📄 License

MIT License
