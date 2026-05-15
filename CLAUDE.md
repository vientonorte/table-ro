# CLAUDE.md — `vientonorte/table-ro`

## Project
Trello-calendario / table-ro — Kanban semanal con bullet journal drawer.
Owner: Rö (Rodrigo Gaete Gaona)

## Tech stack
- Vanilla JS + HTML + CSS (probable; verificar con Rö)
- Google Calendar OAuth
- ICS sync para múltiples calendarios
- localStorage para persistencia
- GitHub Pages para deploy

## Features actuales
- Kanban semanal (columnas por día / categorías)
- Bullet journal drawer (panel lateral)
- Google Calendar OAuth integration
- Multi-calendar ICS sync
- localStorage persistence
- HTTPS token auth para push GitHub

## Architectural decisions
1. **OAuth Google Calendar**: usar client-side flow (implicit grant). Token nunca persiste en servidor.
2. **ICS sync**: parsing client-side; no enviar calendar data a terceros.
3. **localStorage** como única persistencia; sin backend.
4. **GitHub Pages constraints**: client-side only.

## Privacy
- Token OAuth Google **nunca** en logs, nunca en exports, nunca en URLs.
- Calendar data **solo** client-side. No transmitir a terceros.
- localStorage limpio en logout.

## Conventions
- Mismas que `uxtools` (BEM CSS, kebab-case archivos, camelCase JS).
- Commits convencionales.

## Common commands
```bash
# Servir local (sin OAuth funcionando — OAuth requiere domain registrado)
python3 -m http.server 8000

# Push (HTTPS token auth)
git push origin main
```

## Known gotchas
- Google OAuth requiere domain registrado en Google Cloud Console. `localhost` debe estar en authorized origins.
- ICS sync puede ser pesado en navegador; considerar throttling para calendarios grandes.
- localStorage no es seguro para tokens; el token vive solo en sessionStorage cuando posible.

## Do NOT
- Persistir token OAuth en localStorage (usar sessionStorage o memoria).
- Enviar calendar data a servidores externos.
- Hardcoded client_id en repo público (usar variable build-time si es posible, o documentar limitación).

## Definition of Done para feature
- [ ] OAuth funciona en producción
- [ ] Calendar sync verificado con ≥3 calendarios
- [ ] localStorage usage < 5MB
- [ ] WCAG 2.2 AA en componentes UI
- [ ] README actualizado
