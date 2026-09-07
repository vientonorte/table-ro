#!/usr/bin/env bash
# sync-ai-secrets.sh — wrangler secret put desde worker/.dev.vars (gitignored).
# Nunca imprime valores. No usa echo/printf de keys.
#
# Uso:
#   scripts/sync-ai-secrets.sh
#   scripts/sync-ai-secrets.sh --dry-run
#   scripts/sync-ai-secrets.sh --smoke
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKER="$ROOT/worker"
DEVVARS="${DEVVARS:-$WORKER/.dev.vars}"
NAME="table-ro-ai-proxy"
KEYS=(XAI_API_KEY CLAUDE_API_KEY OPENAI_API_KEY GEMINI_API_KEY)
DRY=0
SMOKE=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --smoke) SMOKE=1 ;;
  esac
done

WRANGLER="$WORKER/node_modules/.bin/wrangler"
if [[ ! -x "$WRANGLER" ]]; then
  echo "FAIL: falta $WRANGLER (cd worker && npm install)" >&2
  exit 1
fi

if [[ ! -f "$DEVVARS" ]]; then
  echo "NO DATO: no existe $DEVVARS"
  echo "Copia worker/.dev.vars.example → worker/.dev.vars y pegá las keys (gitignored)."
  echo "No las pegues en chat."
  exit 2
fi

extract_to() {
  local key="$1" out="$2"
  python3 - "$DEVVARS" "$key" "$out" <<'PY'
import sys
from pathlib import Path
path, key, out = sys.argv[1], sys.argv[2], sys.argv[3]
for line in Path(path).read_text(encoding="utf-8").splitlines():
    s = line.strip()
    if not s or s.startswith("#") or "=" not in s:
        continue
    k, v = s.split("=", 1)
    if k.strip() != key:
        continue
    val = v.strip().strip("'").strip('"')
    if not val or val.startswith("sk-ant-xxx") or val in ("CHANGE_ME", "YOUR_KEY"):
        sys.exit(3)
    Path(out).write_text(val, encoding="utf-8")
    sys.exit(0)
sys.exit(3)
PY
}

put=0
missing=0
cd "$WORKER"
for key in "${KEYS[@]}"; do
  tmp="$(mktemp)"
  chmod 600 "$tmp"
  if ! extract_to "$key" "$tmp"; then
    rm -f "$tmp"
    echo "SKIP $key (ausente o placeholder en .dev.vars)"
    missing=$((missing + 1))
    continue
  fi
  if [[ "$DRY" == 1 ]]; then
    echo "DRY would put $key (len=$(wc -c < "$tmp" | tr -d ' '))"
    rm -f "$tmp"
    put=$((put + 1))
    continue
  fi
  if ! "$WRANGLER" secret put "$key" --name "$NAME" < "$tmp"; then
    rm -f "$tmp"
    echo "FAIL wrangler secret put $key" >&2
    exit 1
  fi
  rm -f "$tmp"
  echo "OK put $key"
  put=$((put + 1))
done

echo "sync-ai-secrets put=$put skipped=$missing"

if [[ "$put" -eq 0 ]]; then
  echo "FAIL: ninguna key lista en .dev.vars" >&2
  exit 2
fi

if [[ "$SMOKE" == 1 && "$DRY" != 1 ]]; then
  exec "$ROOT/scripts/qa-proxy.sh"
fi
