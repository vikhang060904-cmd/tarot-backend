import pathlib
import sys

sys.stdout.reconfigure(encoding='utf-8')

path = pathlib.Path(r'd:\TT_BaiTarot\src\components\tarot-patch.css')
data = path.read_bytes()
lines = data.split(b'\n')

for i in range(2960, 3010):
    if i < len(lines):
        line = lines[i].decode('utf-8', errors='replace')
        print(f"Line {i+1}: {line.strip()}")
