import requests

# Test Gemini API directly
def test_gemini_api():
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    api_key = "AIzaSyBMdlxtGIyOINdLcPMixUGNSUi_1zraIbc"

    data = {
        "contents": [
            {
                "parts": [
                    {"text": "Xin chào, bạn có thể trả lời bằng tiếng Việt không?"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 100,
        }
    }

    full_url = f"{url}?key={api_key}"

    try:
        print("Testing Gemini API...")
        print(f"URL: {full_url}")
        print(f"Data: {data}")

        response = requests.post(full_url, json=data, timeout=30)

        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            result = response.json()
            print("SUCCESS! Response:")
            print(result)

            text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            print(f"Text: {text}")
        else:
            print("ERROR Response:")
            print(response.text)

    except Exception as e:
        print(f"Exception: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    test_gemini_api()
