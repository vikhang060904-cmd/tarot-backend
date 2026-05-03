import json
import mysql.connector
from datetime import datetime
from typing import Any, Optional


# ================== CONNECT ==================
def get_conn():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="database_schema",
        autocommit=False
    )


def row_to_dict(row: Optional[Any]) -> Optional[dict]:
    if not row:
        return None
    if isinstance(row, dict):
        return row
    return dict(row)


# ================== INIT ==================
def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        token_balance INT DEFAULT 15,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS token_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255),
        package_code VARCHAR(50),
        package_name VARCHAR(100),
        token_amount INT,
        price_vnd INT,
        transfer_code VARCHAR(100) UNIQUE,
        bank_bin VARCHAR(20),
        account_no VARCHAR(50),
        account_name VARCHAR(100),
        qr_data_url TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS tarot_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255),
        topic VARCHAR(50),
        question TEXT,
        card_1_name VARCHAR(100),
        card_1_suit VARCHAR(50),
        card_1_image VARCHAR(255),
        card_2_name VARCHAR(100),
        card_2_suit VARCHAR(50),
        card_2_image VARCHAR(255),
        card_3_name VARCHAR(100),
        card_3_suit VARCHAR(50),
        card_3_image VARCHAR(255),
        answer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


# ================== USERS ==================
def ensure_user(email: str) -> dict:
    email = email.strip().lower()
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("INSERT IGNORE INTO users (email) VALUES (%s)", (email,))
    cur.execute("SELECT * FROM users WHERE email=%s", (email,))

    user = cur.fetchone()
    conn.commit()
    conn.close()
    return user or {}


def get_user_by_email(email: str) -> Optional[dict]:
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = cur.fetchone()

    conn.close()
    return user


def set_user_token_balance(email: str, token_balance: int) -> dict:
    email = email.strip().lower()

    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("INSERT IGNORE INTO users (email) VALUES (%s)", (email,))
    cur.execute("UPDATE users SET token_balance=%s WHERE email=%s", (token_balance, email))

    cur.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = cur.fetchone()

    conn.commit()
    conn.close()
    return user


def add_user_tokens(email: str, amount: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE users
        SET token_balance = token_balance + %s
        WHERE email = %s
    """, (amount, email))

    conn.commit()
    conn.close()


# ================== TOKEN ORDERS ==================
def create_token_order(data: dict):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        INSERT INTO token_orders (
            user_email, package_code, package_name,
            token_amount, price_vnd, transfer_code,
            bank_bin, account_no, account_name, qr_data_url
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        data["user_email"],
        data["package_code"],
        data["package_name"],
        data["token_amount"],
        data["price_vnd"],
        data["transfer_code"],
        data["bank_bin"],
        data["account_no"],
        data["account_name"],
        data["qr_data_url"],
    ))

    order_id = cur.lastrowid
    cur.execute("SELECT * FROM token_orders WHERE id=%s", (order_id,))
    order = cur.fetchone()

    conn.commit()
    conn.close()
    return order


def get_token_order_by_id(order_id: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT * FROM token_orders WHERE id=%s", (order_id,))
    order = cur.fetchone()

    conn.close()
    return order


def mark_token_order_paid(order_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE token_orders
        SET status='paid', paid_at=NOW()
        WHERE id=%s
    """, (order_id,))

    conn.commit()
    conn.close()


# ================== TAROT HISTORY ==================
def save_tarot_history(user_email, question, topic, cards, answer):
    conn = get_conn()
    cur = conn.cursor()

    c1 = cards[0] if len(cards) > 0 else {}
    c2 = cards[1] if len(cards) > 1 else {}
    c3 = cards[2] if len(cards) > 2 else {}

    cur.execute("""
        INSERT INTO tarot_history (
            user_email, topic, question,
            card_1_name, card_1_suit, card_1_image,
            card_2_name, card_2_suit, card_2_image,
            card_3_name, card_3_suit, card_3_image,
            answer
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        user_email, topic, question,
        c1.get("name"), c1.get("suit"), c1.get("image"),
        c2.get("name"), c2.get("suit"), c2.get("image"),
        c3.get("name"), c3.get("suit"), c3.get("image"),
        answer
    ))

    conn.commit()
    conn.close()


def get_tarot_history_by_email(email: str):
    email = (email or "").strip().lower()
    if not email:
        return []

    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT *
        FROM tarot_history
        WHERE user_email = %s
        ORDER BY id DESC
    """, (email,))

    rows = cur.fetchall()
    conn.close()

    items = []

    for row in rows:
        items.append({
            "id": row["id"],
            "user_email": row["user_email"],
            "topic": row["topic"],
            "question": row["question"],
            "cards": [
                {
                    "name": row["card_1_name"],
                    "suit": row["card_1_suit"],
                    "image": row["card_1_image"],
                },
                {
                    "name": row["card_2_name"],
                    "suit": row["card_2_suit"],
                    "image": row["card_2_image"],
                },
                {
                    "name": row["card_3_name"],
                    "suit": row["card_3_suit"],
                    "image": row["card_3_image"],
                },
            ],
            "answer": row["answer"],
            "created_at": str(row["created_at"]),  # 🔥 FIX CRASH JSON
        })

    return items

def delete_tarot_history_by_email(email: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("DELETE FROM tarot_history WHERE user_email=%s", (email,))
    conn.commit()
    conn.close()