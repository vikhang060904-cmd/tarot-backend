import { useEffect, useState } from "react";
import {
  Layout,
  Table,
  Button,
  Modal,
  Input,
  message,
  Row,
  Col,
  Spin,
  ConfigProvider,
  theme,
} from "antd";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./AdminDashboard.css";

const API = "";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [readings, setReadings] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "orders" | "readings" | "settings" | "diagnostics" | "simulator"
  >("dashboard");
  const [searchEmail, setSearchEmail] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedReading, setSelectedReading] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user",
    token_balance: 15,
  });

  const [settings, setSettings] = useState<any>({
    current_api: "hf",
    openrouter_model: "",
    openai_model: "gpt-4o-mini",
    has_openrouter_key: false,
    has_hf_key: false,
    has_openai_key: false,
    has_sepay_key: false,
    hf_key: "",
    openrouter_key: "",
    openai_key: "",
    sepay_key: "",
    show_sepay: true,
    show_vnpay: true,
  });

  const [tarotConfig, setTarotConfig] = useState<any>({
    reading_cost: 5,
    follow_up_cost: 2,
    temperature: 0.35,
    max_tokens: 1800,
    system_prompt: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab === "diagnostics" && !diagnostics && !testingConnection) {
      runDiagnostics();
    }
  }, [activeTab, diagnostics]);

  const loadAll = async () => {
    try {
      setLoading(true);

      const [u, o, r, s, set, rds, conf] = await Promise.all([
        fetch(`${API}/api/admin/users`).then(res => res.json()),
        fetch(`${API}/api/admin/orders`).then(res => res.json()),
        fetch(`${API}/api/admin/revenue-by-day`).then(res => res.json()),
        fetch(`${API}/api/admin/dashboard`).then(res => res.json()),
        fetch(`${API}/api/admin/settings`).then(res => res.json()),
        fetch(`${API}/api/admin/readings`).then(res => res.json()),
        fetch(`${API}/api/admin/tarot-config`).then(res => res.json()),
      ]);

      setUsers(Array.isArray(u.data) ? u.data : []);
      setOrders(Array.isArray(o.orders) ? o.orders : o.data || []);
      setRevenue(Array.isArray(r.data) ? r.data : []);
      setStats(s || {});
      setReadings(rds && Array.isArray(rds.data) ? rds.data : []);

      if (set && set.success) {
        setSettings({
          ...set,
          hf_key: set.hf_key_placeholder || "",
          openrouter_key: set.openrouter_key_placeholder || "",
          openai_key: set.openai_key_placeholder || "",
          sepay_key: set.sepay_key_placeholder || "",
        });
      }

      if (conf && conf.success) {
        setTarotConfig(conf);
      }
    } catch (err) {
      console.error(err);
      message.error("❌ Tải dữ liệu hệ thống thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}/toggle-status`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      const resData = await res.json();
      message.success(
        `Đã cập nhật trạng thái người dùng thành: ${
          resData.status === "active" ? "Kích hoạt" : "Bị khoá"
        }`
      );
      loadAll();
    } catch (err: any) {
      message.error(err.message || "Không thể cập nhật trạng thái");
    }
  };

  const giftTokens = async (userId: number, amount: number) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}/gift-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Tặng token thất bại");
      message.success(`🎁 Đã tặng thành công +${amount} Token!`);
      loadAll();
    } catch (err: any) {
      message.error(err.message || "Lỗi khi tặng token");
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_api: settings.current_api,
          openrouter_model: settings.openrouter_model,
          openai_model: settings.openai_model,
          hf_key: settings.hf_key,
          openrouter_key: settings.openrouter_key,
          openai_key: settings.openai_key,
          sepay_key: settings.sepay_key,
          show_sepay: settings.show_sepay,
          show_vnpay: settings.show_vnpay,
        }),
      });
      if (!res.ok) throw new Error("Cập nhật cấu hình thất bại");
      const resData = await res.json();
      message.success("🔧 Cấu hình API hệ thống đã được cập nhật thành công!");
      setSettings({
        ...settings,
        ...resData,
        hf_key: resData.hf_key_placeholder || "",
        openrouter_key: resData.openrouter_key_placeholder || "",
        openai_key: resData.openai_key_placeholder || "",
        sepay_key: resData.sepay_key_placeholder || "",
      });
      loadAll();
    } catch (err: any) {
      message.error(err.message || "Lỗi khi lưu cấu hình");
    } finally {
      setLoading(false);
    }
  };

  const saveTarotConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/admin/tarot-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tarotConfig),
      });
      if (!res.ok) throw new Error("Lưu cấu hình Tarot thất bại");
      message.success("🔮 Cấu hình Tarot & AI nâng cao đã được cập nhật thành công!");
      loadAll();
    } catch (err: any) {
      message.error(err.message || "Lỗi khi lưu cấu hình Tarot");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSepay = async (orderId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/admin/simulate-sepay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (data.success) {
        message.success("🎉 Giả lập thanh toán SePay thành công! Đơn hàng đã được duyệt và cộng Token.");
        loadAll();
      } else {
        throw new Error(data.detail || data.message || "Giả lập thất bại");
      }
    } catch (err: any) {
      message.error(`❌ Lỗi giả lập: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      setTestingConnection(true);
      message.loading({ content: "Đang kiểm tra kết nối API & Cơ sở dữ liệu...", key: "diag" });
      const res = await fetch(`${API}/api/admin/diagnostics`);
      const diag = await res.json();
      setDiagnostics(diag);
      message.success({ content: "🩺 Chẩn đoán hệ thống hoàn tất!", key: "diag" });
    } catch (err: any) {
      message.error({ content: "Chẩn đoán thất bại!", key: "diag" });
    } finally {
      setTestingConnection(false);
    }
  };

  const deleteReading = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xoá lịch sử giải bài?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      className: "admin-modal",
      onOk: async () => {
        await fetch(`${API}/api/admin/readings/${id}`, { method: "DELETE" });
        message.success("Đã xoá lịch sử giải bài thành công");
        loadAll();
      },
    });
  };

  const deleteUser = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xoá người dùng?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      className: "admin-modal",
      onOk: async () => {
        await fetch(`${API}/api/admin/users/${id}`, { method: "DELETE" });
        message.success("Đã xoá người dùng thành công");
        loadAll();
      },
    });
  };

  const deleteOrder = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xoá đơn hàng?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      className: "admin-modal",
      onOk: async () => {
        await fetch(`${API}/api/admin/orders/${id}`, {
          method: "DELETE",
        });
        message.success("Đã xoá đơn hàng thành công");
        loadAll();
      },
    });
  };

  const approveOrder = (id: number) => {
    Modal.confirm({
      title: "Xác nhận duyệt đơn hàng?",
      content: "Hành động này sẽ kích hoạt gói và cộng số dư token cho tài khoản của tín đồ.",
      okText: "Duyệt Đơn",
      okType: "primary",
      cancelText: "Huỷ",
      className: "admin-modal",
      onOk: async () => {
        try {
          const res = await fetch(`${API}/api/admin/orders/${id}/approve`, {
            method: "POST",
          });
          if (!res.ok) throw new Error("Duyệt đơn hàng thất bại!");
          message.success("🎉 Duyệt đơn hàng thành công!");
          loadAll();
        } catch (err) {
          console.error(err);
          message.error("❌ Duyệt đơn thất bại!");
        }
      },
    });
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.email.includes("@")) {
      message.error("❌ Email không hợp lệ!");
      return;
    }
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Thêm tín đồ thất bại!");
      }

      message.success("🎉 Đã thêm tín đồ mới thành công!");
      setShowAddUser(false);
      setNewUser({ email: "", password: "", role: "user", token_balance: 15 });
      loadAll();
    } catch (err: any) {
      console.error(err);
      message.error(`❌ ${err.message || "Lỗi khi thêm tín đồ"}`);
    }
  };

  const handleUpdate = async () => {
    try {
      await fetch(`${API}/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editUser),
      });

      message.success("Đã cập nhật thông tin người dùng!");
      setEditUser(null);
      loadAll();
    } catch (err) {
      console.error(err);
      message.error("❌ Cập nhật thất bại!");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const pendingOrders = orders.filter(o => o.status === "pending");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="admin-chart-tooltip">
          <p className="label">{`Ngày: ${label}`}</p>
          <p>{`Doanh thu: ${payload[0].value.toLocaleString("vi-VN")} VND`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#a855f7",
          colorBgBase: "#0c061a",
          colorTextBase: "#f0e7ff",
        },
      }}
    >
      <Layout className="admin-layout" style={{ minHeight: "100vh" }}>
        {/* SIDEBAR */}
        <Layout.Sider width={280} className="admin-sidebar" breakpoint="lg" collapsedWidth="0">
          <div className="admin-sidebar-logo">
            <h2>🔮 TAROT ADMIN MAX</h2>
            <div style={{ color: "#ffd700", fontSize: "0.75rem", marginTop: 4, letterSpacing: 1 }}>
              LEVEL SUPER MAX ACTIVE
            </div>
          </div>
          <div className="admin-nav-menu">
            <div
              className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <span>📊</span> Dashboard Tổng Quan
            </div>
            <div
              className={`admin-nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <span>👥</span> Quản Lý Người Dùng
            </div>
            <div
              className={`admin-nav-item ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <span>💸</span> Lịch Sử Giao Dịch
            </div>
            <div
              className={`admin-nav-item ${activeTab === "readings" ? "active" : ""}`}
              onClick={() => setActiveTab("readings")}
            >
              <span>📖</span> Nhật Ký Trải Bài
            </div>
            <div
              className={`admin-nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span>⚙️</span> Cấu Hình Tarot & AI
            </div>
            <div
              className={`admin-nav-item ${activeTab === "diagnostics" ? "active" : ""}`}
              onClick={() => setActiveTab("diagnostics")}
            >
              <span>🩺</span> Chẩn Đoán & Logs
            </div>
            <div
              className={`admin-nav-item ${activeTab === "simulator" ? "active" : ""}`}
              onClick={() => setActiveTab("simulator")}
            >
              <span>🧪</span> Sandbox Webhook Sepay
            </div>
          </div>
        </Layout.Sider>

        {/* MAIN */}
        <Layout style={{ background: "transparent" }}>
          <Layout.Header className="admin-header">
            <div className="admin-header-title">
              🔮 <span>Bảng Điều Khiển Quản Trị Tối Thượng (Level Max)</span>
            </div>
            <div className="admin-header-actions">
              <Button className="admin-btn-back" onClick={() => (window.location.href = "/")}>
                Quay lại App
              </Button>
              <Button className="admin-btn-logout" onClick={logout}>
                Đăng Xuất
              </Button>
            </div>
          </Layout.Header>

          <Layout.Content className="admin-content-container">
            {loading && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <Spin size="large" />
              </div>
            )}

            {/* TAB 1: DASHBOARD & REVENUE */}
            {activeTab === "dashboard" && (
              <>
                {/* STATS ROW */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="admin-stat-card blue">
                      <div className="admin-stat-icon-wrapper">
                        <span>👥</span>
                        <span className="admin-stat-trend up">Đang hoạt động</span>
                      </div>
                      <div className="admin-stat-title">Tín Chủ Hệ Thống</div>
                      <div className="admin-stat-value">{(stats.total_users || 0).toLocaleString()}</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="admin-stat-card purple">
                      <div className="admin-stat-icon-wrapper">
                        <span>💸</span>
                        <span className="admin-stat-trend up">Hóa đơn</span>
                      </div>
                      <div className="admin-stat-title">Tổng Đơn Hàng</div>
                      <div className="admin-stat-value">{(stats.total_orders || 0).toLocaleString()}</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="admin-stat-card gold">
                      <div className="admin-stat-icon-wrapper">
                        <span>💰</span>
                        <span className="admin-stat-trend up">Doanh thu</span>
                      </div>
                      <div className="admin-stat-title">Tổng Doanh Thu</div>
                      <div className="admin-stat-value">
                        {(stats.total_revenue || 0).toLocaleString("vi-VN")}{" "}
                        <span style={{ fontSize: "1rem" }}>VND</span>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="admin-stat-card pink">
                      <div className="admin-stat-icon-wrapper">
                        <span>📖</span>
                        <span className="admin-stat-trend up">Tarot</span>
                      </div>
                      <div className="admin-stat-title">Lượt Trải Bài</div>
                      <div className="admin-stat-value">{readings.length}</div>
                    </div>
                  </Col>
                </Row>

                {/* REVENUE CHART */}
                <div className="admin-panel-card" style={{ marginTop: 24 }}>
                  <div
                    style={{
                      padding: "20px 24px 0 24px",
                      color: "white",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                    }}
                  >
                    📈 Doanh Thu Hệ Thống Gần Đây
                  </div>
                  <div style={{ padding: 24 }}>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={revenue}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffd700" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ffd700" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
                        <XAxis dataKey="day" stroke="#b5a9c6" tickLine={false} />
                        <YAxis stroke="#b5a9c6" tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#ffd700"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === "users" && (
              <div className="admin-panel-card" style={{ marginTop: 0 }}>
                <div
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <span style={{ color: "white", fontSize: "1.1rem", fontWeight: 600 }}>
                    👥 Danh Sách Tín Đồ Tarot
                  </span>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Button
                      type="primary"
                      style={{
                        background: "linear-gradient(135deg, #ffd700, #d4af37)",
                        borderColor: "#ffd700",
                        color: "#000",
                        fontWeight: 600,
                        borderRadius: "8px",
                      }}
                      onClick={() => setShowAddUser(true)}
                    >
                      🧙‍♂️ Thêm Tín Đồ Mới
                    </Button>
                    <Input
                      placeholder="🔍 Tìm kiếm Email..."
                      value={searchEmail}
                      onChange={e => setSearchEmail(e.target.value)}
                      style={{ width: 280 }}
                      className="admin-modal-input"
                    />
                  </div>
                </div>
                <Table
                  rowKey="id"
                  dataSource={filteredUsers}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "Tín Chủ (Email)",
                      dataIndex: "email",
                      render: text => <span style={{ color: "#fff", fontWeight: 500 }}>{text}</span>,
                    },
                    {
                      title: "Vai Trò",
                      dataIndex: "role",
                      render: role => (
                        <span className={`admin-tag-role ${role === "admin" ? "admin" : "user"}`}>
                          {role === "admin" ? "🧙‍♂️ Admin" : "🔮 User"}
                        </span>
                      ),
                    },
                    {
                      title: "Số Dư Token",
                      dataIndex: "token_balance",
                      render: tokens => (
                        <span style={{ color: "#ffd700", fontWeight: 600 }}>🌟 {tokens || 0} Token</span>
                      ),
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      render: status => (
                        <span
                          className={`admin-badge-status`}
                          style={{
                            background:
                              status === "banned"
                                ? "rgba(239, 68, 68, 0.12)"
                                : "rgba(52, 211, 153, 0.12)",
                            color: status === "banned" ? "#fca5a5" : "#34d399",
                            border:
                              status === "banned"
                                ? "1px solid rgba(239, 68, 68, 0.3)"
                                : "1px solid rgba(52, 211, 153, 0.3)",
                          }}
                        >
                          {status === "banned" ? "🚫 Bị Khoá" : "🟢 Hoạt Động"}
                        </span>
                      ),
                    },
                    {
                      title: "Thao Tác",
                      render: u => (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <Button className="admin-btn-action edit" onClick={() => setEditUser(u)}>
                            Sửa
                          </Button>
                          <Button
                            className="admin-btn-action"
                            style={{
                              background:
                                u.status === "banned"
                                  ? "rgba(52, 211, 153, 0.12)"
                                  : "rgba(239, 68, 68, 0.12)",
                              border:
                                u.status === "banned"
                                  ? "1px solid rgba(52, 211, 153, 0.35)"
                                  : "1px solid rgba(239, 68, 68, 0.35)",
                              color: u.status === "banned" ? "#66bb6a" : "#fca5a5",
                            }}
                            onClick={() => toggleUserStatus(u.id)}
                          >
                            {u.status === "banned" ? "🔓 Mở Khoá" : "🔒 Khoá"}
                          </Button>
                          <Button
                            className="admin-btn-action"
                            style={{
                              background: "rgba(168, 85, 247, 0.12)",
                              border: "1px solid rgba(168, 85, 247, 0.35)",
                              color: "#d8b4fe",
                            }}
                            onClick={() => giftTokens(u.id, 10)}
                          >
                            🎁 +10 🌟
                          </Button>
                          <Button className="admin-btn-action delete" onClick={() => deleteUser(u.id)}>
                            Xoá
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* TAB 3: ORDER HISTORY */}
            {activeTab === "orders" && (
              <div className="admin-panel-card" style={{ marginTop: 0 }}>
                <div style={{ padding: "20px 24px", color: "white", fontSize: "1.1rem", fontWeight: 600 }}>
                  💸 Lịch Sử Nạp Vận Mệnh (Đơn Giao Dịch)
                </div>
                <Table
                  rowKey="id"
                  dataSource={orders}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "Người Nạp",
                      dataIndex: "user_email",
                      render: text => <span style={{ color: "#fff", fontWeight: 500 }}>{text}</span>,
                    },
                    {
                      title: "Giá Trị",
                      dataIndex: "price_vnd",
                      render: price => (
                        <span style={{ color: "#34d399", fontWeight: 600 }}>
                          {price ? price.toLocaleString("vi-VN") : "0"} VND
                        </span>
                      ),
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      render: status => (
                        <span className={`admin-badge-status ${status === "paid" ? "paid" : "pending"}`}>
                          {status === "paid" ? "🟢 Thành Công" : "🟡 Chờ Duyệt"}
                        </span>
                      ),
                    },
                    {
                      title: "Ngày Thực Hiện",
                      dataIndex: "paid_at",
                      render: date => (
                        <span style={{ color: "#b5a9c6", fontSize: "0.85rem" }}>
                          {date ? new Date(date).toLocaleString("vi-VN") : "Chờ giao dịch..."}
                        </span>
                      ),
                    },
                    {
                      title: "Thao Tác",
                      render: o => (
                        <div style={{ display: "flex", gap: "8px" }}>
                          {o.status === "pending" && (
                            <>
                              <Button
                                style={{
                                  background: "linear-gradient(135deg, #10b981, #059669)",
                                  border: "none",
                                  color: "#fff",
                                  fontWeight: 500,
                                }}
                                onClick={() => approveOrder(o.id)}
                              >
                                Duyệt Đơn
                              </Button>
                              <Button
                                style={{
                                  background: "rgba(168, 85, 247, 0.12)",
                                  border: "1px solid rgba(168, 85, 247, 0.35)",
                                  color: "#d8b4fe",
                                }}
                                onClick={() => handleSimulateSepay(o.id)}
                              >
                                🧪 Sandbox Pay
                              </Button>
                            </>
                          )}
                          <Button className="admin-btn-action delete" onClick={() => deleteOrder(o.id)}>
                            Xoá Đơn
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* TAB 4: READINGS LOG */}
            {activeTab === "readings" && (
              <div className="admin-panel-card" style={{ marginTop: 0 }}>
                <div style={{ padding: "20px 24px", color: "white", fontSize: "1.1rem", fontWeight: 600 }}>
                  📖 Nhật Ký Giải Bài Tarot & AI
                </div>
                <Table
                  rowKey="id"
                  dataSource={readings}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "Tín Chủ (Email)",
                      dataIndex: "user_email",
                      render: text => <span style={{ color: "#fff" }}>{text}</span>,
                    },
                    {
                      title: "Chủ Đề",
                      dataIndex: "topic",
                      render: text => (
                        <span style={{ color: "#c084fc", fontWeight: 600, textTransform: "capitalize" }}>
                          {text === "love"
                            ? "💕 Tình Yêu"
                            : text === "career"
                            ? "💼 Sự Nghiệp"
                            : text === "general"
                            ? "🔮 Tổng Quan"
                            : text}
                        </span>
                      ),
                    },
                    {
                      title: "Câu Hỏi Tín Chủ",
                      dataIndex: "question",
                      ellipsis: true,
                      render: text => <span style={{ color: "#b5a9c6" }}>{text || "(Để trống)"}</span>,
                    },
                    {
                      title: "Thời Gian",
                      dataIndex: "created_at",
                      render: text => (
                        <span style={{ color: "#8b7e9f", fontSize: "0.85rem" }}>
                          {new Date(text).toLocaleString("vi-VN")}
                        </span>
                      ),
                    },
                    {
                      title: "Hành Động",
                      render: r => (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            style={{
                              background: "rgba(168, 85, 247, 0.15)",
                              border: "1px solid rgba(168, 85, 247, 0.35)",
                              color: "#d8b4fe",
                            }}
                            onClick={() => setSelectedReading(r)}
                          >
                            Xem Chi Tiết AI
                          </Button>
                          <Button className="admin-btn-action delete" onClick={() => deleteReading(r.id)}>
                            Xoá
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* TAB 5: SYSTEM CONFIGURATION & TAROT AI CONFIG */}
            {activeTab === "settings" && (
              <Row gutter={[24, 24]}>
                {/* ADVANCED TAROT CONFIG */}
                <Col xs={24} lg={12}>
                  <div className="admin-panel-card" style={{ padding: "24px", minHeight: "100%" }}>
                    <div
                      style={{
                        color: "#ffd700",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        marginBottom: "20px",
                        borderBottom: "1px solid rgba(255, 215, 0, 0.2)",
                        paddingBottom: "10px",
                      }}
                    >
                      🔮 Cấu Hình Trải Bài & AI Max Level
                    </div>

                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                          Phí Trải Bài (Token 🌟):
                        </div>
                        <Input
                          type="number"
                          value={tarotConfig.reading_cost}
                          onChange={e =>
                            setTarotConfig({ ...tarotConfig, reading_cost: Number(e.target.value) })
                          }
                          className="admin-modal-input"
                          style={{ marginBottom: "16px", width: "100%" }}
                        />
                      </Col>
                      <Col span={12}>
                        <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                          Phí Hỏi Tiếp (Token 🌟):
                        </div>
                        <Input
                          type="number"
                          value={tarotConfig.follow_up_cost}
                          onChange={e =>
                            setTarotConfig({ ...tarotConfig, follow_up_cost: Number(e.target.value) })
                          }
                          className="admin-modal-input"
                          style={{ marginBottom: "16px", width: "100%" }}
                        />
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                          Nhiệt Độ Trả Lời (Temperature):
                        </div>
                        <Input
                          type="number"
                          step="0.05"
                          value={tarotConfig.temperature}
                          onChange={e =>
                            setTarotConfig({ ...tarotConfig, temperature: Number(e.target.value) })
                          }
                          className="admin-modal-input"
                          style={{ marginBottom: "16px", width: "100%" }}
                        />
                      </Col>
                      <Col span={12}>
                        <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                          Giới Hạn Token AI (Max Tokens):
                        </div>
                        <Input
                          type="number"
                          value={tarotConfig.max_tokens}
                          onChange={e =>
                            setTarotConfig({ ...tarotConfig, max_tokens: Number(e.target.value) })
                          }
                          className="admin-modal-input"
                          style={{ marginBottom: "16px", width: "100%" }}
                        />
                      </Col>
                    </Row>

                    <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                      System Instruction (Tư Duy AI Tarot):
                    </div>
                    <Input.TextArea
                      rows={12}
                      value={tarotConfig.system_prompt}
                      onChange={e => setTarotConfig({ ...tarotConfig, system_prompt: e.target.value })}
                      className="admin-modal-input"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(168, 85, 247, 0.25)",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "10px",
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        marginBottom: "20px",
                        height: "auto",
                      }}
                      placeholder="Nhập System Prompt định hướng cho Tarot AI..."
                    />

                    <Button
                      type="primary"
                      style={{
                        background: "linear-gradient(135deg, #ffd700, #d4af37)",
                        borderColor: "#ffd700",
                        color: "#000",
                        height: "44px",
                        borderRadius: "10px",
                        fontWeight: 700,
                        width: "100%",
                        boxShadow: "0 4px 15px rgba(255, 215, 0, 0.2)",
                      }}
                      onClick={saveTarotConfig}
                    >
                      🔮 Lưu Cấu Hinh Tarot & AI
                    </Button>
                  </div>
                </Col>

                {/* API PROVIDERS CONFIG */}
                <Col xs={24} lg={12}>
                  <div className="admin-panel-card" style={{ padding: "24px", minHeight: "100%" }}>
                    <div
                      style={{
                        color: "white",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        marginBottom: "20px",
                        borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
                        paddingBottom: "10px",
                      }}
                    >
                      🔧 Cấu Hình API Gateway & Keys
                    </div>

                    <div style={{ color: "#b5a9c6", marginBottom: "12px", fontSize: "0.9rem" }}>
                      Chọn API Provider Cho Trình Giải Nghĩa Tarot:
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
                      {/* HuggingFace */}
                      <div
                        style={{
                          flex: "1 1 160px",
                          padding: "16px",
                          borderRadius: "12px",
                          background:
                            settings.current_api === "hf"
                              ? "rgba(168, 85, 247, 0.12)"
                              : "rgba(255, 255, 255, 0.02)",
                          border:
                            settings.current_api === "hf"
                              ? "2px solid #a855f7"
                              : "1px solid rgba(168, 85, 247, 0.15)",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          textAlign: "center",
                        }}
                        onClick={() => setSettings({ ...settings, current_api: "hf" })}
                      >
                        <span style={{ fontSize: "1.8rem" }}>🤗</span>
                        <div style={{ fontWeight: 700, color: "white", marginTop: "6px", fontSize: "0.85rem" }}>
                          HuggingFace
                        </div>
                        {settings.current_api === "hf" && (
                          <div style={{ color: "#a855f7", fontSize: "0.75rem", marginTop: 4 }}>✓ Đang dùng</div>
                        )}
                      </div>

                      {/* OpenRouter */}
                      <div
                        style={{
                          flex: "1 1 160px",
                          padding: "16px",
                          borderRadius: "12px",
                          background:
                            settings.current_api === "openrouter"
                              ? "rgba(168, 85, 247, 0.12)"
                              : "rgba(255, 255, 255, 0.02)",
                          border:
                            settings.current_api === "openrouter"
                              ? "2px solid #a855f7"
                              : "1px solid rgba(168, 85, 247, 0.15)",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          textAlign: "center",
                        }}
                        onClick={() => setSettings({ ...settings, current_api: "openrouter" })}
                      >
                        <span style={{ fontSize: "1.8rem" }}>🚀</span>
                        <div style={{ fontWeight: 700, color: "white", marginTop: "6px", fontSize: "0.85rem" }}>
                          OpenRouter
                        </div>
                        {settings.current_api === "openrouter" && (
                          <div style={{ color: "#a855f7", fontSize: "0.75rem", marginTop: 4 }}>✓ Đang dùng</div>
                        )}
                      </div>

                      {/* OpenAI */}
                      <div
                        style={{
                          flex: "1 1 160px",
                          padding: "16px",
                          borderRadius: "12px",
                          background:
                            settings.current_api === "openai"
                              ? "rgba(52, 211, 153, 0.12)"
                              : "rgba(255, 255, 255, 0.02)",
                          border:
                            settings.current_api === "openai"
                              ? "2px solid #34d399"
                              : "1px solid rgba(52, 211, 153, 0.15)",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          textAlign: "center",
                        }}
                        onClick={() => setSettings({ ...settings, current_api: "openai" })}
                      >
                        <span style={{ fontSize: "1.8rem" }}>🧠</span>
                        <div style={{ fontWeight: 700, color: "white", marginTop: "6px", fontSize: "0.85rem" }}>
                          OpenAI (GPT)
                        </div>
                        {settings.current_api === "openai" && (
                          <div style={{ color: "#34d399", fontSize: "0.75rem", marginTop: 4 }}>✓ Đang dùng</div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                        Mô Hình OpenRouter (Model Path):
                      </div>
                      <Input
                        value={settings.openrouter_model}
                        onChange={e => setSettings({ ...settings, openrouter_model: e.target.value })}
                        className="admin-modal-input"
                        placeholder="vd: google/gemini-2.5-flash"
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                        Mô Hình OpenAI (OPENAI_MODEL):
                      </div>
                      <Input
                        value={settings.openai_model}
                        onChange={e => setSettings({ ...settings, openai_model: e.target.value })}
                        className="admin-modal-input"
                        placeholder="vd: gpt-4o-mini, gpt-4o, gpt-4-turbo"
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                        Hugging Face Token Key (HF_API_KEY):
                      </div>
                      <Input.Password
                        value={settings.hf_key}
                        onChange={e => setSettings({ ...settings, hf_key: e.target.value })}
                        className="admin-modal-input"
                        placeholder="Nhập HF Bearer Token..."
                      />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                        OpenRouter API Key (OPENROUTER_API_KEY):
                      </div>
                      <Input.Password
                        value={settings.openrouter_key}
                        onChange={e => setSettings({ ...settings, openrouter_key: e.target.value })}
                        className="admin-modal-input"
                        placeholder="Nhập OpenRouter Token..."
                      />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                        🧠 OpenAI API Key (OPENAI_API_KEY):
                      </div>
                      <Input.Password
                        value={settings.openai_key}
                        onChange={e => setSettings({ ...settings, openai_key: e.target.value })}
                        className="admin-modal-input"
                        placeholder="sk-... (OpenAI Secret Key)"
                        style={{
                          borderColor: settings.has_openai_key ? "rgba(52,211,153,0.5)" : undefined,
                        }}
                      />
                      {settings.has_openai_key && (
                        <div style={{ color: "#34d399", fontSize: "0.78rem", marginTop: 4 }}>✓ API Key đã cấu hình</div>
                      )}
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <div style={{ color: "#b5a9c6", marginBottom: "6px", fontSize: "0.9rem" }}>
                        Mã bảo mật SePay Webhook (SEPAY_WEBHOOK_API_KEY):
                      </div>
                      <Input.Password
                        value={settings.sepay_key}
                        onChange={e => setSettings({ ...settings, sepay_key: e.target.value })}
                        className="admin-modal-input"
                        placeholder="Mã bảo mật truyền trong header..."
                      />
                    </div>

                    <div
                      style={{
                        color: "white",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        marginTop: "24px",
                        marginBottom: "16px",
                        borderBottom: "1px dashed rgba(168, 85, 247, 0.2)",
                        paddingBottom: "8px",
                      }}
                    >
                      💳 Cấu Hình Hiển Thị Thanh Toán
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "#b5a9c6", cursor: "pointer", fontSize: "0.92rem" }}>
                        <input
                          type="checkbox"
                          checked={settings.show_sepay}
                          onChange={e => setSettings({ ...settings, show_sepay: e.target.checked })}
                          style={{
                            width: "18px",
                            height: "18px",
                            accentColor: "#a855f7",
                            cursor: "pointer"
                          }}
                        />
                        <span>Hiển thị phương thức <strong>Chuyển Khoản VietQR (SePay)</strong></span>
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "#b5a9c6", cursor: "pointer", fontSize: "0.92rem" }}>
                        <input
                          type="checkbox"
                          checked={settings.show_vnpay}
                          onChange={e => setSettings({ ...settings, show_vnpay: e.target.checked })}
                          style={{
                            width: "18px",
                            height: "18px",
                            accentColor: "#3197f9",
                            cursor: "pointer"
                          }}
                        />
                        <span>Hiển thị phương thức <strong>Cổng Thanh Toán VNPAY</strong></span>
                      </label>
                    </div>

                    <Button
                      type="primary"
                      style={{
                        background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                        border: "none",
                        height: "44px",
                        borderRadius: "10px",
                        fontWeight: 700,
                        width: "100%",
                        boxShadow: "0 4px 15px rgba(168, 85, 247, 0.35)",
                      }}
                      onClick={saveSettings}
                    >
                      💾 Lưu API Gateway & Keys
                    </Button>
                  </div>
                </Col>
              </Row>
            )}

            {/* TAB 6: DIAGNOSTICS & STATUS */}
            {activeTab === "diagnostics" && (
              <div className="admin-panel-card" style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
                    paddingBottom: "12px",
                    marginBottom: "24px",
                  }}
                >
                  <span style={{ color: "white", fontSize: "1.25rem", fontWeight: 700 }}>
                    🩺 Trạng Thái Kết Nối & Chẩn Đoán Hệ Thống
                  </span>
                  <Button
                    type="primary"
                    style={{ background: "#ffd700", borderColor: "#ffd700", color: "#000", fontWeight: 600 }}
                    onClick={runDiagnostics}
                    loading={testingConnection}
                  >
                    🚀 Bắt Đầu Kiểm Tra Live
                  </Button>
                </div>

                <Row gutter={[24, 24]}>
                  {/* COGNITIVE APIS STATUS */}
                  <Col xs={24} md={12}>
                    <div
                      style={{
                        padding: "18px",
                        background: "rgba(12, 6, 26, 0.35)",
                        borderRadius: "12px",
                        border: "1px solid rgba(168, 85, 247, 0.15)",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: "#c084fc",
                          marginBottom: "14px",
                        }}
                      >
                        🤗 HuggingFace Endpoint Status
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#b5a9c6" }}>Kết nối internet / Auth:</span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: diagnostics?.hf?.status === "active" ? "#34d399" : "#fca5a5",
                          }}
                        >
                          {diagnostics?.hf?.status === "active" ? "🟢 Hoạt Động Mượt" : `🔴 Lỗi: ${diagnostics?.hf?.status || "Chưa Test"}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#b5a9c6" }}>Độ trễ phản hồi (Latency):</span>
                        <span style={{ color: "#ffd700", fontWeight: 600 }}>
                          {diagnostics?.hf?.latency_sec ? `${diagnostics.hf.latency_sec} giây` : "Chưa Đo"}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "18px",
                        background: "rgba(12, 6, 26, 0.35)",
                        borderRadius: "12px",
                        border: "1px solid rgba(168, 85, 247, 0.15)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: "#c084fc",
                          marginBottom: "14px",
                        }}
                      >
                        🚀 OpenRouter Endpoint Status
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#b5a9c6" }}>Trạng thái API Key:</span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: diagnostics?.openrouter?.status === "active" ? "#34d399" : "#fca5a5",
                          }}
                        >
                          {diagnostics?.openrouter?.status === "active" ? "🟢 Sẵn Sàng" : `🔴 Lỗi: ${diagnostics?.openrouter?.status || "Chưa Test"}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#b5a9c6" }}>Độ trễ phản hồi:</span>
                        <span style={{ color: "#ffd700", fontWeight: 600 }}>
                          {diagnostics?.openrouter?.latency_sec
                            ? `${diagnostics.openrouter.latency_sec} giây`
                            : "Chưa Đo"}
                        </span>
                      </div>
                    </div>
                  </Col>

                  {/* DATABASE AND SYSTEM STATS */}
                  <Col xs={24} md={12}>
                    <div
                      style={{
                        padding: "18px",
                        background: "rgba(12, 6, 26, 0.35)",
                        borderRadius: "12px",
                        border: "1px solid rgba(168, 85, 247, 0.15)",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: "#c084fc",
                          marginBottom: "14px",
                        }}
                      >
                        📂 Kích Thước Bảng Cơ Sở Dữ Liệu MySQL
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#b5a9c6" }}>Người dùng (Users Table):</span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>
                          {diagnostics?.counts?.users ?? "..."} bản ghi
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#b5a9c6" }}>Hóa đơn nạp (Orders Table):</span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>
                          {diagnostics?.counts?.orders ?? "..."} bản ghi
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#b5a9c6" }}>Nhật ký Tarot (History Table):</span>
                        <span style={{ color: "#ffd700", fontWeight: 600 }}>
                          {diagnostics?.counts?.readings ?? "..."} bản ghi
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#b5a9c6" }}>Phiên chat (Sessions Table):</span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>
                          {diagnostics?.counts?.sessions ?? "..."} bản ghi
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "18px",
                        background: "rgba(12, 6, 26, 0.35)",
                        borderRadius: "12px",
                        border: "1px solid rgba(168, 85, 247, 0.15)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: "#c084fc",
                          marginBottom: "14px",
                        }}
                      >
                        💻 Thông Tin Server Backend
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#b5a9c6" }}>Hệ điều hành / OS:</span>
                        <span style={{ color: "#fff" }}>{diagnostics?.system?.platform ?? "..."}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#b5a9c6" }}>Phiên bản Python:</span>
                        <span style={{ color: "#fff", fontSize: "0.85rem" }}>
                          {diagnostics?.system?.python_version?.split(" ")[0] ?? "..."}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#b5a9c6" }}>Thời gian Server:</span>
                        <span style={{ color: "#fff" }}>{diagnostics?.system?.server_time ?? "..."}</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* TAB 7: SANDBOX WEBHOOK SIMULATOR */}
            {activeTab === "simulator" && (
              <div className="admin-panel-card" style={{ padding: "24px" }}>
                <div style={{ borderBottom: "1px solid rgba(168, 85, 247, 0.2)", paddingBottom: "12px", marginBottom: "20px" }}>
                  <span style={{ color: "white", fontSize: "1.25rem", fontWeight: 700 }}>
                    🧪 Sandbox Giả Lập Giao Dịch VietQR / SePay Webhook
                  </span>
                  <div style={{ color: "#b5a9c6", fontSize: "0.85rem", marginTop: "6px" }}>
                    Dành cho Quản Trị Viên kiểm thử tính đồng bộ dữ liệu mà không cần chi tiền thật. Kích hoạt trực tiếp hệ thống xử lý Webhook.
                  </div>
                </div>

                {pendingOrders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#8b7e9f" }}>
                    <span style={{ fontSize: "3rem" }}>✨</span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "10px" }}>Không có đơn hàng nào đang chờ duyệt</div>
                    <div style={{ fontSize: "0.85rem" }}>Tạo một hóa đơn nạp token trong ứng dụng Tarot trước khi bắt đầu kiểm thử.</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: "white", fontWeight: 600, marginBottom: "12px" }}>Danh sách đơn hàng chờ Sandbox duyệt nạp:</div>
                    <Table
                      rowKey="id"
                      dataSource={pendingOrders}
                      columns={[
                        {
                          title: "Mã Đơn",
                          dataIndex: "id",
                          render: id => <span style={{ color: "#ffd700" }}>#{id}</span>,
                        },
                        {
                          title: "Email Tín Đồ",
                          dataIndex: "user_email",
                        },
                        {
                          title: "Gói Chọn",
                          dataIndex: "package_name",
                          render: name => <span style={{ color: "#c084fc", fontWeight: 600 }}>{name}</span>,
                        },
                        {
                          title: "Số Dư Cộng",
                          dataIndex: "token_amount",
                          render: amount => <span style={{ color: "#34d399", fontWeight: 600 }}>+{amount} 🌟</span>,
                        },
                        {
                          title: "Số Tiền",
                          dataIndex: "price_vnd",
                          render: price => <span style={{ color: "#34d399" }}>{price.toLocaleString()} VND</span>,
                        },
                        {
                          title: "Hành Động Sandbox",
                          render: o => (
                            <Button
                              type="primary"
                              style={{
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                border: "none",
                                fontWeight: 700,
                              }}
                              onClick={() => handleSimulateSepay(o.id)}
                            >
                              🚀 Giả Lập Sepay Pay
                            </Button>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </div>
            )}
          </Layout.Content>
        </Layout>

        {/* DETAILS MODAL FOR READINGS LOG */}
        <Modal
          open={!!selectedReading}
          title={
            <div style={{ color: "#ffd700", display: "flex", gap: "8px", alignItems: "center" }}>
              <span>🔮 Luận Giải Chi Tiết AI Tarot</span>
            </div>
          }
          onCancel={() => setSelectedReading(null)}
          footer={[
            <Button key="close" type="primary" onClick={() => setSelectedReading(null)}>
              Đóng Lại
            </Button>,
          ]}
          width={800}
          className="admin-modal"
        >
          {selectedReading && (
            <div style={{ padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(168, 85, 247, 0.15)", paddingBottom: "10px", marginBottom: "14px" }}>
                <div>
                  <div style={{ color: "#b5a9c6", fontSize: "0.8rem" }}>Tín Chủ:</div>
                  <div style={{ color: "#fff", fontWeight: 600 }}>{selectedReading.user_email}</div>
                </div>
                <div>
                  <div style={{ color: "#b5a9c6", fontSize: "0.8rem" }}>Chủ đề:</div>
                  <div style={{ color: "#ffd700", fontWeight: 600, textTransform: "capitalize" }}>
                    {selectedReading.topic}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#b5a9c6", fontSize: "0.8rem" }}>Thời gian:</div>
                  <div style={{ color: "#fff" }}>
                    {new Date(selectedReading.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ color: "#ffd700", fontWeight: 600, marginBottom: "6px" }}>Câu hỏi của tín chủ:</div>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(168, 85, 247, 0.1)", color: "#fff", fontStyle: "italic" }}>
                  "{selectedReading.question || "Để trống (Luận giải tổng quan)"}"
                </div>
              </div>

              <div>
                <div style={{ color: "#ffd700", fontWeight: 600, marginBottom: "6px" }}>Lời giải từ AI Tarot Reader:</div>
                <div
                  style={{
                    background: "rgba(12, 6, 26, 0.5)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(168, 85, 247, 0.2)",
                    color: "#f0e7ff",
                    maxHeight: "350px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                  }}
                >
                  {selectedReading.answer}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* EDIT USER OVERLAY MODAL */}
        <Modal
          open={!!editUser}
          title="🔮 Cập Nhật Quyền Hạn & Số Dư"
          onCancel={() => setEditUser(null)}
          onOk={handleUpdate}
          className="admin-modal"
          okText="Lưu lại"
          cancelText="Đóng"
        >
          {editUser && (
            <div style={{ padding: "10px 0" }}>
              <div style={{ color: "#b5a9c6", marginBottom: 6, fontSize: "0.85rem" }}>
                Vai trò tài khoản (admin/user):
              </div>
              <Input
                value={editUser.role}
                onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                className="admin-modal-input"
              />
              <div style={{ color: "#b5a9c6", marginBottom: 6, fontSize: "0.85rem", marginTop: 14 }}>
                Số dư Token (🌟):
              </div>
              <Input
                type="number"
                value={editUser.token_balance}
                onChange={e =>
                  setEditUser({
                    ...editUser,
                    token_balance: Number(e.target.value),
                  })
                }
                className="admin-modal-input"
              />
            </div>
          )}
        </Modal>

        {/* ADD USER MODAL */}
        <Modal
          open={showAddUser}
          title="🧙‍♂️ Thêm Tín Đồ Mới"
          onCancel={() => setShowAddUser(false)}
          onOk={handleAddUser}
          className="admin-modal"
          okText="Thêm mới"
          cancelText="Huỷ"
        >
          <div style={{ padding: "10px 0" }}>
            <div style={{ color: "#b5a9c6", marginBottom: 6, fontSize: "0.85rem" }}>Email của tín đồ:</div>
            <Input
              placeholder="vd: tin_do@gmail.com"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              className="admin-modal-input"
              style={{ marginBottom: 14 }}
            />
            <div style={{ color: "#b5a9c6", marginBottom: 6, fontSize: "0.85rem" }}>Mật khẩu:</div>
            <Input.Password
              placeholder="Để trống nếu lấy mật khẩu mặc định: 123456"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              className="admin-modal-input"
              style={{ marginBottom: 14 }}
            />
            <div style={{ color: "#b5a9c6", marginBottom: 6, fontSize: "0.85rem" }}>
              Vai trò tài khoản (admin/user):
            </div>
            <Input
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              className="admin-modal-input"
              style={{ marginBottom: 14 }}
            />
            <div style={{ color: "#b5a9c6", marginBottom: 6, fontSize: "0.85rem" }}>Số dư Token (🌟):</div>
            <Input
              type="number"
              value={newUser.token_balance}
              onChange={e =>
                setNewUser({
                  ...newUser,
                  token_balance: Number(e.target.value),
                })
              }
              className="admin-modal-input"
            />
          </div>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
}
