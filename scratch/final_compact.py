import re

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "r", encoding="utf-8") as f:
    css = f.read()

# Change scroll-margin-top to be smaller so the section is pushed higher up
css = css.replace("scroll-margin-top: 80px !important;", "scroll-margin-top: 20px !important;")

# Change the gap inside .showcase-display to be super small
css = css.replace("gap: 1.5rem !important;", "gap: 0.5rem !important;")
css = css.replace("padding: 2rem !important;", "padding: 1rem !important;")

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Applied final compaction!")
