path = "d:/TT_BaiTarot/src/components/tarot-patch.css"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

animation_styles = """

/* =======================================================
   GPU ACCELERATED DECORATIVE FLOATING CARDS ANIMATION
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
  /* Hardware Accelerated GPU Compositor Ambient Float */
  animation: tp-cosmic-float 8s ease-in-out infinite !important;
}

/* Stagger floating cards delay for a natural organic feel */
.floating-card:nth-child(2n) {
  animation-delay: -2s !important;
  animation-duration: 9s !important;
}
.floating-card:nth-child(3n) {
  animation-delay: -4s !important;
  animation-duration: 11s !important;
}
.floating-card:nth-child(4n) {
  animation-delay: -6s !important;
  animation-duration: 13s !important;
}

@keyframes tp-cosmic-float {
  0%, 100% {
    margin-top: 0px;
    opacity: 0.5;
  }
  50% {
    margin-top: -16px;
    opacity: 0.8;
  }
}
"""

# Append styles to the end
content = content.rstrip() + animation_styles

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully applied GPU accelerated CSS animations!")
