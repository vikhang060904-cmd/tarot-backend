import requests
import os

# Gemini API Configuration
AI_CONFIG = {
    "API_KEY": os.environ.get("GEMINI_API_KEY", "AIzaSyBMdlxtGIyOINdLcPMixUGNSUi_1zraIbc"),
    "PROVIDER": "google",
    "MODEL": "gemini-pro",
    "ENDPOINT": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
}

def call_gemini(prompt: str) -> str:
    try:
        data = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2000,
            }
        }
        
        url = f"{AI_CONFIG['ENDPOINT']}?key={AI_CONFIG['API_KEY']}"
        
        response = requests.post(
            url,
            json=data,
            timeout=30
        )
        response.raise_for_status()
        result = response.json()
        
        text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        
        if text:
            return text
        else:
            return "Hiện tại Tarot AI chưa thể giải mã. Bạn hãy thử lại sau."
    except Exception as e:
        print("[ERROR] Gemini error:", e)
        return "Hiện tại Tarot AI chưa thể giải mã. Bạn hãy thử lại sau."
