# Build
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Runtime
FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist
COPY update-config.sh /app/update-config.sh
RUN chmod +x /app/update-config.sh

ENV API_BASE_URL=""

EXPOSE 80

CMD ["/bin/sh", "-c", "/app/update-config.sh && serve -s dist -l 80"]
