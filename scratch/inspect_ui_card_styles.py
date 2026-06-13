with open("d:/TT_BaiTarot/src/components/UI.css", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

start = 3330
end = 3360
for idx in range(start, end):
    safe_line = lines[idx].strip().encode('ascii', errors='replace').decode('ascii')
    print(f"{idx + 1}: {safe_line}")
