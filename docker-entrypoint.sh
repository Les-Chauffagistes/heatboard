#!/bin/sh
set -e


# Injection des secrets
DB_PASS=$(cat /run/secrets/heatboard_db_password)
export PGPASSWORD="${DB_PASS}"
export DATABASE_URL="postgresql://postgres:${DB_PASS}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE}"
export POOL_TOKEN=$(cat /run/secrets/heatboard_pool_token)
export SESSION_PASSWORD=$(cat /run/secrets/heatboard_session_password)
export DISCORD_CLIENT_SECRET=$(cat /run/secrets/heatboard_discord_client_secret)
export NEXTAUTH_SECRET=$(cat /run/secrets/heatboard_nextauth_secret)

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

echo "Applying migrations..."
until npx prisma migrate deploy; do
  echo "DB pas prête, retry..."
  sleep 2
done

echo "Migrations OK, starting..."
exec node server.js