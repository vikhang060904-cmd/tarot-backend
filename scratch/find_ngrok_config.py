import os
import pathlib

# Common ngrok config paths on Windows
paths = [
    pathlib.Path(os.environ.get('USERPROFILE', '')) / 'AppData' / 'Local' / 'ngrok' / 'ngrok.yml',
    pathlib.Path(os.environ.get('APPDATA', '')) / 'ngrok' / 'ngrok.yml',
    pathlib.Path(os.environ.get('USERPROFILE', '')) / '.config' / 'ngrok' / 'ngrok.yml',
]

found = False
for p in paths:
    if p.exists():
        print(f"Found ngrok config at: {p.absolute()}")
        try:
            with open(p, 'r', encoding='utf-8') as f:
                content = f.read()
            print("Content:")
            print(content)
            found = True
        except Exception as e:
            print(f"Error reading: {e}")

if not found:
    print("No ngrok.yml config file found in default locations.")
