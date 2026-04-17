# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Add libc6-compat for Next.js SWC support on Alpine
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm install

COPY . .

# Increase memory for the build and run next build
ENV NODE_OPTIONS="--max_old_space_size=4096"
RUN npm run build

# Final stage
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./
# Copy public folder if it exists, and other necessary assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

EXPOSE 3000

ENV NODE_ENV=production
ENV API_URL=http://backend:8080

CMD ["npm", "start"]
