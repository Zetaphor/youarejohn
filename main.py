from flask import Flask, request, jsonify, send_from_directory, abort
from llama_cpp.llama import Llama
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

GPU_LAYERS = -1 if os.environ.get("USE_GPU", "").lower() == "true" else 0

event_log = []

try:
    print('------STARTING MODEL------')
    system_prompt = open("system_prompt.txt", "r").read()
    system_temperature = float(os.environ.get("SYSTEM_TEMPERATURE", 0.7))
    event_prompt = open("event_prompt.txt", "r").read()
    event_temperature = float(os.environ.get("EVENT_TEMPERATURE", 0.7))
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
    model = models[os.environ.get("MODEL", "phi3")]
    llm = Llama(model["file"], n_gpu_layers=GPU_LAYERS, chat_format=model["chat_format"], n_ctx=model["context_length"], flash_attn=True)

except Exception as e:
    abort(500, description=str(e))

def prepare_system_context(attribute_data):
    global event_log
    prepared_prompt = update_system_prompt(attribute_data)
    prepared_prompt_tokens = len(llm.tokenize(prepared_prompt.encode("utf-8")))

    while prepared_prompt_tokens > model['context_length']:
        event_log.pop(0)
        prepared_prompt = update_system_prompt(attribute_data)
        prepared_prompt_tokens = len(llm.tokenize(prepared_prompt.encode("utf-8")))

    return prepared_prompt

def update_system_prompt(attribute_data):
    global system_prompt
    global event_log
    prepared_prompt = system_prompt
    prepared_prompt = prepared_prompt.replace("[health]", str(attribute_data['health']))
    prepared_prompt = prepared_prompt.replace("[sanity]", str(attribute_data['sanity']))
    prepared_prompt = prepared_prompt.replace("[happiness]", str(attribute_data['happiness']))
    prepared_prompt = prepared_prompt.replace("[satiety]", str(attribute_data['satiety']))

    # Don't include the event list if there are no events
    if len(event_log) == 0:
        prepared_prompt = prepared_prompt[:prepared_prompt.find("[start_event_list]")]
    else:
        prepared_prompt = prepared_prompt.replace("[start_event_list]\n", "")
        event_log_str = "\n".join(["* " + event for event in event_log])
        prepared_prompt = prepared_prompt.replace("[event_list]", event_log_str)

    # Save the prompt to a file
    with open("prepared_prompt.txt", "w") as f:
        f.write(prepared_prompt)

    return prepared_prompt

def prepare_random_event(attribute_data):
    return event_prompt

# Add a route to reset the event log
@app.route('/reset/', methods=['GET'])
def reset():
    global event_log
    event_log = []
    return jsonify({'message': 'Event log reset'})

@app.route('/simulate/', methods=['POST'])
def simulate():
    user_input = request.json.get('event')
    random_event = bool(request.json.get('random_event'))
    attribute_data = request.json.get('attribute_data')

    try:
        if random_event:
            prepared_prompt = prepare_random_event(attribute_data)
            prepared_temperature = event_temperature
        else:
            prepared_prompt = prepare_system_context(attribute_data)
            prepared_temperature = system_temperature

        response = llm.create_chat_completion(
            temperature=prepared_temperature,
            messages=[
                {"role": "system", "content": prepared_prompt},
                {"role": "user", "content": user_input}
            ],
            response_format={
                "type": "json_object",
                "schema": {
                    "type": "object",
                    "properties": {
                        "affected_attribute": {"type": "string"},
                        "positiveImpact": {"type": "boolean"},
                        "severity": {"type": "number"},
                        "mood": {"type": "string"},
                        "event_description": {"type": "string"},
                        "inner_thoughts": {"type": "string"},
                    },
                    "required": ["affected_attribute", "positiveImpact", "severity", "mood", "event_description", "inner_thoughts"],
                },
            }
        )
        content = json.loads(response['choices'][0]['message']['content'])

        # Manually patch up some attribute outputs
        if (content['affected_attribute'] == 'mood'):
            content['affected_attribute'] = 'happiness'

        event_log.append(content['event_description'])

        return jsonify(content)
    except Exception as e:
        abort(500, description=str(e))

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=False)
