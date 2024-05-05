from flask import Flask, request, jsonify, send_from_directory, abort
from llama_cpp.llama import Llama
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

GPU_LAYERS = -1 if os.environ.get("USE_GPU", "").lower() == "true" else 0

try:
    print('------STARTING MODEL------')
    system_prompt = open("system_prompt.txt", "r").read()
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
    llm = Llama(model["file"], n_gpu_layers=GPU_LAYERS, chat_format=model["chat_format"], n_ctx=model["context_length"], flash_attn=True)

except Exception as e:
    abort(500, description=str(e))

@app.route('/simulate/', methods=['POST'])
def simulate():
    user_input = request.json.get('event')
    try:
        response = llm.create_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
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
        return jsonify(content)
    except Exception as e:
        abort(500, description=str(e))

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=False)
