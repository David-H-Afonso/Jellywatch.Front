#!/bin/sh
# Runtime environment injection for Jellywatch frontend (Docker/nginx)
set -e

API_BASE_URL="${API_BASE_URL:-}"

printf 'window.API_BASE_URL = "%s";\n' "$API_BASE_URL" > /usr/share/nginx/html/env-config.js

echo "[jellywatch-entrypoint] API_BASE_URL: ${API_BASE_URL:-<empty — nginx proxy handles /api/ routes>}"
