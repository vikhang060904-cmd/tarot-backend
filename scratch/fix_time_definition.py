with open("d:/TT_BaiTarot/src/components/tarot-patch.css", "r", encoding="utf-8") as f:
    lines = f.readlines()

brace_count = 0
for idx, line in enumerate(lines):
    line_num = idx + 1
    for char in line:
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count < 0:
                print(f"Error: Mismatched closing brace at line {line_num}: {line.strip()}")
                brace_count = 0 # reset

if brace_count > 0:
    print(f"Error: There are {brace_count} unclosed opening braces at the end of the file!")
else:
    print("Brace check: All braces are balanced!")
