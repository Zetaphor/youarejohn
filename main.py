from fastapi import FastAPI, HTTPException
from llama_cpp.llama import Llama, LlamaGrammar
import json

app = FastAPI()

try:
    system_prompt = open("system_prompt.txt", "r").read()
    grammar_json = open("json.gbnf", "r").read()
    models = {
        "llama3": {
            "chat_format": "llama-3",
            "file": "/models/lmstudio-community/Meta-Llama-3-8B-Instruct-BPE-fix-GGUF/Meta-Llama-3-8B-Instruct-Q5_K_M.gguf",
            "context_length": 8192
        },
        "phi3": {
            "chat_format": "chatml",
            "file": "/models/microsoft/Phi-3-mini-4k-instruct-gguf/Phi-3-mini-4k-instruct-q4.gguf",
            "context_length": 4096
        }
    }
    model = models["phi3"]
    llm = Llama(model["file"], n_gpu_layers=-1, chat_format=model["chat_format"], n_ctx=model["context_length"])
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate/")
async def simulate(user_input: str):
    try:
        response = llm.create_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {"role": "user", "content": user_input},
            ],
            response_format={
                "type": "json_object",
                "schema": {
                    "type": "object",
                    "properties": {
                        "affected_attribute": {"type": "string"},
                        "amount": {"type": "number"},
                        "mood": {"type": "string"},
                        "event_description": {"type": "string"},
                        "inner_thoughts": {"type": "string"},
                    },
                    "required": ["affected_attribute", "amount", "mood", "event_description", "inner_thoughts"],
                },
            },
            temperature=0.7,
        )
        content = json.loads(response['choices'][0]['message']['content'])
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
