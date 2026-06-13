import subprocess
import time
import re
import sys

print("Starting SSH Pinggy...")
# ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:8002 qr@a.pinggy.io
process = subprocess.Popen(
    'ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:8002 qr@a.pinggy.io',
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

url = None
start_time = time.time()
# Read output lines
for i in range(100):
    line = process.stdout.readline()
    if not line:
        break
    print(f"OUT: {line.strip()}")
    if "https://" in line:
        urls = re.findall(r'https?://[^\s\x1b]+', line)
        if urls:
            url = urls[0]
            # Clean ANSI escape sequences
            url = re.sub(r'\x1b\[[0-9;]*m', '', url)
            print(f"\nFOUND_URL: {url}")
            break
    if time.time() - start_time > 15:
        break

if not url:
    print("Failed to get Pinggy URL.")
    process.terminate()
    sys.exit(1)

# Keep it running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    process.terminate()
