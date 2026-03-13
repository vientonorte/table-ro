#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TABLERO Rö — Setup Ollama + DeepSeek para análisis de BuJo
# Ejecuta este script una vez para instalar los modelos necesarios
# ═══════════════════════════════════════════════════════════════

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TABLERO Rö · Setup DeepSeek + Ollama               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── 1. Verificar Ollama instalado ─────────────────────────
echo -e "${YELLOW}[1/4] Verificando Ollama...${NC}"
if ! command -v ollama &> /dev/null; then
  echo -e "${RED}✗ Ollama no está instalado.${NC}"
  echo ""
  echo "Instala Ollama en https://ollama.com/download"
  echo "  → macOS: descarga el .dmg o ejecuta:"
  echo "    brew install ollama"
  echo "  → Linux:"
  echo "    curl -fsSL https://ollama.com/install.sh | sh"
  echo ""
  exit 1
fi
OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "desconocida")
echo -e "${GREEN}✓ Ollama instalado (${OLLAMA_VERSION})${NC}"

# ─── 2. Descargar modelo de visión ─────────────────────────
echo ""
echo -e "${YELLOW}[2/4] Descargando modelo de visión: qwen2.5-vl:7b${NC}"
echo "  (este modelo lee e interpreta imágenes del BuJo)"
echo "  Tamaño: ~4.9 GB — puede tardar varios minutos..."
echo ""
if ollama list | grep -q "qwen2.5-vl"; then
  echo -e "${GREEN}✓ qwen2.5-vl ya está instalado${NC}"
else
  ollama pull qwen2.5-vl:7b
  echo -e "${GREEN}✓ qwen2.5-vl:7b instalado${NC}"
fi

# ─── 3. Descargar DeepSeek-R1 ──────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Descargando modelo de análisis: deepseek-r1:7b${NC}"
echo "  (este modelo extrae tareas y eventos del BuJo transcrito)"
echo "  Tamaño: ~4.7 GB — puede tardar varios minutos..."
echo ""
if ollama list | grep -q "deepseek-r1"; then
  echo -e "${GREEN}✓ deepseek-r1 ya está instalado${NC}"
else
  ollama pull deepseek-r1:7b
  echo -e "${GREEN}✓ deepseek-r1:7b instalado${NC}"
fi

# ─── 4. Crear script de inicio con CORS ────────────────────
echo ""
echo -e "${YELLOW}[4/4] Creando script de inicio (start-ollama.sh)...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cat > "$SCRIPT_DIR/start-ollama.sh" << 'EOF'
#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TABLERO Rö — Inicio completo: Ollama + servidor local
#
# Por qué es necesario el servidor local:
#   GitHub Pages corre en HTTPS. Ollama corre en HTTP (localhost).
#   El browser bloquea esa mezcla (Mixed Content). La solución es
#   abrir el tablero desde HTTP local → sin restricción.
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8080

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  TABLERO Rö · Inicio con DeepSeek               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── Verificar Ollama ───────────────────────────────────
if ! command -v ollama &> /dev/null; then
  echo "✗ Ollama no está instalado."
  echo "  Ejecuta primero: ./ollama-deepseek-setup.sh"
  exit 1
fi

# ─── Iniciar Ollama en background ───────────────────────
echo "🤖 Iniciando Ollama (CORS habilitado)..."
export OLLAMA_ORIGINS="http://localhost:${PORT},http://127.0.0.1:${PORT}"
ollama serve &> /tmp/ollama-tablero.log &
OLLAMA_PID=$!
sleep 2   # dar tiempo a que levante

if ! kill -0 $OLLAMA_PID 2>/dev/null; then
  echo "⚠  Ollama ya estaba corriendo (OK)"
fi

echo "   ✓ Ollama PID: $OLLAMA_PID"
echo ""

# ─── Iniciar servidor HTTP local ────────────────────────
echo "🌐 Iniciando tablero en http://localhost:${PORT} ..."
cd "$SCRIPT_DIR"

if command -v python3 &> /dev/null; then
  python3 -m http.server $PORT &> /tmp/tablero-server.log &
  SERVER_PID=$!
elif command -v python &> /dev/null; then
  python -m SimpleHTTPServer $PORT &> /tmp/tablero-server.log &
  SERVER_PID=$!
else
  echo "✗ Python no encontrado. Abre index.html manualmente desde un servidor local."
  kill $OLLAMA_PID 2>/dev/null
  exit 1
fi

sleep 1
echo "   ✓ Servidor PID: $SERVER_PID"
echo ""

# ─── Abrir el tablero en el browser ─────────────────────
URL="http://localhost:${PORT}/index.html"
echo "🚀 Abriendo $URL ..."
if command -v open &> /dev/null; then
  open "$URL"                          # macOS
elif command -v xdg-open &> /dev/null; then
  xdg-open "$URL"                      # Linux
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✓ Todo listo                                   ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Tablero:  http://localhost:${PORT}/index.html      ║"
echo "║  Ollama:   http://localhost:11434               ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Presiona Ctrl+C para detener todo              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── Cleanup al salir ───────────────────────────────────
cleanup() {
  echo ""
  echo "Deteniendo servicios..."
  kill $OLLAMA_PID 2>/dev/null && echo "  ✓ Ollama detenido"
  kill $SERVER_PID 2>/dev/null && echo "  ✓ Servidor detenido"
  exit 0
}
trap cleanup INT TERM

# Mantener vivo hasta Ctrl+C
wait
EOF

chmod +x "$SCRIPT_DIR/start-ollama.sh"
echo -e "${GREEN}✓ start-ollama.sh creado${NC}"

# ─── Resumen final ──────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Setup completo                                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "MODELOS INSTALADOS:"
echo "  • qwen2.5-vl:7b   → transcripción de imágenes BuJo"
echo "  • deepseek-r1:7b  → análisis y extracción de tareas"
echo ""
echo "CÓMO USAR:"
echo "  1. Ejecuta: ./start-ollama.sh"
echo "  2. Abre https://vientonorte.github.io/table-ro"
echo "  3. Click en 📓 Bullet Journal"
echo "  4. Sube tu foto del BuJo"
echo "  5. Click en 🤖 Analizar con DeepSeek"
echo ""
echo "MODELOS DISPONIBLES EN TU SISTEMA:"
ollama list
echo ""
