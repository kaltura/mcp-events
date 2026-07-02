import os

from dotenv import load_dotenv

load_dotenv()

KALTURA_KS: str = os.environ["KALTURA_KS"]
KALTURA_PUBLIC_API: str = os.environ.get("KALTURA_PUBLIC_API", "https://events-api.nvp1.ovp.kaltura.com/api/v1")
MCP_SERVER_URL: str = os.environ.get("MCP_SERVER_URL", "http://localhost:3000/mcp")
EXECUTE_TOOLS: bool = os.environ.get("EXECUTE_TOOLS", "0") == "1"
ANTHROPIC_BASE_URL: str | None = os.environ.get("ANTHROPIC_BASE_URL")
ANTHROPIC_AUTH_TOKEN: str | None = os.environ.get("ANTHROPIC_AUTH_TOKEN")
ANTHROPIC_API_KEY: str | None = os.environ.get("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL: str = os.environ["ANTHROPIC_MODEL"]
