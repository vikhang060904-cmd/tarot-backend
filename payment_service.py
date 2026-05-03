import json
import os
import time
from typing import Any

import requests
from dotenv import load_dotenv
from db import get_conn

load_dotenv()

BANK_BIN = os.getenv("BANK_BIN", "").strip()
BANK_ACCOUNT_NO = os.getenv("BANK_ACCOUNT_NO", "").strip()
BANK_ACCOUNT_NAME = os.getenv("BANK_ACCOUNT_NAME", "").strip()

VIETQR_CLIENT_ID = os.getenv("VIETQR_CLIENT_ID", "").strip()
VIETQR_API_KEY = os.getenv("VIETQR_API_KEY", "").strip()

PACKAGE_MAP = {
    "starter": {
        "name": "Gói Khởi Đầu",
        "token_amount": 100,
        "price_vnd": 29000,
    },
    "explorer": {
        "name": "Gói Khám Phá",
        "token_amount": 500,
        "price_vnd": 99000,
    },
    "master": {
        "name": "Gói Thạo Thủ",
        "token_amount": 1500,
        "price_vnd": 249000,
    },
}


# ================= ENV CHECK =================
def _require_payment_env():
    missing = []
    if not BANK_BIN:
        missing.append("BANK_BIN")
    if not BANK_ACCOUNT_NO:
        missing.append("BANK_ACCOUNT_NO")
    if not BANK_ACCOUNT_NAME:
        missing.append("BANK_ACCOUNT_NAME")
    if not VIETQR_CLIENT_ID:
        missing.append("VIETQR_CLIENT_ID")
    if not VIETQR_API_KEY:
        missing.append("VIETQR_API_KEY")

    if missing:
        raise ValueError("Thiếu cấu hình: " + ", ".join(missing))


# ================= USER =================
def _ensure_user_exists(user_email: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT IGNORE INTO users (email, token_balance)
        VALUES (%s, 350)
    """, (user_email,))

    conn.commit()
    conn.close()


# ================= UTILS =================
def _generate_transfer_code(package_code: str):
    return f"TAROT_{package_code.upper()}_{int(time.time() * 1000)}"


from urllib.parse import quote

def _create_vietqr_data_url(amount: int, transfer_code: str) -> str:
    _require_payment_env()

    # 🔥 Encode để tránh lỗi khoảng trắng / ký tự đặc biệt
    account_name_encoded = quote(BANK_ACCOUNT_NAME.strip())
    transfer_code_encoded = quote(transfer_code.strip())

    return (
        f"https://img.vietqr.io/image/"
        f"{BANK_BIN}-{BANK_ACCOUNT_NO}-compact2.png"
        f"?amount={int(amount)}"
        f"&addInfo={transfer_code_encoded}"
        f"&accountName={account_name_encoded}"
    )
# ================= CREATE ORDER =================
def create_order(user_email: str, package_code: str) -> dict[str, Any]:
    user_email = (user_email or "").strip()
    package_code = (package_code or "").strip().lower()

    if not user_email:
        raise ValueError("Thiếu email")
    if "@" not in user_email:
        raise ValueError("Email không hợp lệ")
    if package_code not in PACKAGE_MAP:
        raise ValueError("Gói không hợp lệ")

    _require_payment_env()
    _ensure_user_exists(user_email)

    package = PACKAGE_MAP[package_code]
    transfer_code = _generate_transfer_code(package_code)
    qr_data_url = _create_vietqr_data_url(package["price_vnd"], transfer_code)

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO token_orders (
                user_email,
                package_code,
                package_name,
                token_amount,
                price_vnd,
                transfer_code,
                bank_bin,
                account_no,
                account_name,
                qr_data_url,
                status
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            user_email,
            package_code,
            package["name"],
            package["token_amount"],
            package["price_vnd"],
            transfer_code,
            BANK_BIN,
            BANK_ACCOUNT_NO,
            BANK_ACCOUNT_NAME,
            qr_data_url,
            "pending",
        ))

        order_id = cur.lastrowid
        conn.commit()

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        conn.close()

    return get_order(order_id)


# ================= GET ORDER =================
def get_order(order_id: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT
            id,
            package_name,
            token_amount,
            price_vnd,
            transfer_code,
            account_no,
            account_name,
            qr_data_url,
            status
        FROM token_orders
        WHERE id = %s
    """, (order_id,))

    row = cur.fetchone()
    conn.close()

    return row


# ================= TOKEN =================
def get_user_tokens(email: str):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        "SELECT token_balance FROM users WHERE email = %s",
        (email,),
    )

    row = cur.fetchone()
    conn.close()

    return int(row["token_balance"]) if row else 350


# ================= WEBHOOK =================
def process_sepay_webhook(payload: dict[str, Any]):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    amount = int(payload.get("amount", 0))
    description = str(payload.get("description", "")).strip()

    cur.execute("""
        SELECT *
        FROM token_orders
        WHERE transfer_code = %s
          AND price_vnd = %s
          AND status = 'pending'
        LIMIT 1
    """, (description, amount))

    order = cur.fetchone()

    if not order:
        conn.close()
        return None

    cur.execute("""
        UPDATE token_orders
        SET status='paid', paid_at=NOW()
        WHERE id=%s
    """, (order["id"],))

    cur.execute("""
        UPDATE users
        SET token_balance = token_balance + %s
        WHERE email = %s
    """, (order["token_amount"], order["user_email"]))

    conn.commit()
    conn.close()

    return get_order(order["id"])