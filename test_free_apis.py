import requests

def test_openrouter_api():
    """Test OpenRouter API (Free tier)"""
    print("🔍 Testing OpenRouter API...")

    # You'll need to get your API key from https://openrouter.ai/keys
    OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY_HERE"  # Replace with your key

    if OPENROUTER_API_KEY == "YOUR_OPENROUTER_API_KEY_HERE":
        print("⚠️  Please set your OpenRouter API key first!")
        print("   Get it from: https://openrouter.ai/keys")
        return False, "API key not set"

    try:
        data = {
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "messages": [
                {"role": "user", "content": "Xin chào! Bạn có hoạt động không? Trả lời ngắn gọn."}
            ],
            "temperature": 0.3,
            "max_tokens": 100
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=data,
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"✅ OpenRouter hoạt động! Response: {text}")
            return True, "OpenRouter API hoạt động"
        else:
            error_data = response.json()
            error_msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            print(f"❌ OpenRouter lỗi: {error_msg}")
            return False, f"OpenRouter error: {error_msg}"

    except Exception as e:
        print(f"❌ OpenRouter exception: {e}")
        return False, f"OpenRouter exception: {e}"

def test_grok_api():
    """Test Grok API (xAI)"""
    print("🔍 Testing Grok API...")

    # You'll need to get your API key from https://console.x.ai/
    GROK_API_KEY = "YOUR_GROK_API_KEY_HERE"  # Replace with your key

    if GROK_API_KEY == "YOUR_GROK_API_KEY_HERE":
        print("⚠️  Please set your Grok API key first!")
        print("   Get it from: https://console.x.ai/")
        return False, "API key not set"

    try:
        data = {
            "model": "grok-beta",
            "messages": [
                {"role": "user", "content": "Xin chào! Bạn có hoạt động không? Trả lời ngắn gọn."}
            ],
            "temperature": 0.3,
            "max_tokens": 100
        }

        headers = {
            "Authorization": f"Bearer {GROK_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            json=data,
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"✅ Grok hoạt động! Response: {text}")
            return True, "Grok API hoạt động"
        else:
            error_data = response.json()
            error_msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            print(f"❌ Grok lỗi: {error_msg}")
            return False, f"Grok error: {error_msg}"

    except Exception as e:
        print(f"❌ Grok exception: {e}")
        return False, f"Grok exception: {e}"

def test_huggingface_api():
    """Test Hugging Face Inference API (Free tier)"""
    print("🔍 Testing Hugging Face API...")

    try:
        # Using a free model from Hugging Face
        data = {
            "inputs": "Xin chào! Bạn có hoạt động không? Trả lời ngắn gọn.",
            "parameters": {
                "max_new_tokens": 50,
                "temperature": 0.3
            }
        }

        # Using a free model - no API key required for basic usage
        response = requests.post(
            "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
            json=data,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            # Hugging Face returns different format
            if isinstance(result, list) and len(result) > 0:
                text = result[0].get("generated_text", "")
                print(f"✅ Hugging Face hoạt động! Response: {text[:100]}...")
                return True, "Hugging Face API hoạt động"
            else:
                print("❌ Hugging Face: Unexpected response format")
                return False, "Unexpected response format"
        else:
            print(f"❌ Hugging Face HTTP {response.status_code}: {response.text}")
            return False, f"HTTP {response.status_code}"

    except Exception as e:
        print(f"❌ Hugging Face exception: {e}")
        return False, f"Exception: {e}"

if __name__ == "__main__":
    print("🧪 TEST CÁC API MIỄN PHÍ CHO TAROT APP")
    print("=" * 50)

    # Test OpenRouter
    print("\n1. 🌐 OPENROUTER API (Khuyến nghị)")
    success, msg = test_openrouter_api()
    print(f"   Kết quả: {'✅' if success else '❌'} {msg}")

    # Test Grok
    print("\n2. 🤖 GROK API (xAI)")
    success, msg = test_grok_api()
    print(f"   Kết quả: {'✅' if success else '❌'} {msg}")

    # Test Hugging Face
    print("\n3. 🧠 HUGGING FACE API (Hoàn toàn miễn phí)")
    success, msg = test_huggingface_api()
    print(f"   Kết quả: {'✅' if success else '❌'} {msg}")

    print("\n" + "=" * 50)
    print("💡 HƯỚNG DẪN:")
    print("1. OpenRouter: Cần API key, có free tier tốt")
    print("2. Grok: Cần API key từ xAI, khá mạnh")
    print("3. Hugging Face: Hoàn toàn miễn phí, không cần API key")
    print("\n🎯 Khuyến nghị: Dùng OpenRouter hoặc Hugging Face!")