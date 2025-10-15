# Multi-stage build for React production with optimized caching
FROM node:20.18.0-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies with optimized caching
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY . .
RUN npm install --legacy-peer-deps
EXPOSE 3000
CMD ["dumb-init", "npm", "start"]

# Build stage
FROM base AS build

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Set production API URL and build options
ENV REACT_APP_API_URL=https://rudyetfanny.be/api
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV DISABLE_ESLINT_PLUGIN=true
ENV CI=false

# Build the application
RUN npm run build

# Production stage with a lightweight Node static server
FROM node:20.18.0-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create app dir and copy build
WORKDIR /app
COPY --from=build /app/build ./build

# Copy server script
COPY server.js ./server.js

# Install a minimal set of dependencies for the static server
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Healthcheck against the static server
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ >/dev/null 2>&1 || exit 1

EXPOSE 3000

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "server.js"]
