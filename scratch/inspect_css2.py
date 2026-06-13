with open("d:/TT_BaiTarot/src/components/tarot-patch.css", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

line_no = 4213
start = max(0, line_no - 15)
end = min(len(lines), line_no + 30)
for idx in range(start, end):
    # safe print to avoid encoding errors in console
    safe_line = lines[idx].strip().encode('ascii', errors='replace').decode('ascii')
    print(f"{idx + 1}: {safe_line}")
