// WaitingState.tsx
// Dùng thay cho phần empty-state trong TarotPage.tsx
// Thay đoạn:
//   <div className="empty-state">...</div>
// Bằng:
//   <WaitingState onDeal={handleDealAll} disabled={busy || isPicking} />

import { useEffect, useRef } from "react";

interface WaitingStateProps {
  onDeal: () => void;
  disabled?: boolean;
}

const WaitingState = ({ onDeal, disabled }: WaitingStateProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // ── Canvas: floating rune particles ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const RUNES = ["✦", "◈", "⬡", "✧", "⁕", "◇", "⋆", "☽", "⊕", "✴"];
    type Rune = {
      x: number; y: number; size: number;
      speed: number; dx: number;
      opacity: number; opDir: number;
      char: string; hue: number;
    };

    const runes: Rune[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 10 + Math.random() * 14,
      speed: 0.18 + Math.random() * 0.28,
      dx: (Math.random() - 0.5) * 0.3,
      opacity: Math.random(),
      opDir: Math.random() > 0.5 ? 1 : -1,
      char: RUNES[Math.floor(Math.random() * RUNES.length)],
      hue: Math.random() > 0.5 ? 270 : 40,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const r of runes) {
        r.y -= r.speed;
        r.x += r.dx;
        r.opacity += r.opDir * 0.008;
        if (r.opacity >= 1) { r.opacity = 1; r.opDir = -1; }
        if (r.opacity <= 0) {
          r.opacity = 0; r.opDir = 1;
          r.x = Math.random() * canvas.width;
          r.y = canvas.height + 10;
        }
        if (r.y < -20) { r.y = canvas.height + 10; r.x = Math.random() * canvas.width; }

        ctx.save();
        ctx.globalAlpha = r.opacity * 0.65;
        ctx.fillStyle = `hsl(${r.hue}, 80%, 72%)`;
        ctx.shadowColor = `hsl(${r.hue}, 90%, 65%)`;
        ctx.shadowBlur = 10;
        ctx.font = `${r.size}px serif`;
        ctx.textAlign = "center";
        ctx.fillText(r.char, r.x, r.y);
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="ws-root">
      {/* Canvas particles */}
      <canvas ref={canvasRef} className="ws-canvas" />

      {/* Orbiting rings */}
      <div className="ws-orbit-wrap">
        <div className="ws-ring ws-ring-1" />
        <div className="ws-ring ws-ring-2" />
        <div className="ws-ring ws-ring-3" />

        {/* Center crystal */}
        <div className="ws-crystal-wrap">
          <div className="ws-crystal">
            <div className="ws-crystal-inner">🔮</div>
            <div className="ws-crystal-glow" />
          </div>
          {/* Orbiting dots */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div
              key={i}
              className="ws-orbit-dot"
              style={{ "--deg": `${deg}deg`, "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="ws-text">
        <p className="ws-text-main">Những lá bài đang chờ được triệu hồi...</p>
        <p className="ws-text-sub">Hãy nhấn để mở ra hành trình vận mệnh của bạn</p>
      </div>

      {/* Deal button */}
      <button
        className="ws-deal-btn"
        onClick={onDeal}
        disabled={disabled}
        type="button"
      >
        <span className="ws-btn-shimmer" />
        <span className="ws-btn-text">🎴 Triệu Hồi Bài</span>
      </button>

      <style>{`
        .ws-root {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          min-height: 420px;
          width: 100%;
          overflow: hidden;
          padding: 40px 20px;
        }

        /* Canvas */
        .ws-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        /* Orbit rings */
        .ws-orbit-wrap {
          position: relative;
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .ws-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid transparent;
        }
        .ws-ring-1 {
          width: 220px; height: 220px;
          border-color: rgba(160, 90, 255, 0.22);
          animation: ws-spin 18s linear infinite;
          background: radial-gradient(circle, transparent 45%, rgba(120,40,220,0.04) 100%);
        }
        .ws-ring-2 {
          width: 165px; height: 165px;
          border-color: rgba(255, 200, 60, 0.2);
          animation: ws-spin 11s linear infinite reverse;
        }
        .ws-ring-3 {
          width: 110px; height: 110px;
          border-color: rgba(160, 90, 255, 0.3);
          animation: ws-spin 7s linear infinite;
          border-style: dashed;
        }

        @keyframes ws-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Crystal center */
        .ws-crystal-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ws-crystal {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(180,100,255,0.5), rgba(60,10,120,0.8));
          border: 1px solid rgba(180,100,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: ws-crystal-pulse 3s ease-in-out infinite;
        }

        .ws-crystal-inner {
          font-size: 2rem;
          filter: drop-shadow(0 0 14px rgba(200,120,255,0.9));
          animation: ws-float 3s ease-in-out infinite;
        }

        .ws-crystal-glow {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(160,60,255,0.35), transparent 70%);
          animation: ws-glow-pulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes ws-crystal-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(160,60,255,0), 0 0 20px rgba(160,60,255,0.3); }
          50%     { box-shadow: 0 0 0 10px rgba(160,60,255,0), 0 0 40px rgba(160,60,255,0.6); }
        }
        @keyframes ws-glow-pulse {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50%     { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes ws-float {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-4px) scale(1.08); }
        }

        /* Orbiting dots around crystal */
        .ws-orbit-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle, #ffd060, #a040e0);
          box-shadow: 0 0 8px #ffd060;
          top: 50%;
          left: 50%;
          transform-origin: 0 0;
          animation: ws-orbit-dot-anim calc(4s + var(--i) * 0.4s) linear infinite;
          animation-delay: calc(var(--i) * -0.65s);
        }

        @keyframes ws-orbit-dot-anim {
          from { transform: rotate(var(--deg)) translateX(56px) translate(-50%, -50%); opacity: 0.4; }
          50%  { opacity: 1; }
          to   { transform: rotate(calc(var(--deg) + 360deg)) translateX(56px) translate(-50%, -50%); opacity: 0.4; }
        }

        /* Text */
        .ws-text {
          text-align: center;
          z-index: 1;
        }
        .ws-text-main {
          font-size: 1.05rem;
          color: #d8c8f8;
          font-style: italic;
          letter-spacing: 0.02em;
          margin: 0 0 8px;
          animation: ws-text-breath 4s ease-in-out infinite;
        }
        .ws-text-sub {
          font-size: 0.82rem;
          color: rgba(180,155,220,0.6);
          margin: 0;
        }
        @keyframes ws-text-breath {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1; }
        }

        /* Deal button */
        .ws-deal-btn {
          position: relative;
          overflow: hidden;
          height: 52px;
          padding: 0 40px;
          border-radius: 14px;
          border: 1px solid rgba(200, 150, 50, 0.45);
          background: linear-gradient(135deg, #2e1206, #6b3010, #2e1206);
          color: #f0c060;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          z-index: 1;
          box-shadow: 0 0 28px rgba(200,120,20,0.25), 0 14px 32px rgba(0,0,0,0.5);
          transition: box-shadow 0.3s, border-color 0.3s;
        }
        .ws-deal-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .ws-deal-btn:not(:disabled):hover {
          box-shadow: 0 0 50px rgba(220,150,20,0.55), 0 0 90px rgba(200,100,20,0.18), 0 14px 32px rgba(0,0,0,0.55);
          border-color: rgba(230,180,60,0.75);
          color: #ffe870;
        }

        .ws-btn-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,200,80,0.18), transparent);
          animation: ws-shimmer 2.5s ease-in-out infinite;
        }
        @keyframes ws-shimmer {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }

        .ws-btn-text {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default WaitingState;
