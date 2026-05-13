#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SOURCE_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
INSTALL_ROOT="${INSTALL_ROOT:-$HOME/.local/share/atli}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required. Install Node.js, then rerun this script." >&2
  exit 1
fi
NODE_PATH=$(command -v node)

rm -rf "$INSTALL_ROOT"
rm -rf "$HOME/.local/share/onprem-atlassian-cli"
mkdir -p "$INSTALL_ROOT" "$BIN_DIR"
cp -R "$SOURCE_ROOT"/. "$INSTALL_ROOT"/
chmod +x "$INSTALL_ROOT/bin/atli.js" "$INSTALL_ROOT/bin/onprem-atlassian.js"
cat > "$BIN_DIR/atli" <<EOF
#!/usr/bin/env sh
exec "$NODE_PATH" "$INSTALL_ROOT/bin/atli.js" "\$@"
EOF
cp "$BIN_DIR/atli" "$BIN_DIR/atlas-ai"
cp "$BIN_DIR/atli" "$BIN_DIR/onprem-atlassian"
chmod +x "$BIN_DIR/atli" "$BIN_DIR/atlas-ai" "$BIN_DIR/onprem-atlassian"

echo "Installed atli to $INSTALL_ROOT"
echo "Command shims created in $BIN_DIR"
echo "Using Node.js at $NODE_PATH"
echo "Add $BIN_DIR to PATH if it is not already there."
