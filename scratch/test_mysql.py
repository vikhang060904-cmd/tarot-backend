import mysql.connector
import sys

print("Testing MySQL connection...")
try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="",
        connect_timeout=3
    )
    print("Connection to MySQL server successful!")
    
    # Check databases
    cur = conn.cursor()
    cur.execute("SHOW DATABASES")
    dbs = [row[0] for row in cur.fetchall()]
    print("Databases found:", dbs)
    
    if "database_schema" in dbs:
        print("'database_schema' database exists!")
    else:
        print("'database_schema' database DOES NOT exist!")
        print("Creating 'database_schema' database...")
        cur.execute("CREATE DATABASE database_schema")
        print("'database_schema' created successfully!")
        
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)
