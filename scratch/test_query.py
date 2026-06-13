import mysql.connector
import sys

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="database_schema"
    )
    cur = conn.cursor()
    
    # Try the login query
    email = "test@gmail.com"
    print("Testing query on 'users' table...")
    try:
        cur.execute("""
            SELECT email, password, role, token_balance, 
                   current_package_code, current_package_name 
            FROM users 
            WHERE email=%s
        """, (email,))
        row = cur.fetchone()
        print("Success! Row returned:", row)
    except Exception as query_err:
        print("❌ Query failed:", query_err)
        
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)
