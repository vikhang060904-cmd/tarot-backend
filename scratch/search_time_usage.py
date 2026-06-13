with open("d:/TT_BaiTarot/src/components/TarotPage.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
matches = re.findall(r"\btime\b", content)
print(f"Found {len(matches)} occurrences of 'time' word in file.")

# Print lines with 'time'
with open("d:/TT_BaiTarot/src/components/TarotPage.tsx", "r", encoding="utf-8", errors="ignore") as f:
    for idx, line in enumerate(f):
        if "const [time" in line or "setTime" in line:
            print(f"Line {idx + 1}: {line.strip()}")
