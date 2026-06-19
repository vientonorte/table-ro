# Worker Cloudflare — Paso a paso

Proxy IA + ICS para table-ro. Sin este Worker, **BuJo con fotos no funciona en producción** (vientonorte.github.io).

---

## Requisitos previos

- Cuenta [Cloudflare](https://dash.cloudflare.com/sign-up) (plan free alcanza)
- Node.js 18+ y npm
- API keys de al menos un proveedor:
  - [Anthropic](https://console.anthropic.com/) → `CLAUDE_API_KEY`
  - [OpenAI](https://platform.openai.com/api-keys) → `OPENAI_API_KEY`
  - [Google AI](https://aistudio.google.com/apikey) → `GEMINI_API_KEY`

---

## Paso 1 — Instalar Wrangler

```bash
cd /Users/ro/Documents/GitHub/table-ro/worker
npm install
npx wrangler --version
```

---

## Paso 2 — Autenticar Cloudflare

```bash
npx wrangler login
```

Se abre el navegador → autorizar acceso a tu cuenta CF.

Verificar:

```bash
npx wrangler whoami
```

---

## Paso 3 — Configurar secrets (API keys)

Ejecutar **una vez por key** (el valor no se muestra al escribir):

```bash
npx wrangler secret put CLAUDE_API_KEY
# pegar sk-ant-...

npx wrangler secret put OPENAI_API_KEY
# pegar sk-...

npx wrangler secret put GEMINI_API_KEY
# pegar AIza...
```

Mínimo **una** key para que BuJo funcione con ese proveedor.

---

## Paso 4 — Verificar CORS (origen permitido)

En `worker/wrangler.toml` ya está:

```toml
[vars]
ALLOWED_ORIGIN = "https://vientonorte.github.io"
```

Para probar en local, añadir temporalmente:

```toml
ALLOWED_ORIGIN = "https://vientonorte.github.io,http://localhost:8080"
```

---

## Paso 5 — Deploy

```bash
npx wrangler deploy
```

Salida esperada:

```
Published table-ro-ai-proxy (X.XX sec)
  https://table-ro-ai-proxy.<tu-subdominio>.workers.dev
```

**Copiar esa URL** — la necesitas en el paso 7.

---

## Paso 6 — Probar el Worker (terminal)

Reemplaza `WORKER_URL` y usa una key configurada:

```bash
WORKER_URL="https://table-ro-ai-proxy.TU-CUENTA.workers.dev"

# Health: debe responder 403 sin Origin (correcto)
curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/api/claude"
# → 403

# Con Origin válido (OPTIONS)
curl -s -X OPTIONS "$WORKER_URL/api/claude" \
  -H "Origin: https://vientonorte.github.io" -w "\n%{http_code}\n"
# → 204

# Claude smoke (payload mínimo)
curl -s -X POST "$WORKER_URL/api/claude" \
  -H "Origin: https://vientonorte.github.io" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":50,"messages":[{"role":"user","content":"di hola"}]}' \
  | head -c 200
```

---

## Paso 7 — Configurar en table-ro (prod)

1. Abrir https://vientonorte.github.io/table-ro/
2. **⚙️ Admin** (o ☰ Más → Admin)
3. Tab **🔧 Admin** → sección **🤖 Motor IA**
4. Campo **Proxy Worker** → pegar URL sin barra final:
   ```
   https://table-ro-ai-proxy.TU-CUENTA.workers.dev
   ```
5. Esperar auto-guardado (toast "Config IA guardada")
6. Dots de proveedor deben ponerse verdes (● ok)

---

## Paso 8 — Probar BuJo end-to-end

1. **📓 Bullet Journal** → subir foto de página Bullet Ro
2. **Analizar y revisar →**
3. Debe aparecer preview con ítems (no error de proxy)
4. Revisar → **＋ Agregar al tablero**

---

## Troubleshooting

| Síntoma | Causa | Fix |
|---------|-------|-----|
| `403 Forbidden` | Origin incorrecto | Verificar `ALLOWED_ORIGIN` en wrangler.toml + redeploy |
| `500 CLAUDE_API_KEY not configured` | Secret no seteado | `wrangler secret put CLAUDE_API_KEY` |
| `CORS error` en DevTools | URL proxy mal pegada | Sin `/` final; debe ser `*.workers.dev` |
| IA no arranca en prod | Proxy vacío | Admin → Proxy Worker |
| `quota` / `429` | Límite API | Cambiar proveedor en Admin o recargar créditos |

---

## Rotación de keys

```bash
npx wrangler secret put CLAUDE_API_KEY   # sobrescribe
npx wrangler deploy                       # no obligatorio pero recomendado
```

---

## Links útiles

- Dashboard Worker: https://dash.cloudflare.com → Workers & Pages → `table-ro-ai-proxy`
- Logs en vivo: `npx wrangler tail`
- Repo worker: `worker/src/index.js`
- HANDOFF: `HANDOFF.md`