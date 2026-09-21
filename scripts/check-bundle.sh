#!/usr/bin/env bash
# scripts/check-bundle.sh
#
# Falla si el JavaScript de un build de PRODUCCIÓN (.next/static) trae los
# ganchos de las pruebas en navegador (tests/browser): la puerta de servicio
# que inicia sesión con un token de prueba y la conexión a los emuladores.
# Están detrás de NEXT_PUBLIC_E2E_EMULATORS, que en producción no existe y
# next.config.js fija en '0' para que el minificador los elimine.
#
# Uso, después de `npx next build` SIN esa variable:  bash scripts/check-bundle.sh
set -u

DIR="${1:-.next/static}"
if [ ! -d "$DIR" ]; then
  echo "❌ No existe $DIR: corré primero \`npx next build\`." >&2
  exit 2
fi

status=0
for pattern in '__cresiE2E' '127.0.0.1:9099' 'NEXT_PUBLIC_E2E_EMULATORS'; do
  files="$(grep -rl -- "$pattern" "$DIR" 2>/dev/null || true)"
  if [ -n "$files" ]; then
    echo "❌ '$pattern' aparece en el bundle público:" >&2
    echo "$files" | sed 's/^/     /' >&2
    status=1
  fi
done

[ "$status" -eq 0 ] && echo "✅ Ningún gancho de prueba en $DIR"
exit "$status"
