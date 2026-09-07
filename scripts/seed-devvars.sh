#!/usr/bin/env bash
# seed-devvars.sh — crea worker/.dev.vars (gitignored, 0600) desde fuentes locales.
# Preferencia Clave A: XAI_API_KEY (Grok / SpaceXAI).
# NUNCA copia ~/.grok/auth.json (OIDC de Grok TUI ≠ API key de console.x.ai).
# Nunca imprime valores.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/worker/.dev.vars"
EXAMPLE="$ROOT/worker/.dev.vars.example"
mkdir -p "$ROOT/worker"
umask 077

python3 - "$OUT" "$EXAMPLE" "$ROOT" <<'PY'
import os, sys, subprocess
from pathlib import Path

out, example, root = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
home = Path.home()
order = ["XAI_API_KEY", "CLAUDE_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"]
aliases = {
    "XAI_API_KEY": ["XAI_API_KEY", "GROK_API_KEY"],
    "CLAUDE_API_KEY": ["CLAUDE_API_KEY", "ANTHROPIC_API_KEY"],
    "OPENAI_API_KEY": ["OPENAI_API_KEY"],
    "GEMINI_API_KEY": ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
}
keychain_services = {
    "XAI_API_KEY": ["XAI_API_KEY", "xai-api-key", "xAI API Key"],
    "CLAUDE_API_KEY": ["CLAUDE_API_KEY", "ANTHROPIC_API_KEY"],
    "OPENAI_API_KEY": ["OPENAI_API_KEY"],
    "GEMINI_API_KEY": ["GEMINI_API_KEY"],
}
file_candidates = [
    home / ".config/xai/api_key",
    home / ".xai/api_key",
    root / ".env",
    root / "worker/.env",
]
# Explicit skip: Grok TUI login is OIDC, not console.x.ai
oidc = home / ".grok" / "auth.json"

def usable(val: str) -> bool:
    if not val:
        return False
    v = val.strip().strip("'").strip('"')
    if len(v) < 20:
        return False
    low = v.lower()
    if low in ("ollama", "change_me", "your_key", "xxx", "placeholder"):
        return False
    if v.startswith("sk-ant-xxx"):
        return False
    return True

def parse_kv_file(path: Path) -> dict:
    found = {}
    if not path.exists() or not path.is_file():
        return found
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return found
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        if s.startswith("export "):
            s = s[len("export "):]
        k, v = s.split("=", 1)
        k, v = k.strip(), v.strip().strip("'").strip('"')
        if usable(v):
            found[k] = v
    # bare key files (one line, no KEY=)
    if not found and path.name in ("api_key", "key"):
        first = text.strip().splitlines()[0].strip() if text.strip() else ""
        if usable(first):
            found["XAI_API_KEY"] = first
    return found

def keychain(service: str) -> str:
    try:
        r = subprocess.run(
            ["security", "find-generic-password", "-s", service, "-w"],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.TimeoutExpired):
        return ""
    if r.returncode != 0:
        return ""
    return r.stdout.strip()

existing = {}
if out.exists():
    existing.update({k: v for k, v in parse_kv_file(out).items()})

sources = {k: [] for k in order}

# 1) env
for k in order:
    for alias in aliases[k]:
        env = os.environ.get(alias, "").strip()
        if usable(env):
            existing[k] = env
            sources[k].append(f"env:{alias}")
            break

# 2) dotenv / file candidates (no OIDC)
for path in file_candidates:
    parsed = parse_kv_file(path)
    for k in order:
        if k in existing and usable(existing.get(k, "")):
            continue
        for alias in aliases[k]:
            if usable(parsed.get(alias, "")):
                existing[k] = parsed[alias]
                sources[k].append(f"file:{path.name}")
                break

# 3) macOS keychain
for k in order:
    if usable(existing.get(k, "")):
        continue
    for svc in keychain_services[k]:
        val = keychain(svc)
        if usable(val):
            existing[k] = val
            sources[k].append(f"keychain:{svc}")
            break

for k in order:
    if k not in existing:
        existing[k] = ""

lines = [
    "# gitignored · generado por scripts/seed-devvars.sh · nunca commit",
    "# Clave A: Grok (XAI_API_KEY de console.x.ai) primero.",
    "# NO copiar ~/.grok/auth.json (OIDC TUI ≠ API key).",
]
for k in order:
    lines.append(f"{k}={existing.get(k, '')}")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
os.chmod(out, 0o600)

nonempty = [k for k in order if usable(existing.get(k, ""))]
harvested = [f"{k}={'+'.join(sources[k])}" for k in order if sources[k]]
print("mode 0600 gitignored")
print("oidc_skipped", str(oidc), "exists=" + str(oidc.exists()))
print("harvested", ",".join(harvested) if harvested else "none")
print("nonempty", ",".join(nonempty) if nonempty else "none")
if not nonempty:
    print("FAIL", str(out), file=sys.stderr)
    print("NO DATO: ninguna API key usable (len>=20, no placeholder).", file=sys.stderr)
    print("Grok TUI ya lee Clave A en sesión. Worker necesita console.x.ai:", file=sys.stderr)
    print("  export XAI_API_KEY=xai-...   # nunca en chat", file=sys.stderr)
    print("  vn-cromatico secrets", file=sys.stderr)
    sys.exit(2)
print("OK", str(out))
PY
