import random
import os

BASE_PATH = "static/images/tarot"
SUITS = ["cups", "wands", "swords", "pentacles"]

def load_all_cards():
    cards = []

    for suit in SUITS:
        folder = os.path.join(BASE_PATH, suit)
        if not os.path.exists(folder):
            continue

        for file in os.listdir(folder):
            if file.endswith(".png"):
                raw = file.replace(".png", "")
                cards.append({
                    "name": raw.replace("_", " ").title(),
                    "raw": raw,
                    "suit": suit,
                    "image": file
                })

    return cards


def draw_cards(n):
    deck = load_all_cards()

    if n > len(deck):
        raise ValueError("Số lá rút vượt quá số lá hiện có")

    return random.sample(deck, n)
