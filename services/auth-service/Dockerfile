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
RUN addgroup -S app && adduser -S app -G app || true
RUN chown app:app /app/auth-service || true
USER app

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["./auth-service"]
