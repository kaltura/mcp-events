#!/bin/sh
set -e

echo "==> Removing any existing 'kaltura-events' registration (idempotent)..."
claude mcp remove kaltura-events 2>/dev/null && echo "  (removed existing entry)" || true

echo ""
echo "==> Registering 'kaltura-events' MCP server in Claude Code (user scope)..."
claude mcp add \
  --transport http \
  --scope user \
  kaltura-events \
  "http://localhost:3000/mcp" \
  --header "Authorization: ks $KALTURA_KS"

echo ""
echo "==> Registered MCP servers:"
claude mcp list

echo ""
echo "==> Verifying live connectivity to http://mcp-server:3000/health..."
response=$(wget -qO- http://mcp-server:3000/health)
echo "  $response"
echo ""
echo "==> Done — MCP server is connected and healthy."