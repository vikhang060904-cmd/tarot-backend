import mysql.connector
import json

def find_order(code):
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='database_schema'
        )
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, user_email, transfer_code, status FROM token_orders WHERE transfer_code LIKE %s", (f"%{code}%",))
        rows = cur.fetchall()
        print(json.dumps(rows, indent=2))
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    find_order("1778848604")
