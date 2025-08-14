# Production Dockerfile for Node.js Backend
FROM node:20.18.0
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force
RUN npm install --only=production

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose the port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
