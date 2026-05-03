  import { useEffect, useRef, useState } from "react";
  import PaymentModal from "./PaymentModal";
  import PaymentCheckPage from "./PaymentCheckPage";

  interface EnergyPageProps {
    currentTokens: number;
    userEmail: string;
    onPaymentSuccess: (addedTokens: number) => void;
  }

  type Order = {
    id: number;
    order_id?: number;
    package_name: string;
    token_amount: number;
    price_vnd: number;
    transfer_code: string;
    account_no: string;
    account_name: string;
    qr_data_url: string;
    status: string;
  };

  type ApiResponse<T = unknown> = {
    success?: boolean;
    detail?: string;
    error?: string;
  } & T;

  type CheckOrderResponse = {
    order?: Order;
    message?: string;
  };

  const API_BASE = "http://127.0.0.1:8002";

  const EnergyPage = ({
    currentTokens,
    userEmail,
    onPaymentSuccess,
  }: EnergyPageProps) => {
    const [loadingCode, setLoadingCode] = useState<string | null>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [isCheckPageOpen, setIsCheckPageOpen] = useState(false);
    const [checkMessage, setCheckMessage] = useState("");
    const [checkMatched, setCheckMatched] = useState<boolean | null>(null);
    const [isCheckingNow, setIsCheckingNow] = useState(false);

    const hasShownPaidAlertRef = useRef(false);

    const packages = [
      {
        id: "starter",
        name: "Gói Khởi Đầu",
        icon: "✨",
        tokens: 100,
        description: "Phù hợp cho người mới bắt đầu hành trình Tarot.",
        usages: "Khoảng 20 lần trải bài",
        price: "29.000đ",
        bestFor: "Mới bắt đầu",
      },
      {
        id: "explorer",
        name: "Gói Khám Phá",
        icon: "⚡",
        tokens: 500,
        description: "Lựa chọn cân bằng giữa chi phí và trải nghiệm sử dụng.",
        usages: "Khoảng 100 lần trải bài",
        price: "99.000đ",
        bestFor: "Nên chọn",
        recommended: true,
      },
      {
        id: "master",
        name: "Gói Thạo Thủ",
        icon: "👑",
        tokens: 1500,
        description: "Dành cho người dùng thường xuyên cần luận giải chuyên sâu.",
        usages: "Khoảng 300 lần trải bài",
        price: "249.000đ",
        bestFor: "Giá tốt nhất",
      },
    ];

    const parseJsonSafely = async <T,>(res: Response): Promise<ApiResponse<T>> => {
    const text = await res.text();

    console.log("API status:", res.status);
    console.log("API raw response:", text);

    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}: ${text}`);
    }

    if (!text) {
      throw new Error("Backend không trả dữ liệu.");
    }

    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      throw new Error(`Backend trả JSON lỗi: ${text}`);
    }
  };

    const getErrorMessage = (error: unknown, fallback: string) => {
      if (error instanceof Error && error.message) return error.message;
      return fallback;
    };

    const mergeOrder = (nextOrder: Order) => {
      setOrder((prev) => {
        if (!prev) return nextOrder;

        return {
          ...prev,
          ...nextOrder,
          qr_data_url: nextOrder.qr_data_url || prev.qr_data_url,
        };
      });
    };
const applyPaidSuccess = async (nextOrder: Order) => {
  const wasPending =
    (order?.status === "pending" || !order?.status) &&
    nextOrder.status === "paid";

  if (wasPending && !hasShownPaidAlertRef.current) {
    hasShownPaidAlertRef.current = true;

    // ✅ cộng token UI
    onPaymentSuccess(nextOrder.token_amount);

    // 🔥 FIX CHÍNH Ở ĐÂY
    try {
      const res = await fetch(
        `http://127.0.0.1:8002/api/users/profile-summary?email=${userEmail}`
      );
      const user = await res.json();

      console.log("USER AFTER PAYMENT:", user);

      // ❗ nếu bạn có setUser thì thêm dòng này
      // setUser(user)

    } catch (err) {
      console.error("Reload user error:", err);
    }

    setCheckMatched(true);
    setCheckMessage(
      `✅ Thanh toán thành công. Bạn đã được cộng ${nextOrder.token_amount} token.`
    );

    setTimeout(() => {
      setIsModalOpen(false);
      setIsCheckPageOpen(false);
    }, 1200);
  }
};
    const createOrder = async (packageCode: string) => {
      try {
        setLoadingCode(packageCode);
        hasShownPaidAlertRef.current = false;
        setCheckMessage("");
        setCheckMatched(null);

        const email = (userEmail || "").trim().toLowerCase();
        if (!email) {
          throw new Error("Không tìm thấy email người dùng.");
        }

        const res = await fetch(`${API_BASE}/api/payments/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: email,
            package_code: packageCode,
          }),
        });

        const data = await parseJsonSafely<Order>(res);

        if (!res.ok || !data?.success) {
          throw new Error(data?.detail || data?.error || "Không tạo được đơn hàng.");
        }

        const { success, ...orderData } = data;
        const createdOrder = orderData as Order;
        setOrder(createdOrder);
        setIsModalOpen(true);
        setIsCheckPageOpen(false);
      } catch (error) {
        console.error("createOrder error:", error);
        alert(getErrorMessage(error, "Lỗi tạo đơn hàng."));
      } finally {
        setLoadingCode(null);
      }
    };

    const refreshStatus = async (silent = false) => {
      if (!order || isRefreshing) return;

      try {
        setIsRefreshing(true);

        const res = await fetch(`${API_BASE}/api/payments/order/${order.id}`);
        const data = await parseJsonSafely<Order>(res);

        if (!res.ok || !data?.success) {
          throw new Error(
            data?.detail || data?.error || "Không kiểm tra được trạng thái thanh toán."
          );
        }

        const { success, ...orderData } = data;
        const nextOrder = orderData as Order;
        mergeOrder(nextOrder);
        applyPaidSuccess(nextOrder);
      } catch (error) {
        console.error("refreshStatus error:", error);
        if (!silent) {
          alert(getErrorMessage(error, "Lỗi kiểm tra thanh toán."));
        }
      } finally {
        setIsRefreshing(false);
      }
    };

  const handleCheckOrderNow = async () => {
    if (!order || isCheckingNow) return;

    try {
      setIsCheckingNow(true);
      setCheckMessage("Đang đối soát giao dịch, vui lòng đợi...");
      setCheckMatched(null);

      const res = await fetch(
        `${API_BASE}/api/payments/check-order/${order.id}`,
        {
          method: "POST",
        }
      );

      const data = await parseJsonSafely<CheckOrderResponse>(res);

      if (!data.success) {
        throw new Error(data.detail || data.error || "Check thất bại");
      }

      const nextOrder = data.order;

      if (!nextOrder) {
        setCheckMatched(false);
        setCheckMessage("❌ Không tìm thấy đơn hàng.");
        return;
      }

      mergeOrder(nextOrder);

      if (nextOrder.status === "paid") {
        await applyPaidSuccess(nextOrder); 

        setCheckMatched(true);
        setCheckMessage(
          data.message || "🎉 Thanh toán thành công!"
        );

        setTimeout(() => {
          setIsCheckPageOpen(false);
          setIsModalOpen(false);
        }, 1500);
      } else {
        setCheckMatched(false);
        setCheckMessage("❌ Chưa thanh toán.");
      }

    } catch (error) {
      console.error("handleCheckOrderNow error:", error);
      setCheckMatched(false);
      setCheckMessage("❌ Lỗi kiểm tra thanh toán");
    } finally {
      setIsCheckingNow(false);
    }
  };

    useEffect(() => {
      if (!isModalOpen || !order || order.status === "paid") return;

      const timer = window.setInterval(() => {
        refreshStatus(true);
      }, 4000);

      return () => window.clearInterval(timer);
    }, [isModalOpen, order?.id, order?.status]);

    return (
      <div className="energy-page">
        <div className="page-header">
          <h1>⚡ Triệu Hồi Năng Lượng</h1>
          <p className="subtitle">
            Nạp token để tiếp tục trải bài Tarot và khám phá hành trình vận mệnh của bạn
          </p>
        </div>

        <div className="current-token-box">Token hiện có: {currentTokens}</div>

        <div className="packages-grid">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`package-card ${pkg.recommended ? "recommended" : ""}`}
            >
              {pkg.recommended && (
                <div className="recommended-badge">⭐ ĐƯỢC CHỌN NHIỀU</div>
              )}

              <div className="package-icon">{pkg.icon}</div>

              <h3>{pkg.name}</h3>

              <div className="package-tokens">
                <span className="token-number">{pkg.tokens}</span>
                <span className="token-label">Token</span>
              </div>

              <p className="package-desc">{pkg.description}</p>
              <p className="package-desc">{pkg.usages}</p>

              <p className="best-for">👉 {pkg.bestFor}</p>

              <div className="package-footer">
                <span className="package-price">{pkg.price}</span>
                <button
                  type="button"
                  className="btn-buy"
                  disabled={loadingCode !== null}
                  onClick={() => createOrder(pkg.id)}
                >
                  {loadingCode === pkg.id ? "Đang tạo QR..." : "💰 Nạp Ngay"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <PaymentModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    order={order}
    onRefreshStatus={refreshStatus} // ✅ ĐÚNG
  />

        <PaymentCheckPage
          isOpen={isCheckPageOpen}
          order={order}
          checking={isCheckingNow}
          message={checkMessage}
          matched={checkMatched}
          onBack={() => {
            setIsCheckPageOpen(false);
            setIsModalOpen(true);
          }}
          onClose={() => setIsCheckPageOpen(false)}
          onCheckNow={handleCheckOrderNow}
          
        />
        

      </div>
    );
  };

  export default EnergyPage;