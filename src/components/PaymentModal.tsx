import "./PaymentModal.css";
import { useState, useEffect } from "react";

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
  onRefreshStatus: () => Promise<void>;
}

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

const getStatusLabel = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "paid":
      return "Đã thanh toán";
    case "pending":
      return "Chờ thanh toán";
    case "failed":
      return "Thanh toán thất bại";
    default:
      return status || "Không rõ";
  }
};

const PaymentModal = ({
  isOpen,
  onClose,
  order,
  onRefreshStatus,
}: PaymentModalProps) => {
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
      await onRefreshStatus();
    } catch (err) {
      console.error("❌ Lỗi kiểm tra:", err);
      alert("Không thể kiểm tra thanh toán");
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

        <h2 className="payment-title">Thanh Toán</h2>
        <p className="payment-quote">
          “Kết nối năng lượng, khơi nguồn vận mệnh”
        </p>

        <div className="payment-qr-wrap">
          {order.qr_data_url && !qrError ? (
            <img
              src={order.qr_data_url}
              alt="QR thanh toán"
              className="payment-qr"
              onError={() => {
                console.error("QR lỗi:", order.qr_data_url);
                setQrError(true);
              }}
            />
          ) : (
            <div className="payment-qr-error">
              <span>Không tải được mã QR</span>
              <small>Hãy tạo lại đơn hoặc kiểm tra backend</small>
            </div>
          )}
        </div>

        <div className="payment-info">
          <div className="payment-row">
            <span>Mã đơn hàng:</span>
            <strong>#{order.id}</strong>
          </div>

          <div className="payment-row">
            <span>Gói:</span>
            <strong>{order.package_name}</strong>
          </div>

          <div className="payment-row">
            <span>Số tiền:</span>
            <strong>{formatMoney(order.price_vnd)}</strong>
          </div>

          <div className="payment-row">
            <span>Trạng thái:</span>
            <strong className={`payment-status ${order.status}`}>
              {getStatusLabel(order.status)}
            </strong>
          </div>

          <div className="payment-row payment-row-top">
            <span>Nội dung CK:</span>
            <strong className="payment-transfer-code">
              {order.transfer_code}
            </strong>
          </div>

          <div className="payment-row">
            <span>Số tài khoản:</span>
            <strong>{order.account_no}</strong>
          </div>

          <div className="payment-row">
            <span>Chủ tài khoản:</span>
            <strong>{order.account_name}</strong>
          </div>
        </div>

        <button
          type="button"
          className="payment-check-btn"
          onClick={handleCheckPayment}
          disabled={loading}
        >
          {loading ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;