#!/usr/bin/env bash
# Copies this starter into ~/.claude WITHOUT overwriting anything that already exists.
# Read it first. Run: bash install.sh
set -euo pipefail
cd "$(dirname "$0")"
DEST="$HOME/.claude"
mkdir -p "$DEST/agents" "$DEST/hooks" "$DEST/statusline"

copy() { # copy <src> <dest>
  if [ -e "$2" ]; then echo "skip   $2 (exists)"; else cp "$1" "$2"; echo "copied $2"; fi
}

copy CLAUDE.md                       "$DEST/CLAUDE.md"
copy hooks/post-deploy-ship.sh       "$DEST/hooks/post-deploy-ship.sh"
copy statusline/statusline.sh        "$DEST/statusline/statusline.sh"
for a in agents/*.md; do copy "$a" "$DEST/agents/$(basename "$a")"; done
chmod +x "$DEST/hooks/post-deploy-ship.sh" "$DEST/statusline/statusline.sh"

if [ -e "$DEST/settings.json" ]; then
  echo "skip   $DEST/settings.json (exists) — merge settings.json from this folder by hand, or ask Claude:"
  echo "       \"merge ~/claude-starter/settings.json into ~/.claude/settings.json, keeping my existing keys\""
else
  cp settings.json "$DEST/settings.json"; echo "copied $DEST/settings.json"
fi

command -v jq >/dev/null || echo "NOTE: install jq for the hook and status line:  brew install jq"
echo "Done. Start a new Claude Code session, then run /agents, /hooks and claude doctor."
