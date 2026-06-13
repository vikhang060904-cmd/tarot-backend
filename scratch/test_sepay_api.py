import requests
import os
from dotenv import load_dotenv

load_dotenv()

SEPAY_API_TOKEN = os.getenv("SEPAY_API_TOKEN", "").strip()
SEPAY_TRANSACTIONS_URL = "https://my.sepay.vn/userapi/transactions/list"

def test_sepay():
    if not SEPAY_API_TOKEN:
        print("[ERROR] Missing SEPAY_API_TOKEN in .env")
        return

    headers = {
        "Authorization": f"Bearer {SEPAY_API_TOKEN}",
        "Content-Type": "application/json",
    }
    
    params = {
        "limit": 1
    }

    try:
        print(f"Testing SePay API with token: {SEPAY_API_TOKEN[:10]}...")
        res = requests.get(SEPAY_TRANSACTIONS_URL, headers=headers, params=params, timeout=10)
        
        if res.status_code == 200:
            print("[SUCCESS] SePay API is WORKING!")
            data = res.json()
            print("Response:", data.get("messages", "No message"))
            if "transactions" in data:
                print(f"Found {len(data['transactions'])} recent transactions.")
        else:
            print(f"[ERROR] SePay API Error: {res.status_code}")
            print("Response:", res.text)
            
    except Exception as e:
        print(f"[CRITICAL] Error connecting to SePay: {e}")

if __name__ == "__main__":
    test_sepay()
