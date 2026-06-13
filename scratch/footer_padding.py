import re

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "r", encoding="utf-8") as f:
    css = f.read()

# Add extra padding to the footer so #rituals can be scrolled to the top
if ".welcome-footer {" in css:
    css = re.sub(r'\.welcome-footer\s*\{', '.welcome-footer { padding-bottom: 30vh !important; ', css)
else:
    css += "\n.welcome-footer { padding-bottom: 30vh !important; }\n"

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Added footer padding!")
