import mysql.connector

def check():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="database_schema",
            connect_timeout=5
        )
        cur = conn.cursor(dictionary=True)
        cur.execute("DESCRIBE users")
        cols = cur.fetchall()
        print("COLUMNS IN users TABLE:")
        for col in cols:
            print(col)
            
        cur.execute("SELECT * FROM users LIMIT 2")
        users = cur.fetchall()
        print("\nUSERS SAMPLE:")
        print(users)
        
        conn.close()
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    check()
