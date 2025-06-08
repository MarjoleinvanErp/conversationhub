FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Clean install (debug version)
RUN npm cache clean --force
RUN npm install --verbose

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV REACT_APP_API_URL=http://localhost:8000
ENV NODE_ENV=development

# Start with Vite
CMD ["npm", "run", "dev"]