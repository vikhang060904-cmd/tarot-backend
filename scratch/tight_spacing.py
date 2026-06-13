import re

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "r", encoding="utf-8") as f:
    css = f.read()

# Make section header very tight
css = re.sub(r'\.section-header\s*\{\s*margin-bottom:\s*[^;]+;\s*\}', '.section-header { margin-bottom: 0.5rem !important; }', css)

# Make tabs container very tight
css = re.sub(r'\.showcase-tabs-container\s*\{\s*gap:\s*[^;]+;\s*\}', '.showcase-tabs-container { margin-top: 0.5rem !important; gap: 0.5rem !important; }', css)

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Applied ultra tight spacing!")
