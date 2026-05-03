import "./UI.css";
import TarotPage from "./TarotPage";
import EnergyPage from "./EnergyPage";
import ProfilePage from "./ProfilePage";
import TarotHistoryPage from "./TarotHistoryPage";

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
  onDealAll: () => void;
  onSelectCard: (card: Card) => void;
  onConfirm: () => void;
  onSetQuestion: (q: string) => void;
  onSetTopic: (topic: string) => void;
  tokens: number;
  onPaymentSuccess: (addedTokens: number) => void;

  tarotMessages: TarotChatMessage[];
  onAskTarotFollowUp: (message: string) => Promise<void> | void;
  followUpBusy: boolean;
  conversationId: string;
  waitingForClarification: boolean;
}

const UI = ({
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
}: UIProps) => {
  const userName = user?.email?.split("@")[0] || "Người Dùng";

  const menuItems: Array<{ key: PageName; icon: string; label: string }> = [
    { key: "tarot", icon: "🎴", label: "Trải Bài" },
    { key: "energy", icon: "⚡", label: "Năng Lượng" },
    { key: "history", icon: "📜", label: "Lịch Sử" },
    { key: "profile", icon: "👤", label: "Hồ Sơ" },
  ];

  return (
    <div className="ui-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <div className="logo-icon">🔮</div>
            <div className="logo-text">
              <h2>Tarot Talk</h2>
              <p>Thấu Hiểu Vận Mệnh</p>
            </div>
          </div>

          <nav className="sidebar-menu">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`menu-item ${currentPage === item.key ? "active" : ""}`}
                onClick={() => onPageChange(item.key)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div
          className="sidebar-user clickable-profile"
          onClick={() => onPageChange("profile")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onPageChange("profile");
            }
          }}
          title="Mở hồ sơ"
        >
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>

          <div className="user-info">
            <p className="user-name">{userName}</p>
            <p className="user-tokens">{tokens} Token</p>
          </div>

          <button
            type="button"
            className="btn-logout"
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

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
          />
        )}

        {currentPage === "energy" && (
          <EnergyPage
            currentTokens={tokens}
            userEmail={user?.email || ""}
            onPaymentSuccess={onPaymentSuccess}
          />
        )}

        {currentPage === "history" && user && (
          <TarotHistoryPage userEmail={user.email} />
        )}

        {currentPage === "profile" && (
          <ProfilePage
            userEmail={user?.email || ""}
            currentTokens={tokens}
          />
        )}
      </main>
    </div>
  );
};

export default UI;