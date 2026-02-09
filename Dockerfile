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

# replace  href="/ in index.html to VITE_APP_BASE_URL_PLACEHOLDER for support base url
RUN sed -i 's|href="/|href="VITE_APP_BASE_URL_PLACEHOLDER|g' ./dist/index.html
RUN sed -i 's|src="/|src="VITE_APP_BASE_URL_PLACEHOLDER|g' ./dist/index.html

# Copy entrypoint script เข้าไป
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# CMD ["serve", "-s", "dist"]
ENTRYPOINT ["/entrypoint.sh"]