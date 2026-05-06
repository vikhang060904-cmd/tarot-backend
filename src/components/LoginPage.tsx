import { useState, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const API = "http://127.0.0.1:8002";

/* ================================================================
   METEOR CANVAS — sao băng bay cong mượt theo Bezier
================================================================ */

function CosmicDust() {
  return (
    <>
      <div style={dustStyles.dust1} />
      <div style={dustStyles.dust2} />
      <div style={dustStyles.lightBeam} />
      <div style={dustStyles.ring} />
    </>
  );
}
function GalaxyBackground() {
  return (
    <>
      <div style={galaxyStyles.galaxy1} />
      <div style={galaxyStyles.galaxy2} />
      <div style={galaxyStyles.nebula} />
    </>
  );
}
const dustStyles: Record<string, React.CSSProperties> = {

  dust1: {
    position: "absolute",
    inset: "-20%",
    backgroundImage: `
      radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px)
    `,
    backgroundSize: "4px 4px",
    opacity: 0.22,
    filter: "blur(.2px)",
    animation: "dustMove 60s linear infinite",
    zIndex: 1,
    pointerEvents: "none",
  },

  dust2: {
    position: "absolute",
    inset: "-20%",
    backgroundImage: `
      radial-gradient(rgba(192,132,252,.2) 1px, transparent 1px)
    `,
    backgroundSize: "6px 6px",
    opacity: 0.05,
    animation: "dustMoveReverse 90s linear infinite",
    zIndex: 1,
    pointerEvents: "none",
  },

  lightBeam: {
    position: "absolute",
    width: "70%",
    height: "140%",

    left: "-15%",
    top: "-20%",

    background: `
      linear-gradient(
        120deg,
        transparent 0%,
        rgba(168,85,247,.04) 40%,
        rgba(255,255,255,.05) 50%,
        rgba(168,85,247,.04) 60%,
        transparent 100%
      )
    `,

    transform: "rotate(-12deg)",

    filter: "blur(30px)",

    animation: "beamMove 8s ease-in-out infinite alternate",

    zIndex: 1,
    pointerEvents: "none",
  },

  ring: {
    position: "absolute",

    width: "1600px",
    height: "1600px",

    borderRadius: "50%",

    border: "1px solid rgba(168,85,247,.08)",

    left: "50%",
    top: "50%",

    transform: "translate(-50%, -50%)",

    boxShadow: `
      0 0 80px rgba(168,85,247,.08),
      inset 0 0 80px rgba(168,85,247,.05)
    `,

    animation: "ringRotate 120s linear infinite",

    zIndex: 0,
    pointerEvents: "none",
  }
};

function MeteorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
      if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d")!;
    const getW = () => canvasEl.width;
    const getH = () => canvasEl.height;

    const resize = () => {
      const parent = canvasEl.parentElement!;
      canvasEl.width = parent.offsetWidth;
      canvasEl.height = parent.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ---- STARS ---- */
    const STARS = Array.from({ length: 420 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.1 + 0.2,
      base: Math.random() * 0.5 + 0.25,
      sp: Math.random() * 0.8 + 0.3,
      ph: Math.random() * Math.PI * 2,
    }));

    /* ---- DUST PARTICLES ---- */
    class Dust {
      x = 0; y = 0; vx = 0; vy = 0; r = 0; life = 0; maxLife = 0; c = "";
      constructor() { this.reset(true); }
      reset(rand: boolean) {
        this.x = Math.random() * getW();
        this.y = rand ? Math.random() * getH() : getH() + 5;
        this.vy = -(0.3 + Math.random() * 0.9);
        this.vx = (Math.random() - 0.5) * 0.3;
        this.r = 0.8 + Math.random() * 1.2;
        this.life = 0;
        this.maxLife = 200 + Math.random() * 200;
        this.c = Math.random() > 0.5 ? "192,132,252" : "255,220,255";
      }
      update() {
        this.life++; this.x += this.vx; this.y += this.vy;
        if (this.life > this.maxLife || this.y < -10) this.reset(false);
      }
      draw() {
        const t = this.life / this.maxLife;
        const a = t < 0.1 ? t / 0.1 : t > 0.75 ? 1 - (t - 0.75) / 0.25 : 0.5 + Math.random() * 0.3;
        ctx.save();
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = `rgba(${this.c},1)`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${this.c},.7)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* ---- METEOR ---- */
    class Meteor {
      sx = 0; sy = 0; ex = 0; ey = 0; cx = 0; cy = 0;
      len = 0; spd = 0; t = 0; alpha = 0; width = 0;
      life = 0;
      rgb: [number, number, number] = [192, 132, 252];
      sparks: { x: number; y: number; vx: number; vy: number; life: number; r: number }[] = [];

   constructor() {

  // spawn ngay lần đầu
  this.init();
}

      init() {
        
        const W =getW(), H = getH();
        this.sx = Math.random() * W;
        this.sy = Math.random() * H * 0.35;
        const angle =
  (-8 - Math.random() * 12) * Math.PI / 180;
        const dist = W * (0.35 + Math.random() * 0.25);
        this.ex = this.sx + dist * Math.cos(angle);
        this.ey = this.sy + dist * Math.sin(angle);
        const mx = (this.sx + this.ex) * 0.5;
        const my = (this.sy + this.ey) * 0.5;
        this.cx = mx + (Math.random() - 0.5) * H * 0.12;
        this.cy = my + Math.random() * H * 0.06;
        this.len = 0.22 + Math.random() * 0.2;
this.spd = 0.0011 + Math.random() * 0.0008;
        
        
        this.width = 1.5 + Math.random() * 1.8;
        this.t = 0;
this.alpha = 0;
        this.rgb = Math.random() > 0.5 ? [192, 132, 252] : [220, 120, 240];
        this.sparks = [];
      }

      bezier(t: number) {
        const mt = 1 - t;
        return {
          x: mt * mt * this.sx + 2 * mt * t * this.cx + t * t * this.ex,
          y: mt * mt * this.sy + 2 * mt * t * this.cy + t * t * this.ey,
        };
      }

      update(dt: number) {
  
     this.t += this.spd * dt;
        const head = this.t;
        if (head < 0.1) this.alpha = head / 0.1;
        else if (head > 0.85) this.alpha = Math.max(0, 1 - (head - 0.85) / 0.15);
        else this.alpha = 1;

        if (Math.random() < 0.25 && this.t > 0 && this.t < 1) {
          const sp = this.bezier(Math.max(0, this.t - Math.random() * this.len));
          this.sparks.push({ x: sp.x + (Math.random() - 0.5) * 3, y: sp.y + (Math.random() - 0.5) * 3, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.15) * 0.5, life: 1, r: 0.8 + Math.random() });
        }
        this.sparks = this.sparks.filter(s => s.life > 0);
        this.sparks.forEach(s => { s.x += s.vx; s.y += s.vy; s.life -= 0.04; });
        if (this.t > 1 + this.len) {
  this.init();
}
   }

      draw() {
        
        const [r, g, b] = this.rgb;
        const SEGS = 40;
        const tHead = Math.min(1, this.t);
        const tTail = Math.max(0, this.t - this.len);
        if (tHead <= tTail) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.globalCompositeOperation = "screen";

        for (let i = 0; i < SEGS; i++) {
          const ta = tTail + (tHead - tTail) * (i / SEGS);
          const tb = tTail + (tHead - tTail) * ((i + 1) / SEGS);
          const pa = this.bezier(ta), pb = this.bezier(tb);
          const frac = (i + 1) / SEGS;
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle =
  `rgba(${r},${g},${b},${Math.pow(frac, 1.8) * 0.65})`;
          ctx.shadowBlur = 22;
          ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
          ctx.lineWidth =
  this.width *
  (0.05 + frac * 0.45);
          ctx.lineCap = "round"; ctx.stroke();
        }
        for (let i = SEGS / 2; i < SEGS; i++) {
          const ta = tTail + (tHead - tTail) * (i / SEGS);
          const tb = tTail + (tHead - tTail) * ((i + 1) / SEGS);
          const pa = this.bezier(ta), pb = this.bezier(tb);
          const frac = (i + 1) / SEGS;
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = `rgba(255,255,255,${Math.pow(frac, 3) * 0.55})`;
          ctx.lineWidth = this.width * frac * 0.3; ctx.stroke();
        }

        if (tHead < 1) {
          const hp = this.bezier(tHead);
          ctx.globalCompositeOperation = "lighter";
          const grd = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 14);
          grd.addColorStop(0, "rgba(255,255,255,0.9)");
          grd.addColorStop(0.25, `rgba(${r},${g},${b},0.28)`);
          grd.addColorStop(0.6, `rgba(${r},${g},${b},0.2)`);
          grd.addColorStop(1, "transparent");
          ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(hp.x, hp.y, 12, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.beginPath(); ctx.arc(hp.x, hp.y, 2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.globalCompositeOperation = "source-over";
        this.sparks.forEach(s => {
          ctx.globalAlpha = this.alpha * s.life * 0.7;
          ctx.fillStyle = `rgba(${r},${g},${b},1)`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
      }
    }

const meteors: Meteor[] = [];

// tạo sẵn nhiều meteor
for (let i = 0; i < 4; i++) {
  const meteor = new Meteor();

  // delay khác nhau để không bay cùng lúc
  meteor.t = -i * 0.4;

  meteors.push(meteor);
}

    const dusts = Array.from({ length: 35 }, () => new Dust());
    let ritualAngle = 0;
    let last = performance.now();
    let rafId: number;

    const drawRitual = () => {
      const W = canvasEl.width, H = canvasEl.height;
      const cx = W / 2, cy = H / 2;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "rgba(216,180,254,1)";
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(cx, cy, 200, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([3, 9]);
      ctx.beginPath(); ctx.arc(cx, cy, 182, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, 158, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.13;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
        const nx = cx + 185 * Math.cos(a), ny = cy + 185 * Math.sin(a);
        i === 0 ? ctx.moveTo(nx, ny) : ctx.lineTo(nx, ny);
      }
      ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const r1 = 200, r2 = i % 5 === 0 ? 190 : 195;
        ctx.lineWidth = i % 5 === 0 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
        ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a));
        ctx.stroke();
      }
      ctx.restore();
    };

    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const W = canvasEl.width, H = canvasEl.height;
      ctx.clearRect(0, 0, W, H);

const fade = ctx.createLinearGradient(0, 0, 0, H);

fade.addColorStop(0, "rgba(2,0,10,0.06)");
fade.addColorStop(1, "rgba(2,0,10,0.03)");

ctx.fillStyle = fade;
ctx.fillRect(0, 0, W, H);

      const t = now * 0.001;
      STARS.forEach(s => {
        const a = s.base * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
        ctx.save(); ctx.globalAlpha = a;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      ritualAngle += 0.0002 * dt;
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.rotate(ritualAngle); ctx.translate(-W / 2, -H / 2);
      drawRitual();
      ctx.restore();

      dusts.forEach(d => { d.update(); d.draw(); });
   

// spawn meteor mới liên tục


meteors.forEach((m) => {
  m.update(dt);
  m.draw();
});
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
     
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
    />
  );
}

/* ================================================================
   LOGIN PAGE
================================================================ */
export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---- LOGIN ---- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("⚠️ Vui lòng nhập đầy đủ"); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error("Server trả về không phải JSON"); }
      if (!res.ok) throw new Error(data?.detail || "❌ Sai tài khoản hoặc mật khẩu");
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);
      onLogin(data.email);
    } catch (err: any) {
      setError(err.message || "❌ Lỗi hệ thống");
    } finally { setLoading(false); }
  };

  /* ---- SIGNUP ---- */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !passwordConfirm) { setError("⚠️ Nhập đầy đủ thông tin"); return; }
    if (password !== passwordConfirm) { setError("❌ Mật khẩu không khớp"); return; }
    if (password.length < 6) { setError("❌ Mật khẩu phải >= 6 ký tự"); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Signup failed");
      alert("🎉 Tạo tài khoản thành công!");
      setIsSignup(false);
      setPassword("");
      setPasswordConfirm("");
    } catch (err: any) {
      setError(err.message || "❌ Không tạo được tài khoản");
    } finally { setLoading(false); }
  };

  /* ---- GOOGLE LOGIN ---- */
  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/api/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Google Login Failed");
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);
      onLogin(data.email);
    } catch (err: any) {
      setError(err.message || "Google Login Error");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>

      {/* ===== MAGIC ORBS ===== */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />
      <div style={{ ...styles.orb, ...styles.orb3 }} />

      {/* ===== METEOR CANVAS ===== */}
      <GalaxyBackground />
<CosmicDust />
<MeteorCanvas />

      {/* ===== RITUAL RING (CSS) ===== */}
      <div style={styles.ritualRing} />

      {/* ===== LOGIN CARD ===== */}
      <div style={styles.card}>
       
        {/* Inner border */}
        <div style={styles.cardInnerBorder} />

        {/* Symbol */}
        <div style={styles.symbol}>☽ ✦ ☾</div>

        {/* Title */}
        <h2 style={styles.title}>
          {isSignup ? "Đăng ký" : "Đăng nhập"}
        </h2>

        {/* Subtitle */}
        <p style={styles.subtitle}>Khám phá vận mệnh của bạn</p>

        {/* Error */}
        {error && <p style={styles.error}>{error}</p>}

        {/* Form */}
        <form onSubmit={isSignup ? handleSignup : handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="📧 Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            onFocus={e => Object.assign(e.currentTarget.style, styles.inputFocus)}
            onBlur={e => Object.assign(e.currentTarget.style, styles.input)}
          />
          <input
            type="password"
            placeholder="🔑 Mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            onFocus={e => Object.assign(e.currentTarget.style, styles.inputFocus)}
            onBlur={e => Object.assign(e.currentTarget.style, styles.input)}
          />
          {isSignup && (
            <input
              type="password"
              placeholder="🔁 Nhập lại mật khẩu"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              style={styles.input}
              onFocus={e => Object.assign(e.currentTarget.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.currentTarget.style, styles.input)}
            />
          )}
          <button
            type="submit"
            disabled={loading}
            style={styles.button}
            onMouseEnter={e => Object.assign(e.currentTarget.style, styles.buttonHover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, styles.button)}
          >
            {loading ? "⏳ Đang xử lý..." : isSignup ? "Bắt đầu hành trình" : "Tiến vào Tarot"}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>hoặc</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google */}
        <div style={styles.googleWrap}>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError("❌ Google Login Failed")}
          />
        </div>

        {/* Switch */}
        <p style={styles.switchText}>
          {isSignup ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <span
            style={styles.switchLink}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Đăng nhập" : "Đăng ký"}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   STYLES
================================================================ */
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: `
      radial-gradient(circle at top left, rgba(91,33,182,.22), transparent 28%),
      radial-gradient(circle at bottom right, rgba(190,24,93,.16), transparent 32%),
      linear-gradient(135deg, #020106 0%, #05010f 35%, #0b0218 65%, #14051f 100%)
    `,
  },

  orb: {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 1,
  },
  orb1: {
    width: 280, height: 280,
    background: "radial-gradient(circle, rgba(124,58,237,.55), rgba(91,33,182,.15) 65%, transparent)",
    top: "-60px", left: "-60px",
    animation: "orbFloat1 13s ease-in-out infinite",
  },
  orb2: {
    width: 380, height: 380,
    background: "radial-gradient(circle, rgba(219,39,119,.45), rgba(190,24,93,.12) 65%, transparent)",
    bottom: "-100px", right: "-60px",
    animation: "orbFloat2 16s ease-in-out infinite",
  },
  orb3: {
    width: 220, height: 220,
    background: "radial-gradient(circle, rgba(167,139,250,.4), rgba(139,92,246,.1) 65%, transparent)",
    top: "32%", left: "56%",
    animation: "orbFloat1 9s ease-in-out infinite reverse",
  },

  ritualRing: {
    position: "absolute",
    width: 480, height: 480,
    borderRadius: "50%",
    border: "1px solid rgba(216,180,254,.22)",
    top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    zIndex: 1,
    pointerEvents: "none",
    opacity: 0.3,
    animation: "slowSpin 80s linear infinite",
  },

  card: {
    animation: "cardPulse 6s ease-in-out infinite",
    position: "relative",
    width: 460,
    maxWidth: "92vw",
    padding: "52px 46px",
    borderRadius: 34,
    overflow: "hidden",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    background: "linear-gradient(145deg, rgba(10,5,20,.85), rgba(5,2,14,.96))",
    border: "1px solid rgba(255,255,255,.05)",
    boxShadow: "0 0 0 1px rgba(255,255,255,.03), 0 24px 80px rgba(0,0,0,.8), 0 0 120px rgba(124,58,237,.14)",
    zIndex: 10,
  },
  cardInnerBorder: {
    position: "absolute",
    inset: 12,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,.05)",
    pointerEvents: "none",
  },

  symbol: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 20,
    letterSpacing: 12,
    color: "rgba(216,180,254,.85)",
    textShadow: "0 0 18px rgba(192,132,252,.7)",
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 48,
    lineHeight: 1,
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: "#f5e9ff",
    textShadow: "0 0 14px rgba(192,132,252,.4), 0 0 50px rgba(124,58,237,.22)",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 28,
    color: "rgba(255,255,255,.42)",
    fontSize: 12,
    letterSpacing: 5,
    textTransform: "uppercase",
  },
  error: {
    marginBottom: 14,
    textAlign: "center",
    color: "#ff6b81",
    fontSize: 14,
  },

  form: { display: "flex", flexDirection: "column" },
  input: {
    width: "100%",
    padding: "16px 18px",
    marginBottom: 16,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.06)",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    transition: "all .3s",
  },
  inputFocus: {
    width: "100%",
    padding: "16px 18px",
    marginBottom: 16,
    borderRadius: 16,
    border: "1px solid rgba(192,132,252,.55)",
    background: "rgba(255,255,255,.09)",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxShadow: "0 0 22px rgba(168,85,247,.28)",
  },
  button: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#fff",
    background: "linear-gradient(135deg, #5b21b6, #7c3aed, #be185d)",
    boxShadow: "0 10px 30px rgba(124,58,237,.35)",
    transition: "all .3s",
    transform: "translateY(0)",
  },
  buttonHover: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#fff",
    background: "linear-gradient(135deg, #5b21b6, #7c3aed, #be185d)",
    boxShadow: "0 16px 42px rgba(168,85,247,.5)",
    transform: "translateY(-3px) scale(1.02)",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    margin: "22px 0",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent)",
  },
  dividerText: {
    color: "rgba(255,255,255,.38)",
    fontSize: 12,
    letterSpacing: 3,
    whiteSpace: "nowrap",
  },

  googleWrap: { display: "flex", justifyContent: "center" },

  switchText: {
    marginTop: 18,
    textAlign: "center",
    color: "#b9b3c9",
    fontSize: 14,
  },
  switchLink: {
    color: "#d8b4fe",
    cursor: "pointer",
    fontWeight: 700,
  },
};

const galaxyStyles: Record<string, React.CSSProperties> = {
  aurora: {
  position: "absolute",
  inset: "-30%",
  background: `
    conic-gradient(
      from 180deg,
      rgba(124,58,237,.12),
      rgba(236,72,153,.08),
      rgba(59,130,246,.08),
      rgba(124,58,237,.12)
    )
  `,
  filter: "blur(120px)",
  animation: "auroraMove 18s ease-in-out infinite alternate",
  mixBlendMode: "screen",
  zIndex: 0,
  pointerEvents: "none",
},

  galaxy1: {
    position: "absolute",
    width: "1200px",
    height: "1200px",
    borderRadius: "50%",
    left: "-25%",
    top: "-35%",
    background: `
radial-gradient(circle at 20% 20%, rgba(124,58,237,.18), transparent 22%),
radial-gradient(circle at 80% 70%, rgba(236,72,153,.14), transparent 28%),
radial-gradient(circle at 50% 50%, rgba(91,33,182,.12), transparent 45%),
linear-gradient(
  135deg,
  #010104 0%,
  #05010f 25%,
  #090014 55%,
  #14051f 100%
)
`,
    filter: "blur(40px)",
    mixBlendMode: "screen",
    animation: "galaxyRotate 35s linear infinite",
    zIndex: 0,
    pointerEvents: "none",
  },

  galaxy2: {
    position: "absolute",
    width: "1000px",
    height: "1000px",
    borderRadius: "50%",
    right: "-20%",
    bottom: "-30%",
    background: `
      radial-gradient(circle,
      rgba(236,72,153,.16) 0%,
      rgba(168,85,247,.08) 30%,
      transparent 75%)
    `,
    filter: "blur(60px)",
    mixBlendMode: "screen",
    animation: "galaxyRotateReverse 120s linear infinite",
    zIndex: 0,
    pointerEvents: "none",
  },

  nebula: {
    position: "absolute",
    inset: "-20%",
    background: `
      radial-gradient(circle at 30% 40%,
      rgba(168,85,247,.08),
      transparent 35%),

      radial-gradient(circle at 70% 60%,
      rgba(236,72,153,.08),
      transparent 35%)
    `,
    filter: "blur(70px)",
    animation: "nebulaMove 20s ease-in-out infinite alternate",
    zIndex: 0,
    pointerEvents: "none",
  }
};
/* ================================================================
   KEYFRAMES — inject vào <head> một lần
================================================================ */
if (typeof document !== "undefined" && !document.getElementById("tarot-keyframes")) {
  const style = document.createElement("style");
  style.id = "tarot-keyframes";
  style.textContent = `
  @keyframes cardPulse {

  0%,100%{
    box-shadow:
      0 0 0 1px rgba(255,255,255,.03),
      0 24px 80px rgba(0,0,0,.8),
      0 0 120px rgba(124,58,237,.14);
  }

  50%{
    box-shadow:
      0 0 0 1px rgba(255,255,255,.05),
      0 24px 120px rgba(168,85,247,.22),
      0 0 180px rgba(236,72,153,.18);
  }
}
  @keyframes dustMove {
  from {
    transform: translateY(0px);
  }

  to {
    transform: translateY(-200px);
  }
}

@keyframes dustMoveReverse {
  from {
    transform: translateY(-100px);
  }

  to {
    transform: translateY(100px);
  }
}

@keyframes beamMove {

  0% {
    opacity: .3;
    transform:
      rotate(-12deg)
      translateX(-40px);
  }

  100% {
    opacity: .8;
    transform:
      rotate(-12deg)
      translateX(40px);
  }
}

@keyframes ringRotate {
  from {
    transform:
      translate(-50%, -50%)
      rotate(0deg);
  }

  to {
    transform:
      translate(-50%, -50%)
      rotate(360deg);
  }
}
  @keyframes galaxyRotate {
  from {
    transform: rotate(0deg) scale(1);
  }
  to {
    transform: rotate(360deg) scale(1.15);
  }
}

@keyframes galaxyRotateReverse {
  from {
    transform: rotate(360deg) scale(1);
  }
  to {
    transform: rotate(0deg) scale(1.2);
  }
}

@keyframes nebulaMove {
  0% {
    transform: translate(-2%, -2%) scale(1);
  }

  100% {
    transform: translate(2%, 2%) scale(1.08);
  }
}
    @keyframes orbFloat1 {
      0%,100% { transform: translate(0,0); }
      40% { transform: translate(18px,-28px); }
      70% { transform: translate(-10px,14px); }
    }
    @keyframes orbFloat2 {
      0%,100% { transform: translate(0,0); }
      35% { transform: translate(-20px,-35px); }
      65% { transform: translate(12px,18px); }
    }
    @keyframes slowSpin {
      from { transform: translate(-50%,-50%) rotate(0deg); }
      to   { transform: translate(-50%,-50%) rotate(360deg); }
    }
    input::placeholder { color: rgba(255,255,255,.42); }
  `;
  document.head.appendChild(style);
  
}
