import re

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace build_tarot_system_prompt
old_system_prompt = '''def build_tarot_system_prompt(language: str = "vi") -> str:
    prompt_file = "tarot_system_prompt.txt"
    if os.path.exists(prompt_file):
        try:
            with open(prompt_file, "r", encoding="utf-8") as f:
                prompt = f.read().strip()
                if language == "en":
                    prompt += "\\n\\nIMPORTANT INSTRUCTION: The user has selected English. You MUST respond entirely in English. Do not use Vietnamese."
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
    if language == "en":
        default_prompt += "\\n\\nIMPORTANT INSTRUCTION: The user has selected English. You MUST respond entirely in English. Do not use Vietnamese."
    return default_prompt'''

new_system_prompt = '''def build_tarot_system_prompt(language: str = "vi") -> str:
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
    return default_prompt'''


old_initial = '''def build_initial_reading_prompt(
    topic_label: str,
    user_question: str,
    cards: list[dict[str, Any]],
    spread_name: str = "Trải bài"
) -> str:
    cards_text = "\\n".join([f"- {c.get('role', f'Lá bài {i+1}')}: {c['name']}" for i, c in enumerate(cards)])

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
"""'''

new_initial = '''def build_initial_reading_prompt(
    topic_label: str,
    user_question: str,
    cards: list[dict[str, Any]],
    spread_name: str = "Trải bài",
    language: str = "vi"
) -> str:
    if language == "en":
        cards_text = "\\n".join([f"- {c.get('role', f'Card {i+1}')}: {c['name']}" for i, c in enumerate(cards)])
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

    cards_text = "\\n".join([f"- {c.get('role', f'Lá bài {i+1}')}: {c['name']}" for i, c in enumerate(cards)])

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
"""'''

old_followup = '''def build_follow_up_prompt(session: dict[str, Any], follow_up_message: str) -> str:
    cards = session["cards"]
    base_question = session.get("base_question", "")
    history = session.get("messages", [])

    cards_text = "\\n".join([
        f"- {c.get('role', f'Lá bài {i+1}')}: {c['name']}" 
        for i, c in enumerate(cards)
    ])

    history_tail = history[-6:]
    history_text = "\\n".join(
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
"""'''

new_followup = '''def build_follow_up_prompt(session: dict[str, Any], follow_up_message: str, language: str = "vi") -> str:
    cards = session["cards"]
    base_question = session.get("base_question", "")
    history = session.get("messages", [])

    if language == "en":
        cards_text = "\\n".join([
            f"- {c.get('role', f'Card {i+1}')}: {c['name']}" 
            for i, c in enumerate(cards)
        ])
        history_tail = history[-6:]
        history_text = "\\n".join(
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

    cards_text = "\\n".join([
        f"- {c.get('role', f'Lá bài {i+1}')}: {c['name']}" 
        for i, c in enumerate(cards)
    ])

    history_tail = history[-6:]
    history_text = "\\n".join(
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
"""'''

if old_system_prompt in content:
    content = content.replace(old_system_prompt, new_system_prompt)
else:
    print("WARNING: system prompt not found")

if old_initial in content:
    content = content.replace(old_initial, new_initial)
else:
    print("WARNING: initial prompt not found")

if old_followup in content:
    content = content.replace(old_followup, new_followup)
else:
    print("WARNING: followup prompt not found")

# Replace callers
content = content.replace(
    'build_initial_reading_prompt(topic_label, user_question, normalized_cards, spread_name)',
    'build_initial_reading_prompt(topic_label, user_question, normalized_cards, spread_name, data.language)'
)

content = content.replace(
    'build_initial_reading_prompt(\n                session["topic_label"],\n                message,\n                session["cards"],\n            )',
    'build_initial_reading_prompt(\n                session["topic_label"],\n                message,\n                session["cards"],\n                "Trải bài",\n                data.language\n            )'
)

content = content.replace(
    'build_follow_up_prompt(session, message)',
    'build_follow_up_prompt(session, message, data.language)'
)

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
