import { useEffect, useState } from "react";
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

interface TarotHistoryPageProps {
  userEmail: string;
}

const API_BASE = "";

const topicLabelMapVI: Record<string, string> = {
  general: "Chung",
  love: "Tình yêu",
  family: "Gia đình",
  career: "Sự nghiệp",
  health: "Sức khỏe",
  money: "Tài chính",
};

const topicLabelMapEN: Record<string, string> = {
  general: "General",
  love: "Love",
  family: "Family",
  career: "Career",
  health: "Health",
  money: "Finance",
};

const TarotHistoryPage = ({ userEmail }: TarotHistoryPageProps) => {
  const { lang } = useLang();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const topicLabel = lang === 'vi' ? topicLabelMapVI : topicLabelMapEN;

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
    if (!value) return "";
    const d = new Date(value.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(lang === 'vi' ? "vi-VN" : "en-US");
  };

  const T = {
    title: lang === 'vi' ? '✨ Nhật Ký Định Mệnh' : '✨ Destiny Journal',
    subtitle: lang === 'vi' ? 'Nơi lưu giữ những thông điệp từ vũ trụ dành riêng cho bạn' : 'Where messages from the universe are kept just for you',
    memories: lang === 'vi' ? 'Kỷ niệm' : 'Readings',
    refreshTitle: lang === 'vi' ? 'Làm mới' : 'Refresh',
    deleteTitle: lang === 'vi' ? 'Xóa tất cả' : 'Delete all',
    loadingText: lang === 'vi' ? 'Đang khai mở nhật ký...' : 'Opening your journal...',
    emptyTitle: lang === 'vi' ? 'Nhật ký còn trống' : 'Journal is empty',
    emptyDesc: lang === 'vi' ? 'Hãy thực hiện một lần trải bài để bắt đầu hành trình của bạn.' : 'Do a reading to start your journey.',
    defaultQuestion: lang === 'vi' ? 'Trải bài tổng quan' : 'General reading',
    details: lang === 'vi' ? 'Chi tiết →' : 'Details →',
    cosmicMsg: lang === 'vi' ? 'Thông điệp Vũ trụ' : 'Cosmic Message',
    reading: lang === 'vi' ? 'Lời luận giải' : 'The Reading',
    deleteConfirmTitle: lang === 'vi' ? 'Xóa toàn bộ nhật ký?' : 'Delete entire journal?',
    deleteConfirmDesc: lang === 'vi' ? 'Hành động này sẽ xóa vĩnh viễn tất cả thông điệp đã lưu và không thể khôi phục.' : 'This action will permanently delete all saved messages and cannot be undone.',
    cancelBtn: lang === 'vi' ? 'Quay lại' : 'Go back',
    deletingBtn: lang === 'vi' ? 'Đang xóa...' : 'Deleting...',
    confirmDeleteBtn: lang === 'vi' ? 'Đồng ý xóa' : 'Confirm delete',
    errorLoad: lang === 'vi' ? 'Không tải được lịch sử.' : 'Failed to load history.',
    errorLoadData: lang === 'vi' ? 'Lỗi tải dữ liệu' : 'Error loading data',
    noHistoryToDelete: lang === 'vi' ? 'Hiện chưa có lịch sử để xóa.' : 'No history to delete.',
    errorDelete: lang === 'vi' ? 'Không xóa được lịch sử.' : 'Failed to delete history.',
    deletedSuccess: lang === 'vi' ? 'Đã xóa toàn bộ lịch sử.' : 'All history deleted.',
    errorDeleting: lang === 'vi' ? 'Lỗi khi xóa' : 'Error deleting',
  };

  const showToast = (type: "success" | "error", message: string) => setToast({ type, message });

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
      const res = await fetch(`${API_BASE}/api/tarot/history?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || T.errorLoad);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : T.errorLoadData);
    } finally {
      setLoading(false);
    }
  };

  const handleAskDeleteHistory = () => {
    if (items.length === 0) {
      showToast("error", T.noHistoryToDelete);
      return;
    }
    setConfirmOpen(true);
  };

  const handleDeleteHistory = async () => {
    if (!userEmail?.trim()) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/api/tarot/history?email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(T.errorDelete);
      setItems([]);
      setConfirmOpen(false);
      showToast("success", T.deletedSuccess);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : T.errorDeleting);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userEmail]);

  return (
    <div className="destiny-journal-container page-container">
      <div className="journal-header">
        <h1 className="journal-title">{T.title}</h1>
        <p className="journal-subtitle">{T.subtitle}</p>
      </div>

      <div className="journal-toolbar">
        <div className="stats-badge">
          <span className="count">{items.length}</span> {T.memories}
        </div>
        <div className="toolbar-actions">
          <button className="journal-btn refresh" onClick={loadHistory} disabled={loading} title={T.refreshTitle}>
            🔄
          </button>
          <button className="journal-btn delete" onClick={handleAskDeleteHistory} disabled={deleting} title={T.deleteTitle}>
            🗑️
          </button>
        </div>
      </div>

      {loading ? (
        <div className="journal-loading">
          <div className="mystic-spinner" />
          <p>{T.loadingText}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="journal-empty">
          <div className="empty-icon">📖</div>
          <h3>{T.emptyTitle}</h3>
          <p>{T.emptyDesc}</p>
        </div>
      ) : (
        <div className="journal-grid">
          {items.map((item) => (
            <div key={item.id} className="journal-card glass-panel" onClick={() => setSelectedItem(item)}>
              <div className="card-preview-spread">
                {item.cards?.slice(0, 3).map((card, idx) => (
                  <div key={idx} className={`preview-card-img card-idx-${idx}`}>
                    <img 
                      src={`${API_BASE}/static/images/tarot/${card.suit}/${card.image}`} 
                      alt={card.name} 
                    />
                  </div>
                ))}
                {item.cards?.length > 3 && (
                  <div className="more-cards-indicator">+{item.cards.length - 3}</div>
                )}
              </div>
              <div className="card-info">
                <div className={`topic-badge ${item.topic}`}>
                  {topicLabel[item.topic] || item.topic}
                </div>
                <h3 className="item-question">{translateQuestion(item.question) || T.defaultQuestion}</h3>
                <div className="item-footer">
                  <span className="item-date">{formatDateTime(item.created_at)}</span>
                  <span className="read-more">{T.details}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Detail Modal */}
      {selectedItem && (
        <div className="journal-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="journal-detail-modal glass-panel premium-scroll" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedItem(null)}>✕</button>
            
            <div className="detail-header">
              <div className={`topic-badge ${selectedItem.topic}`}>
                {topicLabel[selectedItem.topic] || selectedItem.topic}
              </div>
              <h2>{translateQuestion(selectedItem.question) || T.cosmicMsg}</h2>
              <p className="detail-date">{formatDateTime(selectedItem.created_at)}</p>
            </div>

            <div className="detail-cards-display">
              {selectedItem.cards?.map((card, idx) => (
                <div key={idx} className="detail-card-item">
                  <div className="card-img-wrap">
                    <img src={`${API_BASE}/static/images/tarot/${card.suit}/${card.image}`} alt={card.name} />
                  </div>
                  <p className="card-name">{card.name}</p>
                </div>
              ))}
            </div>

            <div className="detail-answer-section">
              <h3>{T.reading}</h3>
              <div className="answer-content">
                {selectedItem.answer}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmOpen && (
        <div className="journal-modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="confirm-modal glass-panel" onClick={e => e.stopPropagation()}>
            <h3>{T.deleteConfirmTitle}</h3>
            <p>{T.deleteConfirmDesc}</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmOpen(false)}>{T.cancelBtn}</button>
              <button className="btn-confirm-delete" onClick={handleDeleteHistory} disabled={deleting}>
                {deleting ? T.deletingBtn : T.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`journal-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default TarotHistoryPage;