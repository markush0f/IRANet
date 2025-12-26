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

    def interpret(self, *, prompt: str, stop: list[str]) -> str:
        response = self._interpreter(
            prompt,
            stop=stop,
        )

        return response["choices"][0]["text"].strip() # type: ignore