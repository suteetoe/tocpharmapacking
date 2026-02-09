# Build stage
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine as production-stage
WORKDIR /app
RUN npm install -g serve
COPY --from=build-stage /app/dist ./dist

# Copy entrypoint script เข้าไป
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# CMD ["serve", "-s", "dist"]
ENTRYPOINT ["/entrypoint.sh"]