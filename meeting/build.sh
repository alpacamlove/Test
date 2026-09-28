#!/bin/sh
# Собирает index.html (фрагмент для публикации) из частей в src/ (порядок важен).
cd "$(dirname "$0")"
{
  cat src/m01-head.html src/m02-body.html
  echo '<script>'
  cat src/m03-core.js src/m04-rig.js src/m05-scenes.js src/m06-close.js src/m07-play.js src/m08-story.js src/m09-engine.js
  echo '</script>'
} > index.html
echo "index.html: $(wc -c < index.html) bytes"
