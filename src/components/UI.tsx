import { useState, memo, useRef } from "react";
import "./UI.css";
import "./SidebarPro.css";
import TarotPage from "./TarotPage";
import EnergyPage from "./EnergyPage";
import ProfilePage from "./ProfilePage";
import TarotHistoryPage from "./TarotHistoryPage";
import { SPREAD_TYPES } from "../constants/spreads";
import TemplateLibrary from "./TemplateLibrary";
import SidebarAudioControls from "./SidebarAudioControls";
import { useLang } from "../i18n/LanguageContext";

const API = import.meta.env.VITE_API_URL || "";

interface Card {
  name: string;
  suit: string;
  image: string;
  index?: number;
}

interface User {
  email: string;
}

interface TarotChatMessage {
  role: "user" | "assistant";
  content: string;
}

type PageName = "tarot" | "energy" | "history" | "profile";

interface UIProps {
  isLoggedIn: boolean;
  currentPage: PageName;
  onPageChange: (page: PageName) => void;
  user: User | null;
  onLogout: () => void;
  busy: boolean;
  allCards: Card[];
  selectedCards: Card[];
  result: string;
  question: string;
  currentTopic: string;
  onDealAll: () => Promise<Card[]>;
  onSelectCard: (card: Card) => void;
  onConfirm: (topicOverride?: string) => void;
  onSetQuestion: (q: string) => void;
  onSetTopic: (topic: string) => void;
  tokens: number;
  onPaymentSuccess: (addedTokens: number) => void;
  tarotMessages: TarotChatMessage[];
  onAskTarotFollowUp: (message: string) => Promise<void> | void;
  followUpBusy: boolean;
  conversationId: string;
  waitingForClarification: boolean;
  dealMode: "random" | "fixed" | "seeded" | "custom" | "bysuit";
  onSetDealMode: (mode: "random" | "fixed" | "seeded" | "custom" | "bysuit") => void;
  dealSuit: string;
  onSetDealSuit: (suit: string) => void;
  maxSelectable: number;
  dealSeed: number;
  onSetDealSeed: (seed: number) => void;
  dealCount: number;
  onSetDealCount: (count: number) => void;
  spreadType: string;
  onSetSpreadType: (id: string) => void;
  deckArrangement: "fan" | "arc" | "rows" | "spiral" | "infinity" | "waves" | "chaos" | "orbit";
  onSetDeckArrangement: (style: "fan" | "arc" | "rows" | "spiral" | "infinity" | "waves" | "chaos" | "orbit") => void;
  onReset: () => void;
  birthDate: string;
  onSetBirthDate: (v: string) => void;
}


const UI = memo(({
  isLoggedIn,
  currentPage,
  onPageChange,
  user,
  onLogout,
  busy,
  allCards,
  selectedCards,
  result,
  question,
  currentTopic,
  onDealAll,
  onSelectCard,
  onConfirm,
  onSetQuestion,
  onSetTopic,
  tokens,
  onPaymentSuccess,
  tarotMessages,
  onAskTarotFollowUp,
  followUpBusy,
  conversationId,
  waitingForClarification,
  maxSelectable,
  spreadType,
  onSetSpreadType,
  deckArrangement,
  onSetDeckArrangement,
  onReset,
  birthDate,
  onSetBirthDate,
}: UIProps) => {
  const { t, lang, toggleLang } = useLang();
  const [showGuide, setShowGuide] = useState(false);
  // Sidebar mặc định mở trên desktop, đóng trên mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 769);
  const userName = user?.email?.split("@")[0] || (lang === "vi" ? "Người Dùng" : "User");
  const isAdmin = localStorage.getItem("role") === "admin";
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // ── ADMIN MODAL STATE ──
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const adminEmailRef = useRef<HTMLInputElement>(null);
  const adminPassRef = useRef<HTMLInputElement>(null);

  const handleAdminClick = () => {
    setAdminEmail("");
    setAdminPass("");
    setAdminError("");
    setShowAdminModal(true);
    setTimeout(() => adminEmailRef.current?.focus(), 80);
  };


  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPass.trim()) { setAdminError(t.adminModal.errorEmpty); return; }
    try {
      setAdminLoading(true);
      setAdminError("");
      const email = adminEmail.trim();
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: adminPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || t.adminModal.errorDefault);
      if (data.role !== "admin") throw new Error(t.adminModal.errorNoAccess);
      // Cấp quyền admin và lưu email
      localStorage.setItem("email", adminEmail.trim());
      localStorage.setItem("role", "admin");
      setShowAdminModal(false);
      window.location.href = "/admin";
    } catch (err: any) {
      setAdminError(err.message || t.adminModal.errorDefault);
    } finally {
      setAdminLoading(false);
    }
  };

  const activeSpread = SPREAD_TYPES.find(s => s.id === spreadType);

  const menuItems: Array<{ key: PageName; icon: string; label: string }> = [
    { key: "tarot",   icon: "✨", label: t.sidebar.nav.tarot },
    { key: "energy",  icon: "💎", label: t.sidebar.nav.energy },
    { key: "history", icon: "📔", label: t.sidebar.nav.history },
    { key: "profile", icon: "⚛️", label: t.sidebar.nav.profile },
  ];

  return (
    <div className={`ui-container ${sidebarOpen ? '' : 'sidebar-collapsed-layout'} ${sidebarOpen ? 'sidebar-open' : ''}`}>

      {/* ── FLOATING TOGGLE BUTTON ── */}
      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
        title={sidebarOpen ? t.sidebar.closeMenu : t.sidebar.openMenu}
        aria-label={sidebarOpen ? t.sidebar.closeMenu : t.sidebar.openMenu}
      >
        <span className="sidebar-toggle-icon">
          {sidebarOpen ? '✕' : '☰'}
        </span>
      </button>

      {/* ── BACKDROP (mobile / overlay) ── */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {/* Animated star field */}
        <div className="sidebar-stars" aria-hidden="true" />

        {/* ── LOGO ── */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="sidebar-logo-gem">🔮</div>
            <div className="logo-text">
              <h2>TAROT TALK</h2>
              <p>MYSTIC READING</p>
            </div>
          </div>
          <div className="sidebar-logo-divider" />
        </div>

        {/* ── MAIN NAV ── */}
        <nav className="sidebar-menu" aria-label="Điều hướng chính">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              id={`nav-${item.key}`}
              className={`menu-item ${currentPage === item.key ? "active" : ""}`}
              onClick={() => onPageChange(item.key)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ── SETTINGS SECTION ── */}
        <div className="sidebar-settings">
          <button
            type="button"
            className="menu-item sidebar-settings-btn"
            onClick={() => setShowGuide(true)}
          >
            <span className="menu-icon">⚙️</span>
            <span className="menu-label">{t.sidebar.settings}</span>
            <span className="sidebar-settings-badge">{activeSpread?.name || (lang === 'vi' ? 'Chọn' : 'Select')}</span>
          </button>

          {/* Admin Button — luôn hiển thị, bấm vào sẽ xác thực mật khẩu */}
          <button
            type="button"
            className="menu-item sidebar-btn-admin"
            onClick={handleAdminClick}
            style={{ width: '100%' }}
          >
            <span className="menu-icon">🧙‍♂️</span>
            <span className="menu-label" style={{ fontWeight: 700 }}>
              {isAdmin ? t.sidebar.adminPage : t.sidebar.adminLogin}
            </span>
          </button>
        </div>

        {/* ── SIDEBAR QUICK CONTROLS ── */}
        <div className="sidebar-quick-controls">
          <SidebarAudioControls />

          {/* ── LANGUAGE TOGGLE ── */}
          <button
            type="button"
            className="lang-toggle-btn"
            onClick={toggleLang}
            title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            aria-label={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <span className="lang-toggle-flags">
              <span className={`lang-flag ${lang === 'vi' ? 'lang-flag-active' : ''}`}>🇻🇳</span>
              <span className="lang-toggle-divider">|</span>
              <span className={`lang-flag ${lang === 'en' ? 'lang-flag-active' : ''}`}>🇬🇧</span>
            </span>
            <span className="lang-toggle-label">
              {lang === 'vi' ? 'Tiếng Việt' : 'English'}
            </span>
            <span className="lang-toggle-arrow">⇄</span>
          </button>
        </div>

        {/* ── USER FOOTER ── */}
        <div
          className="sidebar-user"
          role="button"
          tabIndex={0}
          onClick={() => onPageChange("profile")}
          onKeyDown={(e) => e.key === 'Enter' && onPageChange("profile")}
        >
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-tokens">✦ {tokens} {t.sidebar.tokens}</div>
          </div>
          <button
            type="button"
            className="btn-logout"
            title={t.profile.logout}
            aria-label={t.profile.logout}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLogout(); }}
          >
            <span>⏻</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        {currentPage === "tarot" && (
          <TarotPage
            isLoggedIn={isLoggedIn}
            busy={busy}
            allCards={allCards}
            selectedCards={selectedCards}
            result={result}
            question={question}
            currentTopic={currentTopic}
            onDealAll={onDealAll}
            onSelectCard={onSelectCard}
            onConfirm={onConfirm}
            onSetQuestion={onSetQuestion}
            onSetTopic={onSetTopic}
            onLogout={onLogout}
            tarotMessages={tarotMessages}
            onAskTarotFollowUp={onAskTarotFollowUp}
            followUpBusy={followUpBusy}
            conversationId={conversationId}
            waitingForClarification={waitingForClarification}
            maxSelectable={maxSelectable}
            spreadType={spreadType}
            deckArrangement={deckArrangement}
            onSetDeckArrangement={onSetDeckArrangement}
            onReset={onReset}
            birthDate={birthDate}
            onSetBirthDate={onSetBirthDate}
          />
        )}
        {currentPage === "energy" && (
          <EnergyPage currentTokens={tokens} userEmail={user?.email || ""} onPaymentSuccess={onPaymentSuccess} />
        )}
        {currentPage === "history" && user && (
          <TarotHistoryPage userEmail={user.email} />
        )}
        {currentPage === "profile" && (
          <ProfilePage userEmail={user?.email || ""} currentTokens={tokens} onLogout={onLogout} />
        )}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav" aria-label="Điều hướng mobile">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${currentPage === item.key ? "active" : ""}`}
            onClick={() => onPageChange(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── TEMPLATE LIBRARY MODAL ── */}
      <TemplateLibrary
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        onSelect={(id) => { onSetSpreadType(id); setShowGuide(false); }}
      />

      {/* ── ADMIN PASSWORD MODAL ── */}
      {showAdminModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setShowAdminModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 380, maxWidth: "92vw",
              background: "linear-gradient(145deg, #0d0520, #1a0835)",
              border: "1px solid rgba(216,180,254,0.2)",
              borderRadius: 24,
              padding: "36px 32px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 80px rgba(124,58,237,0.2)",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🧙‍♂️</div>
              <h3 style={{
                margin: 0, fontSize: 20, fontWeight: 700,
                color: "#f5e9ff", letterSpacing: 1,
              }}>{t.adminModal.title}</h3>
              <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                {t.adminModal.subtitle}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAdminSubmit}>
              <input
                ref={adminEmailRef}
                type="email"
                placeholder={t.adminModal.placeholderEmail || "Email"}
                value={adminEmail}
                onChange={(e) => { setAdminEmail(e.target.value); setAdminError(""); }}
                style={{
                  width: "100%", padding: "14px 16px",
                  borderRadius: 14, marginBottom: 8,
                  border: adminError
                    ? "1px solid rgba(239,68,68,0.7)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.07)",
                  color: "#fff", fontSize: 15, outline: "none",
                  boxSizing: "border-box",
                }}
                autoComplete="email"
              />
              <input
                ref={adminPassRef}
                type="password"
                placeholder={t.adminModal.placeholder}
                value={adminPass}
                onChange={(e) => { setAdminPass(e.target.value); setAdminError(""); }}
                style={{
                  width: "100%", padding: "14px 16px",
                  borderRadius: 14, marginBottom: 12,
                  border: adminError
                    ? "1px solid rgba(239,68,68,0.7)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.07)",
                  color: "#fff", fontSize: 15, outline: "none",
                  boxSizing: "border-box",
                }}
                autoComplete="current-password"
              />

              {adminError && (
                <p style={{
                  color: "#ff6b81", fontSize: 13,
                  textAlign: "center", margin: "0 0 12px",
                }}>{adminError}</p>
              )}

              <button
                type="submit"
                disabled={adminLoading}
                style={{
                  width: "100%", padding: "14px",
                  borderRadius: 14, border: "none",
                  background: adminLoading
                    ? "rgba(124,58,237,0.4)"
                    : "linear-gradient(135deg, #5b21b6, #7c3aed)",
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: adminLoading ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
                }}
              >
                {adminLoading ? t.adminModal.submitting : t.adminModal.submit}
              </button>
            </form>

            {/* Cancel */}
            <button
              type="button"
              onClick={() => setShowAdminModal(false)}
              style={{
                width: "100%", marginTop: 12, padding: "10px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, color: "rgba(255,255,255,0.5)",
                fontSize: 13, cursor: "pointer",
              }}
            >
              {t.adminModal.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default UI;
