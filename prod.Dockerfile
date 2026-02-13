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

# Install server dependencies
RUN npm init -y && npm install express multer

# Copy built assets from Stage 1
COPY --from=build /app/build ./build

# Copy server file
COPY server.js ./

# Create directories for persistence
RUN mkdir -p data uploads

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]