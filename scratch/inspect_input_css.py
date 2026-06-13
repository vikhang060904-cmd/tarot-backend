with open("d:/TT_BaiTarot/src/components/tarot-patch.css", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

start = 2800
end = 2835
for idx in range(start, end):
    safe_line = lines[idx].strip().encode('ascii', errors='replace').decode('ascii')
    print(f"{idx + 1}: {safe_line}")
