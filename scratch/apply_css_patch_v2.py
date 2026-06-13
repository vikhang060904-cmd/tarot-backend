path = "d:/TT_BaiTarot/src/components/tarot-patch.css"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

v2_styles = """

/* =======================================================
   ADVANCED MOBILE SPACING PATCH V2 (ZERO CROPPING & TIGHT FIT)
   ======================================================= */
@media (max-width: 768px) {
  /* 1. Reduce overall page padding */
  .tarot-page {
    padding: 12px 12px 80px 12px !important;
  }
  
  .tarot-main {
    gap: 8px !important;
  }

  /* 2. Shrink Selected Cards in Top Section */
  .selected-card-container,
  .selected-card-slot {
    width: 68px !important;
    height: 102px !important;
    border-radius: 8px !important;
  }
  
  .selected-card-image {
    width: 68px !important;
    height: 102px !important;
    border-radius: 8px !important;
  }
  
  .slot-position-wrapper {
    margin: 0 !important;
  }

  .selected-card-name {
    display: none !important; /* Hide name below card to save 20px */
  }

  .selected-card-container .position-label,
  .selected-card-slot .slot-label {
    font-size: 0.55rem !important;
    letter-spacing: 0 !important;
    padding: 2px 4px !important;
  }
  
  .selected-card-slot .slot-icon {
    font-size: 0.8rem !important;
    margin-top: 2px !important;
  }

  .selected-cards-section.glass-panel {
    padding: 10px !important;
    margin-bottom: 8px !important;
  }

  .selected-cards-layout {
    gap: 6px !important;
  }

  /* 3. Extremely compact dealing arena shell */
  .arc-spread-shell {
    min-height: 200px !important;
    height: 200px !important;
    margin-bottom: 8px !important;
  }
  
  .arc-spread-board {
    transform: scale(0.38) !important;
    min-height: 200px !important;
    height: 200px !important;
  }

  .crystal-ball {
    width: 100px !important;
    height: 100px !important;
  }

  /* 4. Super compact Command Center */
  .ritual-command-center {
    margin-top: 8px !important;
    padding: 10px !important;
    gap: 10px !important;
    border-radius: 16px !important;
  }

  .ritual-primary-controls {
    gap: 8px !important;
  }

  .ritual-topic-selector {
    gap: 6px !important;
  }

  .ritual-topic-btn {
    padding: 6px 12px !important;
    font-size: 0.75rem !important;
  }

  .btn-deal-ritual {
    height: 38px !important;
    padding: 6px 12px !important;
    font-size: 0.8rem !important;
  }

  .ritual-input-zone {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }

  .ritual-question-input {
    height: 38px !important;
    font-size: 0.8rem !important;
    padding: 0 10px !important;
    border-radius: 10px !important;
    width: 100% !important;
  }

  .btn-reveal-destiny {
    height: 38px !important;
    font-size: 0.8rem !important;
    border-radius: 10px !important;
    width: 100% !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
}
"""

content = content.rstrip() + v2_styles

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully applied Mobile Spacing V2 patch!")
