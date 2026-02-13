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

# Install server dependencies (Pinning Express to v4 to fix PathError crash)
RUN npm init -y && npm install express@4.21.2 multer cors

# Copy built assets from Stage 1 (Vite outputs to 'dist')
COPY --from=build /app/dist ./dist

# Copy server file
COPY server.js ./

# Create directories for persistence
RUN mkdir -p data uploads

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]