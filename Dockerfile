FROM node:18-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production

FROM node:18-alpine AS builder
WORKDIR /build
COPY . .
COPY --from=base /app/node_modules ./node_modules
RUN npm install
RUN npm run build

FROM base AS production
COPY --from=builder /build/dist .
EXPOSE 3000
CMD ["node", "index.js"]
