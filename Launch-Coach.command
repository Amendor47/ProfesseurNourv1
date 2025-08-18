#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
xattr -dr com.apple.quarantine "$PWD" || true
if [ ! -d ".venv" ]; then /usr/bin/env python3 -m venv .venv; fi
source ".venv/bin/activate"
python -m pip install --upgrade pip wheel >/dev/null 2>&1 || true
if [ -f "requirements.txt" ]; then pip install -r requirements.txt || true; fi
# Serveur statique (si pas d'API)
python -m http.server 5173 >/dev/null 2>&1 &
SERVER_PID=$!
open "http://localhost:5173/coach.html"
wait $SERVER_PID

