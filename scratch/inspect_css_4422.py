with open("d:/TT_BaiTarot/src/components/tarot-patch.css", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

start = 4419
end = 4450
for idx in range(start, end):
    safe_line = lines[idx].strip().encode('ascii', errors='replace').decode('ascii')
    print(f"{idx + 1}: {safe_line}")
