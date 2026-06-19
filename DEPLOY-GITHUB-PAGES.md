# Deploy — GitHub Pages · Tablero Rö

**Repo:** https://github.com/vientonorte/table-ro  
**URL live:** https://vientonorte.github.io/table-ro  
**Versión actual:** v1.5.0

---

## Paso 1 — Push a main

```bash
git add .
git commit -m "Release v1.5.0 — descripción"
git push origin main
```

GitHub Pages redespliega automáticamente (~2 min).

---

## Paso 2 — Version bump (obligatorio en cada release)

Actualizar en sincronía:

| Archivo | Campo |
|---------|-------|
| `index.html` | `meta name="version"`, `<title>`, `?v=` en css/js |
| `sw.js` | `CACHE_NAME` (ej. `table-ro-v7` → `v8`) |
| `CHANGELOG.md` | Entrada nueva versión |

Sin bump de `CACHE_NAME`, usuarios pueden ver assets stale del service worker.

---

## Paso 3 — Google Cloud Console (OAuth)

`console.cloud.google.com/apis/credentials` → OAuth Client ID → **Editar**

**Authorized JavaScript origins:**
```
https://vientonorte.github.io
http://localhost:8080
```

**Authorized redirect URIs:**
```
https://vientonorte.github.io/table-ro
https://vientonorte.github.io/table-ro/index.html
```

---

## Paso 4 — Cloudflare Worker (IA + ICS proxy)

```bash
cd worker
npm install
wrangler secret put CLAUDE_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

Configurar en app: **⚙️ Admin → Proxy Worker** → pegar URL `*.workers.dev`

En producción las API keys **no** se guardan en localStorage.

---

## Paso 5 — Verificar deploy

1. Abrir https://vientonorte.github.io/table-ro/
2. Título debe mostrar versión correcta (ej. v1.5.0)
3. F12 → Application → Service Workers → confirmar SW activo
4. Flujo: consent banner → tablero → ＋ Añadir → persist reload

Si pantalla en blanco: Console → buscar 404 en js/css o violations CSP.

---

## Uso local

```bash
python3 -m http.server 8080
# http://localhost:8080/index.html
```

En local puedes usar API keys directas (solo dev) o el mismo Worker proxy.

---

## Tag release

```bash
git tag -a v1.5.0 -m "table-ro v1.5.0 — security & privacy by design"
git push origin v1.5.0
```