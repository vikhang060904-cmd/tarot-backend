import mysql.connector
try:
    conn = mysql.connector.connect(host="localhost", user="root", password="", database="database_schema")
    print("Connection successful")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
