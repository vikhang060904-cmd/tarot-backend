import urllib.request
import json
import sys

try:
    print("Querying local ngrok API at http://127.0.0.1:4040/api/tunnels...")
    with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels") as response:
        data = json.loads(response.read().decode())
        tunnels = data.get('tunnels', [])
        if tunnels:
            for t in tunnels:
                if t.get('proto') == 'https':
                    print(f"\nFOUND_NGROK_URL: {t.get('public_url')}")
                    sys.exit(0)
            # If no https, print the first one
            print(f"\nFOUND_NGROK_URL: {tunnels[0].get('public_url')}")
            sys.exit(0)
        else:
            print("No active tunnels found in ngrok API.")
except Exception as e:
    print(f"Error querying ngrok API: {e}")
