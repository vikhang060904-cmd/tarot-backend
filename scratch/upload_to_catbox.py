import urllib.request
import os
import sys

apk_path = r'd:\TT_BaiTarot\app_web_view (1)\build\app\outputs\flutter-apk\app-release.apk'

if not os.path.exists(apk_path):
    print(f"Error: APK not found at {apk_path}")
    sys.exit(1)

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = []
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="reqtype"'.encode('utf-8'))
body.append(''.encode('utf-8'))
body.append('fileupload'.encode('utf-8'))

body.append(f'--{boundary}'.encode('utf-8'))
body.append(f'Content-Disposition: form-data; name="fileToUpload"; filename="app-release.apk"'.encode('utf-8'))
body.append('Content-Type: application/vnd.android.package-archive'.encode('utf-8'))
body.append(''.encode('utf-8'))
with open(apk_path, 'rb') as f:
    body.append(f.read())

body.append(f'--{boundary}--'.encode('utf-8'))
body.append(''.encode('utf-8'))

data = b'\r\n'.join(body)

req = urllib.request.Request(
    'https://catbox.moe/user/api.php',
    data=data,
    headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'Content-Length': str(len(data))
    }
)

print("Uploading newly built APK to Catbox...")
try:
    with urllib.request.urlopen(req) as response:
        link = response.read().decode('utf-8').strip()
        print(f"\nSUCCESS! Catbox Link: {link}")
except Exception as e:
    print(f"Error: {e}")
