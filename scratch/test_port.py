import requests

try:
    r = requests.get("http://127.0.0.1:8002/", timeout=3)
    print("Root Status:", r.status_code)
except Exception as e:
    print("Root failed:", e)

try:
    r = requests.get("http://127.0.0.1:8002/api/tarot/config", timeout=3)
    print("Config Status:", r.status_code, "Response:", r.text)
except Exception as e:
    print("Config failed:", e)
