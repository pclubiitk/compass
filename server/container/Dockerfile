# Stage 1: Builder
FROM golang:1.24.4-bookworm AS builder

WORKDIR /app

# Install dependencies and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  pkg-config \
  cmake \
  git \
  libde265-dev \
  libx265-dev \
  libvips-dev \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

#Building latest libheif (v1.18.2)
#Installs HEIF and video codec development libraries: libde265-dev, libx265-dev.
#clones and builds libheif v1.18.2 from source. This is essential for HEIF binding
RUN git clone --depth 1 --branch v1.18.2 https://github.com/strukturag/libheif.git /tmp/libheif \
  && cd /tmp/libheif \
  && mkdir build && cd build \
  && cmake .. -DCMAKE_INSTALL_PREFIX=/usr/local \
  && make -j"$(nproc)" \
  && make install \
  && ldconfig

# Cache Go dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Ensure CGO is enabled and build
ENV CGO_ENABLED=1
RUN GOOS=linux go build -a -o server ./cmd
# Stage 2: Runtime
FROM debian:bookworm-slim

# Install only runtime deps (smaller image)
RUN apt-get update && apt-get install -y --no-install-recommends \
  libvips42 \
  libde265-0 \
  libx265-199 \
  libheif1 \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy built libheif from builder
COPY --from=builder /usr/local/lib/libheif* /usr/local/lib/
COPY --from=builder /usr/local/bin/heif-* /usr/local/bin/
RUN ldconfig

# Copy server binary + configs
COPY --from=builder /app/server /server
COPY ./config.yaml /config.yaml
COPY ./secret.yml /secret.yml
COPY ./assets /assets
# COPY ./assets/tmp /assets/tmp
# COPY ./assets/default /assets/default
# COPY ./assets/pfp /assets/pfp

EXPOSE 8080 8081 8082 8083

ENTRYPOINT ["/server"]