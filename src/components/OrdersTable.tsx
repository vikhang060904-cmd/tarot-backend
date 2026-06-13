import { Table, Button, Space, Popconfirm, Tag, message } from "antd";

const API = "";

export default function OrdersTable({ data, reload }: any) {

  const deleteOrder = async (id: number) => {
    try {
      await fetch(`${API}/api/admin/orders/${id}`, {
        method: "DELETE",
      });
      message.success("Deleted order");
      reload();
    } catch {
      message.error("Delete failed");
    }
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "user_email",
    },
    {
      title: "Price",
      dataIndex: "price_vnd",
      render: (v: number) => v.toLocaleString() + " VND",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) =>
        status === "paid" ? (
          <Tag color="green">PAID</Tag>
        ) : (
          <Tag color="orange">PENDING</Tag>
        ),
    },
    {
      title: "Date",
      dataIndex: "paid_at",
      render: (d: string) => d || "-",
    },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <Space>
          <Popconfirm
            title="Delete order?"
            onConfirm={() => deleteOrder(record.id)}
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
      pagination={{ pageSize: 8 }}
    />
  );
}