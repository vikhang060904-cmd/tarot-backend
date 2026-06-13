from db import init_db
print("Running init_db() to apply DB schema changes and ALTER tables...")
try:
    init_db()
    print("DB successfully upgraded!")
except Exception as e:
    print("DB upgrade failed:", e)
