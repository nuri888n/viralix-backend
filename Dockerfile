# Use the official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code (only what we need)
COPY src ./src/
COPY tsconfig.json ./

# Build the application
RUN npx tsc

# Remove source files (keep only dist)
RUN rm -rf src tsconfig.json

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]