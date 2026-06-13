import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def check_sepay():
    token = os.getenv("SEPAY_API_TOKEN")
    url = "https://my.sepay.vn/userapi/transactions/list"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            transactions = data.get("transactions", [])
            if transactions:
                print("Transaction keys:", transactions[0].keys())
                print(json.dumps(transactions[0], indent=2))
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_sepay()
