#!/bin/sh
# Runtime configuration injection for Docker containers
echo "Updating frontend configuration..."
echo "API_BASE_URL: ${API_BASE_URL:-}"

cat > /app/dist/env-config.js <<EOF
window.API_BASE_URL = '${API_BASE_URL:-}';
EOF

echo "Configuration updated!"
