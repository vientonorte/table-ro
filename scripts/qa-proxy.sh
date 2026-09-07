#!/usr/bin/env bash
# qa-proxy.sh — smoke Worker table-ro-ai-proxy. No imprime bodies con keys.
set -euo pipefail
PROXY="${PROXY:-https://table-ro-ai-proxy.vientonorte.workers.dev}"
ORIGIN="${ORIGIN:-https://vientonorte.io}"
ok=0
cors_fail=0
for path in /api/grok /api/claude /api/openai /api/gemini; do
  code="$(curl -sS -o /tmp/vn-proxy-body.txt -w "%{http_code}" --max-time 15 \
    -X POST -H "Origin: $ORIGIN" -H "Content-Type: application/json" --data '{}' \
    "$PROXY$path" || true)"
  body="$(head -c 200 /tmp/vn-proxy-body.txt 2>/dev/null || true)"
  if [[ "$code" == "403" ]]; then
    echo "FAIL $path HTTP 403 (CORS/origin). ALLOWED_ORIGIN debe incluir $ORIGIN"
    cors_fail=1
    continue
  fi
  if echo "$body" | grep -q "not configured"; then
    echo "SKIP $path HTTP $code · key not configured"
    continue
  fi
  echo "OK $path HTTP $code (no 'not configured')"
  ok=$((ok + 1))
done
rm -f /tmp/vn-proxy-body.txt
if [[ "$cors_fail" -ne 0 ]]; then
  exit 1
fi
if [[ "$ok" -eq 0 ]]; then
  echo "FAIL qa-proxy: ningún proveedor con key (Grok/Claude/OpenAI/Gemini)"
  exit 1
fi
echo "qa-proxy PASS providers_ok=$ok"
