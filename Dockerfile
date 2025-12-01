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
COPY --from=build-stage /app/serve.json ./dist/serve.json
CMD ["serve", "-s", "dist"]
