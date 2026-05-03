from app import get_fallback_tarot_reading, get_individual_card_fallback

# Test the fallback system
print("Testing fallback Tarot reading...")

test_cards = [
    {"name": "The Fool", "role": "Quá khứ"},
    {"name": "The Magician", "role": "Hiện tại"},
    {"name": "The High Priestess", "role": "Tương lai"}
]

test_question = "Tôi nên làm gì với công việc hiện tại?"

result = get_fallback_tarot_reading(test_cards, test_question)
print("Full Reading Fallback:")
print(result)
print("\n" + "="*50 + "\n")

card_result = get_individual_card_fallback("The Fool", "Quá khứ")
print("Individual Card Fallback:")
print(card_result)