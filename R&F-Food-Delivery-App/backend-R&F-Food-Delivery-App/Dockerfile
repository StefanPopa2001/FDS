# Optimized production Dockerfile for Node.js Backend
FROM node:20.18.0-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies with optimized caching
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Production stage
FROM base AS production

# Copy package files and install all dependencies (for dev dependencies needed for build)
COPY package*.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Ensure uploads directory exists and has correct ownership
RUN mkdir -p /app/public/uploads && \
    chown -R nodejs:nodejs /app/public/uploads

# Create logs directory for Docker environment with correct ownership
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app/logs && \
    chmod 755 /app/logs

# Change ownership of the entire app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expose the port
EXPOSE 3001

# Use dumb-init for proper signal handling
CMD ["dumb-init", "npm", "start"]
