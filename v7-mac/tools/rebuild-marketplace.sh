#!/bin/sh
# rebuild-marketplace.sh: rebuild the pinned marketplace (kasasree-mods) that v7-mac installs from: the eight mods copied
# unmodified at their reviewed upstream commits, then this repo's patches in order, one git commit per step so
# `git status` is the tamper check. Every patched file is then checked against the post-image its patch records.
#
#   sh v7-mac/tools/rebuild-marketplace.sh [target]      (default ~/Projects/claude-mods-local; it must not exist)
#
# Needs git and network access to github.com. Commits use GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL if set.
set -eu
REPO=$(cd "$(dirname "$0")/../.." && pwd)
DEST=${1:-$HOME/Projects/claude-mods-local}
[ -e "$DEST" ] && { echo "$DEST already exists; move it away first" >&2; exit 1; }
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$DEST/plugins" "$DEST/.claude-plugin"
cd "$DEST"
git init -q -b main
commit() { git add -A -f . && git -c user.name="${GIT_AUTHOR_NAME:-Kasasree}" -c user.email="${GIT_AUTHOR_EMAIL:-kasasree-mods@localhost}" commit -q -m "$1"; }

# pin <name> <github owner/repo> <commit> [subfolder]: the mod exactly as it is at that commit
pin() {
  git clone -q "https://github.com/$2" "$STAGE/$1"
  mkdir -p "plugins/$1"
  if [ -n "${4:-}" ]; then
    git -C "$STAGE/$1" archive "$3" "$4" | tar -x -C "plugins/$1" --strip-components="$(printf '%s' "$4" | awk -F/ '{print NF}')"
  else
    git -C "$STAGE/$1" archive "$3" | tar -x -C "plugins/$1"
  fi
}
pin flightdeck scasella/claude-flightdeck 626cc0b46d417f81bbff9f5ba3b49abaf8912a85
pin filetree data-goblin/claude-code-filetree 44d4a6293d517028abe303b21715b126bf46fbec
pin prismantis NahumLitvin/prismantis 0d93494caff9c2e31fc9b69261d3e9d329803dab
pin paneline markneonin/paneline fd20c8cb91f18d2c3cc7c8876232084969ead951
pin cockpit drkokorev/cockpit-for-claude 8960ed87ed3b39d7236aaa17a1e1d26c7d154461 plugins/cockpit
pin cctop tomstagl/cctop 6ceafc34a972f4e58d5e53b1c69f80e2a9759d41 plugin
pin secret-box ray-amjad/claude-code-mods 5d6bd156c7586c4b030157a1a2e8b7214b238501 plugins/secret-box
mkdir -p plugins/aurora-bridge && cp -R "$REPO/v2-win/mods/aurora-bridge/." plugins/aurora-bridge/
cp "$REPO/v7-mac/marketplace/marketplace.json" .claude-plugin/marketplace.json
cp "$REPO/v7-mac/marketplace/README.md" README.md
commit "Pin eight mods unmodified at their reviewed commits"

P3=$REPO/v3-win/patches; P7=$REPO/v7-win/patches; PM=$REPO/v7-mac/patches
git apply "$P3/prismantis-rice.patch"
commit "prismantis: rice presets, bar headings, alert colours from the preset (v3-win patch)"
for p in prismantis-rows-copy prismantis-diff-tint paneline-chat-option cockpit-panel-only cctop-rice; do git apply "$P7/$p.patch"; done
git apply --exclude='plugins/aurora-bridge/*' "$P7/local-versions.patch"   # the Bridge snapshot already carries 0.2.0
commit "v7 patches: prismantis tool rows, button copy, retro diff tints; paneline chat option; cockpit panel only; cctop open on start, quiet start; local versions"
git apply "$PM/cctop-status-line.patch"
commit "cctop: statusLine option, 0.10.0-rice.2 (v7-mac patch)"
git apply "$PM/prismantis-prompt-color-declined.patch"
commit "prismantis: promptColor and declined options, 0.25.1-rice.3 (v7-mac patch)"
# v7.3 (2026-11-03): made on Windows, shared with the Mac
git apply "$P7/cockpit-guard-off.patch"
commit "cockpit: the guard starts off, 1.0.2-rice.2 (v7.3 patch)"
git apply "$PM/cctop-skills.patch"
commit "cctop: skills never offer cctop install, the program is built from the pin, 0.10.0-rice.3 (v7-mac patch)"
# v7.4 (2026-11-23): flightdeck 0.6.2 and secret-box 0.5.14 are pinned above; v7.3's secret-box patch (on 0.5.3) is retired
git apply "$P7/secret-box-0.5.14-rice.patch"
commit "secret-box: git messages are text, USERPROFILE for a missing HOME, /secret-box on|off, 0.5.14-rice.1 (v7.4 patch)"

# each patched file must now be exactly the post-image (the last "index a..b") its patches record
bad=0
for f in $(cat "$P3/prismantis-rice.patch" "$P7"/prismantis-rows-copy.patch "$P7"/prismantis-diff-tint.patch "$P7"/paneline-chat-option.patch \
    "$P7"/cockpit-panel-only.patch "$P7"/cctop-rice.patch "$P7"/local-versions.patch "$PM"/cctop-status-line.patch "$PM"/prismantis-prompt-color-declined.patch \
    "$P7"/cockpit-guard-off.patch "$PM"/cctop-skills.patch "$P7"/secret-box-0.5.14-rice.patch |
  awk '/^diff --git/{f=$4; sub(/^b\//,"",f)} /^index /{split($2,a,"\\.\\."); want[f]=a[2]} END{for (f in want) print f "=" want[f]}'); do
  path=${f%=*}; want=${f#*=}
  have=$(git hash-object "$path" | cut -c1-${#want})
  [ "$have" = "$want" ] || { echo "MISMATCH $path: $have, the patches say $want" >&2; bad=1; }
done
[ "$bad" = 0 ] || exit 1
echo "rebuilt $DEST: $(git log --oneline | wc -l | tr -d ' ') commits, every patched file matches its patch"
