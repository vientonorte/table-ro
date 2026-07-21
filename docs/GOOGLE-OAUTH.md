# Google OAuth — table-ro

**App:** https://vientonorte.github.io/table-ro/  
**Brand / ownership page:** https://vientonorte.github.io/table-ro/brand.html  
**Privacy:** https://vientonorte.github.io/table-ro/privacy.html  
**Terms:** https://vientonorte.github.io/table-ro/terms.html  
**Logo marca:** https://vientonorte.github.io/table-ro/icons/logo-oauth.svg  

**Client ID live (Web, público):**  
`913158816697-q9ceacnedpeu1sgkoq73hv829dgnlocj.apps.googleusercontent.com`  

**Proyecto GCP:** `fluted-protocol-485115-c1`  
**Cuenta ops:** `gaete.gaona@gmail.com`  

**Client secret:** solo local (`~/Downloads/client_secret_…json` o `~/.config/vientonorte/`). **Nunca** en git ni frontend.

Vault reanudación: `20-sistema/oauth-verificacion-reanudar.md` (repo Vientonorte).

---

## Errores frecuentes

### 401 `invalid_client` / `flowName=GeneralOAuthFlow`

Client ID borrado o incorrecto. Usar el ID live de arriba; purgar localStorage del ID viejo `5033046467…`.

### 403 `access_denied` — “no completó el proceso de verificación… solo verificadores”

La app está en **Testing** y la cuenta **no está en Test users**.

**Fix:** OAuth consent screen → Test users → add `gaete.gaona@gmail.com`.

### Rechazo de **verificación pública** (Publish)

| Mensaje Google | Acción |
|----------------|--------|
| Homepage no registrada a tu nombre | Verificar `https://vientonorte.github.io/` en **Search Console** con la **misma cuenta** del proyecto GCP |
| Logo no identifica la marca | Subir PNG 120×120 desde `icons/logo-oauth.svg` (marca Viento Norte) |

---

## Ruta A — Uso personal (recomendado, sin Publish)

1. Consent screen → **External** · status **Testing** (no “Publish app”).
2. Test users: `gaete.gaona@gmail.com`.
3. App name: `Tablero Rö`.
4. Support email: `gaete.gaona@gmail.com`.
5. Scopes: Calendar readonly + events.
6. Links del consent (usar URLs reales del sitio):
   - Application home page: `https://vientonorte.github.io/table-ro/brand.html`
   - Privacy: `https://vientonorte.github.io/table-ro/privacy.html`
   - Terms (si pide): `https://vientonorte.github.io/table-ro/terms.html`
7. Origins del Client Web:
   ```
   https://vientonorte.github.io
   http://localhost:8080
   http://127.0.0.1:8080
   ```
8. Calendar API enabled en el proyecto.
9. table-ro → 🔑 Conectar → debe funcionar **sin** verificación de Google.

---

## Ruta B — Publish / verificación (solo si quieres público)

1. **Search Console** → property `https://vientonorte.github.io/`  
   - HTML file o meta tag en el **hub** (raiz org Pages) o dominio propio.  
   - Misma cuenta Google que GCP.
2. Homepage de marca verificable: `brand.html` (ownership + privacy links).
3. Logo PNG 120×120 desde `logo-oauth.svg`.
4. Privacy policy URL = misma en consent y en el sitio.
5. Reenviar verification; espera review (días).

**Nota:** GitHub Pages a veces complica “ownership”; dominio propio (vientonorte.cl / etc.) es más limpio a largo plazo.

---

## Setup inicial Client ID (si recreas)

1. GCP → Library → Google Calendar API ON.  
2. Credentials → OAuth client → **Web application**.  
3. Origins + redirects como arriba.  
4. Pegar Client ID en app / Admin o default `GCAL_CLIENT_ID` en `js/app.js`.

---

## Verificación funcional (no “Publish”)

1. Hard refresh table-ro (v1.7.9+; SW network-first).  
2. 🔑 Conectar con Google.  
3. “Google Calendar conectado ✓”.  
4. 🔍 Detectar calendarios.

---

## Relacionado

- `DEPLOY-GITHUB-PAGES.md`  
- Vault: `google-cuenta.md` · `oauth-verificacion-reanudar.md` · canvas-state  
