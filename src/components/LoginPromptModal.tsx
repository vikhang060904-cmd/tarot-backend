import './LoginPromptModal.css';
import { useLang } from '../i18n/LanguageContext';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const LoginPromptModal = ({ isOpen, onClose, onLogout }: LoginPromptModalProps) => {
  const { lang } = useLang();
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🔒</div>
        <h2>{lang === 'vi' ? 'Vui Lòng Đăng Nhập' : 'Please Log In'}</h2>
        <p>{lang === 'vi' ? 'Chức năng này yêu cầu bạn phải đăng nhập trước.' : 'This feature requires you to log in first.'}</p>
        
        <div className="modal-actions">
          <button className="btn-modal-close" onClick={onClose}>
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
          <button className="btn-modal-logout" onClick={onLogout}>
            {lang === 'vi' ? 'Đăng Xuất & Đăng Nhập Lại' : 'Logout & Re-login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
