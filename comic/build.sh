#!/bin/sh
# Собирает engine.js из частей в src/ (порядок важен).
cd "$(dirname "$0")"
cat src/a-core.js src/b1-face.js src/b2-head.js src/b3-body.js src/c-props.js src/d-places.js src/d2-city.js src/e-panel.js > engine.js
echo "engine.js: $(wc -c < engine.js) bytes"
