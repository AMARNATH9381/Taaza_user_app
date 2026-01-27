# Build Stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy everything first, then tidy to generate go.sum
COPY . .
RUN go mod tidy
RUN go build -o auth-service main.go

# Run Stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/auth-service .

EXPOSE 8080

CMD ["./auth-service"]
