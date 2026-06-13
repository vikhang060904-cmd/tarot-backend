import os
import pathlib

print("Searching for all ngrok.yml files on C: drive...")

user_profile = os.environ.get('USERPROFILE', 'C:\\Users\\PC')
search_paths = [
    pathlib.Path(user_profile),
    pathlib.Path(os.environ.get('APPDATA', '')),
    pathlib.Path(os.environ.get('LOCALAPPDATA', '')),
]

found_files = []
for base_path in search_paths:
    if not base_path:
        continue
    # Search recursively up to 3 levels deep in user folders
    for root, dirs, files in os.walk(base_path):
        # Limit depth to avoid scanning everything
        depth = root.count(os.sep) - str(base_path).count(os.sep)
        if depth > 3:
            dirs.clear()  # don't go deeper
            continue
        for f in files:
            if f == 'ngrok.yml':
                p = pathlib.Path(root) / f
                found_files.append(p)
                print(f"Found ngrok.yml at: {p.absolute()}")
                try:
                    with open(p, 'r') as file:
                        print("Content:")
                        print(file.read())
                except Exception as e:
                    print(f"Error reading: {e}")
                print("-" * 40)
