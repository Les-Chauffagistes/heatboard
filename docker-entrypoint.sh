#!/bin/sh
set -e


# Injection des secrets
DB_PASS=$(cat /run/secrets/heatboard_staging_db_password)
export PGPASSWORD="${DB_PASS}"
export DATABASE_URL="postgresql://postgres:${DB_PASS}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE}"
export POOL_TOKEN=$(cat /run/secrets/heatboard_staging_pool_token)
export SESSION_PASSWORD=$(cat /run/secrets/heatboard_staging_session_password)
export DISCORD_CLIENT_SECRET=$(cat /run/secrets/heatboard_staging_discord_client_secret)
export NEXTAUTH_SECRET=$(cat /run/secrets/heatboard_staging_nextauth_secret)

cat > public/config.js << CONF
window.__CONFIG__ = {
  BASE_URL: "${BASE_URL:-}",
  API_URL: "${API_URL:-}",
  HISTORY_API_URL: "${HISTORY_API_URL:-}",
  BITCOIN_API_URL: "${BITCOIN_API_URL:-}",
  AUTH_URL: "${AUTH_URL:-}",
  AUTH_API_URL: "${AUTH_API_URL:-}",
};
CONF

echo "Waiting migration flag..."
until [ -f /migrations/done ] && \
  [ "$(ls prisma/migrations/ | grep -v migration_lock.toml | sort | sha256sum | cut -d' ' -f1)" = "$(cat /migrations/done)" ]; do
  echo "Migration(s) not applied, retry..."
  sleep 2
done

echo "Migrations OK, starting..."
exec node server.js