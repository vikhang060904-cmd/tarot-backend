import re

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "r", encoding="utf-8") as f:
    css = f.read()

# Replace global padding and gaps to be much smaller
css = re.sub(r'\.showcase-display\s*\{[^}]*\}', 
    """.showcase-display {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.5rem !important;
  padding: 2rem !important;
  border-radius: 32px;
  background: linear-gradient(135deg, rgba(22, 12, 52, 0.65), rgba(12, 6, 28, 0.85)) !important;
  border: 1px solid rgba(168, 85, 247, 0.2) !important;
  align-items: center;
  transform: scale(0.9);
  transform-origin: top center;
  margin-bottom: -5% !important;
}""", css)

# Fix feature-card min-height which was huge (560px)
css = re.sub(r'min-height:\s*560px\s*!important;', 'min-height: 400px !important;', css)
css = re.sub(r'padding:\s*4rem\s*2.5rem\s*3.5rem\s*2.5rem\s*!important;', 'padding: 2rem 1.5rem !important;', css)

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Global CSS adjustments applied!")
