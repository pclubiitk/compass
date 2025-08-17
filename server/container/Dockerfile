# Stage 1: Builder
FROM golang:1.24.4-bookworm AS builder

WORKDIR /app

# Install libvips development dependencies for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*

# Cache Go dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build binary (with CGO enabled)
ENV CGO_ENABLED=1
RUN GOOS=linux go build -a -o server ./cmd

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install only runtime deps (smaller image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
  && rm -rf /var/lib/apt/lists/*

# Copy server binary + configs
COPY --from=builder /app/server /server
COPY ./config.yaml /config.yaml
COPY ./secret.yml /secret.yml

EXPOSE 8080 8081 8082

ENTRYPOINT ["/server"]
