import os
import requests
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# List of free models to try
models_to_try = [
    "deepseek/deepseek-v4-flash:free",
    "z-ai/glm-4.5-air:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "qwen/qwen3-coder:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "poolside/laguna-xs.2:free",
    "baidu/cobuddy:free"
]

print("================= MUTLI-MODEL TEST =================")
headers = {
    "Authorization": f"Bearer {OPENROUTER_KEY}",
    "Content-Type": "application/json",
}

for model in models_to_try:
    print(f"\nTrying model: {model} ...")
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": "Hãy chào tôi bằng một câu ngắn gọn."}
        ],
        "temperature": 0.35,
        "max_tokens": 100,
    }
    try:
        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=15)
        print(f"Status Code: {r.status_code}")
        if r.status_code == 200:
            print("Response:", r.json()["choices"][0]["message"]["content"])
            print(f"🏆 SUCCESSFUL MODEL: {model}")
            break
        else:
            print("Error Response:", r.text)
    except Exception as e:
        print("Exception:", e)
