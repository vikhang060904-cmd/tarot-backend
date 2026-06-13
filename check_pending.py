import mysql.connector
import json

def check_pending():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='database_schema'
        )
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, user_email, package_code, token_amount, price_vnd, transfer_code, status FROM token_orders WHERE status = 'pending' ORDER BY id DESC LIMIT 5")
        rows = cur.fetchall()
        print(json.dumps(rows, indent=2))
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_pending()
