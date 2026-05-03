import requests

# Test OpenRouter API
OPENROUTER_CONFIG = {
    "API_KEY": "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",
    "MODEL": "google/gemini-2.0-flash-exp:free",
    "ENDPOINT": "https://openrouter.ai/api/v1/chat/completions",
    "HEADERS": {
        "HTTP-Referer": "https://codequest-ai.vercel.app",
        "X-Title": "CodeQuest AI Learning Platform",
    },
}

def test_openrouter():
    try:
        # Test đơn giản trước
        data = {
            "model": OPENROUTER_CONFIG["MODEL"],
            "messages": [
                {
                    "role": "user",
                    "content": "Xin chào, hãy trả lời bằng tiếng Việt"
                }
            ],
            "temperature": 0.7,
            "max_tokens": 500,
        }

        print("Testing OpenRouter API...")
        response = requests.post(
            OPENROUTER_CONFIG["ENDPOINT"],
            json=data,
            headers={
                "Authorization": f"Bearer {OPENROUTER_CONFIG['API_KEY']}",
                "Content-Type": "application/json",
                "HTTP-Referer": OPENROUTER_CONFIG["HEADERS"]["HTTP-Referer"],
                "X-Title": OPENROUTER_CONFIG["HEADERS"]["X-Title"],
            },
            timeout=30
        )

        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("Response received!")
            text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print("Content:", text[:200])
        else:
            print("Error response:", response.text)

    except Exception as e:
        print(f"Error: {e}")

def test_tarot_prompt():
    try:
        prompt = """Bạn là Tarot Reader chuyên nghiệp, luôn trả lời bằng tiếng Việt.

Câu hỏi của người dùng: "Tôi nên làm gì với công việc hiện tại?"

Các lá bài đã được rút ra:
- Quá khứ: The Fool
- Hiện tại: The Magician  
- Tương lai: The High Priestess

Hãy phân tích chi tiết:
1. Giải thích ý nghĩa của từng lá bài theo vị trí của nó
2. Kết nối các lá bài thành một thông điệp tổng thể
3. Đưa ra lời khuyên hữu ích và tích cực
4. Trả lời một cách nhẹ nhàng, không quá nghiêm túc

Lưu ý: Đây chỉ là gợi ý tinh thần, không phải dự đoán chắc chắn."""

        data = {
            "model": OPENROUTER_CONFIG["MODEL"],
            "messages": [
                {
                    "role": "system",
                    "content": "Bạn là một Tarot Reader chuyên nghiệp. Luôn trả lời bằng tiếng Việt một cách thân thiện, chi tiết và dễ hiểu."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1500,
        }

        print("Testing Tarot prompt...")
        response = requests.post(
            OPENROUTER_CONFIG["ENDPOINT"],
            json=data,
            headers={
                "Authorization": f"Bearer {OPENROUTER_CONFIG['API_KEY']}",
                "Content-Type": "application/json",
                "HTTP-Referer": OPENROUTER_CONFIG["HEADERS"]["HTTP-Referer"],
                "X-Title": OPENROUTER_CONFIG["HEADERS"]["X-Title"],
            },
            timeout=30
        )

        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("Tarot response received!")
            text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print("Tarot Content:", text[:500])
        else:
            print("Error response:", response.text)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_openrouter()
    print("\n" + "="*50 + "\n")
    test_tarot_prompt()