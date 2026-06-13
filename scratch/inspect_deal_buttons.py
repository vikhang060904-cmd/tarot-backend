with open("d:/TT_BaiTarot/src/components/TarotPage.tsx", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

search_terms = ["b\u00e1i", "X\u00e1o", "Chia", "B\u1eaft \u0111\u1ea7u", "deck-container", "deck-core", "shuffle", "deal-btn", "btn-deal"]

for term in search_terms:
    matches = [(idx + 1, line.strip()) for idx, line in enumerate(lines) if term in line]
    if matches:
        print(f"=== Matches for '{term}' ===")
        for idx, match in matches[:10]:
            print(f"Line {idx}: {match.encode('ascii', errors='replace').decode('ascii')}")
