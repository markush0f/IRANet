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
  down
