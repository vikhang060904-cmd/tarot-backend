import os
from dotenv import load_dotenv

print("1. BEFORE load_dotenv:")
print("OPENROUTER_API_KEY:", os.getenv("OPENROUTER_API_KEY"))
print("HF_API_KEY:", os.getenv("HF_API_KEY"))

load_dotenv()

print("\n2. AFTER load_dotenv:")
print("OPENROUTER_API_KEY:", os.getenv("OPENROUTER_API_KEY"))
print("HF_API_KEY:", os.getenv("HF_API_KEY"))
print("SEPAY_WEBHOOK_API_KEY:", os.getenv("SEPAY_WEBHOOK_API_KEY"))
