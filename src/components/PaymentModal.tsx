import "./PaymentModal.css";
import { useState, useEffect } from "react";
import { useLang } from "../i18n/LanguageContext";

type Order = {
  id: number;
  package_name: string;
  token_amount: number;
  price_vnd: number;
  transfer_code: string;
  account_no: string;
  account_name: string;
  qr_data_url: string;
  status: string;
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onRefreshStatus: (force?: boolean) => Promise<void>;
  onOpenCheck: () => void;
}

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

const PaymentModal = ({
  isOpen,
  onClose,
  order,
  onRefreshStatus,
  onOpenCheck,
}: PaymentModalProps) => {
  const { lang } = useLang();
  const [loading, setLoading] = useState(false);
  const [qrError, setQrError] = useState(false);

  // ✅ luôn gọi hook
  useEffect(() => {
    setQrError(false);
  }, [order?.id]);

  // ✅ auto check (KHÔNG đặt sau return)
  useEffect(() => {
    if (!isOpen || !order || order.status === "paid") return;

    const interval = setInterval(() => {
      onRefreshStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, order?.id, order?.status]);

  // ❗ return đặt SAU tất cả hooks
  if (!isOpen || !order) return null;

  const handleCheckPayment = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await onRefreshStatus(true);
    } catch (err) {
      console.error("❌ Check error:", err);
      alert(lang === 'vi' ? "Không thể kiểm tra thanh toán" : "Cannot check payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        
        <button
          type="button"
          className="payment-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="payment-title">{lang === 'vi' ? 'Thanh Toán' : 'Payment'}</h2>
        <p className="payment-quote">
          {lang === 'vi' ? '“Kết nối năng lượng, khơi nguồn vận mệnh”' : '“Connect energy, unlock destiny”'}
        </p>

        <div className="payment-qr-wrap">
          {order.qr_data_url && !qrError ? (
            <img
              src={order.qr_data_url}
              alt={lang === 'vi' ? 'QR thanh toán' : 'Payment QR'}
              className="payment-qr"
              onError={() => {
                console.error("QR lỗi:", order.qr_data_url);
                setQrError(true);
              }}
            />
          ) : (
            <div className="payment-qr-error">
              <span>{lang === 'vi' ? 'Không tải được mã QR' : 'Cannot load QR code'}</span>
              <small>{lang === 'vi' ? 'Hãy tạo lại đơn hoặc kiểm tra backend' : 'Please create a new order or check backend'}</small>
            </div>
          )}
        </div>

        <div className="payment-info">
          <div className="payment-row">
            <span>{lang === 'vi' ? 'Mã đơn hàng:' : 'Order ID:'}</span>
            <strong>#{order.id}</strong>
          </div>

          <div className="payment-row">
            <span>{lang === 'vi' ? 'Gói:' : 'Package:'}</span>
            <strong>{order.package_name}</strong>
          </div>

          <div className="payment-row">
            <span>{lang === 'vi' ? 'Số tiền:' : 'Amount:'}</span>
            <strong>{formatMoney(order.price_vnd)}</strong>
          </div>

          <div className="payment-row">
            <span>{lang === 'vi' ? 'Trạng thái:' : 'Status:'}</span>
            <strong className={`payment-status ${order.status}`}>
              {lang === 'vi'
                ? (order.status === 'paid' ? 'Đã thanh toán' : order.status === 'pending' ? 'Chờ thanh toán' : order.status === 'failed' ? 'Thanh toán thất bại' : order.status)
                : (order.status === 'paid' ? 'Paid' : order.status === 'pending' ? 'Pending' : order.status === 'failed' ? 'Failed' : order.status)}
            </strong>
          </div>

          <div className="payment-row payment-row-top">
            <span>{lang === 'vi' ? 'Nội dung CK:' : 'Transfer note:'}</span>
            <strong className="payment-transfer-code">
              {order.transfer_code}
            </strong>
          </div>

          <div className="payment-row">
            <span>{lang === 'vi' ? 'Số tài khoản:' : 'Account no:'}</span>
            <strong>{order.account_no}</strong>
          </div>

          <div className="payment-row">
            <span>{lang === 'vi' ? 'Chủ tài khoản:' : 'Account name:'}</span>
            <strong>{order.account_name}</strong>
          </div>
        </div>

        <button
          type="button"
          className="payment-check-btn"
          onClick={handleCheckPayment}
          disabled={loading}
        >
          {loading ? (lang === 'vi' ? 'Đang kiểm tra...' : 'Checking...') : (lang === 'vi' ? 'Kiểm tra thanh toán' : 'Check payment')}
        </button>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button 
            type="button"
            onClick={onOpenCheck}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--gold)', 
              textDecoration: 'underline', 
              fontSize: '0.85rem', 
              cursor: 'pointer',
              opacity: 0.8
            }}
          >
            {lang === 'vi' ? 'Tôi đã chuyển khoản nhưng chưa được cộng?' : 'Transferred but not credited?'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;