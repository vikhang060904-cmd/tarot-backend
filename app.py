from pydoc import text

from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
import requests
import os
import traceback
import mysql.connector
from typing import Any
from datetime import datetime, timedelta
from uuid import uuid4
from fastapi import Body
from fastapi import HTTPException
from pydantic import BaseModel
import requests
print("🚀 APP FILE LOADED")
class SepayWebhook(BaseModel):
    content: str
    amount: int
    account_number: str

def get_conn():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="database_schema"
    )
from db import (
    init_db,
    save_tarot_history,
    get_tarot_history_by_email,
    delete_tarot_history_by_email,
)
from payment_service import (
    create_order,
    get_order,
    get_user_tokens,
    process_sepay_webhook,
)

try:
    from tarot_logic import draw_cards, load_all_cards as tarot_logic_load_all_cards
except Exception:
    draw_cards = None
    tarot_logic_load_all_cards = None

app = FastAPI()
print("🔥 WEBHOOK REGISTERED")


from fastapi import Request
from datetime import datetime
import re


@app.post("/api/payments/webhook/sepay")
async def payments_webhook_sepay(request: Request):
    try:
        payload = await request.json()
        payload = dict(payload)
        print("🔥 WEBHOOK DATA:", payload)

        # ================= PARSE DATA =================
        content = (
            payload.get("content")
            or payload.get("transfer_content")
            or payload.get("description")
            or payload.get("addInfo")
            or ""
        )

        amount = int(float(
            payload.get("transferAmount")
            or payload.get("amount")
            or 0
        ))

        account_no = str(
            payload.get("accountNumber")
            or payload.get("account_number")
            or ""
        ).strip()

        print("===== WEBHOOK INPUT =====")
        print("CONTENT:", content)
        print("AMOUNT:", amount)
        print("ACCOUNT:", account_no)
        print("=========================")

        if amount <= 0:
            print("❌ INVALID DATA")
            return {"success": False}

        conn = get_conn()
        cur = conn.cursor(dictionary=True)

        # ================= GET ORDERS =================
        cur.execute("""
            SELECT * FROM token_orders
            WHERE status = 'pending'
        """)
        orders = cur.fetchall()

        if not orders:
            conn.close()
            print("❌ NO ORDERS")
            return {"success": False}

        # ================= NORMALIZE =================
        def normalize(text):
            return re.sub(r'[^a-zA-Z0-9]', '', str(text)).lower()

        content_norm = normalize(content)
        print("CONTENT_NORM:", content_norm)

        matched_order = None

        # ================= MATCH =================
        for order in orders:
            transfer_code = normalize(order.get("transfer_code", ""))
            price = int(float(order.get("price_vnd", 0)))

            print("===== SO SÁNH =====")
            print("DB CODE:", transfer_code)
            print("PRICE DB:", price)
            print("AMOUNT:", amount)

            if transfer_code and transfer_code in content_norm:
                print("✅ MATCH CODE")

                if abs(price - amount) <= 1000:
                    print("✅ MATCH PRICE")
                    matched_order = order
                    break
                else:
                    print("❌ PRICE NOT MATCH")
            else:
                print("❌ CODE NOT MATCH")

        # ================= NOT MATCH =================
        if not matched_order:
            conn.close()
            print("❌ NO MATCH")
            return {"success": False}

        print("🎯 MATCHED ORDER:", matched_order["id"])

        # ================= UPDATE ORDER =================
        cur.execute("""
            UPDATE token_orders
            SET status = 'paid',
                paid_at = NOW()
            WHERE id = %s
        """, (matched_order["id"],))
        conn.commit()

        # ================= TOKEN =================
        try:
            cur.execute("""
                UPDATE users
                SET token_balance = token_balance + %s
                WHERE LOWER(TRIM(email)) = LOWER(TRIM(%s))
            """, (
                int(matched_order.get("token_amount", 0)),
                matched_order.get("user_email")
            ))
            conn.commit()
            print("💰 TOKEN UPDATED")
        except Exception as e:
            print("⚠️ TOKEN ERROR:", e)

        # ================= 🚀 ACTIVATE PACKAGE =================
        try:
            print("🚀 ACTIVATE PACKAGE")

            now = datetime.now()
            end = now + timedelta(days=30)

            cur.execute("""
                UPDATE users
                SET 
                    current_package_code = %s,
                    current_package_name = %s,
                    package_started_at = %s,
                    package_ends_at = %s
                WHERE LOWER(TRIM(email)) = LOWER(TRIM(%s))
            """, (
                matched_order.get("package_code"),
                matched_order.get("package_name"),
                now,
                end,
                matched_order.get("user_email")
            ))

            conn.commit()
            print("✅ PACKAGE ACTIVATED")

        except Exception as e:
            print("⚠️ PACKAGE ERROR:", e)

        conn.close()

        print("✅ PAID SUCCESS:", matched_order["id"])

        return {"success": True}

    except Exception as e:
        print("🔥 WEBHOOK ERROR:", e)
        return {"success": False}
init_db()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
DB_FILE = os.path.join(BASE_DIR, "payments.db")

TAROT_DIR_CANDIDATES = [
    os.path.join(STATIC_DIR, "images", "tarot"),
    os.path.join(BASE_DIR, "public", "images", "tarot"),
]

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

# =========================
# LOAD ENV
# =========================
load_dotenv()

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
HF_KEY = os.getenv("HF_API_KEY", "").strip()
SEPAY_WEBHOOK_API_KEY = os.getenv("SEPAY_WEBHOOK_API_KEY", "").strip()
VIETQR_CLIENT_ID = os.getenv("VIETQR_CLIENT_ID", "").strip()
VIETQR_API_KEY = os.getenv("VIETQR_API_KEY", "").strip()
SEPAY_API_TOKEN = os.getenv("SEPAY_API_TOKEN", "").strip()
SEPAY_TRANSACTIONS_URL = "https://my.sepay.vn/userapi/transactions/list"

OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free"
HF_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
HF_URL = "https://router.huggingface.co/v1/chat/completions"

CURRENT_API = os.getenv("CURRENT_API", "hf").strip().lower()

PACKAGE_DURATION_DAYS = {
    "starter": 30,
    "explorer": 90,
    "master": 365,
}

# =========================
# APP INIT
# =========================
@app.post("/api/signup")
def signup(data: dict):
    try:
        email = data.get("email").strip().lower()
        password = data.get("password").strip()

        conn = get_conn()
        cur = conn.cursor()

        # check tồn tại
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            raise HTTPException(400, "Email đã tồn tại")

        # insert
        cur.execute("""
            INSERT INTO users (email, password, role, token_balance)
            VALUES (%s,%s,'user',15)
        """, (email, password))

        conn.commit()
        conn.close()

        return {"success": True}

    except Exception as e:
        raise HTTPException(500, str(e))
def ensure_subscription_columns():
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

        if "current_package_code" not in user_cols:
            cur.execute("ALTER TABLE users ADD COLUMN current_package_code VARCHAR(50)")
        if "current_package_name" not in user_cols:
            cur.execute("ALTER TABLE users ADD COLUMN current_package_name VARCHAR(100)")
        if "package_started_at" not in user_cols:
            cur.execute("ALTER TABLE users ADD COLUMN package_started_at DATETIME")
        if "package_ends_at" not in user_cols:
            cur.execute("ALTER TABLE users ADD COLUMN package_ends_at DATETIME")

        # ===== TOKEN_ORDERS TABLE =====
        cur.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'token_orders'
        """)
        order_cols = {row[0] for row in cur.fetchall()}

        if "plan_started_at" not in order_cols:
            cur.execute("ALTER TABLE token_orders ADD COLUMN plan_started_at DATETIME")
        if "plan_ends_at" not in order_cols:
            cur.execute("ALTER TABLE token_orders ADD COLUMN plan_ends_at DATETIME")

        conn.commit()
        conn.close()

    except Exception as e:
        print("ensure_subscription_columns ERROR:", e)
@app.post("/api/login")
def login(data: dict):
    try:
        email = data.get("email").strip().lower()
        password = data.get("password").strip()

        conn = get_conn()
        cur = conn.cursor()

        cur.execute("SELECT email,password,role FROM users WHERE email=%s", (email,))
        user = cur.fetchone()

        conn.close()

        if not user:
            raise HTTPException(401, "Sai email")

        if user[1] != password:
            raise HTTPException(401, "Sai mật khẩu")

        return {
            "email": user[0],
            "role": user[2]
        }

    except Exception as e:
        raise HTTPException(500, str(e))
# HELPERS
# =========================
def safe_json_response(payload: dict[str, Any], status_code: int = 200) -> JSONResponse:
    return JSONResponse(content=payload, status_code=status_code)


def normalize_email(email: str | None) -> str:
    return (email or "").strip().lower()


def normalize_card(card: Any, idx: int = 0) -> dict[str, Any] | None:
    if not isinstance(card, dict):
        return None

    name = (    
        card.get("name")
        or card.get("title")
        or card.get("card_name")
        or f"Card {idx + 1}"
    )

    suit = (
        card.get("suit")
        or card.get("arcana")
        or card.get("type")
        or "major"
    )

    image = (
        card.get("image")
        or card.get("img")
        or card.get("filename")
        or card.get("file")
        or "default.png"
    )

    if isinstance(image, str):
        image = os.path.basename(image)

    return {
        "name": str(name),
        "suit": str(suit).strip().lower(),
        "image": str(image),
        "index": idx,
    }


def scan_cards_from_folder() -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []

    for tarot_root in TAROT_DIR_CANDIDATES:
        if not os.path.isdir(tarot_root):
            continue

        for suit_name in sorted(os.listdir(tarot_root)):
            suit_path = os.path.join(tarot_root, suit_name)

            if not os.path.isdir(suit_path):
                continue

            for filename in sorted(os.listdir(suit_path)):
                lower = filename.lower()
                if not lower.endswith((".png", ".jpg", ".jpeg", ".webp")):
                    continue

                pretty_name = (
                    os.path.splitext(filename)[0]
                    .replace("_", " ")
                    .replace("-", " ")
                    .title()
                )

                cards.append({
                    "name": pretty_name,
                    "suit": suit_name.strip().lower(),
                    "image": filename,
                    "index": len(cards),
                })

        if cards:
            return cards

    return cards


def get_all_cards_safe() -> list[dict[str, Any]]:
    if tarot_logic_load_all_cards is not None:
        try:
            raw_cards = tarot_logic_load_all_cards()

            if isinstance(raw_cards, list):
                normalized_cards = []
                for idx, card in enumerate(raw_cards):
                    normalized = normalize_card(card, idx)
                    if normalized:
                        normalized_cards.append(normalized)

                if normalized_cards:
                    return normalized_cards
        except Exception:
            traceback.print_exc()

    scanned_cards = scan_cards_from_folder()
    if scanned_cards:
        return scanned_cards

    return []

def serialize_order_compact(order):
    if not order:
        return None

    return {
        "id": order.get("id"),
        "user_email": order.get("user_email"),
        "package_code": order.get("package_code"),
        "package_name": order.get("package_name"),
        "token_amount": order.get("token_amount"),
        "price_vnd": order.get("price_vnd"),
        "transfer_code": order.get("transfer_code"),
        "status": order.get("status"),
        "paid_at": order.get("paid_at"),
        "created_at": order.get("created_at"),
        "account_no": order.get("account_no"),
        "account_name": order.get("account_name"),
        "qr_data_url": order.get("qr_data_url"),
        "plan_started_at": order.get("plan_started_at"),
        "plan_ends_at": order.get("plan_ends_at"),
    }
    
def format_sql_datetime(dt: datetime | None) -> str | None:
    if not dt:
        return None
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def parse_sql_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    value = str(value).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value[:19], fmt)
        except Exception:
            pass
    return None

def normalize_transfer_text(value: str) -> str:
    value = (value or "").lower().strip()
    return "".join(ch for ch in value if ch.isalnum())


def parse_db_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    value = str(value).strip()

    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value[:19], fmt)
        except Exception:
            pass

    return None


def parse_sepay_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    value = str(value).strip()

    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%H:%M %d/%m/%Y",
    ):
        try:
            return datetime.strptime(value[:19], fmt)
        except Exception:
            pass

    return None


# =========================
# AI CALLERS
# =========================
def call_openrouter(prompt: str) -> str:
    if not OPENROUTER_KEY:
        raise Exception("Missing OPENROUTER_API_KEY")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=40)
    if r.status_code == 200:
        data = r.json()
        return data["choices"][0]["message"]["content"]

    raise Exception(f"OpenRouter error {r.status_code}: {r.text}")


def call_huggingface(prompt: str) -> str:
    if not HF_KEY:
        raise Exception("Missing HF_API_KEY")

    headers = {
        "Authorization": f"Bearer {HF_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": HF_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    r = requests.post(HF_URL, headers=headers, json=payload, timeout=40)
    if r.status_code == 200:
        data = r.json()
        return data["choices"][0]["message"]["content"]

    raise Exception(f"HuggingFace error {r.status_code}: {r.text}")


def call_ai(prompt: str) -> str:
    try:
        if CURRENT_API == "openrouter":
            return call_openrouter(prompt)
        return call_huggingface(prompt)
    except Exception as e:
        print("AI error:", e)
        return "🔮 Tarot AI đang nghỉ ngơi. Hãy tin vào trực giác của bạn."


def call_ai_tarot(system_prompt: str, user_prompt: str) -> str:
    try:
        if CURRENT_API == "openrouter":
            if not OPENROUTER_KEY:
                raise Exception("Missing OPENROUTER_API_KEY")

            headers = {
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": OPENROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.35,
                "max_tokens": 1800,
            }

            r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=40)
            if r.status_code == 200:
                data = r.json()
                return data["choices"][0]["message"]["content"]

            raise Exception(f"OpenRouter error {r.status_code}: {r.text}")

        if not HF_KEY:
            raise Exception("Missing HF_API_KEY")

        headers = {
            "Authorization": f"Bearer {HF_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": HF_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.35,
            "max_tokens": 1800,
        }

        r = requests.post(HF_URL, headers=headers, json=payload, timeout=40)
        if r.status_code == 200:
            data = r.json()
            return data["choices"][0]["message"]["content"]

        raise Exception(f"HuggingFace error {r.status_code}: {r.text}")

    except Exception as e:
        print("AI tarot error:", e)
        return "🔮 Tarot AI đang nghỉ ngơi. Hãy thử lại sau."


def build_tarot_system_prompt() -> str:
    return """
Bạn là chuyên gia Tarot nói tiếng Việt, có tư duy chặt chẽ và không suy diễn bừa.

NGUYÊN TẮC:
- Chỉ bám vào thông tin người dùng cung cấp.
- Không tự bịa thêm nhân vật như “người con gái của bạn”, “một người đàn ông”, “người thứ ba”, “cô ấy”, “anh ấy” nếu người dùng không nói.
- Không tự bịa bối cảnh, sự kiện hay chi tiết đời tư.
- Nếu người dùng chọn một chủ đề như tình yêu, gia đình, sự nghiệp, sức khỏe, tài chính thì ở lượt đầu tiên PHẢI trả lời luôn theo chủ đề đó.
- Ở lượt đầu tiên, không được hỏi ngược lại người dùng thay cho câu trả lời.
- Nếu câu hỏi ngắn, mơ hồ hoặc để trống, vẫn phải đưa ra một phần luận giải tổng quan hợp lý dựa trên chủ đề và 3 lá bài.
- Nếu người dùng hỏi về tương lai, ưu tiên trả lời xu hướng tương lai trước.
- Không giảng giải lá bài kiểu sách giáo khoa quá dài.
- Văn phong phải tự nhiên, giống người thật đang tư vấn.
- Không dùng từ quá máy móc hoặc sách giáo khoa.
- Có cảm xúc, nhưng không phóng đại.
- Không dùng markdown đậm **.
- Dùng đại từ “bạn” nếu người dùng không chỉ rõ đối tượng khác.
"""


def build_initial_reading_prompt(
    topic_label: str,
    user_question: str,
    cards: list[dict[str, Any]],
) -> str:
    card_1 = cards[0]["name"]
    card_2 = cards[1]["name"]
    card_3 = cards[2]["name"]

    return f"""
Chủ đề: {topic_label}
Câu hỏi người dùng: {user_question}

Ba lá bài đã rút:
- Lá bài 1: {card_1}
- Lá bài 2: {card_2}
- Lá bài 3: {card_3}

Hãy trả lời đúng theo cấu trúc sau:

TRẢ LỜI TRỰC TIẾP CHO CÂU HỎI:
[1 đoạn ngắn, nói thẳng kết quả chính]

LÁ BÀI 1: {card_1}
[giải thích riêng, liên hệ trực tiếp với câu hỏi]

LÁ BÀI 2: {card_2}
[giải thích riêng, liên hệ trực tiếp với câu hỏi]

LÁ BÀI 3: {card_3}
[giải thích riêng, liên hệ trực tiếp với câu hỏi]

TỔNG KẾT:
[1 đoạn ngắn, chốt lại đúng câu hỏi]

LỜI KHUYÊN:
- [ý 1]
- [ý 2]
- [ý 3]
"""


def build_follow_up_prompt(session: dict[str, Any], follow_up_message: str) -> str:
    cards = session["cards"]
    base_question = session.get("base_question", "")
    history = session.get("messages", [])

    cards_text = "\n".join([
        f"- Lá bài 1: {cards[0]['name']}",
        f"- Lá bài 2: {cards[1]['name']}",
        f"- Lá bài 3: {cards[2]['name']}",
    ])

    history_tail = history[-6:]
    history_text = "\n".join(
        [f"{m['role'].upper()}: {m['content']}" for m in history_tail]
    )

    return f"""
Đây là phần hỏi tiếp trên CÙNG MỘT TRẢI BÀI TAROT.

Câu hỏi gốc: {base_question}
Ba lá bài đã rút:
{cards_text}

Lịch sử gần nhất:
{history_text}

Câu hỏi tiếp theo của người dùng:
{follow_up_message}

Yêu cầu:
- Chỉ trả lời dựa trên đúng 3 lá bài này.
- Không đổi chủ đề sang chuyện khác.
- Không bịa thêm người hoặc sự kiện.
- Trả lời như đang nối tiếp cuộc trò chuyện trước.
- Ngắn gọn, rõ ràng, đúng trọng tâm.
"""


# =========================
# PAYMENT HELPERS
# =========================
def get_order_by_id(order_id: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        "SELECT * FROM token_orders WHERE id = %s",
        (order_id,),
    )

    row = cur.fetchone()
    conn.close()
    return row
def check_sepay_transaction(order):
    # 🚨 tạm thời mock (test)
    return True
import requests


def find_matching_sepay_transaction(order):
    try:
        if not SEPAY_API_TOKEN:
            print("❌ Thiếu SEPAY_API_TOKEN")
            return None

        account_no = str(order.get("account_no") or "").strip()
        transfer_code = str(order.get("transfer_code") or "").strip()
        amount = int(order.get("price_vnd") or 0)
        order_created_at = parse_db_datetime(order.get("created_at"))

        if not account_no or not transfer_code or amount <= 0:
            print("❌ Order thiếu dữ liệu")
            return None

        headers = {
            "Authorization": f"Bearer {SEPAY_API_TOKEN}",
            "Content-Type": "application/json",
        }

        params = {
            "account_number": account_no,
            "limit": 100,
        }

        res = requests.get(SEPAY_TRANSACTIONS_URL, headers=headers, params=params, timeout=30)

        if res.status_code != 200:
            print("❌ SEPAY ERROR:", res.text)
            return None

        data = res.json()
        transactions = data.get("transactions", [])

        transfer_code_norm = normalize_transfer_text(transfer_code)

        print("===== DEBUG SEPAY =====")
        print("TOTAL TX:", len(transactions))

        for tx in transactions:
            content = str(tx.get("transaction_content") or "")
            content_norm = normalize_transfer_text(content)

            tx_amount = int(float(tx.get("amount_in") or 0))
            tx_time = parse_sepay_datetime(tx.get("transaction_date"))

            print("CHECK:", content, tx_amount)

            if transfer_code_norm in content_norm and tx_amount == amount:

                if order_created_at and tx_time:
                    if abs((tx_time - order_created_at).total_seconds()) > 300:
                        continue

                print("✅ MATCH FOUND")
                return tx

        print("❌ NO MATCH")
        return None

    except Exception as e:
        print("🔥 ERROR:", e)
        return None
def mark_order_paid_from_manual_check(order_id: int, token_amount: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT status FROM token_orders WHERE id = %s", (order_id,))
    row = cur.fetchone()

    if not row:
        conn.close()
        return None

    if row["status"] == "paid":
        conn.close()
        return get_order(order_id)

    cur.execute("""
        UPDATE token_orders
        SET status='paid', paid_at=NOW()
        WHERE id=%s
    """, (order_id,))

    cur.execute("""
        UPDATE users
        SET token_balance = token_balance + %s
        WHERE email = (
            SELECT user_email FROM token_orders WHERE id = %s
        )
    """, (token_amount, order_id))

    conn.commit()
    conn.close()

    return get_order(order_id)


# =========================
# MODELS
# =========================
class CreateOrderBody(BaseModel):
    user_email: str
    package_code: str


class TarotRequestBody(BaseModel):
    user_email: str = ""
    topic: str = "general"
    question: str = ""
    cards: list[dict]


class TarotFollowUpBody(BaseModel):
    conversation_id: str
    message: str = ""
    user_email: str = ""


TOPIC_LABELS = {
    "love": "Tình yêu",
    "family": "Gia đình",
    "career": "Sự nghiệp",
    "health": "Sức khỏe",
    "money": "Tài chính",
    "general": "Chung",
}

TAROT_CHAT_SESSIONS: dict[str, dict[str, Any]] = {}


# =========================
# ROUTES
# =========================
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    if not os.path.isdir(TEMPLATES_DIR):
        return HTMLResponse("<h1>Templates folder not found</h1>", status_code=500)

    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/health")
async def health():
    return {
        "ok": True,
        "port": 8002,
        "current_api": CURRENT_API,
        "static_exists": os.path.isdir(STATIC_DIR),
        "templates_exists": os.path.isdir(TEMPLATES_DIR),
    }


@app.get("/api/debug-vietqr")
async def debug_vietqr():
    return {
        "has_client_id": bool(VIETQR_CLIENT_ID),
        "has_api_key": bool(VIETQR_API_KEY),
        "client_id_preview": VIETQR_CLIENT_ID[:8] if VIETQR_CLIENT_ID else "",
        "api_key_preview": VIETQR_API_KEY[:8] if VIETQR_API_KEY else "",
    }


@app.get("/api/all_cards")
async def all_cards():
    try:
        cards = get_all_cards_safe()

        if not cards:
            return safe_json_response({
                "success": False,
                "error": "Không tìm thấy dữ liệu lá bài. Hãy kiểm tra static/images/tarot hoặc tarot_logic.py",
                "cards": [],
            }, status_code=200)

        return safe_json_response({
            "success": True,
            "count": len(cards),
            "cards": cards,
        }, status_code=200)

    except Exception as e:
        traceback.print_exc()
        return safe_json_response({
            "success": False,
            "error": str(e),
            "cards": [],
        }, status_code=500)


@app.post("/api/tarot")
async def tarot(data: TarotRequestBody):
    try:
        question = (data.question or "").strip()
        topic = (data.topic or "general").strip().lower()
        user_email = normalize_email(data.user_email)
        cards = data.cards or []

        if not isinstance(cards, list) or len(cards) != 3:
            return safe_json_response({"error": "Hãy chọn đúng 3 lá bài"}, status_code=400)

        roles = ["Quá khứ", "Hiện tại", "Tương lai"]

        normalized_cards = []
        for i, c in enumerate(cards):
            if not isinstance(c, dict):
                continue

            normalized_cards.append({
                "name": c.get("name", f"Lá bài {i + 1}"),
                "suit": c.get("suit", "major"),
                "image": c.get("image", "default.png"),
                "position": i + 1,
                "role": roles[i] if i < len(roles) else "Thông điệp",
            })

        if len(normalized_cards) != 3:
            return safe_json_response({"error": "Dữ liệu lá bài không hợp lệ"}, status_code=400)

        topic_label = TOPIC_LABELS.get(topic, "Chung")
        conversation_id = uuid4().hex

        TAROT_CHAT_SESSIONS[conversation_id] = {
            "conversation_id": conversation_id,
            "topic": topic,
            "topic_label": topic_label,
            "user_email": user_email,
            "cards": normalized_cards,
            "base_question": "",
            "messages": [],
            "initial_answer": "",
        }

        user_question = question if question else f"Tổng quan về {topic_label.lower()} trong thời gian tới"

        system_prompt = build_tarot_system_prompt()
        user_prompt = build_initial_reading_prompt(topic_label, user_question, normalized_cards)
        answer = call_ai_tarot(system_prompt, user_prompt)

        TAROT_CHAT_SESSIONS[conversation_id]["base_question"] = user_question
        TAROT_CHAT_SESSIONS[conversation_id]["initial_answer"] = answer
        TAROT_CHAT_SESSIONS[conversation_id]["messages"] = [
            {"role": "user", "content": user_question},
            {"role": "assistant", "content": answer},
        ]

        if user_email:
            save_tarot_history(
                user_email=user_email,
                topic=topic,
                question=user_question,
                cards=normalized_cards[:3],
                answer=answer,
            )

        return safe_json_response({
            "success": True,
            "conversation_id": conversation_id,
            "need_more_info": False,
            "cards": normalized_cards,
            "answer": answer,
        }, status_code=200)

    except Exception as e:
        traceback.print_exc()
        return safe_json_response({
            "error": str(e),
            "answer": "❌ Lỗi khi kết nối Tarot AI.",
        }, status_code=500)


@app.post("/api/tarot/follow-up")
async def tarot_follow_up(data: TarotFollowUpBody):
    try:
        conversation_id = (data.conversation_id or "").strip()
        message = (data.message or "").strip()
        user_email = normalize_email(data.user_email)

        if not conversation_id:
            return safe_json_response({"error": "Thiếu conversation_id"}, status_code=400)

        if not message:
            return safe_json_response({"error": "Thiếu nội dung câu hỏi tiếp theo"}, status_code=400)

        session = TAROT_CHAT_SESSIONS.get(conversation_id)
        if not session:
            return safe_json_response({"error": "Không tìm thấy phiên Tarot"}, status_code=404)

        system_prompt = build_tarot_system_prompt()

        if not session.get("base_question"):
            session["base_question"] = message

            user_prompt = build_initial_reading_prompt(
                session["topic_label"],
                message,
                session["cards"],
            )
            answer = call_ai_tarot(system_prompt, user_prompt)

            session["initial_answer"] = answer
            session["messages"] = [
                {"role": "user", "content": message},
                {"role": "assistant", "content": answer},
            ]

            if user_email:
                save_tarot_history(
                    user_email=user_email,
                    topic=session["topic"],
                    question=message,
                    cards=session["cards"][:3],
                    answer=answer,
                )

            return safe_json_response({
                "success": True,
                "conversation_id": conversation_id,
                "need_more_info": False,
                "cards": session["cards"],
                "answer": answer,
            }, status_code=200)

        session["messages"].append({"role": "user", "content": message})

        user_prompt = build_follow_up_prompt(session, message)
        answer = call_ai_tarot(system_prompt, user_prompt)

        session["messages"].append({"role": "assistant", "content": answer})

        return safe_json_response({
            "success": True,
            "conversation_id": conversation_id,
            "need_more_info": False,
            "cards": session["cards"],
            "answer": answer,
        }, status_code=200)

    except Exception as e:
        traceback.print_exc()
        return safe_json_response({
            "error": str(e),
            "answer": "❌ Không thể xử lý câu hỏi tiếp theo lúc này.",
        }, status_code=500)


# =========================
# TAROT HISTORY ROUTES
# =========================
@app.get("/api/tarot/history")
def get_tarot_history(email: str):
    try:
        email = normalize_email(email)

        if not email:
            raise HTTPException(status_code=400, detail="Thiếu email")

        items = get_tarot_history_by_email(email)

        return {
            "success": True,
            "items": items
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tarot/history")
def delete_tarot_history(email: str):
    try:
        email = normalize_email(email)

        if not email:
            raise HTTPException(status_code=400, detail="Thiếu email")

        delete_tarot_history_by_email(email)

        return {
            "success": True
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# PAYMENT ROUTES
# =========================

@app.get("/api/users/tokens")
async def user_tokens(email: str):
    email = normalize_email(email)
    if not email:
        raise HTTPException(status_code=400, detail="Thiếu email người dùng.")
    return {"success": True, "token_balance": get_user_tokens(email)}

@app.post("/api/payments/create-order")
async def payments_create_order(body: CreateOrderBody):
    try:
        print("DEBUG create-order raw:", body.dict())
        
        user_email = normalize_email(body.user_email)
        package_code = (body.package_code or "").strip().lower()

        if not user_email:
            raise HTTPException(status_code=400, detail="Thiếu email người dùng.")

        if "@" not in user_email:
            raise HTTPException(status_code=400, detail="Email không hợp lệ.")

        if package_code not in ["starter", "explorer", "master"]:
            raise HTTPException(status_code=400, detail="Gói nạp không hợp lệ.")

        if not VIETQR_CLIENT_ID or not VIETQR_API_KEY:
            raise HTTPException(status_code=500, detail="Thiếu VIETQR_CLIENT_ID hoặc VIETQR_API_KEY.")

        order = create_order(user_email, package_code)
        return {"success": True, **order}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 🔥 đổi SQLite → MySQL
    except mysql.connector.Error as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"database error: {str(e)}")

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payments/order/{order_id}")
async def payments_get_order(order_id: int):
    try:
        order = get_order(order_id)

        if not order:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng.")

        return {
            "success": True,
            **serialize_order_compact(order),
        }

    except mysql.connector.Error as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"database error: {str(e)}")

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Header, HTTPException

from fastapi import HTTPException
import traceback

@app.post("/api/payments/check-order/{order_id}")
async def check_order(order_id: int):
    try:
        print(f"🔍 CHECK ORDER: {order_id}")

        # ================= 1. GET ORDER =================
        order = get_order_by_id(order_id)

        if not order:
            print("❌ ORDER NOT FOUND")
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

        print("📦 ORDER:", order)

        # ================= 2. NẾU ĐÃ PAID =================
        if order.get("status") == "paid":
            print("✅ ORDER ALREADY PAID → APPLY PACKAGE")

            try:
                order = apply_package_to_user_from_order(order)
                print("🚀 PACKAGE APPLIED (PAID CASE)")
            except Exception as e:
                print("⚠️ APPLY PACKAGE ERROR:", e)

            return {
                "success": True,
                "status": "paid",   # 🔥 BẮT BUỘC
                "order": order,
                "message": "Đã thanh toán"
            }

        # ================= 3. TÌM GIAO DỊCH =================
        print("🔎 FIND TRANSACTION...")
        tx = find_matching_sepay_transaction(order)

        if not tx:
            print("❌ NO MATCHING TRANSACTION")
            return {
                "success": False,
                "status": "pending",
                "order": order,
                "message": "Chưa tìm thấy giao dịch phù hợp"
            }

        print("💰 FOUND TX:", tx)

        # ================= 4. UPDATE ORDER =================
        print("📝 MARK ORDER PAID...")
        updated = mark_order_paid_from_manual_check(
            order_id=order["id"],
            token_amount=int(order.get("token_amount") or 0)
        )

        if not updated:
            print("❌ UPDATE ORDER FAILED")
            raise HTTPException(status_code=500, detail="Không cập nhật được đơn hàng")

        print("✅ ORDER UPDATED:", updated)

        # ================= 5. APPLY PACKAGE =================
        try:
            print("🚀 APPLY PACKAGE...")
            updated = apply_package_to_user_from_order(updated)
            print("✅ PACKAGE APPLIED")
        except Exception as e:
            print("⚠️ APPLY PACKAGE ERROR:", e)

        # ================= 6. RETURN =================
        return {
            "success": True,
            "status": "paid",   # 🔥 QUAN TRỌNG NHẤT
            "order": updated,
            "transaction": tx,
            "message": "Thanh toán thành công"
        }

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        print("🔥 SERVER ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")
@app.get("/api/payments/auto-check/{order_id}")
async def auto_check(order_id: int):
    try:
        print(f"🔍 AUTO CHECK ORDER: {order_id}")

        # ================= 1. LẤY ORDER =================
        order = get_order_by_id(order_id)

        if not order:
            print("❌ ORDER NOT FOUND")
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

        print("📦 ORDER:", order)

        # ================= 2. NẾU ĐÃ PAID =================
        if order.get("status") == "paid":
            print("✅ ORDER ALREADY PAID → APPLY PACKAGE")

            try:
                order = apply_package_to_user_from_order(order)
                print("🚀 PACKAGE APPLIED (AUTO CHECK)")
            except Exception as e:
                print("⚠️ APPLY PACKAGE ERROR:", e)

            return {
                "success": True,
                "status": "paid",
                "order": order
            }

        # ================= 3. TÌM GIAO DỊCH =================
        print("🔎 FIND TRANSACTION...")
        tx = find_matching_sepay_transaction(order)

        if not tx:
            print("❌ NO MATCHING TRANSACTION")
            return {
                "success": False,
                "status": "pending",
                "order": order
            }

        print("💰 FOUND TX:", tx)

        # ================= 4. UPDATE ORDER =================
        print("📝 MARK ORDER PAID...")

        updated = mark_order_paid_from_manual_check(
            order_id=order["id"],
            token_amount=int(order.get("token_amount") or 0)
        )

        if not updated:
            print("❌ UPDATE ORDER FAILED")
            raise HTTPException(status_code=500, detail="Không cập nhật được đơn hàng")

        print("✅ ORDER UPDATED:", updated)

        # ================= 5. APPLY PACKAGE =================
        try:
            print("🚀 APPLY PACKAGE...")
            updated = apply_package_to_user_from_order(updated)
            print("✅ PACKAGE APPLIED")
        except Exception as e:
            print("⚠️ APPLY PACKAGE ERROR:", e)

        # ================= 6. RETURN =================
        return {
            "success": True,
            "status": "paid",
            "order": updated,
            "transaction": tx
        }

    except HTTPException:
        raise

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("🔥 AUTO CHECK ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))# =========================paymen
@app.get("/api/users/profile-summary")
def profile_summary(email: str):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT 
            email,
            token_balance,
            current_package_code,
            current_package_name,
            package_started_at,
            package_ends_at
        FROM users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(%s))
    """, (email,))

    row = cur.fetchone()
    conn.close()

    if not row:
        return {
            "success": True,
            "email": email,
            "token_balance": 0,
            "current_package": None
        }

    return {
        "success": True,
        "email": row["email"],
        "token_balance": row["token_balance"],
        "current_package": {
            "package_code": row["current_package_code"],
            "package_name": row["current_package_name"],
            "started_at": row["package_started_at"],
            "ends_at": row["package_ends_at"]
        } if row["current_package_code"] else None
    }
def apply_package_to_user_from_order(order: dict):
    if not order:
        return order
    
    user_email = normalize_email(order.get("user_email"))
    package_code = str(order.get("package_code") or "").strip().lower()
    package_name = str(order.get("package_name") or "").strip()
    print("EMAIL APPLY:", user_email)

    if not user_email or not package_code or not package_name:
        print("❌ BỎ APPLY PACKAGE vì thiếu data")
        return order

    duration_days = PACKAGE_DURATION_DAYS.get(package_code, 30)
    now = datetime.now()
    end_date = now + timedelta(days=duration_days)

    conn = get_conn()
    cur = conn.cursor()

    # đảm bảo user tồn tại
    cur.execute("""
        INSERT IGNORE INTO users (email, token_balance)
        VALUES (%s, 0)
    """, (user_email,))

    # update package
    cur.execute("""
        UPDATE users
        SET
            current_package_code = %s,
            current_package_name = %s,
            package_started_at = %s,
            package_ends_at = %s
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(%s))
    """, (
        package_code,
        package_name,
        now.strftime("%Y-%m-%d %H:%M:%S"),
        end_date.strftime("%Y-%m-%d %H:%M:%S"),
        user_email
    ))

    conn.commit()
    conn.close()

    return order
    
@app.get("/debug/users")
async def debug_users():
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT * FROM users")
        rows = cur.fetchall()

        conn.close()

        return {
            "count": len(rows),
            "users": rows
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
@app.get("/api/admin/dashboard")
def admin_dashboard():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM users")
    total_users = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM token_orders")
    total_orders = cur.fetchone()[0]

    cur.execute("SELECT IFNULL(SUM(price_vnd),0) FROM token_orders WHERE status='paid'")
    revenue = cur.fetchone()[0]

    conn.close()

    return {
        "success": True,
        "total_users": total_users,
        "total_orders": total_orders,
        "total_revenue": revenue
    }

@app.get("/api/admin/revenue-by-day")
def revenue_by_day():
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)

        # 🔥 check bảng tồn tại (MySQL)
        cur.execute("""
            SELECT COUNT(*) as count
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
            AND table_name = 'token_orders'
        """)
        table_check = cur.fetchone()

        if table_check["count"] == 0:
            conn.close()
            return {
                "success": False,
                "error": "Missing table: token_orders"
            }

        # 🔥 query (MySQL version)
        cur.execute("""
            SELECT 
                DATE(paid_at) as day,
                IFNULL(SUM(price_vnd), 0) as revenue
            FROM token_orders
            WHERE status='paid'
            AND paid_at IS NOT NULL
            GROUP BY DATE(paid_at)
            ORDER BY day DESC
            LIMIT 7
        """)

        rows = cur.fetchall()
        conn.close()

        return {
            "success": True,
            "data": [
                {
                    "day": row["day"].strftime("%Y-%m-%d") if row["day"] else None,
                    "revenue": row["revenue"]
                }
                for row in rows
            ]
        }

    except Exception as e:
        print("REVENUE ERROR:", e)
        return {
            "success": False,
            "error": str(e)
        }
@app.get("/api/admin/users")
def get_users():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT id, email, role, token_balance 
        FROM users
        ORDER BY id DESC
    """)

    data = cur.fetchall()
    conn.close()

    return {"success": True, "data": data}
@app.put("/api/admin/users/{user_id}")
def update_user(user_id: int, data: dict):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE users 
        SET role=%s, token_balance=%s 
        WHERE id=%s
    """, (
        data.get("role"),
        data.get("token_balance"),
        user_id
    ))

    conn.commit()
    conn.close()

    return {"success": True}
@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
    conn.commit()
    conn.close()

    return {"success": True}
@app.get("/api/admin/orders")
def get_orders():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT id, user_email, price_vnd, status, paid_at
        FROM token_orders
        ORDER BY id DESC
    """)

    data = cur.fetchall()
    conn.close()

    return {"success": True, "data": data}
@app.delete("/api/admin/orders/{order_id}")
def delete_order(order_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("DELETE FROM token_orders WHERE id=%s", (order_id,))
    conn.commit()
    conn.close()

    return {"success": True}


# =========================
# RUN
# =========================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8002, reload=True)