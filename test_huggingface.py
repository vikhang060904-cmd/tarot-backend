import requests

HF_API_KEY = "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"

API_URL = "https://router.huggingface.co/v1/chat/completions"

def test_huggingface():
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "meta-llama/Meta-Llama-3-8B-Instruct",
        "messages": [
            {"role": "user", "content": "Bạn là chuyên gia Tarot. Giải thích lá The Fool ngắn gọn."}
        ],
        "max_tokens": 120,
        "temperature": 0.6
    }

    r = requests.post(API_URL, headers=headers, json=payload)

    print("Status:", r.status_code)
    print(r.text)

if __name__ == "__main__":
    test_huggingface()