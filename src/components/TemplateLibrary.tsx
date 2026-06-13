import React from 'react';
import { SPREAD_TYPES } from '../constants/spreads';
import { useLang } from '../i18n/LanguageContext';

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ isOpen, onClose, onSelect }) => {
  const { lang } = useLang();
  if (!isOpen) return null;

  return (
    <div className="template-library-overlay">
      <div className="template-library-content glass-panel premium-border">
        <header className="library-header">
          <div className="header-top">
            <div className="header-title-group">
              <h2 className="glitch-text" data-text={lang === 'vi' ? 'THƯ VIỆN QUẺ MẪu' : 'SPREAD LIBRARY'}>🌌 {lang === 'vi' ? 'THƯ VIỆN QUẺ MẪu' : 'SPREAD LIBRARY'}</h2>
              <div className="header-glow-line" />
            </div>
            <button className="close-btn" onClick={onClose} title={lang === 'vi' ? 'Đóng thư viện' : 'Close library'}>✕</button>
          </div>
          <p className="library-subtitle">{lang === 'vi' ? 'Chọn một thế trận linh thiêng để định hình dòng chảy năng lượng của buổi luận giải' : 'Choose a sacred formation to shape the energy flow of your reading'}</p>
        </header>

        <div className="library-grid-container custom-scrollbar">
          {SPREAD_TYPES.map((spread, idx) => (
            <div 
              key={spread.id} 
              className={`template-card ${spread.isNew ? 'featured' : ''}`} 
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => {
                onSelect(spread.id);
                onClose();
              }}
            >
              {spread.isNew && <div className="new-ribbon">PREMIUM</div>}
              
              <div className="card-visual">
                <div className="card-icon-wrapper">
                  <span className="card-icon-main">{spread.icon || '🔮'}</span>
                  <div className="icon-pulse" />
                </div>
                
                <div className="mini-layout-preview-v2">
                   <div className={`preview-container layout-type-${spread.layout}`}>
                     {Array.from({ length: Math.min(spread.count, 12) }).map((_, i) => (
                       <div 
                         key={i} 
                         className="mini-card-dot" 
                         style={{ 
                           animationDelay: `${i * 0.1}s`,
                           opacity: 1 - (i * 0.05)
                         }} 
                       />
                     ))}
                   </div>
                </div>
              </div>

              <div className="card-info-premium">
                <div className="card-header-row">
                  <span className="card-category-tag">{spread.category}</span>
                  {spread.energy && (
                    <span className={`energy-badge energy-${spread.energy.toLowerCase()}`}>
                      ⚡ {spread.energy}
                    </span>
                  )}
                </div>

                <h3 className="card-name-premium">{spread.name}</h3>
                
                {spread.spirit && (
                  <div className="card-spirit-text">
                    <span className="spirit-label">{lang === 'vi' ? 'Linh hồn:' : 'Spirit:'}</span>
                    <span className="spirit-value">{spread.spirit}</span>
                  </div>
                )}

                <p className="card-desc-premium">{spread.description}</p>
                
                <div className="card-footer-premium">
                  <div className="card-tags-row">
                    {spread.tags?.map(tag => (
                      <span key={tag} className="mini-tag">#{tag}</span>
                    ))}
                  </div>
                  <div className="card-count-indicator">
                    <span className="count-num">{spread.count}</span>
                    <span className="count-label">{lang === 'vi' ? 'LÁ BÀI' : 'CARDS'}</span>
                  </div>
                </div>
              </div>

              <div className="card-action-overlay">
                <span className="action-text">{lang === 'vi' ? 'KHAI MỞ NGHI THỨC' : 'BEGIN RITUAL'}</span>
                <div className="action-glow" />
              </div>
            </div>
          ))}
        </div>
        
        <footer className="library-footer-hint">
          <span className="hint-icon">💡</span>
          <span>{lang === 'vi' ? 'Mỗi thế trận mang một tần số rung động riêng biệt. Hãy chọn theo trực giác của bạn.' : 'Each spread carries a unique energy frequency. Choose by your intuition.'}</span>
        </footer>
      </div>
    </div>
  );
};

export default TemplateLibrary;