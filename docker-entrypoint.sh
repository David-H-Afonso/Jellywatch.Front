#!/bin/sh
# Runtime environment injection for Jellywatch frontend (Docker/nginx)
set -e

API_BASE_URL="${API_BASE_URL:-}"
RADARR_URL="${RADARR_URL:-}"
RADARR_ENABLED="${RADARR_ENABLED:-false}"
SONARR_URL="${SONARR_URL:-}"
SONARR_ENABLED="${SONARR_ENABLED:-false}"

{
	printf 'window.API_BASE_URL = "%s";\n' "$API_BASE_URL"
	printf 'window.RADARR_URL = "%s";\n' "$RADARR_URL"
	printf 'window.RADARR_ENABLED = "%s";\n' "$RADARR_ENABLED"
	printf 'window.SONARR_URL = "%s";\n' "$SONARR_URL"
	printf 'window.SONARR_ENABLED = "%s";\n' "$SONARR_ENABLED"
} > /usr/share/nginx/html/env-config.js

echo "[jellywatch-entrypoint] API_BASE_URL: ${API_BASE_URL:-<empty — nginx proxy handles /api/ routes>}"
echo "[jellywatch-entrypoint] RADARR_URL: ${RADARR_URL:-<disabled>}"
echo "[jellywatch-entrypoint] SONARR_URL: ${SONARR_URL:-<disabled>}"
