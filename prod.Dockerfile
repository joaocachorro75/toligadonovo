# Stage 1: Build React App
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:18-alpine
WORKDIR /app

# Install server dependencies (com mysql2)
RUN npm init -y && npm install express@4.21.2 multer cors node-fetch mysql2

# Copy built assets from Stage 1 (Vite outputs to 'dist')
COPY --from=build /app/dist ./dist

# Copy server files
COPY server.js ./
COPY server-mysql.js ./

# Create directories for persistence
RUN mkdir -p data uploads

# Expose port
EXPOSE 3000

# Start server (use server-mysql.js se MYSQL_HOST estiver definido)
CMD ["sh", "-c", "if [ -n \"$MYSQL_HOST\" ]; then node server-mysql.js; else node server.js; fi"]
