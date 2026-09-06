#!/usr/bin/env bash
# qa-proxy.sh — smoke Worker table-ro-ai-proxy. No imprime bodies con keys.
set -euo pipefail
PROXY="${PROXY:-https://table-ro-ai-proxy.vientonorte.workers.dev}"
ORIGIN="${ORIGIN:-https://vientonorte.io}"
fail=0
for path in /api/claude /api/openai /api/gemini; do
  code="$(curl -sS -o /tmp/vn-proxy-body.txt -w "%{http_code}" --max-time 15 \
    -X POST -H "Origin: $ORIGIN" -H "Content-Type: application/json" --data '{}' \
    "$PROXY$path" || true)"
  body="$(head -c 200 /tmp/vn-proxy-body.txt 2>/dev/null || true)"
  if [[ "$code" == "403" ]]; then
    echo "FAIL $path HTTP 403 (CORS/origin). ALLOWED_ORIGIN debe incluir $ORIGIN"
    fail=1
    continue
  fi
  if echo "$body" | grep -q "not configured"; then
    echo "FAIL $path HTTP $code · *_API_KEY not configured"
    fail=1
    continue
  fi
  # 400/401/422 del proveedor = key presente, payload vacío. 200 también ok.
  echo "OK $path HTTP $code (no 'not configured')"
done
rm -f /tmp/vn-proxy-body.txt
if [[ "$fail" -ne 0 ]]; then
  exit 1
fi
echo "qa-proxy PASS"
