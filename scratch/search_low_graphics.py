with open("d:/TT_BaiTarot/src/components/TarotPage.tsx", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "lowGraphicsMode" in line:
        print(f"Line {idx + 1}: {line.strip()}")
