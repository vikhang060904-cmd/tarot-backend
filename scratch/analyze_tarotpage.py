import os

for root, dirs, files in os.walk("d:/TT_BaiTarot"):
    for file in files:
        if file.endswith((".css", ".html", ".tsx", ".ts", ".js")):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                if "template-card" in content:
                    print(f"Found template-card in: {filepath}")
            except Exception as e:
                pass
