#!/usr/bin/env sh
set -eu

INSTALL_ROOT="${INSTALL_ROOT:-$HOME/.local/share/atli}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

rm -rf "$INSTALL_ROOT"
rm -rf "$HOME/.local/share/onprem-atlassian-cli"
rm -f "$BIN_DIR/atli" "$BIN_DIR/onprem-atlassian" "$BIN_DIR/atlas-ai"
echo "Removed atli CLI."
