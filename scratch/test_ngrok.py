import subprocess
import time
import urllib.request
import json

print("Starting test ngrok with blank domain...")
# Run ngrok with empty domain using shell=True
process = subprocess.Popen(
    'npx ngrok http 8002 --domain ""',
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(4)  # Wait for ngrok to spin up

try:
    with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels") as response:
        data = json.loads(response.read().decode())
        tunnels = data.get('tunnels', [])
        if tunnels:
            print("Successfully started on a random domain!")
            for t in tunnels:
                print(f"- {t.get('public_url')}")
        else:
            print("No active tunnels found.")
except Exception as e:
    print(f"Error querying ngrok API: {e}")

# Kill the test process
process.terminate()
print("Terminated test ngrok.")
