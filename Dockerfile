# Use Node.js LTS version
FROM node:20-slim

# Create and set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the application port
EXPOSE 3001

# Start the Node.js application
CMD ["npm", "start"]