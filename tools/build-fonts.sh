#!/usr/bin/env bash
# Rebuild fonts/ from upstream releases. Needs curl, unzip and fontTools (pip install fonttools brotli).
set -euo pipefail

MAPLE=v7.9
IOSEVKA=34.9.1
# Latin, punctuation, arrows, math, box drawing: what stylesheets actually contain
CHARS='U+0020-007E,U+00A0-017F,U+0192,U+02C6-02DC,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2200-22FF,U+2500-257F,U+25A0-25FF'

root=$(cd "$(dirname "$0")/.." && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
cd "$work"

# Maple Mono: upstream variable fonts, converted to woff2 as-is
curl -sSfL -o maple.zip "https://github.com/subframe7536/maple-font/releases/download/$MAPLE/MapleMono-Variable.zip"
unzip -q maple.zip -d maple
mkdir -p "$root/fonts/maple-mono"
for f in 'MapleMono[wght]:MapleMono-VF' 'MapleMono-Italic[wght]:MapleMono-Italic-VF'; do
  pyftsubset "maple/${f%%:*}.ttf" --unicodes='*' --layout-features='*' --flavor=woff2 \
    --output-file="$root/fonts/maple-mono/${f##*:}.woff2"
done
cp maple/LICENSE.txt "$root/fonts/maple-mono/OFL.txt"

# Iosevka: static webfonts, cut to $CHARS with every OpenType feature (ligatures included) kept
curl -sSfL -o iosevka.zip "https://github.com/be5invis/Iosevka/releases/download/v$IOSEVKA/PkgWebFont-Unhinted-Iosevka-$IOSEVKA.zip"
mkdir -p "$root/fonts/iosevka"
for s in Regular Bold Italic BoldItalic; do
  unzip -q -j iosevka.zip "WOFF2-Unhinted/Iosevka-$s.woff2" -d iosevka
  pyftsubset "iosevka/Iosevka-$s.woff2" --unicodes="$CHARS" --layout-features='*' --flavor=woff2 \
    --output-file="$root/fonts/iosevka/Iosevka-$s.woff2"
done
curl -sSfL -o "$root/fonts/iosevka/OFL.md" "https://raw.githubusercontent.com/be5invis/Iosevka/v$IOSEVKA/LICENSE.md"
