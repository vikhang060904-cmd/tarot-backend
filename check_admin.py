import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="database_schema"
)
cur = conn.cursor(dictionary=True)
cur.execute("SELECT email, role, password FROM users WHERE role='admin'")
rows = cur.fetchall()
conn.close()

if not rows:
    print("Khong co tai khoan admin nao trong database!")
else:
    print(f"Tim thay {len(rows)} tai khoan admin:")
    for r in rows:
        print(f"  Email   : {r['email']}")
        print(f"  Role    : {r['role']}")
        print(f"  Password: {r['password']}")
        print("---")
