import urllib.request
import urllib.parse
import os
import sys

apk_path = r'd:\TT_BaiTarot\static\app-release.apk'

if not os.path.exists(apk_path):
    print(f"Error: APK not found at {apk_path}")
    sys.exit(1)

print(f"Uploading {apk_path} to transfer.sh...")
try:
    with open(apk_path, 'rb') as f:
        data = f.read()
    
    # Request to transfer.sh
    req = urllib.request.Request(
        'https://transfer.sh/app-release.apk',
        data=data,
        method='PUT'
    )
    
    with urllib.request.urlopen(req) as response:
        link = response.read().decode('utf-8').strip()
        print(f"\nSUCCESS! Download Link: {link}")
except Exception as e:
    print(f"Error uploading to transfer.sh: {e}")
