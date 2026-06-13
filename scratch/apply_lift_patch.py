path = "d:/TT_BaiTarot/src/components/tarot-patch.css"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Locate target block and replace it
target = """.arc-spread-board {
  transform: scale(0.32) !important;
  min-height: 250px !important;
  height: 250px !important;
}"""

replacement = """.arc-spread-board {
  transform: scale(0.32) !important;
  min-height: 250px !important;
  height: 250px !important;
  margin-top: -20px !important; /* Prevent overlap with purple button below */
}"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced target successfully!")
else:
    print("Target block not found, performing soft replacement...")
    import re
    content = re.sub(
        r"\.arc-spread-board\s*\{\s*transform:\s*scale\(0\.32\)\s*!important;\s*min-height:\s*250px\s*!important;\s*height:\s*250px\s*!important;\s*\}",
        ".arc-spread-board {\n  transform: scale(0.32) !important;\n  min-height: 250px !important;\n  height: 250px !important;\n  margin-top: -20px !important;\n}",
        content
    )
    print("Soft replacement applied!")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Applied lift patch successfully!")
