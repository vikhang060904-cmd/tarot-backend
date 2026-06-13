import mysql.connector
import json
import sys

def run_query(query, params=None):
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='database_schema'
        )
        cur = conn.cursor(dictionary=True)
        cur.execute(query, params or ())
        rows = cur.fetchall()
        print(json.dumps(rows, indent=2, default=str))
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        run_query(sys.argv[1])
    else:
        print("Usage: python db_query.py 'SELECT ...'")
