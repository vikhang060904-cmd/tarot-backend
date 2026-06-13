import pathlib

path = pathlib.Path(r'd:\TT_BaiTarot\src\components\UI.css')
data = path.read_bytes()
lines = data.split(b'\n')

for i in range(130, 170):
    if i < len(lines):
        line = lines[i].decode('utf-8', errors='replace')
        print(f"Line {i+1}: {line.strip()}")
