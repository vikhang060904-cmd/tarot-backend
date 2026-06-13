path = "d:/TT_BaiTarot/src/components/tarot-patch.css"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Locate target block and replace it
target = """.arc-spread-shell {
    min-height: 200px !important;
    height: 200px !important;
    margin-bottom: 8px !important;
  }
  
  .arc-spread-board {
    transform: scale(0.38) !important;
    min-height: 200px !important;
    height: 200px !important;
  }"""

# Normalize spaces to find target
normalized_target = """.arc-spread-shell {
  min-height: 200px !important;
  height: 200px !important;
  margin-bottom: 8px !important;
}

.arc-spread-board {
  transform: scale(0.38) !important;
  min-height: 200px !important;
  height: 200px !important;
}"""

replacement = """.arc-spread-shell {
  min-height: 250px !important;
  height: 250px !important;
  margin-bottom: 12px !important;
}

.arc-spread-board {
  transform: scale(0.32) !important;
  min-height: 250px !important;
  height: 250px !important;
}"""

if normalized_target in content:
    content = content.replace(normalized_target, replacement)
    print("Replaced normalized target successfully!")
elif target in content:
    content = content.replace(target, replacement)
    print("Replaced layout target successfully!")
else:
    # Do a simple regex replace or search
    print("Target block not found, performing soft replacement...")
    # Find and replace the heights manually
    import re
    # We can search for the specific mobile block and replace it
    content = re.sub(
        r"\.arc-spread-shell\s*\{\s*min-height:\s*200px\s*!important;\s*height:\s*200px\s*!important;\s*margin-bottom:\s*8px\s*!important;\s*\}",
        ".arc-spread-shell {\n  min-height: 250px !important;\n  height: 250px !important;\n  margin-bottom: 12px !important;\n}",
        content
    )
    content = re.sub(
        r"\.arc-spread-board\s*\{\s*transform:\s*scale\(0\.38\)\s*!important;\s*min-height:\s*200px\s*!important;\s*height:\s*200px\s*!important;\s*\}",
        ".arc-spread-board {\n  transform: scale(0.32) !important;\n  min-height: 250px !important;\n  height: 250px !important;\n}",
        content
    )
    print("Soft replacement applied!")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Applied overlap fix patch successfully!")
