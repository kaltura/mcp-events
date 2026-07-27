#!/usr/bin/env bash
# Build and run the MCP Events server over stdio for functional tests.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ ! -d "$REPO_ROOT" ]; then
  echo "stdio_mcp.sh: repo root directory not found: $REPO_ROOT" >&2
  exit 1
fi

cd "$REPO_ROOT"

if ! npm run build; then
  echo "stdio_mcp.sh: failed to build the MCP server" >&2
  exit 1
fi

if ! npm run start:stdio; then
  COMMAND="node $REPO_ROOT/dist/apps/mcp-server/src/stdio.js"
  if ! $COMMAND; then
     echo "stdio_mcp.sh: failed to start the MCP server" >&2
     exit 1
  fi
fi