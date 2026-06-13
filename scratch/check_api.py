import requests

endpoints = [
    "/api/admin/users",
    "/api/admin/orders",
    "/api/admin/revenue-by-day",
    "/api/admin/dashboard",
    "/api/admin/settings",
    "/api/admin/readings",
    "/api/admin/tarot-config",
    "/api/admin/diagnostics"
]

base_url = "http://127.0.0.1:8002"

for ep in endpoints:
    url = f"{base_url}{ep}"
    print(f"--> Sending request to {url}...", flush=True)
    try:
        r = requests.get(url, timeout=3)
        print(f"<-- Received status: {r.status_code}, length: {len(r.text)}", flush=True)
    except Exception as e:
        print(f"FAILED: {e}", flush=True)
