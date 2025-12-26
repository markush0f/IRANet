from typing import List, Optional
from llama_cpp import Llama


class ModelInterpreter():
    def __init__(self, *, model_path: str):
        self._interpreter = Llama(
            model_path=model_path,
            n_ctx=4096,
            temperature=0.0,
            top_p=1.0,
            repeat_penalty=1.1,
            verbose=False,
        )

    def interpret(self, *, prompt: str, stop: Optional[List[str]] = None) -> str:
        kwargs = {
            "prompt": prompt,
            "max_tokens": 256,
        }

        if stop:
            kwargs["stop"] = stop

        response = self._interpreter(**kwargs)
        return response["choices"][0]["text"].strip()  # type: ignore
