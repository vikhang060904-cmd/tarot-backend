import mysql.connector

def get_conn():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="database_schema",
        connect_timeout=5
    )

def run():
    try:
        conn = get_conn()
        cur = conn.cursor()

        # ===== USERS TABLE =====
        cur.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'users'
        """)
        user_cols = {row[0] for row in cur.fetchall()}
        print("USER COLS FOUND:", user_cols)

        if "status" not in user_cols:
            print("ADDING status COLUMN...")
            cur.execute("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'")
            print("status COLUMN ADDED SUCCESSFULLY!")

        conn.commit()
        conn.close()
        print("DONE SUCCESS")
    except Exception as e:
        print("ERROR RUNNING ALTER:", e)

if __name__ == "__main__":
    run()
