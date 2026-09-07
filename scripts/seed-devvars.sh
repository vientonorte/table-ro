#!/usr/bin/env bash
# seed-devvars.sh — crea worker/.dev.vars (gitignored) desde env, sin echo.
# Preferencia Clave A: XAI_API_KEY (Grok / SpaceXAI). No copia ~/.grok/auth.json (OIDC ≠ API key).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/worker/.dev.vars"
EXAMPLE="$ROOT/worker/.dev.vars.example"
mkdir -p "$ROOT/worker"
umask 077

python3 - "$OUT" "$EXAMPLE" <<'PY'
import os, sys
from pathlib import Path
out, example = Path(sys.argv[1]), Path(sys.argv[2])
order = ["XAI_API_KEY", "CLAUDE_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"]
existing = {}
if out.exists():
    for line in out.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        existing[k.strip()] = v.strip()

wrote = []
for k in order:
    env = os.environ.get(k, "").strip()
    if env:
        existing[k] = env
        wrote.append(k)
    elif k not in existing:
        existing[k] = ""

lines = [
    "# gitignored · generado por scripts/seed-devvars.sh · nunca commit",
    "# Clave A: Grok (XAI_API_KEY) primero. Claude/OpenAI/Gemini opcionales.",
]
for k in order:
    lines.append(f"{k}={existing.get(k, '')}")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
os.chmod(out, 0o600)
nonempty = [k for k in order if existing.get(k)]
print("OK", str(out))
print("seeded_from_env", ",".join(wrote) if wrote else "none")
print("nonempty", ",".join(nonempty) if nonempty else "none")
if not nonempty:
    sys.exit(2)
PY
