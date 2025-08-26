FROM golang:1.24-alpine AS build

# https://github.com/upx/upx/releases/tag/v4.2.4
ARG upx_version=4.2.4
ARG TARGETARCH

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

WORKDIR /app

COPY go.mod ./
COPY go.sum ./

RUN go mod download && go mod verify

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o api -a -ldflags="-s -w" -installsuffix cgo
RUN upx --ultra-brute -qq api && upx -t api

FROM scratch
COPY --from=build /app/migrations /migrations
COPY --from=build /app/api /api
