import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from pydoc import text
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from fastapi import FastAPI, Request, Header, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

import jwt
from dotenv import load_dotenv
load_dotenv(override=True)
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
import json
import re
print("APP FILE LOADED")
class SepayWebhook(BaseModel):
    content: str
    amount: int
    account_number: str

def get_conn():
    try:
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="database_schema",
            connect_timeout=5
        )
    except mysql.connector.Error as err:
        print(f"❌ DATABASE CONNECTION ERROR: {err}")
        raise HTTPException(status_code=500, detail="Không thể kết nối tới cơ sở dữ liệu. Vui lòng kiểm tra MySQL.")
from db import (
    init_db,
    save_tarot_history,
    get_tarot_history_by_email,
    delete_tarot_history_by_email,
    deduct_user_tokens,
    save_tarot_session,
    get_tarot_session,
)
from payment_service import (
    create_order,
    get_order,
    get_user_tokens,
    process_sepay_webhook,
    PACKAGE_MAP,
)

try:
    from tarot_logic import draw_cards, load_all_cards as tarot_logic_load_all_cards
except Exception:
    draw_cards = None
    tarot_logic_load_all_cards = None

def get_tarot_costs():
    costs = {"reading_cost": 5, "follow_up_cost": 2, "temperature": 0.35, "max_tokens": 1800}
    try:
        config_path = "tarot_config.json"
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                saved = json.load(f)
                costs["reading_cost"] = int(saved.get("reading_cost", 5))
                costs["follow_up_cost"] = int(saved.get("follow_up_cost", 2))
                costs["temperature"] = float(saved.get("temperature", 0.35))
                costs["max_tokens"] = int(saved.get("max_tokens", 1800))
    except Exception:
        pass
    return costs

READING_COST = get_tarot_costs()["reading_cost"]
FOLLOW_UP_COST = get_tarot_costs()["follow_up_cost"]
app = FastAPI()
print("🔥 WEBHOOK REGISTERED")


from fastapi import Request
from datetime import datetime
import re


@app.post("/api/payments/webhook/sepay")
async def payments_webhook_sepay(request: Request):

    conn = None

    try:

        # =====================================================
        # SECURITY CHECK
        # =====================================================
        auth_header = request.headers.get("Authorization", "")
        # SEPAY_WEBHOOK_API_KEY được nạp từ env ở trên
        if SEPAY_WEBHOOK_API_KEY and auth_header != f"Bearer {SEPAY_WEBHOOK_API_KEY}":
            print("❌ UNAUTHORIZED WEBHOOK ATTEMPT")
            return {"success": False, "message": "Invalid API Key"}

        # =====================================================
        # READ PAYLOAD
        # =====================================================
        try:
            payload = await request.json()

        except Exception:
            raw_body = await request.body()

            print("⚠️ RAW BODY:", raw_body)

            try:
                payload = json.loads(raw_body.decode())
            except Exception:
                payload = {}

        payload = dict(payload)

        print("🔥 WEBHOOK DATA:", payload)

        # =====================================================
        # PARSE CONTENT
        # =====================================================
        content = (
            payload.get("content")
            or payload.get("transfer_content")
            or payload.get("description")
            or payload.get("addInfo")
            or ""
        )

        content = str(content).strip()

        # =====================================================
        # PARSE AMOUNT
        # =====================================================
        raw_amount = (
            payload.get("transferAmount")
            or payload.get("amount")
            or payload.get("transfer_amount")
            or 0
        )

        raw_amount = (
            str(raw_amount)
            .replace(",", "")
            .replace(".", "")
            .replace("đ", "")
            .replace("vnd", "")
            .strip()
        )

        try:
            amount = int(raw_amount)

        except Exception:
            amount = 0

        # =====================================================
        # ACCOUNT NUMBER
        # =====================================================
        account_no = str(
            payload.get("accountNumber")
            or payload.get("account_number")
            or ""
        ).strip()

        print("========== WEBHOOK INPUT ==========")
        print("PAYLOAD :", payload)
        print("CONTENT :", content)
        print("AMOUNT  :", amount)
        print("ACCOUNT :", account_no)
        print("===================================")

        # =====================================================
        # VALIDATE
        # =====================================================
        if amount <= 0:
            print("❌ INVALID AMOUNT")

            return {
                "success": False,
                "message": "Invalid amount"
            }

        # =====================================================
        # CONNECT DB
        # =====================================================
        conn = get_conn()
        cur = conn.cursor(dictionary=True)

        # =====================================================
        # GET PENDING ORDERS
        # =====================================================
        cur.execute("""
            SELECT *
            FROM token_orders
            WHERE status = 'pending'
        """)

        orders = cur.fetchall()

        print("📦 TOTAL PENDING ORDERS:", len(orders))

        if not orders:
            conn.close()

            return {
                "success": False,
                "message": "No pending orders"
            }

        # =====================================================
        # NORMALIZE
        # =====================================================
        def normalize(text):
            return re.sub(
                r'[^a-zA-Z0-9]',
                '',
                str(text)
            ).lower()

        content_norm = normalize(content)

        print("CONTENT_NORM:", content_norm)

        matched_order = None

        # =====================================================
        # FIND MATCH
        # =====================================================
        for order in orders:

            transfer_code = normalize(
                order.get("transfer_code", "")
            )

            # PRICE
            price_raw = str(
                order.get("price_vnd", 0)
            )

            price_raw = (
                price_raw
                .replace(",", "")
                .replace(".", "")
                .strip()
            )

            try:
                price = int(price_raw)
            except Exception:
                price = 0

            print("========== COMPARE ==========")
            print("ORDER ID     :", order.get("id"))
            print("TRANSFER CODE:", transfer_code)
            print("PRICE DB     :", price)
            print("AMOUNT       :", amount)

            # MATCH CODE (Thử cả 2 cách: khớp chính xác hoặc khớp một phần)
            if (transfer_code == content_norm) or (transfer_code and transfer_code in content_norm):
                print(f"✅ MATCH CODE: {transfer_code}")

                # MATCH PRICE (Cho phép sai số 100đ để tránh lỗi làm tròn)
                if abs(price - amount) <= 100:
                    print("✅ MATCH PRICE")
                    matched_order = order
                    break

                else:
                    print("❌ PRICE NOT MATCH")

            else:
                print("❌ CODE NOT MATCH")

        # =====================================================
        # NO MATCH
        # =====================================================
        if not matched_order:

            print("❌ NO MATCHED ORDER")

            conn.close()

            return {
                "success": False,
                "message": "No matched order"
            }

        print("🎯 MATCHED ORDER:", matched_order["id"])

        # =====================================================
        # CHECK DUPLICATE
        # =====================================================
        cur.execute("""
            SELECT status
            FROM token_orders
            WHERE id = %s
        """, (matched_order["id"],))

        latest_order = cur.fetchone()

        if latest_order and latest_order["status"] == "paid":

            print("⚠️ ORDER ALREADY PAID")

            conn.close()

            return {
                "success": True,
                "message": "Already paid"
            }

        # =====================================================
        # UPDATE ORDER
        # =====================================================
        sepay_id = str(payload.get("id") or "")
        cur.execute("""
            UPDATE token_orders
            SET
                status = 'paid',
                paid_at = NOW(),
                sepay_tx_id = %s
            WHERE id = %s
        """, (sepay_id, matched_order["id"]))

        conn.commit()

        print("✅ ORDER UPDATED")

        # =====================================================
        # ACTIVATE PACKAGE
        # =====================================================
        try:
            print("🚀 APPLYING PACKAGE & TOKENS...")
            apply_package_to_user_from_order(matched_order)
            print("✅ PACKAGE & TOKENS ACTIVATED")
        except Exception as e:
            print("⚠️ PACKAGE ERROR:", e)

        # =====================================================
        # DONE
        # =====================================================
        conn.close()

        print("🎉 PAYMENT SUCCESS")

        return {
            "success": True,
            "message": "Payment success",
            "order_id": matched_order["id"]
        }

    except Exception as e:

        import traceback

        traceback.print_exc()

        print("🔥 WEBHOOK ERROR:", e)

        try:
            if conn:
                conn.close()
        except:
            pass

        return {
            "success": False,
            "error": str(e)
        }
# Khởi tạo database khi start app (có bảo vệ)
try:
    init_db()
    ensure_subscription_columns()
    print("✅ DATABASE INITIALIZED & VERIFIED")
except Exception as e:
    print(f"⚠️ DATABASE INIT WARNING: {e}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Mount production React build folders if they exist
DIST_DIR = os.path.join(BASE_DIR, "dist")
if os.path.isdir(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    images_dir = os.path.join(DIST_DIR, "images")
    audio_dir = os.path.join(DIST_DIR, "audio")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    if os.path.isdir(images_dir):
        app.mount("/images", StaticFiles(directory=images_dir), name="images")
    if os.path.isdir(audio_dir):
        app.mount("/audio", StaticFiles(directory=audio_dir), name="audio")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

# =========================
# LOAD ENV
# =========================
load_dotenv()

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
HF_KEY = os.getenv("HF_API_KEY", "").strip()
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
SEPAY_WEBHOOK_API_KEY = os.getenv("SEPAY_WEBHOOK_API_KEY", "").strip()
VIETQR_CLIENT_ID = os.getenv("VIETQR_CLIENT_ID", "").strip()
VIETQR_API_KEY = os.getenv("VIETQR_API_KEY", "").strip()
def get_sepay_api_token():
    load_dotenv(override=True)
    return os.getenv("SEPAY_API_TOKEN", "").strip()

SEPAY_TRANSACTIONS_URL = "https://my.sepay.vn/userapi/transactions/list"

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "z-ai/glm-4.5-air:free").strip()
HF_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
HF_URL = "https://router.huggingface.co/v1/chat/completions"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

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

    except HTTPException as he:
        raise he
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
        if "status" not in user_cols:
            cur.execute("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'")

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
        if "sepay_tx_id" not in order_cols:
            cur.execute("ALTER TABLE token_orders ADD COLUMN sepay_tx_id VARCHAR(100)")
        if "tokens_added" not in order_cols:
            cur.execute("ALTER TABLE token_orders ADD COLUMN tokens_added TINYINT DEFAULT 0")

        conn.commit()
        conn.close()

    except Exception as e:
        print("ensure_subscription_columns ERROR:", e)
@app.post("/api/login")
def login(data: dict):
    try:
        email = data.get("email").strip().lower()
        password = data.get("password").strip()

        # Retrieve user from DB
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""SELECT email, password, role, token_balance, current_package_code, current_package_name, status
               FROM users WHERE email=%s""", (email,))
        user = cur.fetchone()
        conn.close()
        if not user:
            raise HTTPException(401, "Sai email")
        # Kiểm tra mật khẩu thông thường
        if user[1] != password:
            raise HTTPException(401, "Sai mật khẩu")

        # Check blocked
        if len(user) > 6 and user[6] == "banned":
            raise HTTPException(403, "Tài khoản của bạn đã bị khoá bởi Admin!")

        return {
            "email": user[0],
            "role": user[2],
            "token_balance": user[3],
            "package_code": user[4],
            "package_name": user[5]
        }

    except HTTPException as he:
        raise he
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


def call_openai(system_prompt: str, user_prompt: str, temp: float = 0.35, max_tok: int = 1800) -> str:
    if not OPENAI_KEY:
        raise Exception("Missing OPENAI_API_KEY")
    headers = {
        "Authorization": f"Bearer {OPENAI_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temp,
        "max_tokens": max_tok,
    }
    r = requests.post(OPENAI_URL, headers=headers, json=payload, timeout=60)
    if r.status_code == 200:
        return r.json()["choices"][0]["message"]["content"]
    raise Exception(f"OpenAI error {r.status_code}: {r.text}")


def call_ai(prompt: str) -> str:
    try:
        if CURRENT_API == "openrouter":
            return call_openrouter(prompt)
        if CURRENT_API == "openai":
            return call_openai("", prompt)
        return call_huggingface(prompt)
    except Exception as e:
        print("AI error:", e)
        return "🔮 Tarot AI đang nghỉ ngơi. Hãy tin vào trực giác của bạn."


def call_ai_tarot(system_prompt: str, user_prompt: str) -> str:
    try:
        costs = get_tarot_costs()
        temp = costs.get("temperature", 0.35)
        max_tok = costs.get("max_tokens", 1800)

        if CURRENT_API == "openai":
            costs = get_tarot_costs()
            return call_openai(system_prompt, user_prompt, costs.get("temperature", 0.35), costs.get("max_tokens", 1800))

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
                "temperature": temp,
                "max_tokens": max_tok,
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
            "temperature": temp,
            "max_tokens": max_tok,
        }

        r = requests.post(HF_URL, headers=headers, json=payload, timeout=40)
        if r.status_code == 200:
            data = r.json()
            return data["choices"][0]["message"]["content"]

        raise Exception(f"HuggingFace error {r.status_code}: {r.text}")

    except Exception as e:
        print("AI tarot error:", e)
        return "🔮 Tarot AI đang nghỉ ngơi. Hãy thử lại sau."


def build_tarot_system_prompt(language: str = "vi") -> str:
    if language == "en":
        return """You are a professional Tarot expert. You think logically and do not make wild assumptions.

PRINCIPLES:
- Only rely on the information provided by the user.
- Do not invent characters like "your girl", "a man", "a third person", "she", "he" if the user didn't mention them.
- Do not invent backgrounds, events, or private details.
- If the user selects a topic (love, family, career, health, money), you MUST answer according to that topic.
- On the first turn, do not ask the user a question instead of providing an answer.
- If the question is short, vague, or empty, provide a reasonable general reading based on the topic and the cards.
- If the user asks about the future, prioritize answering the future trend first.
- Do not explain cards like a textbook.
- Keep the tone natural, like a real person consulting.
- Do not use overly mechanical or textbook words.
- Have emotion, but do not exaggerate.
- Do not use bold markdown **.
- Always use "you" if the user doesn't specify otherwise.
- YOU MUST RESPOND ENTIRELY IN ENGLISH. DO NOT USE VIETNAMESE."""

    prompt_file = "tarot_system_prompt.txt"
    if os.path.exists(prompt_file):
        try:
            with open(prompt_file, "r", encoding="utf-8") as f:
                prompt = f.read().strip()
                return prompt
        except Exception:
            pass
            
    default_prompt = """Bạn là chuyên gia Tarot nói tiếng Việt, có tư duy chặt chẽ và không suy diễn bừa.

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
- Dùng đại từ “bạn” nếu người dùng không chỉ rõ đối tượng khác."""

    try:
        with open(prompt_file, "w", encoding="utf-8") as f:
            f.write(default_prompt)
    except Exception:
        pass
    return default_prompt


def build_initial_reading_prompt(
    topic_label: str,
    user_question: str,
    cards: list[dict[str, Any]],
    spread_name: str = "Trải bài",
    language: str = "vi"
) -> str:
    if language == "en":
        cards_text = "\n".join([f"- {c.get('role', f'Card {i+1}')}: {c['name']}" for i, c in enumerate(cards)])
        return f"""
Spread type: {spread_name}
Topic: {topic_label}
User question: {user_question}

Drawn cards:
{cards_text}

Please answer exactly according to this structure:

DIRECT ANSWER:
[A short paragraph, stating the main result directly]

DETAILED CARD ANALYSIS:
[Analyze each card above according to their exact role and name]

CONCLUSION:
[A short paragraph, concluding exactly on the question]

ADVICE:
- [point 1]
- [point 2]
- [point 3]
"""

    cards_text = "\n".join([f"- {c.get('role', f'Lá bài {i+1}')}: {c['name']}" for i, c in enumerate(cards)])

    return f"""
Kiểu trải bài: {spread_name}
Chủ đề: {topic_label}
Câu hỏi người dùng: {user_question}

Các lá bài đã rút:
{cards_text}

Hãy trả lời đúng theo cấu trúc sau:

TRẢ LỜI TRỰC TIẾP CHO CÂU HỎI:
[1 đoạn ngắn, nói thẳng kết quả chính]

LUẬN GIẢI CHI TIẾT CÁC LÁ BÀI:
[Phân tích từng lá bài ở trên theo đúng vai trò và tên của chúng]

TỔNG KẾT:
[1 đoạn ngắn, chốt lại đúng câu hỏi]

LỜI KHUYÊN:
- [ý 1]
- [ý 2]
- [ý 3]
"""


def build_follow_up_prompt(session: dict[str, Any], follow_up_message: str, language: str = "vi") -> str:
    cards = session["cards"]
    base_question = session.get("base_question", "")
    history = session.get("messages", [])

    if language == "en":
        cards_text = "\n".join([
            f"- {c.get('role', f'Card {i+1}')}: {c['name']}" 
            for i, c in enumerate(cards)
        ])
        history_tail = history[-6:]
        history_text = "\n".join(
            [f"{m['role'].upper()}: {m['content']}" for m in history_tail]
        )
        return f"""
This is a follow-up question on the SAME TAROT READING.

Original question: {base_question}
Drawn cards:
{cards_text}

Recent history:
{history_text}

User's next question:
{follow_up_message}

Requirements:
- Only answer based on these exact cards.
- Do not change the topic.
- Do not invent new people or events.
- Answer as a continuation of the previous conversation.
- Keep it concise, clear, and to the point.
"""

    cards_text = "\n".join([
        f"- {c.get('role', f'Lá bài {i+1}')}: {c['name']}" 
        for i, c in enumerate(cards)
    ])

    history_tail = history[-6:]
    history_text = "\n".join(
        [f"{m['role'].upper()}: {m['content']}" for m in history_tail]
    )

    return f"""
Đây là phần hỏi tiếp trên CÙNG MỘT TRẢI BÀI TAROT.

Câu hỏi gốc: {base_question}
Các lá bài đã rút:
{cards_text}

Lịch sử gần nhất:
{history_text}

Câu hỏi tiếp theo của người dùng:
{follow_up_message}

Yêu cầu:
- Chỉ trả lời dựa trên đúng các lá bài này.
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
        token = get_sepay_api_token()
        if not token:
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
            "Authorization": f"Bearer {get_sepay_api_token()}",
            "Content-Type": "application/json",
        }

        params = {
            "limit": 50, # Lấy 50 giao dịch gần nhất
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

            print(f"🧐 ĐANG CHECK: ND='{content}', Số tiền={tx_amount}")
            print(f"   => So sánh: '{transfer_code_norm}' in '{content_norm}'? {transfer_code_norm in content_norm}")
            print(f"   => So sánh: {tx_amount} == {amount}? {tx_amount == amount}")

            if transfer_code_norm in content_norm and tx_amount == amount:
                print(f"✅ KHỚP GIAO DỊCH! ID={tx.get('id')}")

                # Chấp nhận giao dịch trong vòng 48h để linh hoạt
                if order_created_at and tx_time:
                    diff = abs((tx_time - order_created_at).total_seconds())
                    if diff > 172800: # 48 hours
                        continue

                print(f"✅ MATCH FOUND: ID {tx.get('id')}")
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
        # Vẫn trả về order để frontend biết là thành công
        return get_order(order_id)

    # Cập nhật status trước để đánh dấu đã xử lý
    cur.execute("""
        UPDATE token_orders
        SET status='paid', paid_at=NOW()
        WHERE id=%s
    """, (order_id,))

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
    spread_type: str = "three"
    language: str = "vi"


class TarotFollowUpBody(BaseModel):
    conversation_id: str
    message: str = ""
    user_email: str = ""
    language: str = "vi"


TOPIC_LABELS = {
    "love": "Tình yêu",
    "family": "Gia đình",
    "career": "Sự nghiệp",
    "health": "Sức khỏe",
    "money": "Tài chính",
    "general": "Chung",
}

SPREAD_ROLES = {
    "single": ["Thông điệp ngày hôm nay"],
    "three": ["Quá khứ", "Hiện tại", "Tương lai"],
    "mirror": ["Bản thân", "Thế giới", "Điều bạn thấy", "Điều ẩn giấu"],
    "five": ["Hiện tại", "Thử thách", "Tương lai", "Gốc rễ", "Tiềm năng"],
    "hexagram": ["Đỉnh cao", "Dưới đáy", "Trái trên", "Phải dưới", "Trái dưới", "Phải trên", "Tâm điểm"],
    "celtic": ["Hiện tại", "Thách thức", "Mục tiêu", "Gốc rễ", "Quá khứ", "Tương lai", "Thái độ", "Môi trường", "Hy vọng", "Kết quả"],
    "tree_of_life": ["Kether", "Chokmah", "Binah", "Chesed", "Geburah", "Tiphareth", "Netzach", "Hod", "Yesod", "Malkuth"],
    "horseshoe": ["Quá khứ", "Hiện tại", "Thách thức", "Ẩn số", "Lời khuyên", "Hành động", "Kết quả"],
    "relationship": ["Bạn", "Đối phương", "Cảm xúc của bạn", "Cảm xúc đối phương", "Rào cản", "Lời khuyên", "Tương lai"],
    "decision": ["Tình huống", "Lựa chọn A", "Lựa chọn B", "Kết quả A", "Kết quả B", "Rủi ro", "Lời khuyên"],
    "zodiac": [
        "Bạch Dương (Bản thân)", "Kim Ngưu (Tài chính)", "Song Tử (Giao tiếp)", 
        "Cự Giải (Gia đình)", "Sư Tử (Sáng tạo)", "Xử Nữ (Sức khỏe)", 
        "Thiên Bình (Mối quan hệ)", "Bọ Cạp (Biến đổi)", "Nhân Mã (Tri thức)", 
        "Ma Kết (Sự nghiệp)", "Bảo Bình (Xã hội)", "Song Ngư (Tâm linh)"
    ],
    "pyramid": [
        "Vấn đề cốt lõi", "Tác động trái", "Tác động phải", "Nền tảng 1", "Nền tảng 2", 
        "Nền tảng 3", "Kết quả tiềm năng 1", "Kết quả tiềm năng 2", "Kết quả tiềm năng 3", "Kết quả cuối cùng"
    ],
    "chakra": ["Gốc", "Xương cùng", "Búi mặt trời", "Tim", "Cổ họng", "Con mắt thứ ba", "Vương miện"],
    "spiral": [
        "Tâm điểm", "Khởi đầu", "Phát triển", "Thách thức", "Vượt qua", 
        "Năng lượng 1", "Năng lượng 2", "Năng lượng 3", "Năng lượng 4", "Năng lượng 5",
        "Tiến trình 1", "Tiến trình 2", "Tiến trình 3", "Kết tinh", "Vô hạn"
    ],
    "yearly": [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ],
    "mystic_circle": [
        "0. Chàng khờ", "1. Nhà ảo thuật", "2. Nữ tư tế", "3. Nữ hoàng", "4. Hoàng đế",
        "5. Giáo hoàng", "6. Tình nhân", "7. Cỗ xe", "8. Sức mạnh", "9. Ẩn sĩ",
        "10. Vòng quay", "11. Công lý", "12. Người treo", "13. Cái chết", "14. Tiết độ",
        "15. Ác quỷ", "16. Tòa tháp", "17. Ngôi sao", "18. Mặt trăng", "19. Mặt trời",
        "20. Phán xét", "21. Thế giới"
    ],
    "grand_tableau": [
        "Trung tâm","Trên gần","Trên xa","Dưới gần","Dưới xa",
        "Trái trong trên","Trái ngoài trên","Trái ngoài dưới","Trái trong dưới",
        "Phải trong trên","Phải ngoài trên","Phải ngoài dưới","Phải trong dưới",
        "Cánh xa trái trên","Cánh xa trái dưới",
        "Cánh xa phải trên","Cánh xa phải dưới",
        "Góc trên trái","Góc trên phải","Góc dưới trái","Góc dưới phải"
    ]
}

# TAROT_CHAT_SESSIONS = {} # Removed for persistent DB sessions


# =========================
# ROUTES
# =========================
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    # Serve production built frontend if it exists
    dist_index = os.path.join(BASE_DIR, "dist", "index.html")
    if os.path.isfile(dist_index):
        with open(dist_index, "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())

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

        if not isinstance(cards, list) or len(cards) == 0:
            return safe_json_response({"error": "Hãy chọn ít nhất 1 lá bài"}, status_code=400)

        # =====================================================
        # TOKEN CHECK & DEDUCTION
        # =====================================================
        costs = get_tarot_costs()
        current_reading_cost = costs["reading_cost"]
        if user_email:
            success = deduct_user_tokens(user_email, current_reading_cost)
            if not success:
                error_msg = "Bạn không đủ token. Vui lòng nạp thêm để tiếp tục."
                if data.language == "en":
                    error_msg = "Not enough tokens. Please top up to continue."
                return safe_json_response({
                    "error": error_msg,
                    "success": False,
                    "need_tokens": True
                }, status_code=200) # Trả về 200 để frontend handle thông báo mượt hơn
        else:
             error_msg = "Bạn cần đăng nhập để trải bài"
             if data.language == "en":
                 error_msg = "You must be logged in to read tarot"
             return safe_json_response({"error": error_msg}, status_code=401)

        spread_type = data.spread_type
        roles = SPREAD_ROLES.get(spread_type, ["Lá bài"])

        normalized_cards = []
        for i, c in enumerate(cards):
            if not isinstance(c, dict):
                continue

            role = roles[i] if i < len(roles) else f"Lá bài {i + 1}"
            normalized_cards.append({
                "name": c.get("name", f"Lá bài {i + 1}"),
                "suit": c.get("suit", "major"),
                "image": c.get("image", "default.png"),
                "position": i + 1,
                "role": role,
            })

        if len(normalized_cards) == 0:
            return safe_json_response({"error": "Dữ liệu lá bài không hợp lệ"}, status_code=400)

        topic_label = TOPIC_LABELS.get(topic, "Chung")
        if data.language == "en":
            topic_label = {
                "love": "Love", "family": "Family", "career": "Career",
                "health": "Health", "money": "Finance", "general": "General"
            }.get(topic, "General")
            
        conversation_id = uuid4().hex

        user_question = question if question else f"Tổng quan về {topic_label.lower()} trong thời gian tới"
        if data.language == "en" and not question:
            user_question = f"General overview of {topic_label.lower()} in the near future"

        system_prompt = build_tarot_system_prompt(data.language)
        spread_name = spread_type.capitalize().replace("_", " ")
        user_prompt = build_initial_reading_prompt(topic_label, user_question, normalized_cards, spread_name, data.language)
        answer = call_ai_tarot(system_prompt, user_prompt)

        session_data = {
            "conversation_id": conversation_id,
            "topic": topic,
            "topic_label": topic_label,
            "user_email": user_email,
            "cards": normalized_cards,
            "base_question": user_question,
            "messages": [
                {"role": "user", "content": user_question},
                {"role": "assistant", "content": answer},
            ],
        }
        save_tarot_session(session_data)

        if user_email:
            save_tarot_history(
                user_email=user_email,
                topic=topic,
                question=user_question,
                cards=normalized_cards,
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

        session = get_tarot_session(conversation_id)
        if not session:
            return safe_json_response({"error": "Không tìm thấy phiên Tarot hoặc phiên đã hết hạn. Hãy thử trải bài mới."}, status_code=404)

        costs = get_tarot_costs()
        current_follow_up_cost = costs["follow_up_cost"]
        if user_email:
            success = deduct_user_tokens(user_email, current_follow_up_cost)
            if not success:
                error_msg = "Bạn không đủ token để tiếp tục cuộc trò chuyện."
                if data.language == "en":
                    error_msg = "Not enough tokens to continue the conversation."
                return safe_json_response({
                    "error": error_msg,
                    "success": False,
                    "need_tokens": True
                }, status_code=200)

        system_prompt = build_tarot_system_prompt(data.language)

        if not session.get("base_question"):
            session["base_question"] = message

            user_prompt = build_initial_reading_prompt(
                session["topic_label"],
                message,
                session["cards"],
                "Trải bài",
                data.language
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
                    cards=session["cards"],
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

        user_prompt = build_follow_up_prompt(session, message, data.language)
        answer = call_ai_tarot(system_prompt, user_prompt)

        session["messages"].append({"role": "assistant", "content": answer})
        save_tarot_session(session)

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
        print(f"❌ BỎ APPLY PACKAGE: email='{user_email}', code='{package_code}', name='{package_name}'")
        return order

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    
    # TRUY VẤN TRỰC TIẾP TỪ DB ĐỂ TRÁNH DỮ LIỆU CŨ TRONG OBJECT
    cur.execute("SELECT tokens_added, status FROM token_orders WHERE id = %s", (order.get("id"),))
    db_order = cur.fetchone()
    
    if not db_order:
        print(f"❌ KHÔNG TÌM THẤY ĐƠN #{order.get('id')} TRONG DB")
        conn.close()
        return order

    if db_order.get("tokens_added") == 1:
        print(f"⚠️ ĐƠN #{order.get('id')} ĐÃ ĐƯỢC CỘNG TOKEN TRƯỚC ĐÓ. BỎ QUA.")
        conn.close()
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

    # update package & tokens
    cur.execute("""
        UPDATE users
        SET
            token_balance = token_balance + %s,
            current_package_code = %s,
            current_package_name = %s,
            package_started_at = %s,
            package_ends_at = %s
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(%s))
    """, (
        int(order.get("token_amount") or 0),
        package_code,
        package_name,
        now.strftime("%Y-%m-%d %H:%M:%S"),
        end_date.strftime("%Y-%m-%d %H:%M:%S"),
        user_email
    ))
    # Đánh dấu đơn hàng đã cộng token thành công
    cur.execute("""
        UPDATE token_orders 
        SET tokens_added = 1, status = 'paid', paid_at = NOW() 
        WHERE id = %s
    """, (order.get("id"),))

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
        SELECT id, email, role, token_balance, status 
        FROM users
        ORDER BY id DESC
    """)

    data = cur.fetchall()
    conn.close()

    return {"success": True, "data": data}

@app.post("/api/admin/users/{user_id}/toggle-status")
def toggle_user_status(user_id: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    
    cur.execute("SELECT status FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    new_status = "banned" if user["status"] == "active" else "active"
    cur.execute("UPDATE users SET status = %s WHERE id = %s", (new_status, user_id))
    conn.commit()
    conn.close()
    return {"success": True, "status": new_status}

@app.post("/api/admin/users/{user_id}/gift-tokens")
def gift_tokens(user_id: int, data: dict):
    amount = int(data.get("amount", 10))
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE users SET token_balance = token_balance + %s WHERE id = %s", (amount, user_id))
    conn.commit()
    conn.close()
    return {"success": True}

def update_env_file(key: str, value: str):
    env_path = ".env"
    if not os.path.exists(env_path):
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(f"{key}={value}\n")
        return
        
    with open(env_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[i] = f"{key}={value}\n"
            updated = True
            break
            
    if not updated:
        lines.append(f"\n{key}={value}\n")
        
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

SHOW_SEPAY = os.getenv("SHOW_SEPAY", "true").strip().lower() == "true"
SHOW_VNPAY = os.getenv("SHOW_VNPAY", "true").strip().lower() == "true"

@app.get("/api/admin/settings")
def get_admin_settings():
    return {
        "success": True,
        "current_api": CURRENT_API,
        "openrouter_model": OPENROUTER_MODEL,
        "openai_model": OPENAI_MODEL,
        "has_openrouter_key": bool(OPENROUTER_KEY),
        "has_hf_key": bool(HF_KEY),
        "has_openai_key": bool(OPENAI_KEY),
        "has_sepay_key": bool(SEPAY_WEBHOOK_API_KEY),
        "hf_key_placeholder": "••••••••••••••••" if HF_KEY else "",
        "openrouter_key_placeholder": "••••••••••••••••" if OPENROUTER_KEY else "",
        "openai_key_placeholder": "••••••••••••••••" if OPENAI_KEY else "",
        "sepay_key_placeholder": "••••••••••••••••" if SEPAY_WEBHOOK_API_KEY else "",
        "show_sepay": SHOW_SEPAY,
        "show_vnpay": SHOW_VNPAY
    }

@app.post("/api/admin/settings")
def update_admin_settings(data: dict):
    global CURRENT_API, OPENROUTER_MODEL, OPENROUTER_KEY, HF_KEY, OPENAI_KEY, OPENAI_MODEL, SEPAY_WEBHOOK_API_KEY, SHOW_SEPAY, SHOW_VNPAY
    new_api = data.get("current_api", CURRENT_API).strip().lower()
    new_model = data.get("openrouter_model", OPENROUTER_MODEL).strip()
    new_openai_model = data.get("openai_model", OPENAI_MODEL).strip()

    new_hf_key = data.get("hf_key", "").strip()
    new_openrouter_key = data.get("openrouter_key", "").strip()
    new_openai_key = data.get("openai_key", "").strip()
    new_sepay_key = data.get("sepay_key", "").strip()

    if new_hf_key and new_hf_key != "••••••••••••••••":
        HF_KEY = new_hf_key
        update_env_file("HF_API_KEY", new_hf_key)

    if new_openrouter_key and new_openrouter_key != "••••••••••••••••":
        OPENROUTER_KEY = new_openrouter_key
        update_env_file("OPENROUTER_API_KEY", new_openrouter_key)

    if new_openai_key and new_openai_key != "••••••••••••••••":
        OPENAI_KEY = new_openai_key
        update_env_file("OPENAI_API_KEY", new_openai_key)

    if new_sepay_key and new_sepay_key != "••••••••••••••••":
        SEPAY_WEBHOOK_API_KEY = new_sepay_key
        update_env_file("SEPAY_WEBHOOK_API_KEY", new_sepay_key)

    if new_api in ["hf", "openrouter", "openai"]:
        CURRENT_API = new_api
        update_env_file("CURRENT_API", new_api)

    if new_model:
        OPENROUTER_MODEL = new_model
        update_env_file("OPENROUTER_MODEL", new_model)

    if new_openai_model:
        OPENAI_MODEL = new_openai_model
        update_env_file("OPENAI_MODEL", new_openai_model)

    if "show_sepay" in data:
        SHOW_SEPAY = bool(data["show_sepay"])
        update_env_file("SHOW_SEPAY", "true" if SHOW_SEPAY else "false")

    if "show_vnpay" in data:
        SHOW_VNPAY = bool(data["show_vnpay"])
        update_env_file("SHOW_VNPAY", "true" if SHOW_VNPAY else "false")

    return {
        "success": True,
        "current_api": CURRENT_API,
        "openrouter_model": OPENROUTER_MODEL,
        "openai_model": OPENAI_MODEL,
        "has_openrouter_key": bool(OPENROUTER_KEY),
        "has_hf_key": bool(HF_KEY),
        "has_openai_key": bool(OPENAI_KEY),
        "has_sepay_key": bool(SEPAY_WEBHOOK_API_KEY),
        "show_sepay": SHOW_SEPAY,
        "show_vnpay": SHOW_VNPAY
    }
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
@app.post("/api/admin/users")
def create_user(data: dict):
    email = data.get("email").strip().lower()
    password = data.get("password", "").strip() or "123456"
    role = data.get("role", "user").strip()
    token_balance = int(data.get("token_balance", 15))

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    cur.execute("""
        INSERT INTO users (email, password, role, token_balance)
        VALUES (%s, %s, %s, %s)
    """, (email, password, role, token_balance))
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
        SELECT id, user_email, price_vnd, status, paid_at, package_code, package_name, token_amount
        FROM token_orders
        ORDER BY id DESC
    """)

    data = cur.fetchall()
    conn.close()

    return {"success": True, "data": data}

@app.post("/api/admin/orders/{order_id}/approve")
def approve_order(order_id: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT * FROM token_orders WHERE id = %s", (order_id,))
    order = cur.fetchone()

    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    if order["status"] == "paid":
        conn.close()
        return {"success": True, "message": "Đơn hàng đã thanh toán trước đó"}

    # Update status
    cur.execute("""
        UPDATE token_orders 
        SET status = 'paid', paid_at = NOW() 
        WHERE id = %s
    """, (order_id,))
    conn.commit()
    conn.close()

    # Apply package and credit tokens
    apply_package_to_user_from_order(order)
    return {"success": True}

@app.delete("/api/admin/orders/{order_id}")
def delete_order(order_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("DELETE FROM token_orders WHERE id=%s", (order_id,))
    conn.commit()
    conn.close()

    return {"success": True}

# =====================================================
# MAX LEVEL ADMIN ADVANCED ENDPOINTS
# =====================================================
@app.get("/api/tarot/config")
def public_tarot_config():
    costs = get_tarot_costs()
    return {
        "success": True,
        "reading_cost": costs["reading_cost"],
        "follow_up_cost": costs["follow_up_cost"],
        "show_sepay": SHOW_SEPAY,
        "show_vnpay": SHOW_VNPAY
    }

@app.get("/api/admin/readings")
def admin_get_readings():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id, user_email, topic, question, answer, created_at
        FROM tarot_history
        ORDER BY id DESC
        LIMIT 150
    """)
    rows = cur.fetchall()
    conn.close()
    return {
        "success": True,
        "data": [
            {
                "id": row["id"],
                "user_email": row["user_email"],
                "topic": row["topic"],
                "question": row["question"],
                "answer": row["answer"],
                "created_at": str(row["created_at"])
            } for row in rows
        ]
    }

@app.delete("/api/admin/readings/{reading_id}")
def admin_delete_reading(reading_id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM tarot_history WHERE id = %s", (reading_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/admin/simulate-sepay")
def admin_simulate_sepay(data: dict):
    order_id = int(data.get("order_id", 0))
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM token_orders WHERE id = %s", (order_id,))
    order = cur.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        
    if order["status"] == "paid":
        conn.close()
        return {"success": True, "message": "Đơn hàng đã được thanh toán trước đó"}
        
    # Mark order as paid
    cur.execute("""
        UPDATE token_orders 
        SET status = 'paid', paid_at = NOW(), sepay_tx_id = %s
        WHERE id = %s
    """, (f"SIM-{uuid4().hex[:8].upper()}", order_id))
    conn.commit()
    conn.close()
    
    # Credit tokens and apply package
    apply_package_to_user_from_order(order)
    return {"success": True, "message": "Giả lập giao dịch SePay thành công!"}

@app.get("/api/admin/diagnostics")
def admin_diagnostics():
    import time
    conn = get_conn()
    cur = conn.cursor()
    
    # DB table sizes
    cur.execute("SELECT COUNT(*) FROM users")
    users_count = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM token_orders")
    orders_count = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM tarot_history")
    readings_count = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM tarot_sessions")
    sessions_count = cur.fetchone()[0]
    
    conn.close()
    
    # HF Connectivity Check
    hf_status = "error"
    hf_time = 0.0
    if HF_KEY:
        try:
            start_time = time.time()
            headers = {"Authorization": f"Bearer {HF_KEY}", "Content-Type": "application/json"}
            # Send a lightweight test request
            r = requests.post(HF_URL, headers=headers, json={
                "model": HF_MODEL,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 5
            }, timeout=5)
            hf_time = round(time.time() - start_time, 2)
            if r.status_code in [200, 400]:
                hf_status = "active"
            else:
                hf_status = f"unauthorized ({r.status_code})"
        except Exception as e:
            hf_status = f"error: {str(e)}"
            
    # OpenRouter Connectivity Check
    or_status = "error"
    or_time = 0.0
    if OPENROUTER_KEY:
        try:
            start_time = time.time()
            headers = {"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"}
            r = requests.post(OPENROUTER_URL, headers=headers, json={
                "model": OPENROUTER_MODEL,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 5
            }, timeout=5)
            or_time = round(time.time() - start_time, 2)
            if r.status_code in [200, 400]:
                or_status = "active"
            else:
                or_status = f"unauthorized ({r.status_code})"
        except Exception as e:
            or_status = f"error: {str(e)}"
            
    return {
        "success": True,
        "counts": {
            "users": users_count,
            "orders": orders_count,
            "readings": readings_count,
            "sessions": sessions_count
        },
        "hf": {
            "status": hf_status,
            "latency_sec": hf_time
        },
        "openrouter": {
            "status": or_status,
            "latency_sec": or_time
        },
        "system": {
            "python_version": sys.version,
            "platform": sys.platform,
            "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@app.get("/api/admin/tarot-config")
def admin_get_tarot_config():
    costs = get_tarot_costs()
    system_prompt = build_tarot_system_prompt()
    return {
        "success": True,
        "reading_cost": costs["reading_cost"],
        "follow_up_cost": costs["follow_up_cost"],
        "temperature": costs["temperature"],
        "max_tokens": costs["max_tokens"],
        "system_prompt": system_prompt
    }
    
@app.post("/api/admin/tarot-config")
def admin_save_tarot_config(data: dict):
    # Save costs & model settings
    config_path = "tarot_config.json"
    costs = {
        "reading_cost": int(data.get("reading_cost", 5)),
        "follow_up_cost": int(data.get("follow_up_cost", 2)),
        "temperature": float(data.get("temperature", 0.35)),
        "max_tokens": int(data.get("max_tokens", 1800))
    }
    
    global READING_COST, FOLLOW_UP_COST
    READING_COST = costs["reading_cost"]
    FOLLOW_UP_COST = costs["follow_up_cost"]
    
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(costs, f, indent=4, ensure_ascii=False)
        
    # Save prompt to file
    prompt_file = "tarot_system_prompt.txt"
    new_prompt = data.get("system_prompt", "").strip()
    if new_prompt:
        with open(prompt_file, "w", encoding="utf-8") as f:
            f.write(new_prompt)
            
    return {"success": True, "message": "Đã lưu cấu hình Tarot nâng cao!"}

@app.post("/api/google-login")
async def google_login(data: dict):

    token = data.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    try:
        GOOGLE_CLIENT_ID = "26506370221-ucrnjduq50naerlghgukbqtp1vatee9j.apps.googleusercontent.com"
        # VERIFY TOKEN GOOGLE
        info = id_token.verify_oauth2_token(
            token,
            grequests.Request(),
            
        )

        email = info.get("email", "").strip().lower()
        name = info.get("name", "Google User")

        if not email:
            raise HTTPException(status_code=400, detail="Email not found")

        conn = get_conn()
        cur = conn.cursor(dictionary=True)

        # CHECK USER
        cur.execute(
            "SELECT * FROM users WHERE email=%s",
            (email,)
        )

        user = cur.fetchone()

        # CHƯA CÓ -> TẠO
        if not user:

            cur.execute("""
                INSERT INTO users
                (
                    email,
                    password,
                    role,
                    token_balance
                )
                VALUES
                (
                    %s,
                    '',
                    'user',
                    15
                )
            """, (email,))

            conn.commit()

            cur.execute(
                "SELECT * FROM users WHERE email=%s",
                (email,)
            )

            user = cur.fetchone()

        conn.close()

        return {
            "success": True,
            "email": user["email"],
            "role": user["role"],
            "token_balance": user["token_balance"],
            "name": name
        }

    except Exception as e:
        print("GOOGLE LOGIN ERROR:", e)
        raise HTTPException(status_code=401, detail="Google login failed")
# =====================================================
# VNPAY GATEWAY IMPLEMENTATION
# =====================================================
from vnpay import VNPay
import time
from urllib.parse import urlparse, quote_plus

VNPAY_TMN_CODE = os.getenv("VNPAY_TMN_CODE", "2QX2Z0D4").strip()
VNPAY_HASH_SECRET = os.getenv("VNPAY_HASH_SECRET", "GET8D5P71SMT7HNGXPHNUP0XW4B8ZAGX").strip()
VNPAY_URL = os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html").strip()

@app.post("/api/payments/create-vnpay-url")
async def create_vnpay_url(request: Request, data: dict = Body(...)):
    user_email = normalize_email(data.get("user_email"))
    package_code = str(data.get("package_code") or "").strip().lower()
    
    if not user_email or "@" not in user_email:
        raise HTTPException(status_code=400, detail="Email không hợp lệ")
        
    if package_code not in PACKAGE_MAP:
        raise HTTPException(status_code=400, detail="Gói token không hợp lệ")
        
    package = PACKAGE_MAP[package_code]
    transfer_code = f"TAROTVNP{int(time.time())}"
    
    # Get client IP
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # VNPAY return url in client
    referer = request.headers.get("referer", "http://localhost:8080/")
    parsed = urlparse(referer)
    client_base = f"{parsed.scheme}://{parsed.netloc}"
    
    # VNPAY Return URL phải trỏ thẳng tới FastAPI (port 8002) để xử lý redirect
    # Không dùng Ngrok/Vite port 8080 vì Vite proxy chỉ forward Ajax calls từ React, 
    # không forward external browser redirects từ VNPAY
    backend_return_url = "http://127.0.0.1:8002/api/payments/vnpay-return"
    
    # Create order in MySQL token_orders
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO token_orders (
                user_email, package_code, package_name, token_amount, price_vnd,
                transfer_code, payment_method, client_base, status
            )
            VALUES (%s, %s, %s, %s, %s, %s, 'vnpay', %s, 'pending')
        """, (
            user_email, package_code, package["name"], package["token_amount"],
            package["price_vnd"], transfer_code, client_base
        ))
        order_id = cur.lastrowid
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Lỗi tạo đơn hàng: {str(e)}")
        
    # Map tên gói sang tiếng Việt không dấu để đảm bảo chữ ký băm HMAC-SHA512 luôn khớp chính xác 100%
    package_names_ascii = {
        "starter": "Goi Khoi Dau",
        "explorer": "Goi Kham Pha",
        "master": "Goi Thao Thu"
    }
    pkg_name_ascii = package_names_ascii.get(package_code, "Goi Token")
    clean_order_info = f"Thanh toan mua {pkg_name_ascii} Tarot Talk"
    
    # Generate VNPAY url
    tmn_code = os.getenv("VNPAY_TMN_CODE", "2QX2Z0D4").strip()
    hash_secret = os.getenv("VNPAY_HASH_SECRET", "GET8D5P71SMT7HNGXPHNUP0XW4B8ZAGX").strip()
    vnpay_url = os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html").strip()
    
    vnp = VNPay(tmn_code=tmn_code, hash_secret=hash_secret, payment_url=vnpay_url)
    payment_url = vnp.get_payment_url(
        txn_ref=transfer_code,
        amount=package["price_vnd"],
        order_info=clean_order_info,
        return_url=backend_return_url,
        ip_addr=client_ip
    )
    
    # Save VNPAY url to DB
    cur.execute("UPDATE token_orders SET vnpay_url = %s WHERE id = %s", (payment_url, order_id))
    conn.commit()
    conn.close()
    
    return {"success": True, "payment_url": payment_url, "order_id": order_id}

@app.get("/api/payments/vnpay-return")
async def vnpay_return_endpoint(request: Request):
    params = dict(request.query_params)
    
    txn_ref = params.get("vnp_TxnRef", "")
    
    # Retrieve client_base dynamically from DB using transfer_code
    client_base = "http://localhost:8080"
    if txn_ref:
        try:
            conn = get_conn()
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT client_base FROM token_orders WHERE transfer_code = %s", (txn_ref,))
            order_row = cur.fetchone()
            conn.close()
            if order_row and order_row.get("client_base"):
                client_base = order_row["client_base"]
        except Exception as e:
            print(f"⚠️ Error loading client_base from DB: {e}")
            
    tmn_code = os.getenv("VNPAY_TMN_CODE", "2QX2Z0D4").strip()
    hash_secret = os.getenv("VNPAY_HASH_SECRET", "GET8D5P71SMT7HNGXPHNUP0XW4B8ZAGX").strip()
    vnpay_url = os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html").strip()
    
    vnp = VNPay(tmn_code=tmn_code, hash_secret=hash_secret, payment_url=vnpay_url)
    
    # Verify hash signature
    if not vnp.validate_response(params):
        print("❌ VNPAY RETURN SIGNATURE INVALID")
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{client_base}/?status=cancel")
        
    response_code = params.get("vnp_ResponseCode", "")
    txn_ref = params.get("vnp_TxnRef", "")
    vnp_tx_id = params.get("vnp_TransactionNo", "")
    
    if response_code == "00":
        # Success! Mark order paid and credit tokens
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM token_orders WHERE transfer_code = %s", (txn_ref,))
        order = cur.fetchone()
        
        if order and order["status"] == "pending":
            # Update order status
            cur.execute("""
                UPDATE token_orders 
                SET status = 'paid', paid_at = NOW(), sepay_tx_id = %s
                WHERE id = %s
            """, (f"VNP-{vnp_tx_id}", order["id"]))
            conn.commit()
            
            # Apply tokens
            try:
                apply_package_to_user_from_order(order)
            except Exception as e:
                print("❌ VNPAY APPLY PACKAGE ERROR:", e)
                
        conn.close()
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{client_base}/?status=success")
    else:
        print(f"❌ VNPAY PAYMENT FAILED: {response_code}")
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{client_base}/?status=cancel")

@app.get("/api/payments/vnpay-ipn")
async def vnpay_ipn_endpoint(request: Request):
    params = dict(request.query_params)
    tmn_code = os.getenv("VNPAY_TMN_CODE", "2QX2Z0D4").strip()
    hash_secret = os.getenv("VNPAY_HASH_SECRET", "GET8D5P71SMT7HNGXPHNUP0XW4B8ZAGX").strip()
    vnpay_url = os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html").strip()
    
    vnp = VNPay(tmn_code=tmn_code, hash_secret=hash_secret, payment_url=vnpay_url)
    
    # 1. Check signature
    if not vnp.validate_response(params):
        return {"RspCode": "97", "Message": "Invalid Signature"}
        
    txn_ref = params.get("vnp_TxnRef", "")
    amount_vnp = int(params.get("vnp_Amount", 0)) // 100
    response_code = params.get("vnp_ResponseCode", "")
    vnp_tx_id = params.get("vnp_TransactionNo", "")
    
    # 2. Check order in DB
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM token_orders WHERE transfer_code = %s", (txn_ref,))
    order = cur.fetchone()
    
    if not order:
        conn.close()
        return {"RspCode": "01", "Message": "Order not found"}
        
    # 3. Check amount
    if order["price_vnd"] != amount_vnp:
        conn.close()
        return {"RspCode": "04", "Message": "Invalid amount"}
        
    # 4. Check order status
    if order["status"] == "paid":
        conn.close()
        return {"RspCode": "02", "Message": "Order already confirmed"}
        
    # 5. Confirm order payment status
    if response_code == "00":
        # Payment success
        cur.execute("""
            UPDATE token_orders 
            SET status = 'paid', paid_at = NOW(), sepay_tx_id = %s
            WHERE id = %s
        """, (f"VNP-{vnp_tx_id}", order["id"]))
        conn.commit()
        
        # Apply tokens
        try:
            apply_package_to_user_from_order(order)
        except Exception as e:
            print("❌ VNPAY IPN APPLY PACKAGE ERROR:", e)
            
        conn.close()
        return {"RspCode": "00", "Message": "Confirm Success"}
    else:
        # Payment failed
        cur.execute("UPDATE token_orders SET status = 'failed' WHERE id = %s", (order["id"],))
        conn.commit()
        conn.close()
        return {"RspCode": "00", "Message": "Confirm Success"}

# =========================
# RUN
# =========================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8002, reload=True)