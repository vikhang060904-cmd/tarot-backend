// WaitingState.tsx
// Dùng thay cho phần empty-state trong TarotPage.tsx
// Thay đoạn:
//   <div className="empty-state">...</div>
// Bằng:
//   <WaitingState onDeal={handleDealAll} disabled={busy || isPicking} />

import React, { useEffect, useRef } from "react";
import { useLang } from "../i18n/LanguageContext";
 

interface WaitingStateProps {
  onDeal: () => Promise<void> | void;
  disabled?: boolean;
}

const WaitingState = ({ onDeal, disabled }: WaitingStateProps) => {
  const { lang } = useLang();
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

      {/* Floating 3D Cards */}
      <div className="ws-floating-cards-container">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`ws-floating-card ws-floating-card-${index}`}
          >
            <div className="ws-card-glow-inner" />
            <img 
              src="/images/tarot/back.png" 
              alt="Floating Card" 
              onError={(e) => {
                e.currentTarget.src = "/images/tarot/back.png";
              }}
            />
          </div>
        ))}
      </div>

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
        <p className="ws-text-main">{lang === 'vi' ? 'Những lá bài đang chờ được triệu hồi...' : 'The cards await your summoning...'}</p>
        <p className="ws-text-sub">{lang === 'vi' ? 'Hãy nhấn để mở ra hành trình vận mệnh của bạn' : 'Press to begin your destiny journey'}</p>
      </div>

      {/* Deal button */}
      <button
        className="ws-deal-btn"
        onClick={onDeal}
        disabled={disabled}
        type="button"
      >
        <span className="ws-btn-shimmer" />
        <span className="ws-btn-text">🎴 {lang === 'vi' ? 'Triệu Hồi Bài' : 'Summon Cards'}</span>
      </button>

      <style>{`
        .ws-root {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 40px;
          min-height: 480px;
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

        /* Floating 3D Cards */
        .ws-floating-cards-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .ws-floating-card {
          position: absolute;
          width: 80px;
          height: 135px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 
            0 8px 25px rgba(0,0,0,0.5), 
            0 0 15px rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.25);
          background: rgba(10, 5, 25, 0.7);
          backdrop-filter: blur(3px);
          transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
          transform-style: preserve-3d;
        }

        .ws-floating-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.55;
          filter: saturate(0.8) contrast(1.1);
          transition: all 0.5s ease;
        }

        .ws-card-glow-inner {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, transparent 60%);
          z-index: 2;
          pointer-events: none;
        }

        /* Float Paths for 5 different cards */
        .ws-floating-card-0 {
          top: 10%;
          left: 12%;
          animation: ws-float-card-0 15s ease-in-out infinite;
        }
        .ws-floating-card-1 {
          top: 14%;
          right: 12%;
          animation: ws-float-card-1 18s ease-in-out infinite;
        }
        .ws-floating-card-2 {
          bottom: 12%;
          left: 14%;
          animation: ws-float-card-2 20s ease-in-out infinite;
        }
        .ws-floating-card-3 {
          bottom: 15%;
          right: 15%;
          animation: ws-float-card-3 16s ease-in-out infinite;
        }
        .ws-floating-card-4 {
          top: 40%;
          left: 6%;
          animation: ws-float-card-4 17s ease-in-out infinite;
        }

        @keyframes ws-float-card-0 {
          0%, 100% { transform: translateY(0) rotate(14deg) scale(0.9) perspective(800px) rotateX(12deg) rotateY(18deg); opacity: 0.7; }
          50% { transform: translateY(-24px) rotate(22deg) scale(0.95) perspective(800px) rotateX(6deg) rotateY(24deg); opacity: 0.95; box-shadow: 0 15px 35px rgba(168, 85, 247, 0.35); }
        }
        @keyframes ws-float-card-1 {
          0%, 100% { transform: translateY(0) rotate(-16deg) scale(0.85) perspective(800px) rotateX(-14deg) rotateY(12deg); opacity: 0.65; }
          50% { transform: translateY(-20px) rotate(-10deg) scale(0.9) perspective(800px) rotateX(-8deg) rotateY(6deg); opacity: 0.9; box-shadow: 0 15px 35px rgba(255, 196, 110, 0.25); }
        }
        @keyframes ws-float-card-2 {
          0%, 100% { transform: translateY(0) rotate(-10deg) scale(0.9) perspective(800px) rotateX(16deg) rotateY(-12deg); opacity: 0.7; }
          50% { transform: translateY(-28px) rotate(-15deg) scale(0.95) perspective(800px) rotateX(8deg) rotateY(-20deg); opacity: 0.95; box-shadow: 0 15px 35px rgba(168, 85, 247, 0.35); }
        }
        @keyframes ws-float-card-3 {
          0%, 100% { transform: translateY(0) rotate(12deg) scale(0.85) perspective(800px) rotateX(-12deg) rotateY(-16deg); opacity: 0.65; }
          50% { transform: translateY(-22px) rotate(6deg) scale(0.9) perspective(800px) rotateX(-18deg) rotateY(-12deg); opacity: 0.9; box-shadow: 0 15px 35px rgba(255, 196, 110, 0.25); }
        }
        @keyframes ws-float-card-4 {
          0%, 100% { transform: translateY(0) rotate(22deg) scale(0.8) perspective(800px) rotateX(10deg) rotateY(10deg); opacity: 0.6; }
          50% { transform: translateY(-25px) rotate(16deg) scale(0.85) perspective(800px) rotateX(15deg) rotateY(15deg); opacity: 0.85; box-shadow: 0 15px 35px rgba(168, 85, 247, 0.3); }
        }

        /* Orbit rings / Magic Portal */
        .ws-orbit-wrap {
          position: relative;
          width: 320px;
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          filter: drop-shadow(0 0 20px rgba(120, 40, 220, 0.4));
        }

        .ws-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }
        .ws-ring-1 {
          width: 300px; height: 300px;
          border-color: rgba(160, 90, 255, 0.25);
          box-shadow: 0 0 30px rgba(160, 90, 255, 0.1), inset 0 0 30px rgba(160, 90, 255, 0.1);
          animation: ws-spin 20s linear infinite;
        }
        .ws-ring-2 {
          width: 260px; height: 260px;
          border: 2px dashed rgba(255, 210, 100, 0.3);
          animation: ws-spin 14s linear infinite reverse;
        }
        .ws-ring-3 {
          width: 220px; height: 220px;
          border: 1px solid rgba(200, 120, 255, 0.4);
          animation: ws-spin 10s linear infinite;
        }

        /* Center Portal Glow */
        .ws-crystal-wrap {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(140, 50, 255, 0.3), transparent 70%);
          box-shadow: 0 0 60px rgba(160, 60, 255, 0.4);
          animation: ws-pulse-portal 4s ease-in-out infinite;
        }

        @keyframes ws-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes ws-pulse-portal {
          0%, 100% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 100px rgba(180, 80, 255, 0.6); }
        }

        .ws-crystal {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          filter: drop-shadow(0 0 20px rgba(200,120,255,0.9));
          animation: ws-float 4s ease-in-out infinite;
        }

        @keyframes ws-float {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-8px) scale(1.05); }
        }

        /* Orbiting dots around portal */
        .ws-orbit-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle, #ffe080, #c060ff);
          box-shadow: 0 0 12px #ffe080;
          top: 50%;
          left: 50%;
          transform-origin: 0 0;
          animation: ws-orbit-dot-anim calc(6s + var(--i) * 0.5s) linear infinite;
          animation-delay: calc(var(--i) * -0.8s);
        }

        @keyframes ws-orbit-dot-anim {
          from { transform: rotate(var(--deg)) translateX(90px) translate(-50%, -50%); opacity: 0.5; }
          50%  { opacity: 1; }
          to   { transform: rotate(calc(var(--deg) + 360deg)) translateX(90px) translate(-50%, -50%); opacity: 0.5; }
        }

        /* Text */
        .ws-text {
          text-align: center;
          z-index: 1;
        }
        .ws-text-main {
          font-size: 1.25rem;
          color: #ebdffc;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin: 0 0 12px;
          text-shadow: 0 0 20px rgba(200, 150, 255, 0.6);
          animation: ws-text-breath 4s ease-in-out infinite;
        }
        .ws-text-sub {
          font-size: 0.95rem;
          color: rgba(220, 200, 255, 0.7);
          margin: 0;
        }
        @keyframes ws-text-breath {
          0%,100% { opacity: 0.8; }
          50%     { opacity: 1; }
        }

        /* Deal button - AAA Style */
        .ws-deal-btn {
          position: relative;
          overflow: hidden;
          height: 64px;
          padding: 0 50px;
          border-radius: 32px;
          border: 2px solid rgba(255, 210, 100, 0.6);
          background: linear-gradient(180deg, #3a1508 0%, #1a0804 100%);
          color: #ffde82;
          font-size: 1.1rem;
          font-weight: bold;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          z-index: 1;
          box-shadow: 
            0 10px 30px rgba(0,0,0,0.6),
            0 0 30px rgba(255, 180, 50, 0.3),
            inset 0 2px 10px rgba(255, 210, 100, 0.2);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .ws-deal-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(100%);
        }
        .ws-deal-btn:not(:disabled):hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 
            0 15px 40px rgba(0,0,0,0.8),
            0 0 50px rgba(255, 200, 80, 0.5),
            inset 0 2px 20px rgba(255, 220, 120, 0.4);
          border-color: rgba(255, 230, 150, 0.9);
          color: #fff4c2;
          text-shadow: 0 0 10px rgba(255, 200, 100, 0.8);
        }

        .ws-btn-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,230,120,0.3), transparent);
          transform: skewX(-20deg);
          animation: ws-shimmer 3s ease-in-out infinite;
        }
        @keyframes ws-shimmer {
          0%   { transform: skewX(-20deg) translateX(-150%); }
          50%  { transform: skewX(-20deg) translateX(150%); }
          100% { transform: skewX(-20deg) translateX(150%); }
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
