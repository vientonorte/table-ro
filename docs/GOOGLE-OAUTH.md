# Google OAuth — table-ro (fix `invalid_client`)

## Error

```
Acceso bloqueado: Error de autorización
The OAuth client was not found.
Error 401: invalid_client
```

**Causa:** el Client ID embebido  
`5033046467-kgd7gl4tekb4fkt90jq32rob4evmgnmn.apps.googleusercontent.com`  
**ya no existe** (borrado, proyecto deshabilitado, o no visible para `gaete.gaona@gmail.com`).

## Qué sigue funcionando sin OAuth

- Tablero local (tasks)
- Sync **ICS público** de `gaete.gaona@gmail.com` (eventos en Personal)
- BuJo, filtros Personal/Laboral

OAuth solo para **Calendar API** bidireccional (push/pull API, listar calendarios privados).

## Fix (15 min) — cuenta `gaete.gaona@gmail.com` o Workspace con acceso

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) con **gaete.gaona@gmail.com** (o el proyecto correcto).
2. Elige o crea un proyecto (ej. `vientonorte-table-ro`).
3. **APIs & Services → Library** → habilita **Google Calendar API**.
4. **OAuth consent screen** → External (o Internal si Workspace) → app name `Tablero Rö` → scopes:
   - `.../auth/calendar.readonly`
   - `.../auth/calendar.events`
5. **Credentials → Create credentials → OAuth client ID → Web application**
6. **Authorized JavaScript origins:**
   ```
   https://vientonorte.github.io
   http://localhost:8080
   http://127.0.0.1:8080
   ```
7. **Authorized redirect URIs** (por si acaso):
   ```
   https://vientonorte.github.io
   https://vientonorte.github.io/table-ro
   https://vientonorte.github.io/table-ro/
   ```
8. Copia el **Client ID** (`….apps.googleusercontent.com`).
9. En table-ro prod:
   - ⚙️ → Google OAuth → pega Client ID → Conectar  
   - o en consola del navegador:  
     `localStorage.setItem('gcal_client_id','TU_CLIENT_ID_NUEVO')`  
     y recarga.

10. (Opcional) Actualiza el default en `js/app.js` `GCAL_CLIENT_ID` y despliega v nueva.

## Workspace

Si el proyecto OAuth está en **Google Workspace** de Viento Norte, el usuario de prueba y el consent screen deben permitir `gaete.gaona@gmail.com` (o usa la cuenta Workspace para crear el client y añade gmail como test user en External).

## Verificación

1. https://vientonorte.github.io/table-ro/  
2. 🔑 Conectar con Google → elige `gaete.gaona@gmail.com`  
3. Debe aparecer “Google Calendar conectado ✓”  
4. 🔍 Detectar lista calendarios  

## Relacionado

- DEPLOY-GITHUB-PAGES.md Paso 3  
- Vault: `20-sistema/google-cuenta.md`
