with open("d:/TT_BaiTarot/src/components/TarotPage.tsx", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for idx in range(1644, 1690):
    safe_line = lines[idx].strip().encode('ascii', errors='replace').decode('ascii')
    print(f"{idx + 1}: {safe_line}")
