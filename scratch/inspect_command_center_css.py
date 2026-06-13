with open("d:/TT_BaiTarot/src/components/tarot-patch.css", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

search_terms = ["ritual-command-center", "tarot-main", "ritual-question-input", "glass-panel"]

for term in search_terms:
    print(f"=== Matches for '{term}' ===")
    matches = [(idx + 1, line.strip()) for idx, line in enumerate(lines) if term in line]
    for idx, match in matches[:8]:
        print(f"Line {idx}: {match.encode('ascii', errors='replace').decode('ascii')}")
