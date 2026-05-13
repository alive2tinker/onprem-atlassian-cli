#!/usr/bin/env sh
set -eu

INSTALL_ROOT="${INSTALL_ROOT:-$HOME/.local/share/onprem-atlassian-cli}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

rm -rf "$INSTALL_ROOT"
rm -f "$BIN_DIR/onprem-atlassian" "$BIN_DIR/atlas-ai"
echo "Removed onprem-atlassian CLI."
