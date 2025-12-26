from typing import Optional, List
from llama_cpp import Llama


class ModelInterpreter:
    def __init__(self, *, model_path: str):
        self._interpreter = Llama(
            model_path=model_path,
            n_ctx=4096,
            temperature=0.0,
            top_p=1.0,
            repeat_penalty=1.1,
            verbose=False,
        )

        self._primed = False

    def _prime(self) -> None:
        if self._primed:
            return

        # Priming ONLY for format, result is ignored
        self._interpreter(
            prompt='Output:\n{"name": null, "arguments": {}}',
            max_tokens=32,
        )

        self._primed = True

    def interpret(self, *, prompt: str, stop: Optional[List[str]] = None) -> str:
        self._prime()

        kwargs = {
            "prompt": prompt,
            "max_tokens": 256,
        }

        if stop:
            kwargs["stop"] = stop

        response = self._interpreter(**kwargs)
        return response["choices"][0]["text"].strip()  # type: ignore
