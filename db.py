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
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        token_balance INT DEFAULT 15,
        current_package_code VARCHAR(50),
        current_package_name VARCHAR(100),
        package_started_at DATETIME,
        package_ends_at DATETIME,
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
        payment_method VARCHAR(50) DEFAULT 'vietqr',
        vnpay_url TEXT,
        client_base VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        paid_at DATETIME,
        sepay_tx_id VARCHAR(100), -- Lưu mã giao dịch từ SePay
        tokens_added TINYINT DEFAULT 0, -- Đánh dấu đã cộng tiền cho user chưa
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
        cards_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS tarot_sessions (
        conversation_id VARCHAR(100) PRIMARY KEY,
        user_email VARCHAR(255),
        topic VARCHAR(50),
        topic_label VARCHAR(100),
        cards_json TEXT,
        base_question TEXT,
        messages_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """)

    # ALTER token_orders safely for existing databases
    try:
        cur.execute("ALTER TABLE token_orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'vietqr'")
    except Exception:
        pass

    try:
        cur.execute("ALTER TABLE token_orders ADD COLUMN vnpay_url TEXT")
    except Exception:
        pass

    try:
        cur.execute("ALTER TABLE token_orders ADD COLUMN client_base VARCHAR(255)")
    except Exception:
        pass

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


def deduct_user_tokens(email: str, amount: int) -> bool:
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    # Check balance first
    cur.execute("SELECT token_balance FROM users WHERE email=%s", (email,))
    row = cur.fetchone()

    if not row or row["token_balance"] < amount:
        conn.close()
        return False

    # Deduct
    cur.execute("""
        UPDATE users
        SET token_balance = token_balance - %s
        WHERE email = %s
    """, (amount, email))

    conn.commit()
    conn.close()
    return True


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


def save_tarot_history(user_email, question, topic, cards, answer):
    conn = get_conn()
    cur = conn.cursor()

    c1 = cards[0] if len(cards) > 0 else {}
    c2 = cards[1] if len(cards) > 1 else {}
    c3 = cards[2] if len(cards) > 2 else {}

    import json
    cards_json = json.dumps(cards, ensure_ascii=False)

    cur.execute("""
        INSERT INTO tarot_history (
            user_email, topic, question,
            card_1_name, card_1_suit, card_1_image,
            card_2_name, card_2_suit, card_2_image,
            card_3_name, card_3_suit, card_3_image,
            answer, cards_json
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        user_email, topic, question,
        c1.get("name"), c1.get("suit"), c1.get("image"),
        c2.get("name"), c2.get("suit"), c2.get("image"),
        c3.get("name"), c3.get("suit"), c3.get("image"),
        answer, cards_json
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


def save_tarot_session(session: dict):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO tarot_sessions (
            conversation_id, user_email, topic, topic_label,
            cards_json, base_question, messages_json
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s)
        ON DUPLICATE KEY UPDATE
            messages_json = VALUES(messages_json),
            base_question = VALUES(base_question)
    """, (
        session["conversation_id"],
        session.get("user_email"),
        session.get("topic"),
        session.get("topic_label"),
        json.dumps(session.get("cards", []), ensure_ascii=False),
        session.get("base_question", ""),
        json.dumps(session.get("messages", []), ensure_ascii=False)
    ))

    conn.commit()
    conn.close()


def get_tarot_session(conversation_id: str) -> Optional[dict]:
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT * FROM tarot_sessions WHERE conversation_id = %s", (conversation_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "conversation_id": row["conversation_id"],
        "user_email": row["user_email"],
        "topic": row["topic"],
        "topic_label": row["topic_label"],
        "cards": json.loads(row["cards_json"] or "[]"),
        "base_question": row["base_question"],
        "messages": json.loads(row["messages_json"] or "[]"),
    }