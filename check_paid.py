import mysql.connector
import json

def check_paid():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='database_schema'
        )
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, user_email, package_code, token_amount, price_vnd, transfer_code, status, paid_at FROM token_orders WHERE status = 'paid' ORDER BY id DESC LIMIT 5")
        rows = cur.fetchall()
        for row in rows:
            if row['paid_at']:
                row['paid_at'] = str(row['paid_at'])
        print(json.dumps(rows, indent=2))
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_paid()
