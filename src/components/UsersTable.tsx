import { Table, Button, Space, Popconfirm, message } from "antd";

const API = "http://127.0.0.1:8002";

export default function UsersTable({ data, reload }: any) {

  const deleteUser = async (id: number) => {
    try {
      await fetch(`${API}/api/admin/users/${id}`, {
        method: "DELETE",
      });
      message.success("Deleted user");
      reload();
    } catch {
      message.error("Delete failed");
    }
  };

  const updateUser = async (u: any) => {
    const role = prompt("Role (admin/user):", u.role);
    const token = prompt("Token:", u.token_balance);

    if (!role || token === null) return;

    try {
      await fetch(`${API}/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          token_balance: Number(token),
        }),
      });

      message.success("Updated user");
      reload();
    } catch {
      message.error("Update failed");
    }
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
    },
    {
      title: "Token",
      dataIndex: "token_balance",
    },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" onClick={() => updateUser(record)}>
            Edit
          </Button>

          <Popconfirm
            title="Delete user?"
            onConfirm={() => deleteUser(record.id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      dataSource={data}
      columns={columns}
      pagination={{ pageSize: 5 }}
    />
  );
}