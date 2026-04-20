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

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build and static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/src/cron ./src/cron

EXPOSE 3000

# Start both cron and the standalone server
# Note: In production, standalone output uses 'server.js' instead of 'next start'
CMD node src/cron/emailCron.js & node server.js
