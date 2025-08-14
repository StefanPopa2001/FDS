# Multi-stage build for React production
FROM node:20.18.0 as build

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force
RUN npm install --legacy-peer-deps
RUN npm install -g react-scripts

# Copy source code
COPY . .

# Fix permissions for node_modules
RUN chmod -R 755 node_modules/.bin/

# Disable ESLint and set legacy OpenSSL provider for Node.js
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV DISABLE_ESLINT_PLUGIN=true

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
