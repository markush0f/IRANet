#!/bin/bash
set -e

cd "$(dirname "$0")"

docker compose \
  --env-file .env.db \
  --env-file .env.backend \
  --env-file .env.frontend \
  -f compose.db.yml \
  -f compose.backend.yml \
  -f compose.frontend.yml \
  up -d --build

echo ""
echo "Services:"
echo "  Frontend  -> http://localhost:3000"
echo "  Backend   -> http://localhost:8000"
echo "  PostgreSQL-> localhost:5432"
