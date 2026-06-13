with open('src/index.css', 'a', encoding='utf-8') as f:
    f.write("""

/* ===== MISSING ANIMATIONS ===== */

@keyframes orbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
  50% { transform: translate(30px, -40px) scale(1.1); opacity: 1; }
}

@keyframes orbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
  50% { transform: translate(-40px, 30px) scale(1.15); opacity: 0.9; }
}

@keyframes slowSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes cardPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 24px 80px rgba(0,0,0,.8), 0 0 120px rgba(124,58,237,.14); }
  50% { transform: scale(1.01); box-shadow: 0 30px 100px rgba(0,0,0,.9), 0 0 150px rgba(124,58,237,.25); }
}

@keyframes tp-screen-flash {
  0% { opacity: 0; transform: scale(1.2); }
  20% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.9); }
}

@keyframes dustMove {
  from { transform: translate(0, 0); }
  to { transform: translate(100px, 100px); }
}

@keyframes dustMoveReverse {
  from { transform: translate(0, 0); }
  to { transform: translate(-100px, -100px); }
}

@keyframes beamMove {
  0% { opacity: 0.3; transform: rotate(-12deg) translateX(-5%); }
  100% { opacity: 0.7; transform: rotate(-10deg) translateX(5%); }
}

@keyframes ringRotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(-360deg); }
}
""")
