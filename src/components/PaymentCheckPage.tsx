import "./PaymentCheckPage.css";

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

interface PaymentCheckPageProps {
  isOpen: boolean;
  order: Order | null;
  checking: boolean;
  message: string;
  matched: boolean | null;
  onBack: () => void;
  onClose: () => void;
  onCheckNow: () => void;
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

const PaymentCheckPage = ({
  isOpen,
  order,
  checking,
  message,
  matched,
  onBack,
  onClose,
  onCheckNow,
}: PaymentCheckPageProps) => {
  if (!isOpen || !order) return null;

  return (
    <div className="payment-check-overlay">
      <div className="payment-check-page">
        <button
          type="button"
          className="payment-check-close"
          onClick={onClose}
          aria-label="Đóng"
          title="Đóng"
        >
          ×
        </button>

        <div className="payment-check-header">
          <h2>Kiểm Tra Thanh Toán</h2>
          <p>Đối soát giao dịch với SePay theo đúng nội dung chuyển khoản</p>
        </div>

        <div className="payment-check-card">
          <div className="payment-check-row">
            <span>Mã đơn hàng</span>
            <strong>#{order.id}</strong>
          </div>

          <div className="payment-check-row">
            <span>Gói</span>
            <strong>{order.package_name}</strong>
          </div>

          <div className="payment-check-row">
            <span>Số tiền</span>
            <strong>{formatMoney(order.price_vnd)}</strong>
          </div>

          <div className="payment-check-row">
            <span>Trạng thái hiện tại</span>
            <strong className={`pcs-status pcs-status-${order.status}`}>
              {getStatusLabel(order.status)}
            </strong>
          </div>

          <div className="payment-check-row payment-check-row-top">
            <span>Nội dung chuyển khoản</span>
            <strong className="pcs-transfer-code">{order.transfer_code}</strong>
          </div>

          <div className="payment-check-row">
            <span>Số tài khoản</span>
            <strong>{order.account_no}</strong>
          </div>

          <div className="payment-check-row">
            <span>Chủ tài khoản</span>
            <strong>{order.account_name}</strong>
          </div>
        </div>

        <div
          className={`payment-check-result ${
            matched === true
              ? "success"
              : matched === false
              ? "warning"
              : "neutral"
          }`}
        >
          {message || "Nhấn nút bên dưới để bắt đầu kiểm tra giao dịch."}
        </div>

        <div className="payment-check-actions">
          <button
            type="button"
            className="btn-check-now"
            onClick={onCheckNow}
            disabled={checking}
          >
            {checking ? "Đang kiểm tra..." : "Kiểm tra ngay"}
          </button>

          <button
            type="button"
            className="btn-back-payment"
            onClick={onBack}
            disabled={checking}
          >
            Quay lại QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckPage;