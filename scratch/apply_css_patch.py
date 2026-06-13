path = "d:/TT_BaiTarot/src/components/tarot-patch.css"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Verify the file content contains our target crystal ball rule
target = """.crystal-ball {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  box-shadow: inset 0 0 30px rgba(160, 80, 255, 0.4), 0 0 40px rgba(160, 80, 255, 0.4) !important;
}
}"""

if target in content:
    print("Found crystal-ball target in CSS file!")
else:
    # Try normalized spacing match
    print("Trying alternative target spacing match...")

new_styles = """

/* =======================================================
   MOBILE LAYOUT OPTIMIZATION (ELIMINATING BLANK SPACES & CENTERING)
   ======================================================= */
.floating-card {
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;
  width: 80px !important;
  height: 120px !important;
  pointer-events: none !important;
  z-index: 2 !important;
  will-change: transform;
}

.floating-card img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  border-radius: 8px !important;
  border: 1px solid rgba(255, 215, 0, 0.15) !important;
  opacity: 0.5 !important;
}

@media (max-width: 768px) {
  /* 1. Reduce Selected Cards Container Padding/Margin */
  .selected-cards-section.glass-panel {
    padding: 14px !important;
    margin-bottom: 12px !important;
    border-radius: 20px !important;
  }
  
  .selected-cards-section .section-header {
    margin-bottom: 15px !important;
    padding-bottom: 10px !important;
  }

  .ritual-title-group h3 {
    font-size: 1.2rem !important;
  }
  
  /* 2. Optimize Card Dealing Arena Shell */
  .arc-spread-shell {
    min-height: 240px !important;
    height: 240px !important;
    margin-bottom: 15px !important;
    overflow: visible !important;
  }
  
  .arc-spread-board {
    transform: scale(0.42) !important;
    transform-origin: center center !important;
    width: 100% !important;
    min-height: 240px !important;
    height: 240px !important;
    left: 0 !important;
    margin-left: 0 !important;
    margin-top: 0 !important;
    top: 50% !important;
  }
  
  /* 3. Adjust Crystal Ball placement inside shrunk arena */
  .crystal-ball {
    width: 120px !important;
    height: 120px !important;
    top: 50% !important;
  }
  
  /* 4. Compact Control Panel (Command Center) */
  .ritual-command-center {
    margin-top: 15px !important;
    padding: 14px !important;
    border-radius: 20px !important;
    gap: 12px !important;
  }
  
  .ritual-primary-controls {
    gap: 12px !important;
  }
  
  .btn-deal-ritual {
    height: 46px !important;
    padding: 8px 16px !important;
    font-size: 0.9rem !important;
  }

  .ritual-input-zone {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }

  .ritual-question-input {
    height: 44px !important;
    font-size: 0.85rem !important;
    padding: 0 12px !important;
    width: 100% !important;
  }

  .btn-reveal-destiny {
    height: 44px !important;
    font-size: 0.9rem !important;
    width: 100% !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
}
"""

# Append styles to the end
content = content.rstrip() + new_styles

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully applied mobile CSS patch!")
