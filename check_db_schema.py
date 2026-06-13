from db import get_conn
conn = get_conn()
cur = conn.cursor()
tables = ['users', 'token_orders', 'tarot_history', 'tarot_sessions']
for t in tables:
    print(f"--- {t} ---")
    try:
        cur.execute(f"DESCRIBE {t}")
        for row in cur.fetchall():
            print(row)
    except Exception as e:
        print(f"Error: {e}")
conn.close()
