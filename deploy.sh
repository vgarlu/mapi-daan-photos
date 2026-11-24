#!/usr/bin/env bash
# Publica los cambios y limpia la caché de Cloudflare.
#   ./deploy.sh            -> commit + push + espera a Pages + purga todo el edge
#   ./deploy.sh "mensaje"  -> ídem con mensaje de commit
set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-Actualizacion $(date +%Y-%m-%d\ %H:%M)}"
ZONE="8ec8c270316aa81ddcf12ae2ecb0a498"
TOKEN_FILE="$HOME/.config/cloudflare/token"

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -q -m "$MSG"
fi
git push -q origin main
echo "→ push hecho, esperando a GitHub Pages…"

for i in $(seq 1 40); do
  STATUS=$(gh api repos/vgarlu/mapi-daan-photos/pages/builds/latest --jq .status 2>/dev/null || echo pending)
  [[ "$STATUS" == "built" ]] && break
  sleep 10
done
echo "→ Pages: $STATUS"

if [[ -f "$TOKEN_FILE" ]]; then
  curl -sS -X POST -H "Authorization: Bearer $(cat "$TOKEN_FILE")" \
    -H "Content-Type: application/json" --data '{"purge_everything":true}' \
    "https://api.cloudflare.com/client/v4/zones/$ZONE/purge_cache" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print('→ purge:', 'OK' if d['success'] else d['errors'])"
else
  echo "→ sin token de Cloudflare: no se purga (usa ./deploy.sh con ~/.config/cloudflare/token)"
fi
