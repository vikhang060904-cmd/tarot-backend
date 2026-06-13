def print_section(file_path, line_no):
    print(f"\n=== FILE: {file_path} (Around Line {line_no}) ===")
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        start = max(0, line_no - 10)
        end = min(len(lines), line_no + 20)
        for idx in range(start, end):
            safe_line = lines[idx].strip().encode('ascii', errors='replace').decode('ascii')
            print(f"{idx + 1}: {safe_line}")
    except Exception as e:
        print("Error:", e)

print_section("d:/TT_BaiTarot/src/components/tarot-patch.css", 184)
print_section("d:/TT_BaiTarot/src/components/tarot-patch.css", 2976)
print_section("d:/TT_BaiTarot/src/components/tarot-patch.css", 4298)
