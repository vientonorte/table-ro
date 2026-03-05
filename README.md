# Tablero Rö · 2026

Tablero semanal personal con integración Google Calendar, BuJo y sync bidireccional.

**Live:** https://vientonorte.github.io/table-ro

---

## Stack

- HTML + CSS + JS vanilla — sin dependencias ni build
- Google Identity Services (OAuth 2.0) — sync Google Calendar API v3
- ICS fallback — para calendarios sin API (Sura Outlook)
- localStorage — persistencia de estado, tasks manuales, URLs privadas

## Características

- Tablero semanal 7 columnas con navegación ← Hoy →
- Drag & drop entre días
- Categorías: Personal · Vínculos · Camila · Trabajo · Bienestar
- BuJo Drawer: sube fotos, pega análisis de Claude, agrega tareas al tablero
- Sync Google Calendar (API + ICS fallback)
- Quick-add modal, detalle por card, exportar/importar JSON
- FAQ y panel de Admin integrados

## Uso local

```bash
python3 -m http.server 8080
# Abre http://localhost:8080/index.html
```

OAuth requiere `http://localhost:8080` en **Authorized JavaScript Origins** de Google Cloud Console.

## Configuración OAuth

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Tu OAuth Client ID → Authorized JavaScript Origins → agregar:
   - `http://localhost:8080`
   - `https://vientonorte.github.io`
3. Authorized redirect URIs → agregar:
   - `https://vientonorte.github.io/table-ro`

## Fuentes de calendario

| Fuente | Cuenta | Modo |
|--------|--------|------|
| Personal | gaete.gaona@gmail.com | Lectura + Escritura |
| Finanzas | grupo calendar Google | Solo lectura |
| Sura Investments | Outlook Office 365 ICS | Solo lectura |
| Camila | c.camilapalma@gmail.com | Solo lectura |

---

Rö · 2026
