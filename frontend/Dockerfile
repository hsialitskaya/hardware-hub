# Frontend (Vite + React + TypeScript)
# Multi-stage: build + serve

FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build


FROM node:20-slim AS runtime

WORKDIR /app

# Install a simple HTTP server to serve the built files
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 5173 (or use 3000 for serve)
EXPOSE 5173

# Serve the application
CMD ["serve", "-s", "dist", "-l", "5173"]
