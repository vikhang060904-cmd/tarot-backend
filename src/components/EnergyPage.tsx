  import { useEffect, useRef, useState } from "react";
  import PaymentModal from "./PaymentModal";
  import PaymentCheckPage from "./PaymentCheckPage";
  import { useLang } from "../i18n/LanguageContext";

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

  const API_BASE = ""; // Dùng proxy để tương thích với Ngrok/Local

  const EnergyPage = ({
    currentTokens,
    userEmail,
    onPaymentSuccess,
  }: EnergyPageProps) => {
    const { lang } = useLang();
    const [loadingCode, setLoadingCode] = useState<string | null>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [isCheckPageOpen, setIsCheckPageOpen] = useState(false);
    const [checkMessage, setCheckMessage] = useState("");
    const [checkMatched, setCheckMatched] = useState<boolean | null>(null);
    const [isCheckingNow, setIsCheckingNow] = useState(false);

    const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [isVnpayRedirecting, setIsVnpayRedirecting] = useState(false);

    const [showSepay, setShowSepay] = useState(true);
    const [showVnpay, setShowVnpay] = useState(true);

    const hasShownPaidAlertRef = useRef(false);

    useEffect(() => {
      const fetchConfig = async () => {
        try {
          const res = await fetch("/api/tarot/config");
          const data = await res.json();
          if (data && data.success) {
            if (data.show_sepay !== undefined) setShowSepay(data.show_sepay);
            if (data.show_vnpay !== undefined) setShowVnpay(data.show_vnpay);
          }
        } catch (err) {
          console.error("Lỗi lấy cấu hình thanh toán:", err);
        }
      };
      fetchConfig();
    }, []);

    const handleBuyClick = async (pkg: any) => {
      setSelectedPackage(pkg);

      // If neither is enabled
      if (!showSepay && !showVnpay) {
        alert(lang === 'vi' ? "🔮 Hệ thống nạp token hiện đang bảo trì. Vui lòng quay lại sau!" : "🔮 Token top-up system is under maintenance. Please try again later!");
        return;
      }

      // If only VietQR is enabled
      if (showSepay && !showVnpay) {
        await createOrder(pkg.id);
        return;
      }

      // If only VNPAY is enabled
      if (!showSepay && showVnpay) {
        try {
          setIsVnpayRedirecting(true);
          const email = (userEmail || "").trim().toLowerCase();
          if (!email) {
            throw new Error(lang === 'vi' ? "Không tìm thấy email người dùng." : "User email not found.");
          }

          const res = await fetch(`${API_BASE}/api/payments/create-vnpay-url`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_email: email,
              package_code: pkg.id,
            }),
          });

          const data = await parseJsonSafely<any>(res);
          if (!res.ok || !data?.success) {
            throw new Error(data?.detail || data?.error || (lang === 'vi' ? "Không tạo được liên kết VNPAY." : "Failed to create VNPAY link."));
          }

          window.location.href = data.payment_url;
        } catch (error) {
          console.error("VNPAY error:", error);
          alert(getErrorMessage(error, lang === 'vi' ? "Lỗi kết nối Cổng VNPAY." : "VNPAY connection error."));
        } finally {
          setIsVnpayRedirecting(false);
        }
        return;
      }

      // If both are enabled, open method selection modal
      setIsMethodModalOpen(true);
    };

    const handleSelectVietQr = async () => {
      if (!selectedPackage) return;
      setIsMethodModalOpen(false);
      await createOrder(selectedPackage.id);
    };

    const handleSelectVnpay = async () => {
      if (!selectedPackage) return;
      try {
        setIsVnpayRedirecting(true);
        const email = (userEmail || "").trim().toLowerCase();
        if (!email) {
          throw new Error(lang === 'vi' ? "Không tìm thấy email người dùng." : "User email not found.");
        }

        const res = await fetch(`${API_BASE}/api/payments/create-vnpay-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: email,
            package_code: selectedPackage.id,
          }),
        });

        const data = await parseJsonSafely<any>(res);
        if (!res.ok || !data?.success) {
          throw new Error(data?.detail || data?.error || (lang === 'vi' ? "Không tạo được liên kết VNPAY." : "Failed to create VNPAY link."));
        }

        // Redirect to VNPay checkout
        window.location.href = data.payment_url;
      } catch (error) {
        console.error("VNPAY error:", error);
        alert(getErrorMessage(error, "Lỗi kết nối Cổng VNPAY."));
      } finally {
        setIsVnpayRedirecting(false);
        setIsMethodModalOpen(false);
      }
    };

    const packages = [
      {
        id: "starter",
        name: lang === 'vi' ? "Gói Khởi Đầu" : "Starter Pack",
        icon: "✨",
        tokens: 100,
        description: lang === 'vi' ? "Phù hợp cho người mới bắt đầu hành trình Tarot." : "Perfect for beginners starting their Tarot journey.",
        usages: lang === 'vi' ? "Khoảng 20 lần trải bài" : "About 20 readings",
        price: "29.000đ",
        bestFor: lang === 'vi' ? "Mới bắt đầu" : "Getting started",
      },
      {
        id: "explorer",
        name: lang === 'vi' ? "Gói Khám Phá" : "Explorer Pack",
        icon: "⚡",
        tokens: 500,
        description: lang === 'vi' ? "Lựa chọn cân bằng giữa chi phí và trải nghiệm sử dụng." : "Balanced choice between cost and experience.",
        usages: lang === 'vi' ? "Khoảng 100 lần trải bài" : "About 100 readings",
        price: "99.000đ",
        bestFor: lang === 'vi' ? "Nên chọn" : "Recommended",
        recommended: true,
      },
      {
        id: "master",
        name: lang === 'vi' ? "Gói Thạo Thủ" : "Master Pack",
        icon: "👑",
        tokens: 1500,
        description: lang === 'vi' ? "Dành cho người dùng thường xuyên cần luận giải chuyên sâu." : "For frequent users needing deep insights.",
        usages: lang === 'vi' ? "Khoảng 300 lần trải bài" : "About 300 readings",
        price: "249.000đ",
        bestFor: lang === 'vi' ? "Giá tốt nhất" : "Best value",
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
        `/api/users/profile-summary?email=${encodeURIComponent(userEmail)}`
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
      `✅ ${lang === 'vi' ? 'Thanh toán thành công' : 'Payment successful'}. ${lang === 'vi' ? 'Bạn đã được cộng' : 'You received'} ${nextOrder.token_amount} token.`
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
          throw new Error(lang === 'vi' ? "Không tìm thấy email người dùng." : "User email not found.");
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
          throw new Error(data?.detail || data?.error || (lang === 'vi' ? "Không tạo được đơn hàng." : "Failed to create order."));
        }

        const { success, ...orderData } = data;
        const createdOrder = orderData as Order;
        setOrder(createdOrder);
        setIsModalOpen(true);
        setIsCheckPageOpen(false);
      } catch (error) {
        console.error("createOrder error:", error);
        alert(getErrorMessage(error, lang === 'vi' ? "Lỗi tạo đơn hàng." : "Error creating order."));
      } finally {
        setLoadingCode(null);
      }
    };

    const refreshStatus = async (force = false) => {
      if (!order || isRefreshing) return;

      try {
        setIsRefreshing(true);

        const endpoint = force 
          ? `${API_BASE}/api/payments/check-order/${order.id}`
          : `${API_BASE}/api/payments/order/${order.id}`;
          
        const res = await fetch(endpoint, { method: force ? 'POST' : 'GET' });
        const data = await parseJsonSafely<any>(res);

        if (!res.ok || !data?.success) {
          if (force) {
             setCheckMessage(data?.detail || data?.error || (lang === 'vi' ? "Không tìm thấy giao dịch." : "Transaction not found."));
             setCheckMatched(false);
          }
          return;
        }

        const nextOrder = data.order || data;
        mergeOrder(nextOrder);
        applyPaidSuccess(nextOrder);
        
        if (force && nextOrder.status === 'paid') {
           setCheckMatched(true);
           setCheckMessage("✅ Thanh toán thành công!");
        }
      } catch (error) {
        console.error("refreshStatus error:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

  const handleCheckOrderNow = async () => {
    if (!order || isCheckingNow) return;

    try {
      setIsCheckingNow(true);
      setCheckMessage(lang === 'vi' ? "Đang đối soát giao dịch, vui lòng đợi..." : "Verifying transaction, please wait...");
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
        setCheckMessage(lang === 'vi' ? "❌ Không tìm thấy đơn hàng." : "❌ Order not found.");
        return;
      }

      mergeOrder(nextOrder);

      if (nextOrder.status === "paid") {
        await applyPaidSuccess(nextOrder); 

        setCheckMatched(true);
        setCheckMessage(
          data.message || (lang === 'vi' ? "🎉 Thanh toán thành công!" : "🎉 Payment successful!")
        );

        setTimeout(() => {
          setIsCheckPageOpen(false);
          setIsModalOpen(false);
        }, 1500);
      } else {
        setCheckMatched(false);
        setCheckMessage(lang === 'vi' ? "❌ Chưa thanh toán." : "❌ Not paid yet.");
      }

    } catch (error) {
      console.error("handleCheckOrderNow error:", error);
      setCheckMatched(false);
      setCheckMessage(lang === 'vi' ? "❌ Lỗi kiểm tra thanh toán" : "❌ Payment check error");
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
          <h1>⚡ {lang === 'vi' ? 'Triệu Hồi Năng Lượng' : 'Summon Energy'}</h1>
          <p className="subtitle">
            {lang === 'vi' ? 'Nạp token để tiếp tục trải bài Tarot và khám phá hành trình vận mệnh của bạn' : 'Recharge tokens to continue your Tarot journey and explore your destiny'}
          </p>
        </div>

        <div className="current-token-box">{lang === 'vi' ? 'Token hiện có' : 'Current tokens'}: {currentTokens}</div>

        <div className="packages-grid">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`package-card ${pkg.recommended ? "recommended" : ""}`}
            >
              {pkg.recommended && (
                <div className="recommended-badge">⭐ {lang === 'vi' ? 'ĐƯỢC CHỌN NHIỀU' : 'MOST POPULAR'}</div>
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
                  onClick={() => handleBuyClick(pkg)}
                >
                  {loadingCode === pkg.id ? (lang === 'vi' ? "Đang tạo QR..." : "Creating QR...") : (lang === 'vi' ? "💰 Nạp Ngay" : "💰 Buy Now")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          order={order}
          onRefreshStatus={refreshStatus}
          onOpenCheck={() => {
            setIsModalOpen(false);
            setIsCheckPageOpen(true);
          }}
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

        {/* PAYMENT METHOD SELECTION MODAL */}
        {isMethodModalOpen && selectedPackage && (
          <div className="payment-overlay" onClick={() => setIsMethodModalOpen(false)}>
            <div className="payment-modal method-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "30px" }}>
              <button type="button" className="payment-close" onClick={() => setIsMethodModalOpen(false)}>×</button>
              
              <h2 className="payment-title" style={{ fontFamily: "Times New Roman", fontSize: "1.8rem" }}>{lang === 'vi' ? 'Chọn Phương Thức' : 'Choose Method'}</h2>
              <p className="payment-quote" style={{ marginBottom: "25px", color: "var(--gold)", fontSize: "0.95rem" }}>
                {lang === 'vi' ? 'Gói đã chọn' : 'Selected package'}: {selectedPackage.name} ({selectedPackage.tokens} Tokens) — {selectedPackage.price}
              </p>

              <div className="payment-methods-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                
                {/* Method 1: VietQR */}
                {showSepay && (
                  <div 
                    className="payment-method-item" 
                    onClick={handleSelectVietQr}
                    style={{
                      border: "1px solid rgba(197, 160, 89, 0.4)",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      background: "rgba(26, 21, 14, 0.85)",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--gold)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.background = "rgba(197, 160, 89, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(197, 160, 89, 0.4)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.background = "rgba(26, 21, 14, 0.85)";
                    }}
                  >
                    <div style={{ fontSize: "2.2rem", filter: "drop-shadow(0 0 8px var(--gold))" }}>📲</div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: "bold", fontSize: "1.1rem", color: "var(--gold)", fontFamily: "Times New Roman" }}>
                        {lang === 'vi' ? 'Chuyển Khoản VietQR (SePay)' : 'VietQR Transfer (SePay)'}
                      </div>
                      <div style={{ fontSize: "0.82rem", opacity: 0.8, marginTop: "4px", lineHeight: "1.4" }}>
                        {lang === 'vi' ? 'Quét mã QR tự động từ ứng dụng Ngân hàng. Kích hoạt cực nhanh trong 30 giây.' : 'Scan auto QR from Banking app. Activated in 30 seconds.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Method 2: VNPAY */}
                {showVnpay && (
                  <div 
                    className="payment-method-item" 
                    onClick={handleSelectVnpay}
                    style={{
                      border: "1px solid rgba(197, 160, 89, 0.4)",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      background: "rgba(26, 21, 14, 0.85)",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3197f9";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.background = "rgba(49, 151, 249, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(197, 160, 89, 0.4)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.background = "rgba(26, 21, 14, 0.85)";
                    }}
                  >
                    <div style={{ fontSize: "2.2rem", filter: "drop-shadow(0 0 8px #3197f9)" }}>💳</div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#3197f9", fontFamily: "Times New Roman", display: "flex", alignItems: "center", gap: "8px" }}>
                        {lang === 'vi' ? 'Cổng Thanh Toán VNPAY' : 'VNPAY Payment Gateway'} <span style={{ background: "#3197f9", color: "white", fontSize: "0.6rem", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", fontWeight: "bold" }}>{lang === 'vi' ? 'Mới' : 'New'}</span>
                      </div>
                      <div style={{ fontSize: "0.82rem", opacity: 0.8, marginTop: "4px", lineHeight: "1.4" }}>
                        {lang === 'vi' ? 'Thanh toán thẻ ATM Nội địa, Visa, Mastercard, JCB hoặc ứng dụng Ví VNPAY.' : 'Pay with ATM, Visa, Mastercard, JCB or VNPAY Wallet.'}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {isVnpayRedirecting && (
                <div style={{ marginTop: "20px", color: "#3197f9", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span className="vnpay-spinner" style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #3197f9",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 1s linear infinite"
                  }}></span>
                  {lang === 'vi' ? 'Đang chuyển hướng tới cổng VNPAY...' : 'Redirecting to VNPAY...'}
                </div>
              )}
            </div>
          </div>
        )}
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

      </div>
    );
  };

  export default EnergyPage;