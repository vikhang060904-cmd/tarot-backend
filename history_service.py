from typing import Any
from db import get_conn


def save_tarot_history(
    user_email: str,
    topic: str,
    question: str,
    cards: list[dict[str, Any]],
    answer: str,
):
    if not user_email or len(cards) < 3:
        return

    c1 = cards[0]
    c2 = cards[1]
    c3 = cards[2]

    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO tarot_history (
                user_email,
                topic,
                question,
                card_1_name, card_1_suit, card_1_image,
                card_2_name, card_2_suit, card_2_image,
                card_3_name, card_3_suit, card_3_image,
                answer
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_email,
                topic,
                question,
                c1.get("name", ""),
                c1.get("suit", ""),
                c1.get("image", ""),
                c2.get("name", ""),
                c2.get("suit", ""),
                c2.get("image", ""),
                c3.get("name", ""),
                c3.get("suit", ""),
                c3.get("image", ""),
                answer,
            ),
        )
        conn.commit()


def get_tarot_history(user_email: str):
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT *
            FROM tarot_history
            WHERE user_email = ?
            ORDER BY id DESC
            """,
            (user_email,),
        ).fetchall()

    return [dict(row) for row in rows]