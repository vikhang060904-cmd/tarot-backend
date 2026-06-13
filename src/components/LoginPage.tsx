import { useState, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLang } from "../i18n/LanguageContext";

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const API = "";

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
          ctx.beginPath();
          const radius = Math.max(0, s.r * s.life);
          ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
          ctx.fill();
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
      className="cosmic-canvas"
      style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
    />
  );
}

/* ================================================================
   LOGIN PAGE
================================================================ */
export default function LoginPage({ onLogin }: LoginPageProps) {
  const isMobileApp = /TarotTalkApp/i.test(navigator.userAgent) || document.cookie.indexOf("viewappmobie=true") !== -1;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, lang } = useLang();

  /* ---- LOGIN ---- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError(lang === 'vi' ? "⚠️ Vui lòng nhập đầy đủ" : "⚠️ Please fill in all fields"); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error(lang === 'vi' ? "Server trả về không phải JSON" : "Server returned invalid data"); }
      if (!res.ok) throw new Error(data?.detail || (lang === 'vi' ? "❌ Sai tài khoản hoặc mật khẩu" : "❌ Wrong email or password"));
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);
      onLogin(data.email);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally { setLoading(false); }
  };

  /* ---- SIGNUP ---- */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !passwordConfirm) { setError(lang === 'vi' ? "⚠️ Nhập đầy đủ thông tin" : "⚠️ Please fill in all fields"); return; }
    if (password !== passwordConfirm) { setError(lang === 'vi' ? "❌ Mật khẩu không khớp" : "❌ Passwords don't match"); return; }
    if (password.length < 6) { setError(lang === 'vi' ? "❌ Mật khẩu phải >= 6 ký tự" : "❌ Password must be at least 6 characters"); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Signup failed");
      alert(lang === 'vi' ? "🎉 Tạo tài khoản thành công!" : "🎉 Account created successfully!");
      setIsSignup(false);
      setPassword("");
      setPasswordConfirm("");
    } catch (err: any) {
      setError(err.message || (lang === 'vi' ? "❌ Không tạo được tài khoản" : "❌ Could not create account"));
    } finally { setLoading(false); }
  };

  /* ---- GOOGLE LOGIN via Redirect (mobile-friendly) ---- */
  const GOOGLE_CLIENT_ID = "26506370221-ucrnjduq50naerlghgukbqtp1vatee9j.apps.googleusercontent.com";

  // Xử lý callback khi Google redirect về với access_token trong URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;

    const hashParams = new URLSearchParams(hash.replace("#", ""));
    const accessToken = hashParams.get("access_token");
    if (!accessToken) return;

    // Xóa hash khỏi URL ngay
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    setLoading(true);
    setError("");

    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(async userInfo => {
        if (!userInfo.email) throw new Error("Không lấy được email từ Google");
        const res = await fetch(`${API}/api/google-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userInfo.email, name: userInfo.name || "" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Google Login Failed");
        localStorage.setItem("email", data.email);
        localStorage.setItem("role", data.role);
        onLogin(data.email);
      })
      .catch(err => setError(err.message || "Google Login Error"))
      .finally(() => setLoading(false));
  }, []);

  const handleGoogleRedirect = () => {
    // Nếu là WebView của App Flutter, gọi bridge thay vì redirect
    if (isMobileApp && window.FlutterBridge) {
      window.FlutterBridge.postMessage('GOOGLE_LOGIN:' + Date.now().toString());
      return;
    }

    // Dùng window.location.origin sẽ lấy đúng URL đang chạy, dù bạn đổi ngrok.
    const redirectUri = window.location.origin;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "email profile",
      prompt: "select_account",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div style={styles.container}>

      {/* ===== MAGIC ORBS (Hidden on mobile for performance) ===== */}
      {!isMobile && (
        <>
          <div style={{ ...styles.orb, ...styles.orb1 }} />
          <div style={{ ...styles.orb, ...styles.orb2 }} />
          <div style={{ ...styles.orb, ...styles.orb3 }} />
        </>
      )}

      {/* ===== METEOR CANVAS ===== */}
      {!isMobile && (
        <>
          <GalaxyBackground />
          <CosmicDust />
          <MeteorCanvas />
        </>
      )}

      {/* ===== RITUAL RING (CSS) ===== */}
      {!isMobile && <div style={styles.ritualRing} />}

      {/* ===== LOGIN CARD ===== */}
      <div style={styles.card}>
       
        {/* Inner border */}
        <div style={styles.cardInnerBorder} />

        {/* Symbol */}
        <div style={styles.symbol}>☽ ✦ ☾</div>

        {/* Title */}
        <h2 style={styles.title}>
          {isSignup ? t.login.submitRegister : t.login.submitLogin}
        </h2>

        {/* Subtitle */}
        <p style={styles.subtitle}>{t.login.subtitle}</p>

        {/* Error */}
        {error && <p style={styles.error}>{error}</p>}

        {/* Form */}
        <form onSubmit={isSignup ? handleSignup : handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder={`📧 ${t.login.emailLabel}`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            onFocus={e => Object.assign(e.currentTarget.style, styles.inputFocus)}
            onBlur={e => Object.assign(e.currentTarget.style, styles.input)}
          />
          <input
            type="password"
            placeholder={`🔑 ${t.login.passwordLabel}`}
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            onFocus={e => Object.assign(e.currentTarget.style, styles.inputFocus)}
            onBlur={e => Object.assign(e.currentTarget.style, styles.input)}
          />
          {isSignup && (
            <input
              type="password"
              placeholder={`🔁 ${lang === 'vi' ? 'Nhập lại mật khẩu' : 'Confirm password'}`}
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
            {loading ? t.login.loading : isSignup ? (lang === 'vi' ? "Bắt đầu hành trình" : "Start journey") : (lang === 'vi' ? "Tiến vào Tarot" : "Enter Tarot")}
          </button>
        </form>

        {/* Divider */}
        {!isMobileApp && (
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>{lang === 'vi' ? 'hoặc' : 'or'}</span>
            <div style={styles.dividerLine} />
          </div>
        )}

        {/* Google */}
        <div style={styles.googleWrap}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleGoogleRedirect();
              }}
              style={{
                ...styles.googleBtn,
                textDecoration: "none",
                pointerEvents: loading ? "none" : "auto",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>{lang === 'vi' ? 'Đăng nhập bằng Google' : 'Sign in with Google'}</span>
            </a>
          </div>

        {/* Switch */}
        <p style={styles.switchText}>
          {isSignup ? (lang === 'vi' ? 'Đã có tài khoản? ' : 'Already have an account? ') : (lang === 'vi' ? 'Chưa có tài khoản? ' : 'No account? ')}
          <span
            style={styles.switchLink}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? t.login.submitLogin : t.login.submitRegister}
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
  googleBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "13px 24px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.07)",
    color: "#f0e6ff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "0.25s",
    width: "100%",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
  },
  googleBtnHover: {
    background: "rgba(255, 255, 255, 0.12)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
  },

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
