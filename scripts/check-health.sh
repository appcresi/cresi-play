#!/usr/bin/env bash
# scripts/check-health.sh
#
# Consulta /api/health de un sitio y sale con error si no está sano. Lo usa
# .github/workflows/health.yml, pero se puede correr a mano:
#
#   scripts/check-health.sh https://jugar.cresi.com.ar
#   HEALTH_TOKEN=... scripts/check-health.sh https://jugar.cresi.com.ar --deep
#
# Reintenta unas veces antes de darse por vencido: justo después de un deploy
# el dominio puede tardar unos segundos en apuntar a la versión nueva.
#
# Variables opcionales: ATTEMPTS (6), WAIT_SECONDS (20), HEALTH_TOKEN (para --deep).
set -u

BASE="${1:?Uso: check-health.sh <url-base> [--deep]}"
BASE="${BASE%/}"
DEEP="${2:-}"
ATTEMPTS="${ATTEMPTS:-6}"
WAIT_SECONDS="${WAIT_SECONDS:-20}"

URL="$BASE/api/health"
CURL_ARGS=(-sS --max-time 20 -o /tmp/health-body.$$ -w '%{http_code}')
if [ "$DEEP" = "--deep" ]; then
  if [ -z "${HEALTH_TOKEN:-}" ]; then
    echo "❌ --deep necesita la variable HEALTH_TOKEN" >&2
    exit 2
  fi
  URL="$URL?deep=1"
  CURL_ARGS+=(-H "Authorization: Bearer $HEALTH_TOKEN")
fi

trap 'rm -f /tmp/health-body.$$' EXIT

for attempt in $(seq 1 "$ATTEMPTS"); do
  status="$(curl "${CURL_ARGS[@]}" "$URL" 2>/tmp/health-err.$$ || true)"
  body="$(cat /tmp/health-body.$$ 2>/dev/null || true)"

  if [ "$status" = "200" ] && echo "$body" | grep -q '"ok":true'; then
    echo "✅ $URL respondió sano (intento $attempt): $body"
    exit 0
  fi

  echo "⚠️  intento $attempt/$ATTEMPTS: HTTP ${status:-sin respuesta} — ${body:-$(cat /tmp/health-err.$$ 2>/dev/null)}"
  [ "$attempt" -lt "$ATTEMPTS" ] && sleep "$WAIT_SECONDS"
done

echo "❌ $URL NO está sano después de $ATTEMPTS intentos." >&2
exit 1
