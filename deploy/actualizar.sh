#!/usr/bin/env bash
# Actualiza el servidor con lo último de GitHub. Lo ejecuta GitHub Actions (por SSH)
# en cada push a main, y también se puede correr a mano:  bash deploy/actualizar.sh
# El .env no se toca: está fuera de git.
set -euo pipefail

RUTA="${RUTA_VOCES:-/opt/voces}"
SERVICIO="${SERVICIO_VOCES:-voces}"
cd "$RUTA"

echo "→ Bajando cambios de GitHub…"
# ANTES lo pasa GitHub Actions, que ya bajó el código antes de llamar a este script.
antes="${ANTES:-$(git rev-parse HEAD)}"
git fetch --quiet origin main
# El servidor queda igual a GitHub (los cambios hechos a mano en el servidor se pierden).
git reset --hard --quiet origin/main
despues=$(git rev-parse HEAD)
echo "  $antes → $despues"

if [ "$antes" != "$despues" ] && git diff --name-only "$antes" "$despues" | grep -q '^requirements.txt$'; then
  echo "→ requirements.txt cambió: instalando dependencias…"
  .venv/bin/pip install --quiet -r requirements.txt
fi

echo "→ Reiniciando el servicio $SERVICIO…"
sudo systemctl restart "$SERVICIO"

echo "→ Comprobando que responda…"
for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8000/health | grep -q ok; then
    echo "✔ Listo: el servidor responde."
    exit 0
  fi
  sleep 2
done
echo "✘ El servidor no respondió. Revisa: sudo journalctl -u $SERVICIO -n 50"
exit 1
