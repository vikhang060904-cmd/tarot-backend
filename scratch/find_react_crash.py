with open("d:/TT_BaiTarot/src/components/TarotPage.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re

# Find any occurrences of "time" or "setTime"
print("=== Remaining references to 'time' or 'setTime' ===")
for idx, line in enumerate(content.splitlines()):
    if "time" in line or "setTime" in line:
        # Exclude comments
        if not line.strip().startswith("//") and not line.strip().startswith("/*"):
            print(f"Line {idx + 1}: {line.strip()}")

print("=== Checking if there are any obvious typescript/compilation errors ===")
# Let's search for references to 'time' in the rendering code
# Specifically inside the deal logic
