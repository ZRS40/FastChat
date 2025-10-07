#!/usr/bin/env sh
set -e

echo "[entrypoint] Ensuring frontend dependencies are installed..."
if [ -f package-lock.json ]; then
  # Prefer reproducible installs when lockfile is present
  npm ci || npm install
else
  npm install
fi

# Fallback: explicitly ensure react-router-dom is present
if [ ! -f node_modules/react-router-dom/package.json ]; then
  echo "[entrypoint] react-router-dom missing, installing..."
  npm install react-router-dom@latest
fi

exec "$@"


