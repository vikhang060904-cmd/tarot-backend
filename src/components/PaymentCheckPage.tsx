import "./PaymentCheckPage.css";
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
  const { lang } = useLang();
  if (!isOpen || !order) return null;

  const T = {
    title: lang === 'vi' ? 'Kiểm Tra Thanh Toán' : 'Payment Verification',
    subtitle: lang === 'vi' ? 'Đối soát giao dịch với SePay theo đúng nội dung chuyển khoản' : 'Verify transaction with SePay using the correct transfer content',
    orderId: lang === 'vi' ? 'Mã đơn hàng' : 'Order ID',
    package: lang === 'vi' ? 'Gói' : 'Package',
    amount: lang === 'vi' ? 'Số tiền' : 'Amount',
    status: lang === 'vi' ? 'Trạng thái hiện tại' : 'Current status',
    transferNote: lang === 'vi' ? 'Nội dung chuyển khoản' : 'Transfer content',
    accountNo: lang === 'vi' ? 'Số tài khoản' : 'Account number',
    accountName: lang === 'vi' ? 'Chủ tài khoản' : 'Account name',
    defaultMsg: lang === 'vi' ? 'Nhấn nút bên dưới để bắt đầu kiểm tra giao dịch.' : 'Click the button below to start checking the transaction.',
    checkingBtn: lang === 'vi' ? 'Đang kiểm tra...' : 'Checking...',
    checkNowBtn: lang === 'vi' ? 'Kiểm tra ngay' : 'Check now',
    backBtn: lang === 'vi' ? 'Quay lại QR' : 'Back to QR',
    closeLabel: lang === 'vi' ? 'Đóng' : 'Close',
    statusPaid: lang === 'vi' ? 'Đã thanh toán' : 'Paid',
    statusPending: lang === 'vi' ? 'Chờ thanh toán' : 'Pending',
    statusFailed: lang === 'vi' ? 'Thanh toán thất bại' : 'Failed',
    statusUnknown: lang === 'vi' ? 'Không rõ' : 'Unknown',
  };

  const getStatusLabel = (s: string) => {
    switch ((s || "").toLowerCase()) {
      case "paid": return T.statusPaid;
      case "pending": return T.statusPending;
      case "failed": return T.statusFailed;
      default: return s || T.statusUnknown;
    }
  };

  return (
    <div className="payment-check-overlay">
      <div className="payment-check-page">
        <button
          type="button"
          className="payment-check-close"
          onClick={onClose}
          aria-label={T.closeLabel}
          title={T.closeLabel}
        >
          ×
        </button>

        <div className="payment-check-header">
          <h2>{T.title}</h2>
          <p>{T.subtitle}</p>
        </div>

        <div className="payment-check-card">
          <div className="payment-check-row">
            <span>{T.orderId}</span>
            <strong>#{order.id}</strong>
          </div>

          <div className="payment-check-row">
            <span>{T.package}</span>
            <strong>{order.package_name}</strong>
          </div>

          <div className="payment-check-row">
            <span>{T.amount}</span>
            <strong>{formatMoney(order.price_vnd)}</strong>
          </div>

          <div className="payment-check-row">
            <span>{T.status}</span>
            <strong className={`pcs-status pcs-status-${order.status}`}>
              {getStatusLabel(order.status)}
            </strong>
          </div>

          <div className="payment-check-row payment-check-row-top">
            <span>{T.transferNote}</span>
            <strong className="pcs-transfer-code">{order.transfer_code}</strong>
          </div>

          <div className="payment-check-row">
            <span>{T.accountNo}</span>
            <strong>{order.account_no}</strong>
          </div>

          <div className="payment-check-row">
            <span>{T.accountName}</span>
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
          {message || T.defaultMsg}
        </div>

        <div className="payment-check-actions">
          <button
            type="button"
            className="btn-check-now"
            onClick={onCheckNow}
            disabled={checking}
          >
            {checking ? T.checkingBtn : T.checkNowBtn}
          </button>

          <button
            type="button"
            className="btn-back-payment"
            onClick={onBack}
            disabled={checking}
          >
            {T.backBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckPage;