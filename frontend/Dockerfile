FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add npm optimization
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-factor 2
RUN npm config set fetch-timeout 60000

# Install dependencies first (for Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]