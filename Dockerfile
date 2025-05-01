# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install && \
    npm install --prefix frontend && \
    npm install --prefix backend

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-slim

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install production dependencies
RUN npm install --only=production && \
    npm install --only=production --prefix backend

# Copy built application from builder stage
COPY --from=builder /app/backend/public ./backend/public
COPY --from=builder /app/backend/src ./backend/src

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port used by the backend server
EXPOSE 3001

# Start the application
CMD ["npm", "start"]