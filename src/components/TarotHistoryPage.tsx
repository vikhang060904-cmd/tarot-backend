import { useEffect, useState } from "react";

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

interface TarotHistoryPageProps {
  userEmail: string;
}

const API_BASE = "http://127.0.0.1:8002";

const topicLabelMap: Record<string, string> = {
  general: "Chung",
  love: "Tình yêu",
  family: "Gia đình",
  career: "Sự nghiệp",
  health: "Sức khỏe",
  money: "Tài chính",
};

const formatDateTime = (value: string) => {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
};

const TarotHistoryPage = ({ userEmail }: TarotHistoryPageProps) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadHistory = async () => {
    if (!userEmail?.trim()) {
      setItems([]);
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
        throw new Error(data?.detail || "Không tải được lịch sử.");
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("loadHistory error:", err);
      setError(err instanceof Error ? err.message : "Không tải được lịch sử.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAskDeleteHistory = () => {
    if (items.length === 0) {
      showToast("error", "Hiện chưa có lịch sử để xóa.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleDeleteHistory = async () => {
    if (!userEmail?.trim()) return;

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/api/tarot/history?email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Không xóa được lịch sử.");
      }

      setItems([]);
      setConfirmOpen(false);
      showToast("success", "Đã xóa toàn bộ lịch sử rút bài.");
    } catch (err) {
      console.error("deleteHistory error:", err);
      showToast(
        "error",
        err instanceof Error ? err.message : "Không xóa được lịch sử."
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userEmail]);

  return (
    <div className="history-page page-container">
      <div className="page-header">
        <h1>📜 Lịch Sử Rút Bài</h1>
        <p className="subtitle">Xem lại các lần trải bài Tarot trước đó của bạn</p>
      </div>

      <div className="history-toolbar">
        <div className="history-meta">
          <strong>{items.length}</strong> lượt rút bài
        </div>

        <div className="history-toolbar-actions">
          <button
            type="button"
            className="history-btn secondary"
            onClick={loadHistory}
            disabled={loading}
          >
            Làm mới
          </button>

          <button
            type="button"
            className="history-btn danger"
            onClick={handleAskDeleteHistory}
            disabled={deleting}
          >
            Xóa
          </button>
        </div>
      </div>

      {loading ? (
        <div className="history-empty-card">
          <h3>Đang tải lịch sử...</h3>
        </div>
      ) : error ? (
        <div className="history-empty-card">
          <h3>Lỗi tải lịch sử</h3>
          <p>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="history-empty-card">
          <h3>Lịch sử</h3>
          <p>Chưa có lịch sử rút bài.</p>
        </div>
      ) : (
        <div className="history-list">
          {items.map((item) => (
            <div key={item.id} className="history-card">
              <div className="history-card-top">
                <div>
                  <h3 className="history-topic">
                    {topicLabelMap[item.topic] || item.topic || "Chung"}
                  </h3>
                  <p className="history-question">
                    {item.question || "Không có câu hỏi cụ thể"}
                  </p>
                </div>

                <div className="history-time">
                  {formatDateTime(item.created_at)}
                </div>
              </div>

              <div className="history-cards-row">
                {item.cards?.filter(Boolean).map((card, index) => (
                  <div key={`${item.id}-${index}`} className="history-picked-card">
                    <img
                      src={`${API_BASE}/static/images/tarot/${card.suit}/${card.image}`}
                      alt={card.name}
                      className="history-picked-card-image"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <p className="history-picked-card-name">{card.name}</p>
                  </div>
                ))}
              </div>

              <div className="history-answer">
                {item.answer || "Không có nội dung luận giải."}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmOpen && (
        <div className="history-modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Xóa lịch sử rút bài?</h3>
            <p>Bạn có chắc muốn xóa toàn bộ lịch sử rút bài không?</p>

            <div className="history-modal-actions">
              <button
                type="button"
                className="history-btn secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                Hủy
              </button>

              <button
                type="button"
                className="history-btn danger"
                onClick={handleDeleteHistory}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xóa lịch sử"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`history-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default TarotHistoryPage;