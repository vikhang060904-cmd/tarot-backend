def print_section(file_path, line_no):
    print(f"\n=== FILE: {file_path} (Around Line {line_no}) ===")
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        start = max(0, line_no - 15)
        end = min(len(lines), line_no + 30)
        for idx in range(start, end):
            print(f"{idx + 1}: {lines[idx].strip()}")
    except Exception as e:
        print("Error:", e)

print_section("d:/TT_BaiTarot/src/components/tarot-patch.css", 278)
print_section("d:/TT_BaiTarot/src/components/tarot-patch.css", 3214)
print_section("d:/TT_BaiTarot/src/components/UI.css", 758)
