with open("d:/TT_BaiTarot/src/components/tarot-patch.css", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = [m.start() for m in re.finditer(r"tp-slide-up", content)]
for i, start in enumerate(matches):
    print(f"Match {i+1} at index {start}:")
    print(content[start-50:start+250])
    print("-" * 50)
