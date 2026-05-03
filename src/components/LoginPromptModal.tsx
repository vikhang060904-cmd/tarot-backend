import './LoginPromptModal.css';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const LoginPromptModal = ({ isOpen, onClose, onLogout }: LoginPromptModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🔒</div>
        <h2>Vui Lòng Đăng Nhập</h2>
        <p>Chức năng này yêu cầu bạn phải đăng nhập trước.</p>
        
        <div className="modal-actions">
          <button className="btn-modal-close" onClick={onClose}>
            Đóng
          </button>
          <button className="btn-modal-logout" onClick={onLogout}>
            Đăng Xuất & Đăng Nhập Lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
