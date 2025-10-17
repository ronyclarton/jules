# 1. Base Image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy application code
COPY . .

# 5. Build TypeScript code
RUN npm run build

# 6. Expose port and start the application
EXPOSE 3000
CMD ["npm", "start"]