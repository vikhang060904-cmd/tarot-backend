import subprocess
import time
import re

print("Starting test Pinggy...")
# ssh -R 80:localhost:8002 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null a.pinggy.io
# To run without prompt and get a clean https URL
process = subprocess.Popen(
    'ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:8002 qr@a.pinggy.io',
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

url = None
start_time = time.time()
while time.time() - start_time < 8:
    line = process.stdout.readline()
    print(f"Pinggy: {line.strip()}")
    if "https://" in line:
        urls = re.findall(r'https?://[^\s\x1b]+', line)
        if urls:
            url = urls[0]
            # Strip ANSI escape sequences if any
            url = re.sub(r'\x1b\[[0-9;]*m', '', url)
            break

if url:
    print(f"\nSUCCESS! Pinggy URL: {url}")
else:
    print("\nFailed to get Pinggy URL.")

# Terminate test process
process.terminate()
