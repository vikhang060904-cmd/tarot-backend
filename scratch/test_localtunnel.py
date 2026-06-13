import subprocess
import time
import re

print("Starting test localtunnel...")
process = subprocess.Popen(
    'npx localtunnel --port 8002',
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Wait and read stdout to find the url
url = None
start_time = time.time()
while time.time() - start_time < 8:
    line = process.stdout.readline()
    print(f"LT: {line.strip()}")
    if "your url is" in line.lower():
        url = re.search(r'https?://[^\s]+', line).group(0)
        break

if url:
    print(f"\nSUCCESS! Localtunnel URL: {url}")
else:
    print("\nFailed to get Localtunnel URL.")

# Terminate test process
process.terminate()
