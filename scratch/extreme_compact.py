import re

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "r", encoding="utf-8") as f:
    css = f.read()

# Make all headings and texts smaller in showcase
if ".showcase-display h3 {" not in css:
    css += """
.showcase-display h3 {
    font-size: 1.5rem !important;
    margin: 0 0 0.5rem 0 !important;
}
.showcase-display .display-desc {
    font-size: 0.85rem !important;
    margin-bottom: 0.5rem !important;
}
.showcase-display .positions-title {
    font-size: 0.85rem !important;
    margin: 0.5rem 0 !important;
}
.showcase-display .position-item {
    padding: 0.5rem !important;
    font-size: 0.8rem !important;
}
.showcase-display .position-item h5 {
    font-size: 0.85rem !important;
    margin-bottom: 0.2rem !important;
}
.showcase-display .display-badge {
    padding: 2px 8px !important;
    font-size: 0.65rem !important;
    margin-bottom: 0.5rem !important;
}
"""

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Applied ultra extreme compacting for fonts and inner items!")
