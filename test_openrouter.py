import requests

def test_openrouter_with_key():
    """Test OpenRouter API with the provided key"""
    print("🧪 Testing OpenRouter API with your key...")

    OPENROUTER_API_KEY = "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"

    try:
        # Test with Tarot-related prompt
        test_prompt = "Bạn là chuyên gia Tarot. Hãy phân tích ngắn gọn lá bài 'The Fool'."

        data = {
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "messages": [
                {"role": "user", "content": test_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 300
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        print("📡 Sending test request to OpenRouter...")
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=data,
            headers=headers,
            timeout=30
        )

        print(f"📊 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ OpenRouter API hoạt động!")

            text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"🤖 AI Response: {text[:200]}...")

            if text and len(text.strip()) > 10:
                print("✅ Phù hợp cho Tarot app!")
                return True, "OpenRouter hoạt động tốt cho Tarot"
            else:
                print("⚠️  Response quá ngắn")
                return True, "Response ngắn nhưng vẫn dùng được"

        elif response.status_code == 401:
            print("❌ API key không hợp lệ")
            return False, "API key không hợp lệ"

        elif response.status_code == 429:
            print("❌ Quá nhiều request (Rate limited)")
            return False, "Rate limited - thử lại sau"

        elif response.status_code == 402:
            print("❌ Hết credits")
            return False, "Hết free credits"

        else:
            error_data = response.json()
            error_msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            print(f"❌ Lỗi: {error_msg}")
            return False, f"Lỗi: {error_msg}"

    except requests.exceptions.Timeout:
        print("⏰ Timeout: API phản hồi quá chậm")
        return False, "Timeout"

    except Exception as e:
        print(f"💥 Lỗi: {e}")
        return False, f"Lỗi: {e}"

if __name__ == "__main__":
    print("🎴 OPENROUTER TEST CHO TAROT APP")
    print("=" * 40)

    success, message = test_openrouter_with_key()

    print(f"\n🎯 Kết quả: {'✅ THÀNH CÔNG' if success else '❌ THẤT BẠI'}")
    print(f"📋 Chi tiết: {message}")

    if success:
        print("\n🚀 Sẵn sàng chạy Tarot app!")
        print("   Chạy: python app.py")
        print("   Mở: http://127.0.0.1:8000")
    else:
        print("\n💡 Thử các lựa chọn khác:")
        print("   - Hugging Face (hoàn toàn miễn phí)")
        print("   - Kiểm tra API key OpenRouter")
        print("   - Thử lại sau")