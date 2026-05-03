import { useEffect, useState } from "react";
import {
  Layout,
  Table,
  Button,
  Modal,
  Input,
  message,
  Card,
  Row,
  Col,
  Spin,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const { Header, Content, Sider } = Layout;

const API = "http://127.0.0.1:8002";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      const [u, o, r, s] = await Promise.all([
        fetch(`${API}/api/admin/users`).then(r => r.json()),
        fetch(`${API}/api/admin/orders`).then(r => r.json()),
        fetch(`${API}/api/admin/revenue-by-day`).then(r => r.json()),
        fetch(`${API}/api/admin/dashboard`).then(r => r.json()),
      ]);

      setUsers(Array.isArray(u.data) ? u.data : []);
      setOrders(Array.isArray(o.orders) ? o.orders : o.data || []);
      setRevenue(Array.isArray(r.data) ? r.data : []);
      setStats(s || {});
    } catch (err) {
      console.error(err);
      message.error("❌ Load failed");
    } finally {
      setLoading(false);
    }
  };

  // ===== DELETE =====
  const deleteUser = (id: number) => {
    Modal.confirm({
      title: "Xoá user?",
      okType: "danger",
      onOk: async () => {
        await fetch(`${API}/api/admin/users/${id}`, { method: "DELETE" });
        message.success("Đã xoá");
        loadAll();
      },
    });
  };

  const deleteOrder = (id: number) => {
    Modal.confirm({
      title: "Xoá order?",
      okType: "danger",
      onOk: async () => {
        await fetch(`${API}/api/admin/orders/${id}`, {
          method: "DELETE",
        });
        message.success("Đã xoá");
        loadAll();
      },
    });
  };

  // ===== UPDATE =====
  const handleUpdate = async () => {
    await fetch(`${API}/api/admin/users/${editUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser),
    });

    message.success("Updated");
    setEditUser(null);
    loadAll();
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sider theme="dark">
        <h2 style={{ color: "white", padding: 20 }}>🔥 Admin</h2>
      </Sider>

      {/* MAIN */}
      <Layout>
        <Header style={{ display: "flex", justifyContent: "space-between", color: "white" }}>
          Admin Dashboard
          <Button danger onClick={logout}>
            Logout
          </Button>
        </Header>

        <Content style={{ padding: 20 }}>
          {loading && <Spin />}

          {/* STATS */}
          <Row gutter={16}>
            <Col span={6}>
              <Card title="Users">{stats.total_users || 0}</Card>
            </Col>
            <Col span={6}>
              <Card title="Orders">{stats.total_orders || 0}</Card>
            </Col>
            <Col span={6}>
              <Card title="Revenue">
                {(stats.total_revenue || 0) + " VND"}
              </Card>
            </Col>
            <Col span={6}>
              <Card title="Today">
                {(stats.today_revenue || 0) + " VND"}
              </Card>
            </Col>
          </Row>

          {/* CHART */}
          <Card title="Revenue Chart" style={{ marginTop: 20 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenue}>
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line dataKey="revenue" stroke="#1890ff" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* USERS */}
          <Card title="Users" style={{ marginTop: 20 }}>
            <Table
              rowKey="id"
              dataSource={users}
              columns={[
                { title: "Email", dataIndex: "email" },
                { title: "Role", dataIndex: "role" },
                { title: "Token", dataIndex: "token_balance" },
                {
                  title: "Action",
                  render: (u) => (
                    <>
                      <Button onClick={() => setEditUser(u)}>Edit</Button>
                      <Button danger onClick={() => deleteUser(u.id)}>
                        Delete
                      </Button>
                    </>
                  ),
                },
              ]}
            />
          </Card>

          {/* ORDERS */}
          <Card title="Orders" style={{ marginTop: 20 }}>
            <Table
              rowKey="id"
              dataSource={orders}
              columns={[
                { title: "Email", dataIndex: "user_email" },
                { title: "Price", dataIndex: "price_vnd" },
                { title: "Status", dataIndex: "status" },
                { title: "Date", dataIndex: "paid_at" },
                {
                  title: "Action",
                  render: (o) => (
                    <Button danger onClick={() => deleteOrder(o.id)}>
                      Delete
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Content>
      </Layout>

      {/* MODAL */}
      <Modal
        open={!!editUser}
        title="Edit User"
        onCancel={() => setEditUser(null)}
        onOk={handleUpdate}
      >
        {editUser && (
          <>
            <Input
              value={editUser.role}
              onChange={(e) =>
                setEditUser({ ...editUser, role: e.target.value })
              }
              style={{ marginBottom: 10 }}
            />
            <Input
              value={editUser.token_balance}
              onChange={(e) =>
                setEditUser({
                  ...editUser,
                  token_balance: Number(e.target.value),
                })
              }
            />
          </>
        )}
      </Modal>
    </Layout>
  );
}