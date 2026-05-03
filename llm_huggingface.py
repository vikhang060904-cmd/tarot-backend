import requests

class HFClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.url = "https://router.huggingface.co/v1/chat/completions"

    def ask_tarot(self, prompt):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "meta-llama/Meta-Llama-3-8B-Instruct",
            "messages": [
                {"role": "system", "content": "Bạn là chuyên gia Tarot, trả lời ngắn gọn, huyền bí, dễ hiểu."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 200
        }

        try:
            r = requests.post(self.url, headers=headers, json=payload, timeout=60)
            data = r.json()

            return data["choices"][0]["message"]["content"]

        except Exception as e:
            return f"Lỗi HF: {e}"