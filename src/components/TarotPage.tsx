import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties } from "react";
import html2canvas from "html2canvas";
import LoginPromptModal from "./LoginPromptModal";
import WaitingState from "./WaitingState";
import { SPREAD_TYPES } from "../constants/spreads";
import { useLang } from "../i18n/LanguageContext";
import "./tarot-patch.css";


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
  onDealAll: () => Promise<Card[]> | void;
  onSelectCard: (card: Card) => void;
  onConfirm: (topicOverride?: string) => void;
  onSetQuestion: (q: string) => void;
  onSetTopic: (topic: string) => void;
  onLogout: () => void;

  tarotMessages: TarotChatMessage[];
  onAskTarotFollowUp: (message: string) => Promise<void> | void;
  followUpBusy: boolean;
  conversationId: string | null;
  waitingForClarification: boolean;

  // New props for spread handling
  maxSelectable: number;
  spreadType: string;
  deckArrangement: "fan" | "arc" | "rows" | "spiral" | "infinity" | "waves" | "chaos" | "orbit";
  onSetDeckArrangement: (v: "fan" | "arc" | "rows" | "spiral" | "infinity" | "waves" | "chaos" | "orbit") => void;
  onReset: () => void;
  birthDate: string;
  onSetBirthDate: (v: string) => void;
}

const PICK_ANIMATION_MS = 1100;

type FlyingCardState = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotate: number;
} | null;

function spawnStarDust(cx: number, cy: number) {
  for (let i = 0; i < 25; i++) {
    const p = document.createElement("div");
    const size = Math.random() * 4 + 1;
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 120;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const duration = 0.6 + Math.random() * 0.8;

    p.style.cssText = `
      position:fixed;width:${size}px;height:${size}px;border-radius:50%;
      background:white;box-shadow:0 0 10px #fde68a, 0 0 20px #fff;
      left:${cx}px;top:${cy}px;pointer-events:none;z-index:9999;
      animation:tp-star-dust ${duration}s ease-out forwards;
      --tx:${tx}px;--ty:${ty}px;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000);
  }
}

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
        {/* Placeholder shown when no result yet */}
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
  maxSelectable,
  spreadType,
  deckArrangement,
  onSetDeckArrangement,
  onReset,
  birthDate,
  onSetBirthDate,
}: TarotPageProps) => {
  const { t, lang } = useLang();
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
  const [majorShake, setMajorShake] = useState(false);
  const [runes, setRunes] = useState<Array<{ id: number; char: string; left: string; top: string; delay: string; duration: string }>>([]);
  const [phase, setPhase] = useState<"idle" | "shuffle" | "deal" | "done">("idle");
  const time = 0; // Optimized: Converted from high-frequency Dead React State to static constant to stop 60fps lag and crash
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tiltStyles, setTiltStyles] = useState<Record<number, CSSProperties>>({});
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const isMounted = useRef(true);
  const timeouts = useRef<number[]>([]);
  const intervals = useRef<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("tarotMuted") === "true");
  const [meditationMode, setMeditationMode] = useState(false);
  const [lowGraphicsMode, setLowGraphicsMode] = useState(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768 || document.body.classList.contains("is-mobile-app");
      return isMobile;
    }
    return false;
  });

  // Audio Refs
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  const sfxFlip = useRef<HTMLAudioElement | null>(null);
  const sfxSparkle = useRef<HTMLAudioElement | null>(null);
  const sfxBell = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    console.log("🔊 Initializing Local Audio System...");
    // Initialize SFX using local assets
    sfxFlip.current = new Audio("/audio/magic.mp3"); // Fallback to magic if no flip exists
    sfxSparkle.current = new Audio("/audio/magic.mp3");
    sfxBell.current = new Audio("/audio/magic.mp3");

    // Initialize Background Music using local asset
    bgMusic.current = new Audio("/audio/bg.mp3");
    bgMusic.current.loop = true;
    bgMusic.current.volume = 0.2;

    const handleLoaded = () => console.log("✅ Audio asset loaded successfully");
    const handleError = (e: any) => console.error("❌ Audio load error:", e);

    bgMusic.current.addEventListener('canplaythrough', handleLoaded);
    bgMusic.current.addEventListener('error', handleError);

    return () => {
      console.log("Static Audio Cleanup...");
      bgMusic.current?.pause();
      bgMusic.current?.removeEventListener('canplaythrough', handleLoaded);
      bgMusic.current?.removeEventListener('error', handleError);
      bgMusic.current = null;
    };
  }, []);



  const sfxPool = useRef<Record<string, HTMLAudioElement[]>>({});

  const playSFX = useCallback((type: 'flip' | 'sparkle' | 'bell') => {
    if (isMuted) return;
    
    // Khởi tạo pool cho mỗi loại âm thanh nếu chưa có
    if (!sfxPool.current[type]) {
      sfxPool.current[type] = Array.from({ length: 4 }, () => new Audio("/audio/magic.mp3"));
    }

    // Tìm một instance đang rảnh hoặc lấy instance đầu tiên và reset
    const pool = sfxPool.current[type];
    const audio = pool.find(a => a.paused) || pool[0];
    
    audio.volume = (type === 'flip') ? 0.15 : 0.4;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [isMuted]);

  useEffect(() => {
    if (bgMusic.current) {
      if (isMuted) {
        bgMusic.current.pause();
      } else {
        bgMusic.current.volume = meditationMode ? 0.1 : 0.25;
        bgMusic.current.play().catch(() => { });
      }
    }
    localStorage.setItem("tarotMuted", String(isMuted));
  }, [isMuted, meditationMode]);

  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    if (bgMusic.current) {
      if (next) bgMusic.current.pause();
      else bgMusic.current.play().catch(e => console.log("Manual play failed:", e));
    }
  }, [isMuted]);

  // Listen for sidebar audio toggle events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "muted") setIsMuted(detail.value);
      if (detail?.type === "meditation") setMeditationMode(detail.value);
    };
    window.addEventListener("sidebar-audio-toggle", handler);
    return () => window.removeEventListener("sidebar-audio-toggle", handler);
  }, []);

  useEffect(() => {
    if (tarotMessages.length > 0 || result) {
      playSFX('bell');
    }
  }, [tarotMessages.length, result]);



  const zodiac = useMemo(() => {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) return null;
    const m = date.getMonth() + 1;
    const d = date.getDate();
    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return { name: lang === 'vi' ? "Bạch Dương" : "Aries", symbol: "♈", element: lang === 'vi' ? "Lửa" : "Fire" };
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return { name: lang === 'vi' ? "Kim Ngưu" : "Taurus", symbol: "♉", element: lang === 'vi' ? "Đất" : "Earth" };
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return { name: lang === 'vi' ? "Song Tử" : "Gemini", symbol: "♊", element: lang === 'vi' ? "Khí" : "Air" };
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return { name: lang === 'vi' ? "Cự Giải" : "Cancer", symbol: "♋", element: lang === 'vi' ? "Nước" : "Water" };
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return { name: lang === 'vi' ? "Sư Tử" : "Leo", symbol: "♌", element: lang === 'vi' ? "Lửa" : "Fire" };
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return { name: lang === 'vi' ? "Xử Nữ" : "Virgo", symbol: "♍", element: lang === 'vi' ? "Đất" : "Earth" };
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return { name: lang === 'vi' ? "Thiên Bình" : "Libra", symbol: "♎", element: lang === 'vi' ? "Khí" : "Air" };
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return { name: lang === 'vi' ? "Bọ Cạp" : "Scorpio", symbol: "♏", element: lang === 'vi' ? "Nước" : "Water" };
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return { name: lang === 'vi' ? "Nhân Mã" : "Sagittarius", symbol: "♐", element: lang === 'vi' ? "Lửa" : "Fire" };
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return { name: lang === 'vi' ? "Ma Kết" : "Capricorn", symbol: "♑", element: lang === 'vi' ? "Đất" : "Earth" };
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return { name: lang === 'vi' ? "Bảo Bình" : "Aquarius", symbol: "♒", element: lang === 'vi' ? "Khí" : "Air" };
    if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return { name: lang === 'vi' ? "Song Ngư" : "Pisces", symbol: "♓", element: lang === 'vi' ? "Nước" : "Water" };
    return null;
  }, [birthDate, lang]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (tarotMessages.length > 0) {
      scrollToBottom();
    }
  }, [tarotMessages]);

  useEffect(() => {
    isMounted.current = true;

    // Initialize floating runes
    const chars = "᚛ ᚜ ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚻ ᚼ ᚽ ᚾ ᚿ ᛁ ᛃ ᛄ ᛅ ᛆ ᛇ ᛈ ᛉ ᛊ ᛋ ᛌ ᛍ ᛎ ᛏ ᛐ ᛑ ᛒ ᛓ ᛔ ᛕ ᛖ ᛗ ᛘ ᛙ ᛚ ᛛ ᛜ ᛝ ᛞ ᛟ";
    const newRunes = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      char: chars[Math.floor(Math.random() * chars.length)],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${15 + Math.random() * 20}s`
    }));
    setRunes(newRunes);

    return () => {
      isMounted.current = false;
      timeouts.current.forEach(clearTimeout);
      intervals.current.forEach(clearInterval);
    };
  }, []);

  const safeSetTimeout = (fn: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      if (isMounted.current) fn();
    }, delay);
    timeouts.current.push(id);
    return id;
  };

  const safeSetInterval = (fn: () => void, delay: number) => {
    const id = window.setInterval(() => {
      if (isMounted.current) fn();
    }, delay);
    intervals.current.push(id);
    return id;
  };



  const currentSpread = useMemo(() => {
    return SPREAD_TYPES.find((s) => s.id === spreadType);
  }, [spreadType]);

  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15; // Max 15 deg
    const rotateY = ((x - centerX) / centerX) * 15;

    setTiltStyles((prev) => ({
      ...prev,
      [index]: {
        "--rot-x": `${rotateX}deg`,
        "--rot-y": `${rotateY}deg`,
        "--mouse-x": `${(x / rect.width) * 100}%`,
        "--mouse-y": `${(y / rect.height) * 100}%`,
      } as CSSProperties,
    }));
  }, []);

  const handleCardMouseLeave = useCallback((index: number) => {
    setTiltStyles((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setHoveredIndex(null);
  }, []);
  const [floatingCards] = useState(
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      radius: 520 + Math.random() * 180,
      speed: 0.002 + Math.random() * 0.002,
    }))
  );

  // Optimized: Removed high-frequency requestAnimationFrame loops inside React.
  // The floating cards now render beautifully and statically at GPU compositor level,
  // completely eliminating 120 full page virtual DOM re-renders per second!
  useEffect(() => {
    const canvas = document.getElementById("galaxy-canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let stars: { x: number; y: number; z: number }[] = [];
    let mX = 0;
    let mY = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mX = (e.clientX - window.innerWidth / 2) * 0.002;
      mY = (e.clientY - window.innerHeight / 2) * 0.002;
    };

    const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || document.body.classList.contains('is-mobile-app'));
    const starCount = isMobile ? 35 : 180;
    const starSpeed = isMobile ? 0.4 : 1.2;

    // 🌠 tạo sao
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * canvas.width,
      });
    }

    window.addEventListener("mousemove", onMouseMove);

    const draw = () => {
      // 🌌 Dark deep background with gradient
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      grad.addColorStop(0, "#0a0020");
      grad.addColorStop(1, "#020008");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.z -= starSpeed;
        if (star.z <= 0) star.z = canvas.width;

        const k = 128 / star.z;
        const x = star.x * k + canvas.width / 2 + mX * star.z * 0.15;
        const y = star.y * k + canvas.height / 2 + mY * star.z * 0.15;

        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const size = (1 - star.z / canvas.width) * 2.5;
          const opacity = (1 - star.z / canvas.width);

          ctx.beginPath();
          ctx.arc(x, y, Math.max(0, size / 2), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 180, 255, ${opacity})`;
          ctx.fill();
        }
      });

      requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);
  useEffect(() => {
    const isMobile = lowGraphicsMode;
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
          from { opacity:0; transform:translateY(40px) scale(0.78) rotate(-6deg); ${isMobile ? "" : "filter:blur(6px);"} }
          to   { opacity:1; transform:translateY(0) scale(1) rotate(0deg); ${isMobile ? "" : "filter:blur(0);"} }
        }

        @keyframes tp-simple-deal {
          from { opacity: 0; transform: translate(-50%, -50%) translateX(var(--x)) translateY(var(--y)) rotate(var(--r)) scale(0.8); }
          to   { opacity: 1; transform: translate(-50%, -50%) translateX(var(--x)) translateY(var(--y)) rotate(var(--r)) scale(1); }
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
            ${isMobile ? "" : "filter: blur(22px) brightness(3) saturate(1.9) drop-shadow(0 0 42px rgba(192,96,255,1));"}
          }

          12% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--spiralX) * 0.15))
              translateY(calc(var(--spiralY) * 0.15 + 180px))
              scale(0.34)
              rotate(calc(var(--r) + 26deg));
            ${isMobile ? "" : "filter: blur(12px) brightness(2.3) saturate(1.7) drop-shadow(0 0 36px rgba(255,196,110,0.9));"}
          }

          32% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--spiralX) * 0.72))
              translateY(calc(var(--spiralY) * 0.72 - 26px))
              scale(1.12)
              rotate(calc(var(--r) + 14deg));
            ${isMobile ? "" : "filter: blur(4px) brightness(1.45) saturate(1.28) drop-shadow(0 0 24px rgba(192,96,255,0.7));"}
          }

          60% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              translateX(calc(var(--x) + 16px))
              translateY(calc(var(--y) - 18px))
              scale(0.98)
              rotate(calc(var(--r) - 3deg));
            ${isMobile ? "" : "filter: blur(1px) brightness(1.12) saturate(1.08);"}
          }

          100% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              translateX(var(--x))
              translateY(var(--y))
              scale(1)
              rotate(var(--r));
            ${isMobile ? "" : "filter: blur(0) brightness(1) saturate(1);"}
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
      ${isMobile ? "" : "filter: blur(28px) brightness(3);"}
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
      ${isMobile ? "" : "filter: blur(0);"}
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

    if (lowGraphicsMode) {
      return () => {
        document.getElementById("tp-mystic-keyframes")?.remove();
        document.getElementById("tp-particles")?.remove();
      };
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
  }, [lowGraphicsMode]);

  const topics = useMemo(
    () => [
      { id: "love", label: `💕 ${t.tarot.topics.love}` },
      { id: "family", label: `👨‍👩‍👧‍👦 ${lang === 'vi' ? 'Gia Đình' : 'Family'}` },
      { id: "career", label: `💼 ${t.tarot.topics.career}` },
      { id: "health", label: `🏥 ${t.tarot.topics.health}` },
      { id: "money", label: `💰 ${t.tarot.topics.finance}` },
      { id: "general", label: `🔮 ${t.tarot.topics.general}` },
    ],
    [t, lang]
  );

  const requireLogin = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return true;
    }
    return false;
  };

  const visibleCards = allCards.filter((card) => {
    const isAnimating = `${card.index ?? "x"}-${card.name}` === animatingCardKey;
    return !isAnimating;
  });

  const handleDealAll = useCallback(async () => {
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
    safeSetTimeout(() => setScreenFlash(false), 350);
    safeSetTimeout(() => setBoardShock(false), 600);
    playSFX('bell');

    safeSetTimeout(() => {
      setPhase("deal");

      const dealTickTime = lowGraphicsMode ? 12 : 90;
      const dealStep = lowGraphicsMode ? 6 : 1;

      let i = 0;
      const interval = safeSetInterval(() => {
        i += dealStep;
        if (i > visibleCards.length) i = visibleCards.length;
        setDealtCount(i);
        if (i % 6 === 0) playSFX('flip');

        if (i >= visibleCards.length) {
          clearInterval(interval);
          setPhase("done");
        }

      }, dealTickTime);
    }, lowGraphicsMode ? 250 : 900);

    safeSetTimeout(() => setScreenFlash(false), 650);
    safeSetTimeout(() => setBoardShock(false), 900);
    safeSetTimeout(() => setDeckCharging(false), 2300);
  }, [requireLogin, isPicking, onDealAll, visibleCards.length, safeSetTimeout, safeSetInterval]);

  const handleSelectCard = useCallback((
    card: Card,
    event: React.MouseEvent<HTMLButtonElement>,
    rotate: number
  ) => {
    if (requireLogin()) return;
    if (isPicking || busy) return;

    const alreadySelected = selectedCards.some((c) => c.index === card.index);
    if (alreadySelected || selectedCards.length >= maxSelectable) return;

    const board = boardRef.current;
    if (!board) return;

    const button = event.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const cardKey = `${card.index ?? "x"}-${card.name}`;

    spawnBurst(event);
    playSFX('flip');
    setScreenFlash(true);
    setBoardShock(true);

    safeSetTimeout(() => setScreenFlash(false), 250);
    safeSetTimeout(() => setBoardShock(false), 400);

    setFlyingCard({
      left: buttonRect.left - boardRect.left,
      top: buttonRect.top - boardRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
      rotate,
    });

    setAnimatingCardKey(cardKey);
    setIsPicking(true);

    safeSetTimeout(() => {
      onSelectCard(card);
      setAnimatingCardKey(null);
      setFlyingCard(null);
      setIsPicking(false);
    }, PICK_ANIMATION_MS);
  }, [requireLogin, isPicking, busy, selectedCards, maxSelectable, onSelectCard, safeSetTimeout]);

  const handleConfirm = useCallback(() => {
    if (requireLogin()) return;
    if (isPicking || busy) return;

    // 🔥 Check for Major Arcana for Shake effect
    const hasMajor = selectedCards.some(c =>
      c.suit === "Major Arcana" ||
      c.suit?.toLowerCase().includes("major") ||
      !["Cups", "Swords", "Wands", "Pentacles"].some(s => c.suit?.includes(s))
    );

    if (hasMajor) {
      setMajorShake(true);
      safeSetTimeout(() => setMajorShake(false), 800);
    }

    // ✨ Play Sound Effects
    playSFX('flip');
    setTimeout(() => playSFX('sparkle'), 200);

    // ✨ Star Dust burst from center of screen (where revelation happens)
    spawnStarDust(window.innerWidth / 2, window.innerHeight / 2);

    // ✨ Optional: Spawn star dust for each card in the result section
    setTimeout(() => {
      const cardElements = document.querySelectorAll('.selected-card-image');
      cardElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        spawnStarDust(rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
    }, 100);

    setPhase("done");
    onConfirm();
  }, [requireLogin, isPicking, busy, onConfirm, selectedCards, safeSetTimeout, playSFX]);

  const handleSetTopic = useCallback((topic: string) => {
    if (requireLogin()) return;
    if (isPicking) return;
    onSetTopic(topic);

    // Nếu đã có kết quả (đã giải bài), tự động gọi lại onConfirm với topic mới
    if (result && !busy) {
      onConfirm(topic);
    }
  }, [requireLogin, isPicking, onSetTopic, result, busy, onConfirm]);

  const handleSetQuestion = useCallback((value: string) => {
    if (requireLogin()) return;
    onSetQuestion(value);
  }, [requireLogin, onSetQuestion]);

  const handleAskFollowUp = useCallback(async () => {
    console.log("DEBUG: handleAskFollowUp called, input:", followUpInput);
    const cleaned = followUpInput.trim();
    if (!cleaned) {
      console.warn("DEBUG: Empty input, ignoring.");
      return;
    }
    await onAskTarotFollowUp(cleaned);
    setFollowUpInput("");
  }, [followUpInput, onAskTarotFollowUp]);

  const handleExportImage = async () => {
    const element = document.getElementById('reading-poster-template');
    if (!element) return;

    try {
      // Temporary show for capture
      element.style.display = 'block';
      element.style.position = 'fixed';
      element.style.left = '-9999px';

      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: '#0b0018',
        scale: 2,
      });

      element.style.display = 'none';

      const link = document.createElement('a');
      link.download = `Tarot-Reading-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (!isMuted) playSFX('bell');
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAskFollowUp();
    }
  };

  const selectedCount = selectedCards.length;
  const hasDeck = allCards.length > 0;
  const canReveal = selectedCount === maxSelectable && !busy && !isPicking;

  return (


    <>
      {!lowGraphicsMode && (
        <div className="mystic-runes-container" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
          {runes.map(r => (
            <div
              key={r.id}
              className="mystic-rune"
              style={{
                position: "absolute",
                left: r.left,
                top: r.top,
                color: "rgba(139, 92, 246, 0.15)",
                fontSize: "1.5rem",
                fontFamily: "serif",
                animation: `tp-rune-float ${r.duration} linear infinite`,
                animationDelay: r.delay,
                filter: "blur(1px)",
                textShadow: "0 0 10px rgba(139, 92, 246, 0.3)"
              }}
            >
              {r.char}
            </div>
          ))}
        </div>
      )}

      {!lowGraphicsMode && (
        <canvas
          id="galaxy-canvas"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0, // 🔥 ĐỔI TỪ -1 → 0
            pointerEvents: "none",
          }}
        />
      )}

      {screenFlash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 50% 72%, rgba(192,96,255,0.45), rgba(255,196,110,0.22), transparent 65%)",
            mixBlendMode: "screen",
            animation: "tp-screen-flash 0.8s ease-out 1",
          }}
        />
      )}

      {!lowGraphicsMode && (
        <div className="nebula-background-container">
          <div className="nebula-bg-layer layer-1" />
          <div className="nebula-bg-layer layer-2" />
          <div className="nebula-bg-layer layer-3" />
          <div className="depth-layer" />
          <div className="mystic-aura" />
        </div>
      )}
      <div className="outer-frame" />

      <div
        className={`tarot-page ${majorShake ? 'major-arcana-shake' : ''} ${meditationMode ? 'meditation-active' : ''}`}
        style={{
          position: "relative",
          zIndex: 1,
          background: lowGraphicsMode ? "linear-gradient(135deg, #0a001a 0%, #030008 100%)" : undefined
        }}
      >
        <div className="meditation-overlay" />
        {!meditationMode && !lowGraphicsMode && (
          <div className="incense-smoke-container">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="smoke-particle"
                style={{
                  ['--l' as any]: `${10 + i * 12}%`,
                  ['--d' as any]: `${8 + i * 2}s`
                } as any}
              />
            ))}
          </div>
        )}
        <div className="page-header">
          <h1>🎴 {lang === 'vi' ? 'Trải Bài Tarot' : 'Tarot Reading'}</h1>
          <p className="subtitle">{lang === 'vi' ? 'Nhìn thấu bản chất sự việc, khai mở vận mệnh' : 'See the essence, unlock your destiny'}</p>
        </div>
        {hasDeck ? (
          <>
            <div className="ritual-config-bar glass-panel">
              <div className="config-group">
                <div className="config-item">
                  <span className="config-icon">✨</span>
                  <div className="config-content">
                    <label>{lang === 'vi' ? 'Bản Đồ Linh Hồn' : 'Soul Map'}</label>
                    <input
                      type="date"
                      className="soul-date-input"
                      value={birthDate}
                      onChange={(e) => {
                        onSetBirthDate(e.target.value);
                        localStorage.setItem("birthDate", e.target.value);
                      }}
                    />
                  </div>
                </div>
                {zodiac && (
                  <div className="zodiac-badge animate-fade-in">
                    <span className="zodiac-symbol">{zodiac.symbol}</span>
                    <div className="zodiac-info">
                      <p className="zodiac-name">{zodiac.name}</p>
                      <p className="zodiac-element">{zodiac.element}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="config-divider" />

              <div className="config-group">
                <div className="config-item">

                  <div className="config-content">
                    <label>{lang === 'vi' ? 'Kiểu Trải Bài' : 'Deck Layout'}</label>
                    <div className="arrangement-selector">
                      {(["fan", "arc", "rows", "spiral", "infinity", "waves", "chaos", "orbit"] as const).map((mode) => (
                        <button
                          key={mode}
                          className={`arrangement-btn ${deckArrangement === mode ? "active" : ""}`}
                          onClick={() => onSetDeckArrangement(mode)}
                          title={`${lang === 'vi' ? 'Kiểu' : 'Mode'} ${mode}`}
                        >
                          {mode === "fan" && "🪭"}
                          {mode === "arc" && "🌙"}
                          {mode === "rows" && "📋"}
                          {mode === "spiral" && "🌀"}
                          {mode === "infinity" && "∞"}
                          {mode === "waves" && "🌊"}
                          {mode === "chaos" && "⚛️"}
                          {mode === "orbit" && "🪐"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="config-divider" />

              <div className="config-group">
                <div className="config-item">
                  <span className="config-icon"></span>
                  <div className="config-content">
                    <label>{lang === 'vi' ? 'Không Gian' : 'Space'}</label>
                    <div className="arrangement-selector">
                      <button
                        type="button"
                        className={`arrangement-btn ${!isMuted ? 'active' : ''}`}
                        onClick={handleToggleMute}
                        title={isMuted ? (lang === 'vi' ? "Bật âm thanh" : "Unmute") : (lang === 'vi' ? "Tắt âm thanh" : "Mute")}
                      >
                        {isMuted ? "🔇" : "🔊"}
                      </button>
                      <button
                        type="button"
                        className={`arrangement-btn ${meditationMode ? 'active' : ''}`}
                        onClick={() => setMeditationMode(!meditationMode)}
                        title={lang === 'vi' ? "Chế độ thiền định (Giảm độ sáng, nhạc nhẹ)" : "Meditation mode (Dim lights, soft music)"}
                      >
                        🧘
                      </button>
                      <button
                        type="button"
                        className={`arrangement-btn ${lowGraphicsMode ? 'active' : ''}`}
                        onClick={() => setLowGraphicsMode(!lowGraphicsMode)}
                        title={lowGraphicsMode ? (lang === 'vi' ? "Tắt chế độ máy yếu" : "Disable low-end mode") : (lang === 'vi' ? "Bật chế độ máy yếu (Mượt mà tuyệt đối / Tiết kiệm pin)" : "Enable low-end mode (Smooth performance / Save battery)")}
                      >
                        ⚡
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <section className="selected-cards-section glass-panel">
              <div className="section-header">
                <div className="ritual-title-group">
                  <span className="premium-badge">DIVINE SPREAD</span>
                  <h3>{lang === 'vi' ? 'LÁ BÀI ĐÃ CHỌN' : 'SELECTED CARDS'}</h3>
                </div>
                <div className="selected-count-badge">
                  <span>{lang === 'vi' ? 'Tiến độ:' : 'Progress:'}</span>
                  <strong>{selectedCount} / {maxSelectable}</strong>
                </div>
              </div>

              <div className={`selected-cards-layout layout-${currentSpread?.layout || 'grid'}`}>
                {Array.from({ length: maxSelectable }).map((_, slot) => {
                  const card = selectedCards[slot];
                  const positionLabel = currentSpread?.positions?.[slot] || (lang === 'vi' ? `Lá ${slot + 1}` : `Card ${slot + 1}`);

                  // 🎡 Calculate Positioning Style
                  let posStyle: React.CSSProperties = {};
                  if (currentSpread?.layout === 'circle') {
                    const radius = 320;
                    const angle = (slot / maxSelectable) * Math.PI * 2 - Math.PI / 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    posStyle = {
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      margin: 0,
                      zIndex: 10
                    };
                  } else {
                    posStyle = { position: 'relative' };
                  }

                  return (
                    <div key={slot} className="slot-position-wrapper" style={posStyle}>
                      {card ? (
                        <div
                          className="selected-card-container selected-card-enter"
                          style={{
                            animation: `tp-rise 0.8s cubic-bezier(0.22,1.3,0.36,1) ${slot * 100}ms both`,
                          }}
                        >
                          <div className="card-perspective">
                            <img
                              src={`/images/tarot/${card.suit}/${card.image}`}
                              alt={card.name}
                              className="selected-card-image"
                              draggable={false}
                            />
                            <div className="card-shine" />
                          </div>
                          <div className="position-label">{positionLabel}</div>
                          <p className="selected-card-name">{card.name}</p>
                        </div>
                      ) : (
                        <div
                          className="selected-card-slot"
                          style={{
                            animation: `tp-slot-breath 4s ${slot * 0.8}s ease-in-out infinite`
                          }}
                        >
                          <div className="slot-glow" />
                          <div className="slot-label">{positionLabel}</div>
                          <span className="slot-icon">◈</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="tarot-main">
              <section className="arc-spread-shell">
                <div
                  key={dealWaveKey}
                  className="arc-spread-board"
                  ref={boardRef}
                  onMouseMove={(e) => {
                    const rect = boardRef.current?.getBoundingClientRect();
                    if (!rect) return;

                    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
                    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

                    setMouse({ x, y });
                  }}
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

                    const startX = `${x + mouse.x * 25}px`;
                    const startY = `${y + mouse.y * 25}px`;
                    const startRot = `${card.angle * 60}deg`;

                    return (
                      <div
                        key={card.id}
                        className={`floating-card ${deckCharging ? "tp-shuffling-vortex" : ""}`}
                        style={{
                          transform: `
          translate(-50%, -50%)
          translateX(${startX})
          translateY(${startY})
          rotate(${startRot})
          scale(${scale})
        `,
                          opacity,
                          "--startX": startX,
                          "--startY": startY,
                          "--startRot": startRot,
                          "--startScale": scale,
                        } as React.CSSProperties}
                      >
                        <img 
                          src="/images/tarot/back.png" 
                          alt="Floating Card" 
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      </div>
                    );
                  })}
                  {/* 🌟 SUMMONING SIGIL (MAGIC CIRCLE) & SHOCKWAVE */}
                  {deckCharging && (
                    <div className="summoning-sigil">
                      <div className="summon-shockwave" />
                      <div className="sigil-ring sigil-outer" />
                      <div className="sigil-ring sigil-mid" />
                      <div className="sigil-ring sigil-inner" />
                      <div className="sigil-star" />
                      <div className="sigil-runes">
                        {["✦", "✧", "✵", "✹", "✥", "◇", "◈", "⬡", "☽", "❂"].map((rune, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              "--idx": idx, 
                              position: "absolute",
                            } as React.CSSProperties}
                          >
                            {rune}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 🔮 CRYSTAL BALL */}
                  <div
                    className="crystal-ball"
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
                    let x = 0, y = 0, rotate = 0, scale = 1, zIndex = 1000, brightness = 1, blur = 0, depth = 0.5;

                    if (deckArrangement === "arc") {
                      const innerCount = Math.ceil(total * 0.28);
                      const outerCount = total - innerCount;
                      const isInner = visibleIndex < innerCount;
                      const ringIndex = isInner ? visibleIndex : visibleIndex - innerCount;
                      const ringTotal = isInner ? innerCount : outerCount;
                      const angle = (ringIndex / ringTotal) * Math.PI * 2;
                      const orbit = angle + time * (isInner ? 0.18 : 0.11);
                      const radius = isInner ? 160 : 285;
                      x = Math.cos(orbit) * radius;
                      y = Math.sin(orbit) * radius - 50;
                      depth = (Math.sin(orbit) + 1) / 2;
                      scale = isInner ? 0.78 + depth * 0.22 : 0.92 + depth * 0.18;
                      rotate = orbit * 180 / Math.PI + 90;
                      zIndex = isInner ? 3000 + Math.floor(depth * 500) : 1000 + Math.floor(depth * 500);
                      brightness = 0.8 + depth * 0.5;
                      blur = (1 - depth) * 1.2;
                    } else if (deckArrangement === "fan") {
                      const fanAngle = Math.PI * 1.2;
                      const startAngle = -Math.PI * 1.1;
                      const angle = startAngle + (visibleIndex / total) * fanAngle;
                      const radius = 350 + Math.sin(visibleIndex * 0.1) * 20;
                      x = Math.cos(angle) * radius;
                      y = Math.sin(angle) * (radius * 0.6) + 100;
                      rotate = angle * 180 / Math.PI + 90;
                      scale = 0.9 + Math.sin(angle) * 0.1;
                      zIndex = 2000 + visibleIndex;
                      brightness = 1;
                    } else if (deckArrangement === "rows") {
                      const cols = 13;
                      const row = Math.floor(visibleIndex / cols);
                      const col = visibleIndex % cols;
                      x = (col - (cols - 1) / 2) * 55;
                      y = (row - 2.5) * 85 + 50;
                      rotate = 0;
                      scale = 0.65;
                      zIndex = 2000 + visibleIndex;
                    } else if (deckArrangement === "spiral") {
                      const angle = visibleIndex * 0.4 + time * 0.5;
                      const radius = 40 + visibleIndex * 4.5;
                      x = Math.cos(angle) * radius;
                      y = Math.sin(angle) * radius - 20;
                      rotate = angle * 180 / Math.PI + 90;
                      scale = 0.5 + (visibleIndex / total) * 0.6;
                      zIndex = 2000 + visibleIndex;
                      depth = visibleIndex / total;
                      brightness = 0.7 + depth * 0.5;
                    } else if (deckArrangement === "infinity") {
                      // ∞ Lemniscate of Bernoulli
                      const t = (visibleIndex / total) * Math.PI * 2 + time * 0.4;
                      const scale_inf = 350 / (Math.sin(t) * Math.sin(t) + 1);
                      x = scale_inf * Math.cos(t);
                      y = scale_inf * Math.sin(t) * Math.cos(t);
                      rotate = Math.atan2(y, x) * 180 / Math.PI + 90;
                      scale = 0.75;
                      zIndex = 2000 + visibleIndex;
                    } else if (deckArrangement === "waves") {
                      const waveFreq = 0.5;
                      const t = (visibleIndex / total) * Math.PI * 4 * waveFreq + time * 0.8;
                      x = (visibleIndex - total / 2) * 45;
                      y = Math.sin(t) * 120;
                      rotate = Math.cos(t) * 25;
                      scale = 0.8;
                      zIndex = 2000 + visibleIndex;
                    } else if (deckArrangement === "chaos") {
                      // Magic Chaos: deterministic random based on index
                      const seed = visibleIndex * 13.37 + time * 0.1;
                      x = Math.sin(seed) * 350;
                      y = Math.cos(seed * 0.8) * 220;
                      rotate = (Math.sin(seed * 1.5) * 45);
                      scale = 0.6 + Math.abs(Math.sin(seed)) * 0.4;
                      zIndex = 2000 + visibleIndex;
                    } else if (deckArrangement === "orbit") {
                      const ring = visibleIndex % 3;
                      const ringIndex = Math.floor(visibleIndex / 3);
                      const ringTotal = Math.ceil(total / 3);
                      const ringRadius = 140 + ring * 130;
                      const angle = (ringIndex / ringTotal) * Math.PI * 2 + time * (0.3 - ring * 0.1);
                      x = Math.cos(angle) * ringRadius;
                      y = Math.sin(angle) * ringRadius;
                      rotate = angle * 180 / Math.PI + 90;
                      scale = 0.6 + (2 - ring) * 0.2;
                      zIndex = 2000 + visibleIndex;
                    }

                    const dealDelay = visibleIndex * 25 + Math.random() * 120;
                    const isHovered = hoveredIndex === visibleIndex;
                    const hoverScale = isHovered ? 1.35 : 1;

                    return (
                      <button
                        type="button"
                        key={`${card.index}-${card.name}`}
                        className={`mystic-grid-card ${phase === 'deal' ? 'deal-glow' : ''} ${hoveredIndex === visibleIndex ? 'hover-glow' : ''}`}
                        onClick={(e) => handleSelectCard(card, e, rotate)}
                        onMouseMove={(e) => {
                          handleCardMouseMove(e, visibleIndex);
                        }}
                        onMouseEnter={() => setHoveredIndex(visibleIndex)}
                        onMouseLeave={() => handleCardMouseLeave(visibleIndex)}
                        style={
                          {
                            ...tiltStyles[visibleIndex],
                            ["--x" as any]: `${x}px`,
                            ["--y" as any]: `${y}px`,
                            ["--fromX" as any]: `0px`,
                            ["--fromY" as any]: `380px`,
                            ["--r" as any]: `${rotate}deg`,
                            transform: `
  translate(-50%, -50%)
  translateX(${x}px)
  translateY(${y}px)
  translateZ(${isHovered ? 600 : scale * 200}px)
  rotate(${rotate}deg)
  scale(${scale * hoverScale})
`,
                            transition: "transform 0.25s cubic-bezier(.2,1,.3,1)",
                            zIndex: isHovered ? 9999 : zIndex + Math.floor(depth * 400),
                            opacity: isHovered
                              ? 1
                              : hoveredIndex !== null
                                ? 0.25
                                : 0.4 + depth * 0.6,
                            filter: (typeof window !== "undefined" && (window.innerWidth <= 768 || document.body.classList.contains("is-mobile-app")))
                              ? (isHovered ? "drop-shadow(0 0 25px rgba(168,85,247,0.85))" : "none")
                              : `
  brightness(${isHovered ? brightness * 1.9 : brightness})
  blur(${blur}px)
  saturate(${isHovered ? 1.4 : 1})
  drop-shadow(0 0 ${isHovered ? 120 : 18}px rgba(192,96,255,1))
  drop-shadow(0 0 ${isHovered ? 60 : 10}px rgba(255,196,110,0.8))
`,
                            ["--spiralX" as any]: `${x * 2.2}px`,
                            ["--spiralY" as any]: `${y * 1.8}px`,
                            visibility: isSelected ? "hidden" : "visible",
                            animation: lowGraphicsMode
                              ? `tp-simple-deal 0.28s ease-out ${dealDelay * 0.15}ms forwards`
                              : `tp-cinematic-deal 1.4s cubic-bezier(0.16,1,0.3,1) ${dealDelay}ms forwards`,
                          } as any
                        }
                        aria-label={`Chọn lá ${card.name}`}
                        disabled={busy || isPicking || selectedCount >= maxSelectable}
                      >
                        <div className="card-inner-3d">
                          {!lowGraphicsMode ? (
                            <>
                              <div className="foil-glare" />
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
                            </>
                          ) : null}

                          <img
                            src="/images/tarot/back.png"
                            alt="Card Back"
                            draggable={false}
                            style={{
                              position: "relative",
                              zIndex: 5,
                              filter: lowGraphicsMode ? "none" : "drop-shadow(0 14px 26px rgba(0,0,0,0.56))",
                            }}
                          />
                        </div>
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
                          ["--pick-rotate" as any]: `${flyingCard.rotate}deg`,
                          animation: "tp-ghost-fly 1.1s cubic-bezier(0.2,0,0.1,1) forwards",
                          filter:
                            "drop-shadow(0 0 12px rgba(255,200,80,0.8)) drop-shadow(0 0 24px rgba(200,100,255,0.6))",
                        } as any
                      }
                    >
                      <span className="mystic-card-glow" />
                      <span className="mystic-card-smoke" />
                      <img 
                        src="/images/tarot/back.png" 
                        alt="Card Back" 
                        draggable={false} 
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
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
                                  ["--rx" as any]: `${(i - 5.5) * 22}px`,
                                  animation: `tp-rune-float ${1 + i * 0.06}s ${i * 0.04}s ease-out infinite`,
                                } as any
                              }
                            >
                              ✦
                            </span>
                          ))}
                        </>
                      )}

                      {phase === "shuffle" ? (
                        <div className="riffle-shuffle-container">
                          {/* Left pile */}
                          <div className="shuffle-pile pile-left">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <img
                                key={`l-${i}`}
                                src="/images/tarot/back.png"
                                alt="Shuffling Left"
                                className="shuffle-card"
                                style={{
                                  animation: `riffle-left 0.8s ease-in-out infinite`,
                                  animationDelay: `${i * 0.12}s`,
                                  transform: `translateY(${-i * 1.5}px) rotate(-12deg)`,
                                }}
                              />
                            ))}
                          </div>
                          {/* Right pile */}
                          <div className="shuffle-pile pile-right">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <img
                                key={`r-${i}`}
                                src="/images/tarot/back.png"
                                alt="Shuffling Right"
                                className="shuffle-card"
                                style={{
                                  animation: `riffle-right 0.8s ease-in-out infinite`,
                                  animationDelay: `${i * 0.12}s`,
                                  transform: `translateY(${-i * 1.5}px) rotate(12deg)`,
                                }}
                              />
                            ))}
                          </div>
                          {/* Center forming pile */}
                          <div className="shuffle-pile pile-center">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <img
                                key={`c-${i}`}
                                src="/images/tarot/back.png"
                                alt="Shuffling Center"
                                className="shuffle-card-center"
                                style={{
                                  transform: `translateY(${-i * 1.5}px)`,
                                  animation: `pile-grow 0.8s ease-out infinite`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <img
                          src="/images/tarot/back.png"
                          alt="Main Deck"
                          draggable={false}
                          className="ritual-main-deck-img"
                          style={{
                            position: "relative",
                            zIndex: 6,
                            boxShadow: deckCharging
                              ? "0 0 60px rgba(160,80,255,0.6), 0 0 30px rgba(255,196,110,0.3)"
                              : "0 20px 40px rgba(0,0,0,0.6)",
                            filter: deckCharging ? "brightness(1.1) saturate(1.2)" : undefined,
                          }}
                        />
                      )}
                      <div className="deck-ritual-label">
                        {deckCharging ? (lang === 'vi' ? "ĐANG TRIỆU HỒI" : "SUMMONING") : (lang === 'vi' ? "BỘ BÀI LINH HỒN" : "SOUL DECK")}
                      </div>
                    </div>
                  )}
                </div>

              </section>
            </div>

            <section className="ritual-command-center glass-panel">
              <div className="ritual-primary-controls">
                <button
                  type="button"
                  className="btn-deal-ritual"
                  onClick={handleDealAll}
                  disabled={busy || isPicking || deckCharging}
                >
                  <span className="btn-icon">{busy || deckCharging ? "⏳" : "🎴"}</span>
                  <span className="btn-text">{busy || deckCharging ? (lang === 'vi' ? "Đang Triệu Hồi..." : "Summoning...") : (lang === 'vi' ? "Triệu Hồi Bộ Bài" : "Summon Deck")}</span>
                </button>

                <div className="ritual-topic-selector">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      className={`ritual-topic-btn ${currentTopic === topic.id ? "active" : ""}`}
                      onClick={() => handleSetTopic(topic.id)}
                      disabled={isPicking}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ritual-input-zone">
                <div className="ritual-question-wrapper">
                  <input
                    type="text"
                    className="ritual-question-input"
                    placeholder={t.tarot.questionPlaceholder}
                    value={question}
                    onChange={(e) => handleSetQuestion(e.target.value)}
                    disabled={selectedCount === 0 || isPicking}
                  />
                  <div className="input-focus-glow" />
                </div>

                <div className="ritual-action-group">
                  <button
                    type="button"
                    className="btn-reveal-destiny"
                    onClick={handleConfirm}
                    disabled={!canReveal}
                  >
                    <div className="btn-shine-layer" />
                    <span className="btn-content">
                      {busy ? t.tarot.confirmingBtn : (lang === 'vi' ? "Khai Mở Vận Mệnh" : "Reveal Destiny")}
                    </span>
                  </button>
                </div>
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

        <section className="result-section glass-panel">
          <div className="result-header">
            <h3 className="result-title">🌌 {lang === 'vi' ? 'THÔNG ĐIỆP VẬN MỆNH' : 'DESTINY MESSAGE'}</h3>
            <div className="result-actions">
              <button
                className="btn-result-action btn-save-image"
                onClick={handleExportImage}
              >
                📸 {lang === 'vi' ? 'Lưu ảnh quẻ' : 'Save image'}
              </button>
              <button
                className="btn-result-action btn-new-reading"
                onClick={onReset}
              >
                ✨ {lang === 'vi' ? 'Trải bài mới' : 'New reading'}
              </button>
            </div>
          </div>

          {/* 🖼️ Hidden Export Template */}
          <div id="reading-poster-template" className="reading-poster-hidden">
            <div className="poster-inner">
              <div className="poster-header">
                <h2>TAROT TALK</h2>
                <p>{lang === 'vi' ? 'Khám Phá Vận Mệnh' : 'Explore Destiny'} • {new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</p>
              </div>

              <div className="poster-cards">
                {selectedCards.map((card, i) => (
                  <div key={i} className="poster-card-item">
                    <img 
                      src={`/images/tarot/${card.suit}/${card.image}`} 
                      alt={card.name} 
                      onError={(e) => {
                        e.currentTarget.src = "/images/tarot/back.png";
                      }}
                    />
                    <span>{card.name}</span>
                  </div>
                ))}
              </div>

              <div className="poster-divider" />

              <div className="poster-content">
                <h3>{lang === 'vi' ? 'THÔNG ĐIỆP DÀNH CHO BẠN' : 'MESSAGE FOR YOU'}</h3>
                <div className="poster-text">
                  {result ? result.split('\n')[0] : (lang === 'vi' ? "Hãy luôn tin vào trực giác của bản thân..." : "Always trust your intuition...")}
                </div>
              </div>

              <div className="poster-footer">
                <p>{lang === 'vi' ? 'Quẻ bài được luận giải bởi Tarot AI • Kết nối tâm hồn & vũ trụ' : 'Reading by Tarot AI • Connecting soul & universe'}</p>
              </div>
            </div>
          </div>

          <div className="result-glass-container">
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
                      <span className="role-icon">{msg.role === "user" ? "👤" : "🔮"}</span>
                      {msg.role === "user" ? (lang === 'vi' ? "Bạn" : "You") : "Tarot AI"}
                    </div>

                    <div className="tarot-chat-content">
                      {msg.role === "assistant" ? renderTarotAnswer(msg.content) : <p>{msg.content}</p>}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {(conversationId || result) && (
              <div className="tarot-followup-box premium-chat-input">
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="question-input"
                    placeholder={
                      waitingForClarification
                        ? (lang === 'vi' ? "Nhập thêm thông tin để Tarot AI luận giải chính xác hơn..." : "Provide more info for accurate reading...")
                        : t.tarot.chatPlaceholder
                    }
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={followUpBusy}
                  />
                  <div className="input-glow" />

                  <button
                    type="button"
                    className="btn-chat-send"
                    onClick={handleAskFollowUp}
                    disabled={followUpBusy || !followUpInput.trim()}
                  >
                    {followUpBusy ? (
                      <div className="mini-loader" />
                    ) : (
                      `✨ ${t.tarot.sendBtn}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
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