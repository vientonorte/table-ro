# HANDOFF — table-ro v1.5.0

**Live:** https://vientonorte.github.io/table-ro/  
**Repo:** https://github.com/vientonorte/table-ro  
**Fecha cierre sprint:** 19 junio 2026  
**Gate G0:** vanilla v1.5-prod (React v2 track paralelo, no bloqueante)

---

## Estado al cierre

| Área | Estado | Notas |
|------|--------|-------|
| Producto v1.5.0 | ✅ Live | Push `main` → GitHub Pages root |
| Security | ✅ | CSP, escapeHtml, keys IA purgadas en prod |
| Privacy | ✅ | Ley 21.719, consent banner, passkey documentado |
| A11y | ✅ | Focus trap modales, pa11y CI |
| Passkey | ✅ | WebAuthn opcional (`js/auth-passkey.js`) |
| PWA | ✅ | SW `table-ro-v7`, iconos SVG maskable |
| Worker IA | ⚠️ Pendiente owner | Desplegar `worker/` + URL en Admin |
| React v2 | 🔜 S3 | Andamio S1 en `src/`, no prod |

---

## Arquitectura prod

```
Browser (GitHub Pages)
  ├── index.html + js/app.js (vanilla v1.5)
  ├── localStorage (estados, sync cache, perms)
  ├── sessionStorage (passkey session)
  └── fetch → Google Calendar API | Trello API
              └── Cloudflare Worker (opcional)
                    ├── POST /api/claude|openai|gemini
                    └── GET  /api/ics?url=
```

---

## Deploy

### App (GitHub Pages)

1. Bump versión en `index.html` (`meta version`, `?v=` en css/js)
2. Bump `CACHE_NAME` en `sw.js` (ej. `table-ro-v8`)
3. `git push origin main` — deploy automático ~2 min

### Worker (Cloudflare)

```bash
cd worker
wrangler secret put CLAUDE_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

En app: **⚙️ Admin → Proxy Worker** → URL `https://table-ro-ai-proxy.<account>.workers.dev`

### Rollback

```bash
git revert <commit>
# o
git checkout <tag-anterior> -- index.html js/app.js css/styles.css sw.js
git push
```

Usuarios con SW stale: hard refresh o DevTools → Application → Clear site data.

---

## CI

| Job | Qué valida |
|-----|------------|
| `lint` | Prettier HTML, `node --check` app.js, auth-passkey.js, sw.js |
| `a11y` | pa11y-ci WCAG2AA en index, privacy, terms |

Local:

```bash
npx serve . -l 3456 &
sleep 2 && npx pa11y-ci --config .pa11yci.json
```

---

## localStorage — inventario

| Key | Contenido | Prod OK |
|-----|-----------|---------|
| `tablero_states_ro` | done, detail, cancelled | ✅ |
| `tablero_extra_ro` | eventos manuales | ✅ |
| `tablero_synced_ro` | caché sync | ✅ |
| `tablero_ai_cfg_ro` | config IA (**sin keys**) | ✅ |
| `tablero_consent_ro` | banner privacidad | ✅ |
| `tablero_passkey_users` | usuarios passkey | ✅ |
| `trello_*` | credenciales Trello | ⚠️ migrar a Worker |

---

## Checklist release (owner)

- [ ] Worker desplegado con secrets rotados
- [ ] Proxy URL configurada en Admin prod
- [ ] Flujo humo: load → consent → tablero → add task → export JSON
- [ ] BuJo texto manual OK; BuJo foto + IA OK con proxy
- [ ] Passkey registro/login en dispositivo real
- [ ] Tag `v1.5.0` en GitHub

---

## Referencias

- `DESIGN-SPRINT.md` — plan end-to-end completo
- `DEPLOY-GITHUB-PAGES.md` — OAuth Google + Pages
- `CHANGELOG.md` — historial versiones
- `privacy.html` / `terms.html` — legal v1.5

**Sign-off:** Rö / viento norte — pendiente post Worker deploy