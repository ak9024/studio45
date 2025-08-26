# Multi-stage build for Vite React application
# Produces an optimized nginx-served production build
FROM node:22.12-alpine AS build

# ============================================================================
# BUILD ARGUMENTS & ENVIRONMENT
# ============================================================================
# Build-time arguments for Vite environment variables
# These are embedded into the production build at build time
ARG VITE_APP_TITLE="Studio45"
ARG VITE_API_HOST="http://localhost"

# Convert build args to environment variables for Vite
# Vite only processes env vars that start with VITE_ prefix
ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_API_HOST=${VITE_API_HOST}

# ============================================================================
# NODE.JS DEPENDENCIES
# ============================================================================
WORKDIR /app

# Copy package files first for optimal Docker layer caching
# Dependencies will only reinstall if package.json or package-lock.json change
COPY package*.json ./

# Use npm ci for faster, reliable, reproducible builds in production
# npm ci installs from package-lock.json and is faster than npm install
RUN npm ci

# ============================================================================
# BUILD APPLICATION
# ============================================================================
# Copy source code after dependencies for optimal layer caching
COPY . .

# Build production-optimized bundle with Vite
# Creates minified, tree-shaken, and optimized assets in /dist
RUN npm run build

# ============================================================================
# PRODUCTION IMAGE
# ============================================================================
# Use nginx Alpine for serving static files with minimal footprint
# nginx is optimized for high-performance static file serving
FROM nginx:1.25-alpine

# Copy custom nginx configuration
# Replaces default nginx config with our optimized settings
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
# Vite build output goes to nginx's default serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP traffic
# In production, Traefik will handle HTTPS termination
EXPOSE 80

# Start nginx in foreground mode (required for containers)
# -g "daemon off;" prevents nginx from running as background daemon
CMD ["nginx", "-g", "daemon off;"]

