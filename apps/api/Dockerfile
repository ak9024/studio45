# Multi-stage build for Go API with UPX compression
# Produces a minimal scratch-based image with compressed binary
FROM golang:1.24-alpine AS build

# ============================================================================
# UPX COMPRESSION TOOL INSTALLATION
# ============================================================================
# UPX (Ultimate Packer for eXecutables) reduces binary size by 60-80%
# https://github.com/upx/upx/releases/tag/v4.2.4
ARG upx_version=4.2.4
ARG TARGETARCH

# Install UPX with architecture detection for cross-platform builds
# Supports AMD64 and ARM64 architectures commonly used in production
RUN apk add --no-cache curl xz && \
  case ${TARGETARCH} in \
    amd64) ARCH=amd64_linux ;; \
    arm64) ARCH=arm64_linux ;; \
    *) echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
  esac && \
  curl -Ls https://github.com/upx/upx/releases/download/v${upx_version}/upx-${upx_version}-${ARCH}.tar.xz -o - | tar xvJf - -C /tmp && \
  cp /tmp/upx-${upx_version}-${ARCH}/upx /usr/local/bin/ && \
  chmod +x /usr/local/bin/upx && \
  apk del curl xz

# ============================================================================
# GO DEPENDENCIES
# ============================================================================
WORKDIR /app

# Copy go.mod and go.sum first for better Docker layer caching
# Dependencies will only re-download if these files change
COPY go.mod ./
COPY go.sum ./

# Download and verify dependencies
# go mod verify ensures integrity of downloaded modules
RUN go mod download && go mod verify

# ============================================================================
# BUILD APPLICATION
# ============================================================================
# Copy source code after dependencies for optimal layer caching
COPY . .

# Build optimized static binary
# CGO_ENABLED=0: Disable CGO for static linking
# GOOS=linux: Target Linux OS
# -a: Force rebuilding of packages
# -ldflags="-s -w": Strip debug info (-s) and symbol table (-w) for smaller binary
# -installsuffix cgo: Ensure packages built without cgo don't conflict
RUN CGO_ENABLED=0 GOOS=linux go build -o api -a -ldflags="-s -w" -installsuffix cgo

# Compress binary with UPX ultra-brute compression (maximum compression)
# -qq: Quiet mode, -t: Test compressed binary integrity
RUN upx --ultra-brute -qq api && upx -t api

# ============================================================================
# PRODUCTION IMAGE
# ============================================================================
# Use scratch base image for minimal attack surface and smallest possible size
# Contains only the essentials: our binary and migration files
FROM scratch

# Copy database migration files for schema management
COPY --from=build /app/migrations /migrations

# Copy the compressed static binary (typically 2-5MB after UPX compression)
COPY --from=build /app/api /api

# No EXPOSE needed - port is configured via environment variables
# No USER needed - scratch has no users, runs as root by default
# No ENTRYPOINT/CMD needed - configured in docker-compose.yaml
