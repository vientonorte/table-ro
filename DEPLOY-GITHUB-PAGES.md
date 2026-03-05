# Deploy — GitHub Pages · Tablero Rö

**Repo:** https://github.com/vientonorte/table-ro  
**URL live:** https://vientonorte.github.io/table-ro

---

## Paso 1 — Push inicial (desde Codespace o local)

```bash
git add index.html README.md CLAUDE-PROJECT-INSTRUCTIONS.md DEPLOY-GITHUB-PAGES.md
git commit -m "Initial commit — Tablero Rö"
git branch -M main
git push -u origin main
```

> En GitHub Codespaces el push HTTPS funciona automáticamente con tu sesión.  
> En local sin SSH: usa HTTPS + Personal Access Token (no contraseña).

---

## Paso 2 — Activar GitHub Pages

`github.com/vientonorte/table-ro` → **Settings** → **Pages**  
→ Source: **Deploy from branch**  
→ Branch: `main / (root)`  
→ **Save**

Espera ~2 minutos. URL: `https://vientonorte.github.io/table-ro`

---

## Paso 3 — Google Cloud Console

`console.cloud.google.com/apis/credentials` → tu OAuth Client ID → **Editar**

**Authorized JavaScript origins** — agregar:
```
https://vientonorte.github.io
```

**Authorized redirect URIs** — agregar:
```
https://vientonorte.github.io/table-ro
https://vientonorte.github.io/table-ro/index.html
```

→ **Guardar** (puede tardar hasta 5 min en propagarse)

---

## Paso 4 — Verificar

Abre `https://vientonorte.github.io/table-ro`  
→ Si ves pantalla en blanco: F12 → Console → busca errores CORS o 404  
→ Si sale Error 400 OAuth: verifica que los Authorized Origins estén guardados  

---

## Updates futuros

Cualquier push a `main` redespliega automáticamente:

```bash
git add index.html
git commit -m "Update — descripción del cambio"
git push
```

---

## Uso local (OAuth activo)

```bash
# En la carpeta del proyecto:
python3 -m http.server 8080
# Abre: http://localhost:8080/index.html
```

Asegúrate de que `http://localhost:8080` esté en **Authorized JavaScript Origins**.
