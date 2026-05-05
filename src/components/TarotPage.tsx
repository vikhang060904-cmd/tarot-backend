  import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
  import LoginPromptModal from "./LoginPromptModal";
  import WaitingState from "./WaitingState";
  import "./tarot-patch.css";
  const API_BASE = "http://127.0.0.1:8002";

  interface Card {
    name: string;
    suit: string;
    image: string;
    index?: number;
  }

  interface TarotChatMessage {
    role: "user" | "assistant";
    content: string;
  }

  interface TarotPageProps {
    isLoggedIn: boolean;
    busy: boolean;
    allCards: Card[];
    selectedCards: Card[];
    result: string;
    question: string;
    currentTopic: string;
    onDealAll: () => void;
    onSelectCard: (card: Card) => void;
    onConfirm: () => void;
    onSetQuestion: (q: string) => void;
    onSetTopic: (topic: string) => void;
    onLogout: () => void;

    tarotMessages: TarotChatMessage[];
    onAskTarotFollowUp: (message: string) => Promise<void> | void;
    followUpBusy: boolean;
    conversationId: string | null;
    waitingForClarification: boolean;
  }

  const PICK_ANIMATION_MS = 1100;

  type FlyingCardState = {
    left: number;
    top: number;
    width: number;
    height: number;
    rotate: number;
  } | null;

  function spawnBurst(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      const gold = Math.random() > 0.4;
      const color = gold ? "#ffd060" : "#c060ff";
      const size = Math.random() * 6 + 2;
      const angle = (Math.PI * 2 * i) / 14;
      const dist = 55 + Math.random() * 55;
      p.style.cssText = `
        position:fixed;width:${size}px;height:${size}px;border-radius:50%;
        background:${color};box-shadow:0 0 ${size * 3}px ${color};
        left:${cx}px;top:${cy}px;pointer-events:none;z-index:9999;
        animation:tp-burst 0.8s ease forwards;
        --bx:${Math.cos(angle) * dist}px;--by:${Math.sin(angle) * dist}px;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }

    for (let i = 0; i < 10; i++) {
      const p = document.createElement("div");
      const color = Math.random() > 0.5 ? "#ff9a30" : "#a040e0";
      const size = Math.random() * 4 + 1;
      const angle = (Math.PI * 2 * i) / 10 + 0.3;
      const dist = 30 + Math.random() * 40;
      p.style.cssText = `
        position:fixed;width:${size}px;height:${size}px;border-radius:50%;
        background:${color};box-shadow:0 0 ${size * 2}px ${color};
        left:${cx}px;top:${cy}px;pointer-events:none;z-index:9998;
        animation:tp-burst 0.6s 0.12s ease forwards;
        --bx:${Math.cos(angle) * dist}px;--by:${Math.sin(angle) * dist}px;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  function renderTarotAnswer(text: string) {
    if (!text?.trim()) {
      return (
        <p className="tarot-empty-text">
          Kết quả luận giải sẽ xuất hiện sau khi bạn chọn đủ 3 lá và bấm “Khai Mở Vận Mệnh”.
        </p>
      );
    }

    const cleanedLines = text
      .split("\n")
      .map((line) => line.replace(/\*\*/g, "").trim())
      .filter(Boolean);

    const getIcon = (title: string) => {
      const upper = title.toUpperCase();
      if (upper.startsWith("TRẢ LỜI TRỰC TIẾP")) return "🎯";
      if (upper.startsWith("LUẬN GIẢI TỔNG QUAN")) return "📜";
      if (upper.startsWith("LÁ BÀI 1")) return "1️⃣";
      if (upper.startsWith("LÁ BÀI 2")) return "2️⃣";
      if (upper.startsWith("LÁ BÀI 3")) return "3️⃣";
      if (upper.startsWith("TỔNG KẾT")) return "✨";
      if (upper.startsWith("LỜI KHUYÊN")) return "🔮";

      if (title.startsWith("Quá khứ")) return "🕰️";
      if (title.startsWith("Hiện tại")) return "🌙";
      if (title.startsWith("Tương lai")) return "✨";
      if (title.startsWith("Lời khuyên")) return "🔮";
      if (title.startsWith("Tác động")) return "⚡";
      if (title.startsWith("Định nghĩa")) return "📖";
      return "📜";
    };

    const isHeading = (line: string) => {
      const upper = line.toUpperCase();
      return (
        line.startsWith("Quá khứ:") ||
        line.startsWith("Hiện tại:") ||
        line.startsWith("Tương lai:") ||
        line.startsWith("Lời khuyên:") ||
        line.startsWith("Tác động:") ||
        line.startsWith("Định nghĩa:") ||
        upper.startsWith("TRẢ LỜI TRỰC TIẾP CHO CÂU HỎI:") ||
        upper.startsWith("LUẬN GIẢI TỔNG QUAN:") ||
        upper.startsWith("LÁ BÀI 1:") ||
        upper.startsWith("LÁ BÀI 2:") ||
        upper.startsWith("LÁ BÀI 3:") ||
        upper.startsWith("TỔNG KẾT:") ||
        upper.startsWith("LỜI KHUYÊN:")
      );
    };

    const blocks: { title: string; paragraphs: string[] }[] = [];
    let currentBlock: { title: string; paragraphs: string[] } | null = null;
    const introParagraphs: string[] = [];

    cleanedLines.forEach((line) => {
      if (isHeading(line)) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { title: line, paragraphs: [] };
      } else if (currentBlock) {
        currentBlock.paragraphs.push(line);
      } else {
        introParagraphs.push(line);
      }
    });

    if (currentBlock) blocks.push(currentBlock);

    return (
      <>
        {introParagraphs.length > 0 && (
          <div className="tarot-reading-intro">
            {introParagraphs.map((line, idx) => (
              <p key={`intro-${idx}`} className="tarot-reading-paragraph">
                {line}
              </p>
            ))}
          </div>
        )}

        {blocks.map((block, index) => (
          <div key={index} className="tarot-reading-block">
            <h4 className="tarot-reading-heading">
              <span className="icon">{getIcon(block.title)}</span>
              {block.title}
            </h4>

            {block.paragraphs.map((para, pIndex) => (
              <p key={pIndex} className="tarot-reading-paragraph">
                {para}
              </p>
            ))}
          </div>
        ))}
      </>
    );
  }

  const TarotPage = ({
    isLoggedIn,
    busy,
    allCards,
    selectedCards,
    result,
    question,
    currentTopic,
    onDealAll,
    onConfirm,
    onSetQuestion,
    onSetTopic,
    onLogout,
    onSelectCard,
    tarotMessages,
    onAskTarotFollowUp,
    followUpBusy,
    conversationId,
    waitingForClarification,
  }: TarotPageProps) => {
    const [dealtCount, setDealtCount] = useState(0);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [animatingCardKey, setAnimatingCardKey] = useState<string | null>(null);
    const [isPicking, setIsPicking] = useState(false);
    const [flyingCard, setFlyingCard] = useState<FlyingCardState>(null);
    const [followUpInput, setFollowUpInput] = useState("");
    const [deckCharging, setDeckCharging] = useState(false);
    const [dealWaveKey, setDealWaveKey] = useState(0);
    const [screenFlash, setScreenFlash] = useState(false);
    const [boardShock, setBoardShock] = useState(false);
    const [phase, setPhase] = useState<"idle" | "shuffle" | "deal" | "done">("idle");
    const [time, setTime] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hoverTime, setHoverTime] = useState(0);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [floatingCards, setFloatingCards] = useState(
  Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: Math.random() * Math.PI * 2,
    radius: 520 + Math.random() * 180,
    speed: 0.002 + Math.random() * 0.002,
  }))
);
useEffect(() => {
  if (hoveredIndex !== null) {
    const t = setTimeout(() => setHoverTime(1), 400);
    return () => clearTimeout(t);
  } else {
    setHoverTime(0);
  }
}, [hoveredIndex]);
    useEffect(() => {
    let raf: number;

    const loop = () => {
      setTime(Date.now() / 8000);
      raf = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
  let raf: number;

  const animate = () => {
    setFloatingCards(prev =>
      prev.map(card => {
        const newAngle = card.angle + card.speed;
        const newRadius = card.radius - 0.8;

        // 🔥 bay vào tâm rồi reset
        if (newRadius < 180) {
          return {
            ...card,
            angle: Math.random() * Math.PI * 2,
            radius: 520 + Math.random() * 180,
          };
        }

        return {
          ...card,
          angle: newAngle,
          radius: newRadius,
        };
      })
    );

    raf = requestAnimationFrame(animate);
  };

  animate();
  return () => cancelAnimationFrame(raf);
}, []);
    useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/payments/auto-check/${conversationId}`);
          const data = await res.json();

          if (data.success) {
            alert("Thanh toán thành công!");
            window.location.reload();
          }
        } catch (err) {
          console.error(err);
        }
      })();
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId]);
    useEffect(() => {
      const style = document.createElement("style");
      style.id = "tp-mystic-keyframes";
      style.textContent = `
        @keyframes tp-burst {
          from { opacity:1; transform:translate(-50%,-50%) scale(1); }
          to   { opacity:0; transform:translate(calc(-50% + var(--bx)),calc(-50% + var(--by))) scale(0.1); }
        }

        @keyframes tp-ascend {
          0%   { transform:translateY(0) translateX(0) scale(1); opacity:0; }
          8%   { opacity:1; }
          85%  { opacity:0.65; }
          100% { transform:translateY(-110vh) translateX(var(--dx)) scale(0.2); opacity:0; }
        }

        @keyframes tp-nebula {
          0%   { transform:scale(1) translate(0,0); }
          100% { transform:scale(1.08) translate(-1.5%,2%); }
        }

        @keyframes tp-twinkle {
          0%   { opacity:0.5; }
          50%  { opacity:1; }
          100% { opacity:0.65; }
        }

        @keyframes tp-rise {
          from { opacity:0; transform:translateY(40px) scale(0.78) rotate(-6deg); filter:blur(6px); }
          to   { opacity:1; transform:translateY(0) scale(1) rotate(0deg); filter:blur(0); }
        }

        @keyframes tp-slot-breath {
          0%,100% { border-color:rgba(160,90,255,0.2); box-shadow:none; }
          50%     { border-color:rgba(160,90,255,0.48); box-shadow:0 0 16px rgba(120,50,220,0.2); }
        }

        @keyframes tp-shimmer {
          0%   { transform:translateX(-100%); }
          60%  { transform:translateX(100%); }
          100% { transform:translateX(100%); }
        }

        @keyframes tp-auraPulse {
          0%, 100% { opacity: 0.22; transform: scale(0.96); }
          50% { opacity: 0.42; transform: scale(1.06); }
        }

        @keyframes tp-glowPulse {
          0%, 100% { opacity: 0.26; transform: scale(0.98); }
          50% { opacity: 0.58; transform: scale(1.08); }
        }

        @keyframes tp-ghost-fly {
          0% {
            opacity: 1;
            transform: translate(0,0) scale(1) rotate(var(--pick-rotate,0deg));
            filter: brightness(1.5) blur(0) drop-shadow(0 0 8px rgba(255,200,80,0.6));
          }
          20% {
            opacity: 1;
            transform: translate(-30px, -60px) scale(1.15) rotate(calc(var(--pick-rotate,0deg) * 0.5));
            filter: brightness(2.5) blur(0) drop-shadow(0 0 24px rgba(255,200,80,1));
          }
          55% {
            opacity: 0.85;
            transform: translate(-160px,-180px) scale(0.75) rotate(-8deg);
            filter: brightness(3) blur(2px) drop-shadow(0 0 30px rgba(200,120,255,0.9));
          }
          85% {
            opacity: 0.3;
            transform: translate(-220px,-240px) scale(0.4) rotate(-15deg);
            filter: brightness(4) blur(5px);
          }
          100% {
            opacity: 0;
            transform: translate(-260px,-290px) scale(0.15) rotate(-20deg);
            filter: brightness(5) blur(10px);
          }
        }

        @keyframes tp-deck-charge {
          0% {
            transform: translateX(-50%) scale(1) rotate(0deg);
            filter: brightness(0.8) saturate(1);
          }
          30% {
            transform: translateX(-50%) scale(1.03) rotate(-1deg);
            filter: brightness(1.1) saturate(1.15);
          }
          60% {
            transform: translateX(-50%) scale(1.08) rotate(1deg);
            filter: brightness(1.28) saturate(1.28);
          }
          100% {
            transform: translateX(-50%) scale(1.02) rotate(0deg);
            filter: brightness(1.05) saturate(1.1);
          }
        }

        @keyframes tp-portal-spin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0.82);
            opacity: 0;
          }
          20% {
            opacity: 0.65;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) scale(1.18);
            opacity: 0;
          }
        }

        @keyframes tp-portal-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.96);
            opacity: 0.22;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 0.5;
          }
        }

        @keyframes tp-rune-float {
          0% {
            transform: translate(-50%, 0) scale(0.7) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.7;
          }
          100% {
            transform: translate(calc(-50% + var(--rx)), -220px) scale(1.15) rotate(160deg);
            opacity: 0;
          }
        }

        @keyframes tp-screen-flash {
          0% { opacity: 0; transform: scale(0.88); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.2); }
        }

        @keyframes tp-board-shake {
          0%   { transform: translate(0, 0) scale(1); }
          18%  { transform: translate(-5px, 2px) scale(1.004); }
          36%  { transform: translate(5px, -2px) scale(1.006); }
          54%  { transform: translate(-4px, 2px) scale(1.004); }
          72%  { transform: translate(4px, -1px) scale(1.003); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes tp-deck-core {
          0%, 100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(0.88);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.22);
          }
        }

        @keyframes tp-launch-ring {
          0% {
            opacity: 0.42;
            transform: translate(-50%, -50%) scale(0.55);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2.5);
          }
        }

        @keyframes tp-card-trail-strong {
          0%, 100% {
            opacity: 0.18;
            transform: scale(0.9);
          }
          50% {
            opacity: 0.48;
            transform: scale(1.12);
          }
        }

        @keyframes tp-rune-orbit {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(0deg) translateY(-8px) scale(0.7);
          }
          25% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(220deg) translateY(-34px) scale(1.1);
          }
        }

        @keyframes tp-deal-spiral {
          0% {
            opacity: 0;
            transform:
              translate(-50%, -50%)
              translateX(0px)
              translateY(var(--fromY, 360px))
              scale(0.12)
              rotate(calc(var(--tilt, 0deg) * 10));
            filter:
              blur(22px)
              brightness(3)
              saturate(1.9)
              drop-shadow(0 0 42px rgba(192,96,255,1));
          }

          12% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--spiralX) * 0.15))
              translateY(calc(var(--spiralY) * 0.15 + 180px))
              scale(0.34)
              rotate(calc(var(--r) + 26deg));
            filter:
              blur(12px)
              brightness(2.3)
              saturate(1.7)
              drop-shadow(0 0 36px rgba(255,196,110,0.9));
          }

          32% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--spiralX) * 0.72))
              translateY(calc(var(--spiralY) * 0.72 - 26px))
              scale(1.12)
              rotate(calc(var(--r) + 14deg));
            filter:
              blur(4px)
              brightness(1.45)
              saturate(1.28)
              drop-shadow(0 0 24px rgba(192,96,255,0.7));
          }

          60% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--x) + 16px))
              translateY(calc(var(--y) - 18px))
              scale(0.98)
              rotate(calc(var(--r) - 3deg));
            filter:
              blur(1px)
              brightness(1.12)
              saturate(1.08);
          }

          100% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              translateX(var(--x))
              translateY(var(--y))
              scale(1)
              rotate(var(--r));
            filter:
              blur(0)
              brightness(1)
              saturate(1);
          }
        }

        @keyframes tp-hover-float {
          0%, 100% {
            transform:
              translate(-50%, -50%)
              translateX(var(--x))
              translateY(var(--y))
              scale(1)
              rotate(var(--r));
          }

          25% {
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--x) + 2px))
              translateY(calc(var(--y) - 6px))
              scale(1.01)
              rotate(calc(var(--r) + 0.1deg));
          }

          50% {
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--x) - 1px))
              translateY(calc(var(--y) - 11px))
              scale(1.016)
              rotate(calc(var(--r) - 0.3deg));
          }

          75% {
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--x) + 1px))
              translateY(calc(var(--y) - 5px))
              scale(1.01)
              rotate(calc(var(--r) + 0.22deg));
          }
        }
  @keyframes tp-cinematic-deal {
    0% {
      opacity: 0;
      transform:
        translate(-50%, -50%)
        translateX(0)
        translateY(460px)
        scale(0.05)
        rotate(-240deg);
      filter: blur(28px) brightness(3);
    }

    20% {
      opacity: 1;
      transform:
        translate(-50%, -50%)
        translateX(calc(var(--x) * 0.25))
        translateY(calc(var(--y) * 0.25 + 220px))
        scale(1.45)
        rotate(calc(var(--r) + 140deg));
    }

    45% {
      transform:
        translate(-50%, -50%)
        translateX(calc(var(--x) * 0.8))
        translateY(calc(var(--y) * 0.8))
        scale(1.1)
        rotate(calc(var(--r) + 10deg));
    }

    /* 🔥 impact */
    80% {
      transform:
        translate(-50%, -50%)
        translateX(calc(var(--x) + 10px))
        translateY(calc(var(--y) - 4px))
        scale(0.97);
    }

    100% {
      transform:
        translate(-50%, -50%)
        translateX(var(--x))
        translateY(var(--y))
        scale(1)
        rotate(var(--r));
      filter: blur(0);
    }
  }

  @keyframes tp-hover-haunt-max {
    0%, 100% {
      transform:
        translate(-50%, -50%)
        translateX(var(--x))
        translateY(var(--y))
        scale(1)
        rotate(var(--r));
    }

    50% {
      transform:
        translate(-50%, -50%)
        translateX(calc(var(--x) + 2px))
        translateY(calc(var(--y) - 12px))
        scale(1.01)
        rotate(calc(var(--r) + 0.4deg));
    }
  }

  @keyframes tp-ritual-fog {
    0%, 100% {
      opacity: 0.18;
      transform: scale(0.92);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.12);
    }
  }

  @keyframes tp-ritual-ring {
    0% {
      opacity: 0.4;
      transform: translate(-50%, -50%) scale(0.55);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(2.8);
    }
  }
  @keyframes tp-spin-orbit {
    0% {
      opacity: 0;
      transform:
        translate(-50%, -50%)
        rotate(0deg)
        scale(0.2);
    }

    40% {
      opacity: 1;
      transform:
        translate(-50%, -50%)
        rotate(720deg)   /* 🔥 xoay mạnh */
        scale(1.2);
    }

    70% {
      transform:
        translate(-50%, -50%)
        rotate(1080deg)
        scale(1);
    }

    100% {
      transform:
        translate(-50%, -50%)
        translateX(var(--x))
        translateY(var(--y))
        rotate(var(--r));
    }
  }
    @keyframes tp-screen-flash {
    0% { opacity: 0; }
    20% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes tp-board-shake {
    0% { transform: translate(0,0); }
    25% { transform: translate(-6px, 3px); }
    50% { transform: translate(6px, -3px); }
    75% { transform: translate(-4px, 2px); }
    100% { transform: translate(0,0); }
  }
    @keyframes crystalPulse {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
      box-shadow: 0 0 60px rgba(160,80,255,0.6);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.08);
      box-shadow: 0 0 90px rgba(200,120,255,0.9);
    }
  }

  @keyframes coreGlow {
    0%, 100% {
      opacity: 0.7;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.3);
    }
  }
      `;

      if (!document.getElementById("tp-mystic-keyframes")) {
        document.head.appendChild(style);
      }

      const container = document.createElement("div");
      container.id = "tp-particles";
      container.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;";
      document.body.appendChild(container);

      for (let i = 0; i < 32; i++) {
        const p = document.createElement("div");
        const gold = Math.random() > 0.5;
        const size = Math.random() * 3 + 1;
        const color = gold
          ? `rgba(${200 + Math.random() * 55},${160 + Math.random() * 40},50,0.8)`
          : `rgba(${140 + Math.random() * 60},${60 + Math.random() * 40},${220 + Math.random() * 35},0.7)`;

        p.style.cssText = `
          position:absolute;width:${size}px;height:${size}px;border-radius:50%;
          left:${Math.random() * 100}%;top:${80 + Math.random() * 22}%;
          background:${color};box-shadow:0 0 ${size * 5}px ${color};
          --dx:${(Math.random() - 0.5) * 120}px;
          animation:tp-ascend ${8 + Math.random() * 14}s ${Math.random() * 10}s linear infinite;
        `;
        container.appendChild(p);
      }

      return () => {
        document.getElementById("tp-mystic-keyframes")?.remove();
        document.getElementById("tp-particles")?.remove();
      };
    }, []);

    const topics = useMemo(
      () => [
        { id: "love", label: "💕 Tình Yêu" },
        { id: "family", label: "👨‍👩‍👧‍👦 Gia Đình" },
        { id: "career", label: "💼 Sự Nghiệp" },
        { id: "health", label: "🏥 Sức Khỏe" },
        { id: "money", label: "💰 Tài Chính" },
        { id: "general", label: "🔮 Chung" },
      ],
      []
    );

    const requireLogin = () => {
      if (!isLoggedIn) {
        setShowLoginPrompt(true);
        return true;
      }
      return false;
    };

    const handleDealAll = async () => {
    console.log("🔥 RUN DEAL");

    if (requireLogin()) return;
    if (isPicking) return;

    await onDealAll(); // 🔥 QUAN TRỌNG

    setDealWaveKey((k) => k + 1);
    setPhase("shuffle");
    setDealtCount(0);
    setScreenFlash(true);
    setBoardShock(true);
    setDeckCharging(true);
    setTimeout(() => setScreenFlash(false), 350);
    setTimeout(() => setBoardShock(false), 600);

    setTimeout(() => {
      setPhase("deal");

      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDealtCount(i);

        if (i >= visibleCards.length) {
          clearInterval(interval);
          setPhase("done");
        }
        
      }, 90);
    }, 900);

    setTimeout(() => setScreenFlash(false), 650);
    setTimeout(() => setBoardShock(false), 900);
    setTimeout(() => setDeckCharging(false), 2300);
  };

    const handleSelectCard = (
      card: Card,
      event: React.MouseEvent<HTMLButtonElement>,
      rotate: number
    ) => {
      if (requireLogin()) return;
      if (isPicking || busy) return;

      const alreadySelected = selectedCards.some((c) => c.index === card.index);
      if (alreadySelected || selectedCards.length >= 3) return;

      const board = boardRef.current;
      if (!board) return;

      const button = event.currentTarget;
      const buttonRect = button.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      const cardKey = `${card.index ?? "x"}-${card.name}`;

      spawnBurst(event);
      setScreenFlash(true);
setBoardShock(true);

    setTimeout(() => setScreenFlash(false), 250);
    setTimeout(() => setBoardShock(false), 400);
      setFlyingCard({
        left: buttonRect.left - boardRect.left,
        top: buttonRect.top - boardRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
        rotate,
      });

      setAnimatingCardKey(cardKey);
      setIsPicking(true);

      window.setTimeout(() => {
        onSelectCard(card);
        setAnimatingCardKey(null);
        setFlyingCard(null);
        setIsPicking(false);
      }, PICK_ANIMATION_MS);
    };

    const handleConfirm = () => {
      if (requireLogin()) return;
      if (isPicking || busy) return;
      onConfirm();
    };

    const handleSetTopic = (topic: string) => {
      if (requireLogin()) return;
      if (isPicking) return;
      onSetTopic(topic);
    };

    const handleSetQuestion = (value: string) => {
      if (requireLogin()) return;
      onSetQuestion(value);
    };

    const handleAskFollowUp = async () => {
      const cleaned = followUpInput.trim();
      if (!cleaned) return;
      await onAskTarotFollowUp(cleaned);
      setFollowUpInput("");
    };

    const selectedCount = selectedCards.length;
    const hasDeck = allCards.length > 0;
    const canReveal = selectedCount === 3 && !busy && !isPicking;

    const visibleCards = allCards.filter((card) => {
      const isAlreadySelected = selectedCards.some((s) => s.index === card.index);
      const isAnimating = `${card.index ?? "x"}-${card.name}` === animatingCardKey;
      return !isAlreadySelected && !isAnimating;
    });

    return (
      <>
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            background: `
  radial-gradient(ellipse 70% 55% at 15% 85%, rgba(80,10,120,0.65), transparent 55%),
  radial-gradient(ellipse 60% 45% at 85% 15%, rgba(40,5,90,0.6), transparent 55%),
             radial-gradient(circle at 50% 50%, rgba(120,40,200,0.25), transparent 60%)
            `,  
            animation: "tp-nebula 22s ease-in-out infinite alternate",
          }}
        />
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            backgroundImage: `
              radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,.8), transparent),
              radial-gradient(1px 1px at 23% 38%, rgba(255,255,255,.55), transparent),
              radial-gradient(1.5px 1.5px at 38% 7%, rgba(255,240,180,.9), transparent),
              radial-gradient(1px 1px at 54% 57%, rgba(255,255,255,.5), transparent),
              radial-gradient(1px 1px at 69% 24%, rgba(255,255,255,.65), transparent),
              radial-gradient(1.5px 1.5px at 83% 43%, rgba(200,180,255,.75), transparent),
              radial-gradient(1px 1px at 14% 67%, rgba(255,255,255,.5), transparent),
              radial-gradient(1px 1px at 47% 81%, rgba(200,180,255,.45), transparent),
              radial-gradient(1.5px 1.5px at 75% 72%, rgba(255,240,180,.65), transparent),
              radial-gradient(1px 1px at 61% 4%, rgba(255,255,255,.65), transparent),
              radial-gradient(1px 1px at 5% 51%, rgba(200,180,255,.5), transparent),
              radial-gradient(1.5px 1.5px at 51% 31%, rgba(255,240,180,.55), transparent)
            `,
            animation: "tp-twinkle 6s ease-in-out infinite alternate",
          }}
        />

        {screenFlash && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 3,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 50% 72%, rgba(192,96,255,0.34), rgba(255,196,110,0.16), transparent 58%)",
              mixBlendMode: "screen",
              animation: "tp-screen-flash 0.7s ease-out 1",
            }}
          />
        )}
        <div className="depth-layer" />
        <div className="mystic-aura" />
        <div className="outer-frame" />
        <div className="tarot-page" style={{ position: "relative", zIndex: 1 }}>
          <div className="page-header">
            <div style={{ color: "#888", fontSize: 12 }}>
    Phase: {phase}
  </div>
            <h1>🎴 Trải Bài Tarot</h1>
            <p className="subtitle">Nhìn thấu bản chất sự việc, khai mở vận mệnh</p>
          </div>

          {hasDeck ? (
            <>
              <section className="selected-cards-section">
                <h3>LÁ BÀI ĐÃ CHỌN</h3>

                <div className="selected-cards-grid">
                  {[0, 1, 2].map((slot) => {
                    const card = selectedCards[slot];

                    return card ? (
                      <div
                        key={`${card.index ?? slot}-${card.name}`}
                        className="selected-card selected-card-enter"
                        style={{
                          animation: `tp-rise 0.7s cubic-bezier(0.22,1.3,0.36,1) ${slot * 140}ms both`,
                        }}
                      >
                        <img
                          src={`/images/tarot/${card.suit}/${card.image}`}
                          alt={card.name}
                          className="selected-card-image"
                          draggable={false}
                          style={{
                            border: "1px solid rgba(255,200,80,0.6)",
                            boxShadow:
                              "0 0 0 1px rgba(255,200,80,0.1), 0 0 20px rgba(200,140,40,0.3), 0 10px 24px rgba(0,0,0,0.45)",
                          }}
                        />
                        <p className="selected-card-name">{card.name}</p>
                      </div>
                    ) : (
                      <div
                        key={slot}
                        className="selected-card-slot"
                        style={{ animation: `tp-slot-breath 4s ${slot * 1.3}s ease-in-out infinite` }}
                      >
                        <span>◈</span>
                      </div>
                    );
                  })}
                </div>

                <div className="selected-count-display">
                  Đã chọn: <strong>{selectedCount}/3</strong> lá
                </div>
              </section>

              <div className="tarot-main">
                <section className="arc-spread-shell">
                  <div
                    key={dealWaveKey} 
                    className="arc-spread-board"
                    ref={boardRef}
                    style={{
                      animation: boardShock ? "tp-board-shake 0.42s ease-in-out 2" : undefined,
                    }}
                  >
                    {/* ===== FLOATING CARDS ===== */}
{floatingCards.map(card => {
  const x = Math.cos(card.angle) * card.radius;
  const y = Math.sin(card.angle) * card.radius;

  const dist = Math.sqrt(x * x + y * y);
  const scale = dist < 220 ? 0.3 : 0.85;
 const opacity = dist < 180 ? 0.25 : 0.85;

  return (
    <div
      key={card.id}
      className="floating-card"
      style={{
        transform: `
          translate(-50%, -50%)
          translateX(${x}px)
          translateY(${y}px)
          rotate(${card.angle * 60}deg)
          scale(${scale})
        `,
        opacity
      }}
    > 
    


      <img src="/images/tarot/back.png" />
    </div>
  );
})}
                    {/* 🔮 CRYSTAL BALL */}
  <div
    
    style={{
      position: "absolute",
      left: "50%",
      top: "55%",
      transform: "translate(-50%, -50%)",
      width: "220px",
      height: "220px",
      borderRadius: "50%",
      zIndex: 20,
      pointerEvents: "none",

      // 🔥 nền cầu
      background: `
        radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 40%),
        radial-gradient(circle at 70% 70%, rgba(160,80,255,0.35), transparent 60%),
        radial-gradient(circle, rgba(90,30,160,0.5), rgba(10,0,30,0.9))
      `,

      // 🔥 glow
      boxShadow: `
        0 0 60px rgba(160,80,255,0.6),
        inset 0 0 40px rgba(255,255,255,0.1)
      `,

      backdropFilter: "blur(6px)",

      animation: "crystalPulse 3s ease-in-out infinite"
    }}
  >
    {/* ✨ lõi phát sáng */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(255,200,255,0.9), rgba(160,80,255,0.2))",
        filter: "blur(4px)",
        animation: "coreGlow 1.5s ease-in-out infinite"
      }}
    />
  </div>
                  
                      {visibleCards.slice(0, dealtCount).map((card, visibleIndex) => {
  const isSelected = selectedCards.some((c) => c.index === card.index);

  const total = visibleCards.length;

  // chia 2 vòng
  const innerCount = Math.ceil(total * 0.28);
  const outerCount = total - innerCount;

  const isInner = visibleIndex < innerCount;

  // index từng vòng
  const ringIndex = isInner ? visibleIndex : visibleIndex - innerCount;
  const ringTotal = isInner ? innerCount : outerCount;

  // góc
  const angle = (ringIndex / ringTotal) * Math.PI * 2;

  // hover
  const isHovered = hoveredIndex === visibleIndex;
  const hoverScale = isHovered ? 1.45 : 1;
  const dimOthers = hoveredIndex !== null && !isHovered;

  // bán kính
  const radius = isInner ? 160 : 285;

  // orbit (xoay)
  const orbit = angle + time * (isInner ? 0.18 : 0.11);

  // depth
  const depth = (Math.sin(orbit) + 1) / 2;

  // freeze khi hover
  const frozenOrbit = isHovered ? angle : orbit;

  // position
  const x = Math.cos(frozenOrbit) * radius;
  const y = Math.sin(frozenOrbit) * radius * 0.82;

  // magnet effect
  const offsetX = isHovered ? Math.cos(frozenOrbit) * 20 : 0;
  const offsetY = isHovered ? Math.sin(frozenOrbit) * 20 : 0;

  // scale
  const scale = isInner
    ? 0.78 + depth * 0.22
    : 0.92 + depth * 0.18;

  // rotate
  const rotate = orbit * 180 / Math.PI + 90;

  // z-index
  const zIndex = isInner
    ? 3000 + Math.floor(depth * 500)
    : 1000 + Math.floor(depth * 500);

  // ánh sáng
  const brightness = 0.8 + depth * 0.5;

  // blur
  const blur = (1 - depth) * 1.2;

  const dealDelay = visibleIndex * 25 + Math.random() * 120;

                      return (
                        <button
    type="button"
    key={`${card.index}-${card.name}`}
    className="mystic-grid-card"
    onClick={(e) => handleSelectCard(card, e, rotate)}
    onMouseEnter={() => setHoveredIndex(visibleIndex)}
     onMouseLeave={() => setHoveredIndex(null)}
    style={
      {
        ["--x" as string]: `${x}px`,
        ["--y" as string]: `${y}px`,
        ["--fromX" as string]: `0px`,
        ["--fromY" as string]: `380px`,
        ["--r" as string]: `${rotate}deg`,
transform: `
  translate(-50%, 50%)
  translateX(${x + offsetX}px)
  translateY(${y + offsetY}px)
  translateZ(${scale * 260}px)
  rotate(${rotate}deg)
  scale(${scale * hoverScale})
`,
  zIndex: isHovered ? 9999 : zIndex + Math.floor(depth * 400),
  opacity: dimOthers ? 0.15 : 0.4 + depth * 0.6,

filter: `
  brightness(${isHovered ? brightness * (hoverTime ? 2.2 : 1.6) : brightness})
  blur(${dimOthers ? 3 : blur}px)
  drop-shadow(0 0 ${isHovered ? 100 : 15}px rgba(192,96,255,1))
`,
        ["--spiralX" as string]: `${x * 2.2}px`,
        ["--spiralY" as string]: `${y * 1.8}px`,
        visibility: isSelected ? "hidden" : "visible",
        animation: `
  tp-cinematic-deal 1.4s cubic-bezier(0.16,1,0.3,1) ${dealDelay}ms forwards
`,
      } as CSSProperties
    }
    aria-label={`Chọn lá ${card.name}`}
    disabled={busy || isPicking || selectedCount >= 3}
  >
    <span
      className="mystic-card-aura"
      style={{
        position: "absolute",
        inset: "-30px",
        borderRadius: "34px",
        background:
          "radial-gradient(circle, rgba(168,85,247,0.36) 0%, rgba(91,33,182,0.14) 44%, transparent 78%)",
        filter: "blur(26px)",
        opacity: 0.34,
        zIndex: 1,
        pointerEvents: "none",
        animation: "tp-auraPulse 2.8s ease-in-out infinite",
      }}
    />

    <span
      className="mystic-card-glow"
      style={{
        position: "absolute",
        inset: "-16px",
        borderRadius: "24px",
        background:
          "radial-gradient(circle, rgba(255,196,110,0.26) 0%, rgba(167,139,250,0.32) 32%, rgba(124,58,237,0.12) 60%, transparent 80%)",
        filter: "blur(18px)",
        opacity: 0.56,
        zIndex: 2,
        pointerEvents: "none",
        animation: "tp-glowPulse 1.9s ease-in-out infinite",
      }}
    />

    <span
      style={{
        position: "absolute",
        inset: "-22px",
        borderRadius: "28px",
        background:
          "radial-gradient(circle, rgba(255,255,255,0.09), rgba(192,96,255,0.06), transparent 72%)",
        filter: "blur(20px)",
        zIndex: 2,
        pointerEvents: "none",
        animation: "tp-ritual-fog 1.5s ease-in-out infinite",
      }}
    />

    <span
      className="mystic-card-smoke"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "128px",
        height: "128px",
        transform: "translate(-50%, -50%)",
        borderRadius: "999px",
        background:
          "radial-gradient(circle, rgba(168,85,247,0.24) 0%, rgba(91,33,182,0.11) 44%, transparent 75%)",
        filter: "blur(22px)",
        opacity: 0.26,
        zIndex: 3,
        pointerEvents: "none",
      }}
    />

    <span
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "56px",
        height: "56px",
        transform: "translate(-50%, -50%)",
        borderRadius: "999px",
        border: "1px solid rgba(255,216,122,0.2)",
        boxShadow: "0 0 18px rgba(192,96,255,0.32)",
        zIndex: 3,
        opacity: 0.32,
        pointerEvents: "none",
        animation: "tp-ritual-ring 1.2s ease-out infinite",
      }}
    />
    {isHovered && (
  <div
    className="mystic-beam"
    style={{
      left: "50%",
      top: "55%",
      transform: `
        translate(-50%, -100%)
        rotate(${rotate}deg)
      `
    }}
  />
)}
    <img
      src="/images/tarot/back.png"
      alt="Card Back"
      draggable={false}
      style={{
        position: "relative",
        zIndex: 5,
        filter: "drop-shadow(0 14px 26px rgba(0,0,0,0.56))",
      }}
    />
  </button>
                      );
                    })} 

                    {flyingCard && (
                      <div
                        className="picked-card-ghost"
                        style={
                          {
                            left: `${flyingCard.left}px`,
                            top: `${flyingCard.top}px`,
                            width: `${flyingCard.width}px`,
                            height: `${flyingCard.height}px`,
                            ["--pick-rotate" as string]: `${flyingCard.rotate}deg`,
                            animation: "tp-ghost-fly 1.1s cubic-bezier(0.2,0,0.1,1) forwards",
                            filter:
                              "drop-shadow(0 0 12px rgba(255,200,80,0.8)) drop-shadow(0 0 24px rgba(200,100,255,0.6))",
                          } as CSSProperties
                        }
                      >
                        <span className="mystic-card-glow" />
                        <span className="mystic-card-smoke" />
                        <img src="/images/tarot/back.png" alt="Card Back" draggable={false} />
                      </div>
                    )}
                    {phase !== "deal" && phase !== "done" && (
                    <div
                      className="arc-main-deck"
                      style={{
                        animation: deckCharging ? "tp-deck-charge 0.9s ease-in-out infinite" : undefined,
                        zIndex: 50,
                      }}
                    >
                      {deckCharging && (
                        <>
                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "44%",
                              width: "220px",
                              height: "220px",
                              borderRadius: "999px",
                              border: "1px solid rgba(192,96,255,0.34)",
                              boxShadow:
                                "0 0 46px rgba(192,96,255,0.28), inset 0 0 22px rgba(255,196,110,0.12)",
                              transform: "translate(-50%, -50%)",
                              pointerEvents: "none",
                              animation: "tp-portal-spin 1.2s linear infinite",
                            }}
                          />

                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "44%",
                              width: "160px",
                              height: "160px",
                              borderRadius: "999px",
                              background:
                                "radial-gradient(circle, rgba(255,196,110,0.18) 0%, rgba(192,96,255,0.22) 34%, rgba(91,33,182,0.1) 58%, transparent 75%)",
                              filter: "blur(16px)",
                              transform: "translate(-50%, -50%)",
                              pointerEvents: "none",
                              animation: "tp-portal-pulse 1.05s ease-in-out infinite",
                            }}
                          />

                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "44%",
                              width: "56px",
                              height: "56px",
                              borderRadius: "999px",
                              background:
                                "radial-gradient(circle, rgba(255,240,180,0.95) 0%, rgba(255,196,110,0.55) 35%, rgba(192,96,255,0.24) 65%, transparent 100%)",
                              transform: "translate(-50%, -50%)",
                              filter: "blur(3px)",
                              pointerEvents: "none",
                              animation: "tp-deck-core 0.8s ease-in-out infinite",
                            }}
                          />

                          <span
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "44%",
                              width: "72px",
                              height: "72px",
                              borderRadius: "999px",
                              border: "1px solid rgba(255,216,122,0.22)",
                              transform: "translate(-50%, -50%)",
                              pointerEvents: "none",
                              animation: "tp-launch-ring 0.9s ease-out infinite",
                            }}
                          />

                          {Array.from({ length: 12 }).map((_, i) => (
                            <span
                              key={i}
                              style={
                                {
                                  position: "absolute",
                                  left: "50%",
                                  bottom: "70px",
                                  color: i % 2 === 0 ? "rgba(255,208,96,0.92)" : "rgba(192,96,255,0.9)",
                                  fontSize: `${14 + (i % 4) * 5}px`,
                                  fontWeight: 700,
                                  letterSpacing: "0.08em",
                                  transform: "translateX(-50%)",
                                  pointerEvents: "none",
                                  ["--rx" as string]: `${(i - 5.5) * 22}px`,
                                  animation: `tp-rune-float ${1 + i * 0.06}s ${i * 0.04}s ease-out infinite`,
                                } as CSSProperties
                              }
                            >
                              ✦
                            </span>
                          ))}
                        </>
                      )}

                      <img
                        src="/images/tarot/back.png"
                        alt="Main Deck"
                        draggable={false}
                        style={{
                          position: "relative",
                          zIndex: 6,
                          boxShadow: deckCharging
                            ? "0 0 42px rgba(192,96,255,0.52), 0 0 22px rgba(255,196,110,0.24), 0 20px 42px rgba(0,0,0,0.52)"
                            : "0 18px 36px rgba(0,0,0,0.46), 0 0 26px rgba(124,58,237,0.18)",
                          filter: deckCharging ? "brightness(1.08) saturate(1.15)" : undefined,
                        }}
                      />
                      <span>{deckCharging ? "Triệu Hồi" : "Xáo Bài"}</span>
                    </div>
                    )}
                  </div>
              
                </section>
              </div>

              <section className="tarot-footer">
                <div className="controls-row">
                  <button
                    type="button"
                    className="btn-deal"
                    onClick={handleDealAll}
                    disabled={busy || isPicking || deckCharging}
                  >
                    {busy || deckCharging ? "⏳ Đang Triệu Hồi..." : "🎴 Chia Bài"}
                  </button>

                  <div className="topics-row">
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        className={`topic-btn ${currentTopic === topic.id ? "active" : ""}`}
                        onClick={() => handleSetTopic(topic.id)}
                        disabled={isPicking}
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="question-input"
                    placeholder="Nhập bối cảnh hiện tại hoặc câu hỏi bạn đang trăn trở..."
                    value={question}
                    onChange={(e) => handleSetQuestion(e.target.value)}
                    disabled={selectedCount === 0 || isPicking}
                  />

                  <button
                    type="button"
                    className="btn-reveal"
                    onClick={handleConfirm}
                    disabled={!canReveal}
                    style={{ position: "relative", overflow: "hidden" }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(90deg,transparent,rgba(255,200,80,0.18),transparent)",
                        animation: canReveal ? "tp-shimmer 2s ease-in-out infinite" : "none",
                        transform: canReveal ? undefined : "translateX(-100%)",
                      }}
                    />
                    <span style={{ position: "relative", zIndex: 1 }}>
                      {busy ? "⏳ Đang Giải Mã..." : "✨ Khai Mở Vận Mệnh"}
                    </span>
                  </button>
                </div>
              </section>
            </>
          ) : (
            <div className="tarot-main">
              <div className="cards-grid-section">
                <WaitingState onDeal={handleDealAll} disabled={busy || isPicking || deckCharging} />
              </div>
            </div>
          )}

          <section className="result-section">
            <div className="result-header">
              <span className="result-badge">🔮 Giải Mã Tarot</span>
              <h3>Thông Điệp Từ Bộ Bài</h3>
            </div>

            {tarotMessages.length === 0 ? (
              <article className="tarot-reading-article">
                {renderTarotAnswer(result)}
              </article>
            ) : (
              <div className="tarot-chat-thread">
                {tarotMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`tarot-chat-bubble ${msg.role === "user" ? "user" : "assistant"}`}
                  >
                    <div className="tarot-chat-role">
                      {msg.role === "user" ? "Bạn" : "Tarot AI"}
                    </div>

                    <div className="tarot-chat-content">
                      {msg.role === "assistant" ? renderTarotAnswer(msg.content) : <p>{msg.content}</p>}
                    </div>
                  </div>
                ))}

                {conversationId && waitingForClarification && (
                  <div
                    style={{
                      marginBottom: "10px",
                      color: "#f5d08a",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Tarot AI cần bạn bổ sung thêm thông tin trước khi luận giải đầy đủ.
                  </div>
                )}

                <div className="tarot-followup-box">
                  <input
                    type="text"
                    className="question-input"
                    placeholder={
                      !conversationId
                        ? "Hãy trải bài trước"
                        : waitingForClarification
                        ? "Nhập thêm thông tin để Tarot AI luận giải chính xác hơn..."
                        : "Hỏi tiếp về chính 3 lá bài này..."
                    }
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    disabled={!conversationId || followUpBusy}
                  />

                  <button
                    type="button"
                    className="btn-reveal"
                    onClick={handleAskFollowUp}
                    disabled={!conversationId || followUpBusy || !followUpInput.trim()}
                  >
                    {followUpBusy
                      ? "⏳ Đang trả lời..."
                      : waitingForClarification
                      ? "📩 Gửi bổ sung"
                      : "💬 Hỏi tiếp"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <LoginPromptModal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          onLogout={() => {
            setShowLoginPrompt(false);
            onLogout();
          }}
        />
      </>
    );
  };

  export default TarotPage;