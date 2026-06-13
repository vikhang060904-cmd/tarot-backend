import { useEffect, useMemo, useState } from "react";
import { useLang } from "../i18n/LanguageContext";

type HistoryCard = {
  name: string;
  suit: string;
  image: string;
};

type HistoryItem = {
  id: number;
  user_email: string;
  topic: string;
  question: string;
  cards: HistoryCard[];
  answer: string;
  created_at: string;
};

type CurrentPackage = {
  package_code: string;
  package_name: string;
  started_at?: string | null;
  ends_at?: string | null;
} | null;

type ProfileSummaryResponse = {
  success: boolean;
  token_balance: number;
  current_package: {
  package_code: string;
  package_name: string;
  started_at: string;
  ends_at: string;
} | null;
};

interface ProfilePageProps {
  userEmail: string;
  currentTokens: number;
  onLogout?: () => void;
}

const API_BASE = "";
const READING_COST = 5;

const topicIconMap: Record<string, string> = {
  general: "🔮",
  love: "💞",
  family: "👨‍👩‍👧‍👦",
  career: "💼",
  health: "🩺",
  money: "💰",
};

const ProfilePage = ({ userEmail, currentTokens, onLogout }: ProfilePageProps) => {
  const { lang } = useLang();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [currentPackage, setCurrentPackage] = useState<CurrentPackage>(null);

  const topicLabelMap: Record<string, string> = lang === 'vi'
    ? { general: "Chung", love: "Tình Yêu", family: "Gia Đình", career: "Sự Nghiệp", health: "Sức Khỏe", money: "Tài Chính" }
    : { general: "General", love: "Love", family: "Family", career: "Career", health: "Health", money: "Finance" };

  const packageBadgeMap: Record<string, string> = lang === 'vi'
    ? { starter: "✨ Khởi Đầu", explorer: "⚡ Khám Phá", master: "👑 Thạo Thủ" }
    : { starter: "✨ Starter", explorer: "⚡ Explorer", master: "👑 Master" };

  const translateQuestion = (q: string) => {
    if (lang !== 'en' || !q) return q;
    const match = q.match(/^Tổng quan về (.+) trong thời gian tới$/i);
    if (match) {
      const topic = match[1].trim().toLowerCase();
      let topicEn = "general";
      if (topic === "chung") topicEn = "general";
      else if (topic === "tình yêu") topicEn = "love";
      else if (topic === "gia đình") topicEn = "family";
      else if (topic === "sự nghiệp") topicEn = "career";
      else if (topic === "sức khỏe") topicEn = "health";
      else if (topic === "tài chính") topicEn = "finance";
      else topicEn = topic;
      const capitalized = topicEn.charAt(0).toUpperCase() + topicEn.slice(1);
      return `${capitalized} overview in the near future`;
    }
    return q;
  };

  const formatDateTime = (value: string) => {
    if (!value) return "—";
    const d = new Date(value.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(lang === 'vi' ? "vi-VN" : "en-US");
  };

  const formatDateOnly = (value: string) => {
    if (!value) return "—";
    const d = new Date(value.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(lang === 'vi' ? "vi-VN" : "en-US");
  };

  const userName = useMemo(() => {
    return userEmail?.split("@")[0] || (lang === 'vi' ? "Người Dùng" : "User");
  }, [userEmail, lang]);

  // ── Translations ──
  const T = {
    pageTitle: lang === 'vi' ? '👤 Hồ Sơ Cá Nhân' : '👤 Personal Profile',
    pageSubtitle: lang === 'vi' ? 'Theo dõi hành trình trải bài và năng lượng hiện có của bạn' : 'Track your reading journey and available energy',
    email: '📧 Email',
    firstActivity: lang === 'vi' ? '🗓 Hoạt động đầu tiên' : '🗓 First activity',
    lastActivity: lang === 'vi' ? '⏱ Gần nhất' : '⏱ Most recent',
    currentTokens: lang === 'vi' ? '🔋 Token hiện có' : '🔋 Available tokens',
    totalReadings: lang === 'vi' ? 'Tổng lượt rút' : 'Total readings',
    tokensUsed: lang === 'vi' ? 'Token đã dùng' : 'Tokens used',
    topTopic: lang === 'vi' ? 'Chủ đề nổi bật' : 'Top topic',
    currentPkg: lang === 'vi' ? '🎁 Gói bạn đang sử dụng' : '🎁 Your current package',
    loadingPkg: lang === 'vi' ? 'Đang tải...' : 'Loading...',
    noPkg: lang === 'vi' ? 'Chưa có gói đang hoạt động.' : 'No active package.',
    startedAt: lang === 'vi' ? 'Bắt đầu:' : 'Started:',
    expiresAt: lang === 'vi' ? 'Hết hạn:' : 'Expires:',
    adminBtn: lang === 'vi' ? 'Vào Trang Quản Trị' : 'Enter Admin Panel',
    logoutBtn: lang === 'vi' ? 'Đăng xuất tài khoản' : 'Logout',
    historyTitle: lang === 'vi' ? '📖 Lịch Sử Tu Tập' : '📖 Reading History',
    historyDesc: lang === 'vi' ? 'Các lần trải bài và khai mở trước đó' : 'Previous readings and revelations',
    refreshBtn: lang === 'vi' ? 'Làm mới' : 'Refresh',
    loadingProfile: lang === 'vi' ? 'Đang tải dữ liệu hồ sơ...' : 'Loading profile data...',
    noHistory: lang === 'vi' ? 'Chưa có lịch sử trải bài.' : 'No reading history yet.',
    thDate: lang === 'vi' ? 'NGÀY GIỜ' : 'DATE',
    thTopic: lang === 'vi' ? 'CHỦ ĐỀ' : 'TOPIC',
    thQuestion: lang === 'vi' ? 'CÂU HỎI' : 'QUESTION',
    thCards: lang === 'vi' ? 'LÁ BÀI' : 'CARDS',
    thToken: 'TOKEN',
    thDetail: lang === 'vi' ? 'CHI TIẾT' : 'DETAILS',
    thAction: lang === 'vi' ? 'HÀNH ĐỘNG' : 'ACTION',
    noQuestion: lang === 'vi' ? 'Không có câu hỏi cụ thể' : 'No specific question',
    viewDetail: lang === 'vi' ? 'Xem chi tiết' : 'View details',
    noAnswer: lang === 'vi' ? 'Không có nội dung luận giải.' : 'No reading content.',
    errorLoadProfile: lang === 'vi' ? 'Không tải được dữ liệu hồ sơ.' : 'Failed to load profile data.',
    errorLoadPkg: lang === 'vi' ? 'Không tải được gói hiện tại.' : 'Failed to load current package.',
  };

  const loadHistory = async () => {
    if (!userEmail.trim()) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/api/tarot/history?email=${encodeURIComponent(userEmail)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || T.errorLoadProfile);
      }

      setHistory(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("Profile history error:", err);
      setError(err instanceof Error ? err.message : T.errorLoadProfile);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileSummary = async () => {
    if (!userEmail.trim()) {
      setCurrentPackage(null);
      setSummaryLoading(false);
      return;
    }

    try {
      setSummaryLoading(true);

      const res = await fetch(
        `${API_BASE}/api/users/profile-summary?email=${encodeURIComponent(userEmail)}`
      );
      const data: ProfileSummaryResponse = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(T.errorLoadPkg);
      }

      setCurrentPackage(
  data.current_package
    ? {
        package_code: data.current_package.package_code,
        package_name: data.current_package.package_name,
        started_at: data.current_package.started_at,
        ends_at: data.current_package.ends_at,
      }
    : null
);
    } catch (err) {
      console.error("Profile summary error:", err);
      setCurrentPackage(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadProfileSummary();
  }, [userEmail]);

  const stats = useMemo(() => {
    const totalReadings = history.length;
    const totalSpent = totalReadings * READING_COST;

    const topicCounter: Record<string, number> = {};
    history.forEach((item) => {
      const key = item.topic || "general";
      topicCounter[key] = (topicCounter[key] || 0) + 1;
    });

    let favoriteTopic = "general";
    let maxCount = 0;
    Object.entries(topicCounter).forEach(([topic, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteTopic = topic;
      }
    });

    const latestActivity = history[0]?.created_at || "";
    const firstActivity = history[history.length - 1]?.created_at || "";

    return {
      totalReadings,
      totalSpent,
      favoriteTopic,
      latestActivity,
      firstActivity,
    };
  }, [history]);

  return (
    <div className="profile-page page-container">
      <div className="page-header">
        <h1>{T.pageTitle}</h1>
        <p className="subtitle">
          {T.pageSubtitle}
        </p>
      </div>

      <div className="profile-grid">
        <div className="profile-summary-card glass-panel">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          <h2 className="profile-user-name">{userName}</h2>

          <div className="profile-info-list">
            <div className="profile-info-row">
              <span>{T.email}</span>
              <strong>{userEmail || "user@example.com"}</strong>
            </div>

            <div className="profile-info-row">
              <span>{T.firstActivity}</span>
              <strong>
                {stats.firstActivity ? formatDateOnly(stats.firstActivity) : "--/--/----"}
              </strong>
            </div>

            <div className="profile-info-row">
              <span>{T.lastActivity}</span>
              <strong>
                {stats.latestActivity ? formatDateOnly(stats.latestActivity) : "--/--/----"}
              </strong>
            </div>
          </div>

          <div className="profile-token-box">
            <span>{T.currentTokens}</span>
            <strong>{currentTokens}</strong>
          </div>

          <div className="profile-stats-grid">
            <div className="profile-mini-stat">
              <span>{T.totalReadings}</span>
              <strong>{stats.totalReadings}</strong>
            </div>

            <div className="profile-mini-stat">
              <span>{T.tokensUsed}</span>
              <strong>-{stats.totalSpent}</strong>
            </div>

            <div className="profile-mini-stat full">
              <span>{T.topTopic}</span>
              <strong>
                {topicIconMap[stats.favoriteTopic] || "🔮"}{" "}
                {topicLabelMap[stats.favoriteTopic] || (lang === 'vi' ? "Chung" : "General")}
              </strong>
            </div>
          </div>

          <div className="profile-current-package">
            <div className="package-section-label">
              {T.currentPkg}
            </div>

            {summaryLoading ? (
              <div style={{ color: "#f3d8ff" }}>{T.loadingPkg}</div>
            ) : currentPackage ? (
              <>
                <div className="package-display-name">
                  {currentPackage.package_name}
                </div>

                <div className="package-display-badge">
                  {packageBadgeMap[currentPackage.package_code] || currentPackage.package_code}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                  {T.startedAt} {formatDateOnly(currentPackage.started_at || "")}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#ffcf70', marginTop: 4 }}>
                  {T.expiresAt} {formatDateOnly(currentPackage.ends_at || "")}
                </div>
              </>
            ) : (
              <div style={{ color: "#f3d8ff" }}>{T.noPkg}</div>
            )}
          </div>

          {localStorage.getItem("role") === "admin" && (
            <div className="profile-admin-wrap" style={{ marginTop: '20px', width: '100%' }}>
              <button 
                type="button" 
                className="profile-admin-btn"
                onClick={() => window.location.href = "/admin"}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ffd700, #d4af37)',
                  color: '#000000',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>🧙‍♂️</span> {T.adminBtn}
              </button>
            </div>
          )}

          {onLogout && (
            <div className="profile-logout-wrap" style={{ marginTop: '12px', width: '100%' }}>
              <button 
                type="button" 
                className="profile-logout-btn"
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>⏻</span> {T.logoutBtn}
              </button>
            </div>
          )}
        </div>

        <div className="profile-history-card glass-panel">
          <div className="profile-history-head">
            <div>
              <h2>{T.historyTitle}</h2>
              <p>{T.historyDesc}</p>
            </div>

            <button
              type="button"
              className="profile-refresh-btn"
              onClick={() => {
                loadHistory();
                loadProfileSummary();
              }}
              disabled={loading || summaryLoading}
            >
              {T.refreshBtn}
            </button>
          </div>

          {loading ? (
            <div className="profile-empty">{T.loadingProfile}</div>
          ) : error ? (
            <div className="profile-empty">{error}</div>
          ) : history.length === 0 ? (
            <div className="profile-empty">{T.noHistory}</div>
          ) : (
            <div className="profile-table-wrap">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>{T.thDate}</th>
                    <th>{T.thTopic}</th>
                    <th>{T.thQuestion}</th>
                    <th>{T.thCards}</th>
                    <th>{T.thToken}</th>
                    <th>{T.thDetail}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td data-label={T.thDate}>{formatDateTime(item.created_at)}</td>
                      <td data-label={T.thTopic}>
                        <span className="profile-topic-pill">
                          {topicIconMap[item.topic] || "🔮"}{" "}
                          {topicLabelMap[item.topic] || item.topic || (lang === 'vi' ? "Chung" : "General")}
                        </span>
                      </td>
                      <td data-label={T.thQuestion}>{translateQuestion(item.question) || T.noQuestion}</td>
                      <td data-label={T.thCards}>{item.cards?.length || 0} 🎴</td>
                      <td data-label={T.thToken} className="profile-token-spent">-{READING_COST}</td>
                      <td data-label={T.thAction}>
                        <button
                          type="button"
                          className="profile-view-btn"
                          onClick={() => setSelectedItem(item)}
                        >
                          {T.viewDetail}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div
          className="profile-modal-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="profile-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-head">
              <div>
                <h3>
                  {topicIconMap[selectedItem.topic] || "🔮"}{" "}
                  {topicLabelMap[selectedItem.topic] || selectedItem.topic || (lang === 'vi' ? "Chung" : "General")}
                </h3>
                <p>{translateQuestion(selectedItem.question) || T.noQuestion}</p>
              </div>

              <button
                type="button"
                className="profile-close-btn"
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="profile-modal-cards">
              {selectedItem.cards?.filter(Boolean).map((card, index) => (
                <div key={`${selectedItem.id}-${index}`} className="profile-modal-card">
                  <img
                    src={`${API_BASE}/static/images/tarot/${card.suit}/${card.image}`}
                    alt={card.name}
                    className="profile-modal-card-image"
                  />
                  <p>{card.name}</p>
                </div>
              ))}
            </div>

            <div className="profile-modal-answer">
              {selectedItem.answer || T.noAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;