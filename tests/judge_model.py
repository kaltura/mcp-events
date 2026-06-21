"""DeepEval judge model backed by the Anthropic client (supports LiteLLM proxy)."""

import os

from deepeval.models import DeepEvalBaseLLM

from mcp_agent import _build_anthropic_client


class AnthropicJudge(DeepEvalBaseLLM):
    """Wraps the Anthropic SDK client (direct or via LiteLLM proxy) as a DeepEval judge."""

    def __init__(self):
        self._client = _build_anthropic_client()
        self._model = os.environ["ANTHROPIC_MODEL"]

    def load_model(self):
        return self._client

    def generate(self, prompt: str) -> str:
        response = self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    async def a_generate(self, prompt: str) -> str:
        return self.generate(prompt)

    def get_model_name(self) -> str:
        return self._model
