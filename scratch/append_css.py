import os

css_append = """
/* SUPER COMPACT LAYOUT FOR SMALL SCREENS */
@media (max-height: 900px) {
  .welcome-features,
  .welcome-daily-oracle,
  .welcome-rituals {
    padding: 1rem 1rem !important;
    scroll-margin-top: 80px !important;
  }
  
  .section-header {
    margin-bottom: 0.5rem !important;
  }
  
  .section-header h2 {
    font-size: 2rem !important;
    margin: 5px 0 !important;
  }

  .showcase-tabs-container {
    margin-top: 0.5rem !important;
    gap: 0.5rem !important;
  }

  .showcase-display {
    padding: 1rem !important;
    gap: 1rem !important;
  }

  .display-badge {
    margin-bottom: 0.5rem !important;
  }

  .display-left h3 {
    font-size: 2rem !important;
    margin: 0 0 0.5rem 0 !important;
  }

  .display-desc {
    font-size: 0.9rem !important;
    margin-bottom: 1rem !important;
  }

  .positions-title {
    margin: 1rem 0 0.5rem 0 !important;
  }

  .positions-list {
    gap: 0.5rem !important;
  }

  .position-item {
    padding: 8px 12px !important;
  }

  .oracle-card-3d-wrap {
    width: 240px !important;
    height: 380px !important;
  }
  
  .daily-oracle-card-area {
    margin-top: 0.5rem !important;
    gap: 0.5rem !important;
  }
}
"""

with open(r"d:\\TT_BaiTarot\\src\\components\\tarot-patch.css", "a", encoding="utf-8") as f:
    f.write(css_append)

print("Appended CSS successfully!")
