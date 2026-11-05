#!/usr/bin/env bash
# Build fonts/iosevka from tools/iosevka-build-plan.toml. Needs git, Node >= 18 and a few GB of RAM.
# IOSEVKA_SRC: an existing Iosevka checkout to reuse (default: a temporary shallow clone).
set -euo pipefail

IOSEVKA=v34.9.1
PLAN=IosevkaCustom

root=$(cd "$(dirname "$0")/.." && pwd)
src=${IOSEVKA_SRC:-}
if [[ -z $src ]]; then
  src=$(mktemp -d)
  trap 'rm -rf "$src"' EXIT
fi
[[ -d $src/.git ]] || git clone -q --depth 1 --branch "$IOSEVKA" https://github.com/be5invis/Iosevka.git "$src"

cp "$root/tools/iosevka-build-plan.toml" "$src/private-build-plans.toml"
cd "$src"
echo "npm ci..."
npm ci --no-audit --no-fund --loglevel=error
echo "building $PLAN (slow)..."
npm run build -- "woff2-unhinted::$PLAN"

out="$root/fonts/iosevka"
mkdir -p "$out"
rm -f "$out"/*.woff2
for s in Regular Bold Italic BoldItalic; do
  cp "$(find dist -name "$PLAN-$s.woff2" | head -1)" "$out/Iosevka-$s.woff2"
done
cp LICENSE.md "$out/OFL.md"
ls -la "$out"
