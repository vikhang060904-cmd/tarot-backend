import os

filepath = r"d:\TT_BaiTarot\src\components\UI.css"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    # Replace literal \n representations with actual newlines
    cleaned = content.replace("\\n", "\n")
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(cleaned)
    print("UI.css cleaned successfully!")
else:
    print("UI.css not found!")
