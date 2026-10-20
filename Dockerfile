# Build (always on native arch — output is static files)
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

# Node 20 bundles npm 10, which has an upstream Arborist peer-resolution crash ("edgesOut").
# Pin npm 11.21.1, which contains the fix, before installing from the lockfile.
RUN npm install --global npm@11.21.1 --no-audit --no-fund && npm --version

COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Runtime
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
ENV API_BASE_URL=""

EXPOSE 80
