#!/usr/bin/env bash
# Publica los cambios y limpia la caché de Cloudflare.
#   ./deploy.sh            -> versiona CSS/JS, commit + push, espera a Pages y purga el edge
#   ./deploy.sh "mensaje"  -> ídem con mensaje de commit
set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-Actualizacion $(date +%Y-%m-%d\ %H:%M)}"
ZONE="8ec8c270316aa81ddcf12ae2ecb0a498"
REPO="vgarlu/mapi-daan-photos"
TOKEN_FILE="$HOME/.config/cloudflare/token"

# 1. versionar CSS/JS: ni el navegador ni Cloudflare sirven código viejo
VER=$(date +%Y%m%d%H%M)
python3 - "$VER" <<'PY'
import re, sys
v = sys.argv[1]
p = "index.html"
s = open(p, encoding="utf-8").read()
s = re.sub(r'css/style\.css(\?v=[^"\']*)?', f'css/style.css?v={v}', s)
s = re.sub(r'js/app\.js(\?v=[^"\']*)?', f'js/app.js?v={v}', s)
open(p, "w", encoding="utf-8").write(s)
print(f"→ version {v}")
PY

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -q -m "$MSG"
fi
git push -q origin main
SHA=$(git rev-parse HEAD)
echo "→ push ${SHA:0:8}, esperando a GitHub Pages…"

# 2. esperar al build DE ESTE commit (el endpoint devuelve el anterior un rato)
STATUS=""; BUILT=""
for i in $(seq 1 60); do
  read -r STATUS BUILT <<<"$(gh api "repos/$REPO/pages/builds/latest" --jq '"\(.status) \(.commit)"' 2>/dev/null || echo "pending -")"
  [[ "$BUILT" == "$SHA" && "$STATUS" == "built" ]] && break
  sleep 10
done
echo "→ Pages: $STATUS ($BUILT)"

if [[ -f "$TOKEN_FILE" ]]; then
  curl -sS -X POST -H "Authorization: Bearer $(cat "$TOKEN_FILE")" \
    -H "Content-Type: application/json" --data '{"purge_everything":true}' \
    "https://api.cloudflare.com/client/v4/zones/$ZONE/purge_cache" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print('→ purge:', 'OK' if d['success'] else d['errors'])"
else
  echo "→ sin token de Cloudflare: no se purga (usa ./deploy.sh con ~/.config/cloudflare/token)"
fi
