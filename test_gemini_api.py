import requests

# Test Gemini API key
GEMINI_API_KEY = "AIzaSyBQJfJfcpnYfSPACTpDQYRHFgPpqBDtd9A"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"

def test_gemini_api():
    """Test the Gemini API key and connection"""
    try:
        print("🔍 Testing Gemini API connection...")

        # Simple test prompt
        test_prompt = "Xin chào, bạn có hoạt động không? Trả lời ngắn gọn."

        data = {
            "contents": [
                {
                    "parts": [
                        {"text": test_prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 100,
            }
        }

        url = f"{GEMINI_URL}?key={GEMINI_API_KEY}"

        print(f"📡 Sending request to: {url}")
        print(f"📝 Test prompt: {test_prompt}")

        response = requests.post(
            url,
            json=data,
            timeout=30
        )

        print(f"📊 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")

            # Extract response text
            text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            print(f"🤖 AI Response: {text}")

            return True, "API hoạt động bình thường"

        elif response.status_code == 400:
            error_data = response.json()
            error_message = error_data.get("error", {}).get("message", "Unknown error")
            print(f"❌ Bad Request (400): {error_message}")
            return False, f"Lỗi API: {error_message}"

        elif response.status_code == 401:
            print("❌ Unauthorized (401): API key không hợp lệ")
            return False, "API key không hợp lệ hoặc đã hết hạn"

        elif response.status_code == 403:
            print("❌ Forbidden (403): Quyền truy cập bị từ chối")
            return False, "API key không có quyền truy cập"

        elif response.status_code == 429:
            print("❌ Rate Limited (429): Quá nhiều yêu cầu")
            return False, "Đã vượt quá giới hạn số lượng yêu cầu"

        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            return False, f"Lỗi HTTP {response.status_code}"

    except requests.exceptions.Timeout:
        print("⏰ Timeout: API phản hồi quá chậm")
        return False, "API phản hồi quá chậm (timeout)"

    except requests.exceptions.ConnectionError:
        print("🌐 Connection Error: Không thể kết nối đến API")
        return False, "Không thể kết nối đến máy chủ Gemini"

    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return False, f"Lỗi không mong muốn: {e}"

if __name__ == "__main__":
    success, message = test_gemini_api()
    print(f"\n🎯 Kết quả test: {'✅ THÀNH CÔNG' if success else '❌ THẤT BẠI'}")
    print(f"📋 Thông tin: {message}")

    if not success:
        print("\n💡 Khuyến nghị:")
        print("1. Kiểm tra API key có chính xác không")
        print("2. Kiểm tra kết nối internet")
        print("3. Thử tạo API key mới từ Google AI Studio")
        print("4. Ứng dụng sẽ dùng hệ thống fallback nếu API thất bại")