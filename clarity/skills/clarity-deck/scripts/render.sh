#!/bin/bash
# Build the deck, then export a PDF with LibreOffice (CoWork sandbox) or Keynote (Mac).
# Usage: bash scripts/render.sh <run>/content.json [--anon] [--outdir <dir>]
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
PPTX="$(node "$SKILL/scripts/build.js" "$@")"
OUTDIR="$(dirname "${PPTX:?build failed}")"
echo "$PPTX"

if command -v soffice >/dev/null 2>&1; then
  # Poppins must be installed or LibreOffice substitutes a different font in the PDF.
  mkdir -p "$HOME/.fonts" && cp "$SKILL"/assets/poppins-*.ttf "$HOME/.fonts/" && (fc-cache -f >/dev/null 2>&1 || true)
  soffice --headless --convert-to pdf --outdir "$OUTDIR" "$PPTX" >/dev/null 2>&1
  echo "${PPTX%.pptx}.pdf"
elif [ -d /Applications/Keynote.app ]; then
  osascript "$SKILL/scripts/keynote_to_pdf.applescript" "$PPTX" "${PPTX%.pptx}.pdf"
  echo "${PPTX%.pptx}.pdf"
else
  echo "NO_PDF: no LibreOffice or Keynote here. Open the .pptx in PowerPoint and use File > Export > PDF."
fi
