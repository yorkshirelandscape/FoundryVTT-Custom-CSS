#!/usr/bin/env bash
# Rebuild fonts/ from upstream releases. Needs curl, unzip and fontTools (pip install fonttools brotli).
set -euo pipefail

MAPLE=v7.9

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

# Iosevka: a custom build from tools/iosevka-build-plan.toml
"$root/tools/build-iosevka.sh"
