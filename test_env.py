from dotenv import load_dotenv
import os

load_dotenv()

print("OPENROUTER:", os.getenv("OPENROUTER_API_KEY"))
print("HF:", os.getenv("HF_API_KEY"))   