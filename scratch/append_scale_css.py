import os

css_append = """
/* EXTREME AUTO-FIT FOR LAPTOP SCREENS */
@media (max-height: 900px) {
  /* Scale down the entire showcase display to fit */
  .showcase-display {
    transform: scale(0.85);
    transform-origin: top center;
    margin-bottom: -15% !important; /* Reclaim space from scaling */
  }
  
  /* Scale down the daily oracle card area */
  .daily-oracle-card-area {
    transform: scale(0.85);
    transform-origin: top center;
    margin-bottom: -15% !important;
  }
}
"""

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "a", encoding="utf-8") as f:
    f.write(css_append)

print("Appended scaling CSS successfully!")
