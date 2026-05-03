import { useEffect, useMemo, useState } from "react";

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
}

const API_BASE = "http://127.0.0.1:8002";
const READING_COST = 5;

const topicLabelMap: Record<string, string> = {
  general: "Chung",
  love: "Tình Yêu",
  family: "Gia Đình",
  career: "Sự Nghiệp",
  health: "Sức Khỏe",
  money: "Tài Chính",
};

const topicIconMap: Record<string, string> = {
  general: "🔮",
  love: "💞",
  family: "👨‍👩‍👧‍👦",
  career: "💼",
  health: "🩺",
  money: "💰",
};

const packageBadgeMap: Record<string, string> = {
  starter: "✨ Khởi Đầu",
  explorer: "⚡ Khám Phá",
  master: "👑 Thạo Thủ",
};

const formatDateTime = (value: string) => {
  if (!value) return "—";
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
};

const formatDateOnly = (value: string) => {
  if (!value) return "—";
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
};

const ProfilePage = ({ userEmail, currentTokens }: ProfilePageProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [currentPackage, setCurrentPackage] = useState<CurrentPackage>(null);

  const userName = useMemo(() => {
    return userEmail?.split("@")[0] || "Người Dùng";
  }, [userEmail]);

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
        throw new Error(data?.detail || "Không tải được dữ liệu hồ sơ.");
      }

      setHistory(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("Profile history error:", err);
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu hồ sơ.");
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
        throw new Error("Không tải được gói hiện tại.");
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
        <h1>👤 Hồ Sơ Cá Nhân</h1>
        <p className="subtitle">
          Theo dõi hành trình trải bài và năng lượng hiện có của bạn
        </p>
      </div>

      <div className="profile-grid">
        <div className="profile-summary-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          <h2 className="profile-user-name">{userName}</h2>

          <div className="profile-info-list">
            <div className="profile-info-row">
              <span>📧 Email</span>
              <strong>{userEmail || "user@example.com"}</strong>
            </div>

            <div className="profile-info-row">
              <span>🗓 Hoạt động đầu tiên</span>
              <strong>
                {stats.firstActivity ? formatDateOnly(stats.firstActivity) : "--/--/----"}
              </strong>
            </div>

            <div className="profile-info-row">
              <span>⏱ Gần nhất</span>
              <strong>
                {stats.latestActivity ? formatDateOnly(stats.latestActivity) : "--/--/----"}
              </strong>
            </div>
          </div>

          <div className="profile-token-box">
            <span>🔋 Token hiện có</span>
            <strong>{currentTokens}</strong>
          </div>

          <div className="profile-stats-grid">
            <div className="profile-mini-stat">
              <span>Tổng lượt rút</span>
              <strong>{stats.totalReadings}</strong>
            </div>

            <div className="profile-mini-stat">
              <span>Token đã dùng</span>
              <strong>-{stats.totalSpent}</strong>
            </div>

            <div className="profile-mini-stat full">
              <span>Chủ đề nổi bật</span>
              <strong>
                {topicIconMap[stats.favoriteTopic] || "🔮"}{" "}
                {topicLabelMap[stats.favoriteTopic] || "Chung"}
              </strong>
            </div>
          </div>

          <div
            className="profile-current-package"
            style={{
              marginTop: 20,
              padding: 18,
              borderRadius: 18,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                color: "#f6d89d",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              🎁 Gói bạn đang sử dụng
            </div>

            {summaryLoading ? (
              <div style={{ color: "#f3d8ff" }}>Đang tải...</div>
            ) : currentPackage ? (
              <>
                <div
                  style={{
                    color: "#f3d8ff",
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  {currentPackage.package_name}
                </div>

                <div
                  style={{
                    color: "#ffcf70",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {packageBadgeMap[currentPackage.package_code] || currentPackage.package_code}
                </div>

              </>
            ) : (
              <div style={{ color: "#f3d8ff" }}>Chưa có gói đang hoạt động.</div>
            )}
          </div>
        </div>

        <div className="profile-history-card">
          <div className="profile-history-head">
            <div>
              <h2>📖 Lịch Sử Tu Tập</h2>
              <p>Các lần trải bài và khai mở trước đó</p>
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
              Làm mới
            </button>
          </div>

          {loading ? (
            <div className="profile-empty">Đang tải dữ liệu hồ sơ...</div>
          ) : error ? (
            <div className="profile-empty">{error}</div>
          ) : history.length === 0 ? (
            <div className="profile-empty">Chưa có lịch sử trải bài.</div>
          ) : (
            <div className="profile-table-wrap">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>NGÀY GIỜ</th>
                    <th>CHỦ ĐỀ</th>
                    <th>CÂU HỎI</th>
                    <th>LÁ BÀI</th>
                    <th>TOKEN</th>
                    <th>CHI TIẾT</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDateTime(item.created_at)}</td>
                      <td>
                        <span className="profile-topic-pill">
                          {topicIconMap[item.topic] || "🔮"}{" "}
                          {topicLabelMap[item.topic] || item.topic || "Chung"}
                        </span>
                      </td>
                      <td>{item.question || "Không có câu hỏi cụ thể"}</td>
                      <td>{item.cards?.length || 0} 🎴</td>
                      <td className="profile-token-spent">-{READING_COST}</td>
                      <td>
                        <button
                          type="button"
                          className="profile-view-btn"
                          onClick={() => setSelectedItem(item)}
                        >
                          Xem
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
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-head">
              <div>
                <h3>
                  {topicIconMap[selectedItem.topic] || "🔮"}{" "}
                  {topicLabelMap[selectedItem.topic] || selectedItem.topic || "Chung"}
                </h3>
                <p>{selectedItem.question || "Không có câu hỏi cụ thể"}</p>
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
              {selectedItem.answer || "Không có nội dung luận giải."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;