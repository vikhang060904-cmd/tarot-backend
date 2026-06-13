import re

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "r", encoding="utf-8") as f:
    css = f.read()

# Replace transform: scale with zoom for real layout shrinking
css = css.replace("transform: scale(0.9);", "zoom: 0.75;")
css = css.replace("transform-origin: top center;", "")
css = css.replace("margin-bottom: -5% !important;", "")

# Make the feature cards smaller too
css = css.replace("min-height: 400px !important;", "min-height: 300px !important;")

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Applied zoom for compact layouts!")
