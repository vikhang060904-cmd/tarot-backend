path = "d:/TT_BaiTarot/src/components/tarot-patch.css"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Let's locate line 4422 and verify it contains "@media (max-width: 768px) {"
# Note: lines list is 0-indexed, so line 4422 is index 4421.
target_idx = 4421
if "@media (max-width: 768px) {" in lines[target_idx]:
    lines[target_idx] = "@media (max-width: 1024px) {\n"
    print(f"Successfully changed breakpoint to 1024px at line {target_idx+1}")
else:
    # If the index is slightly shifted, let's scan for it in the vicinity of V2 Spacing Patch
    found = False
    for idx in range(target_idx - 10, target_idx + 10):
        if idx >= 0 and idx < len(lines) and "@media (max-width: 768px) {" in lines[idx]:
            lines[idx] = "@media (max-width: 1024px) {\n"
            print(f"Successfully changed breakpoint to 1024px at scan line {idx+1}")
            found = True
            break
    if not found:
        print("Could not find exact breakpoint line, scanning entire file around V2 patch...")
        for idx in range(len(lines)):
            if idx > 4300 and "@media (max-width: 768px) {" in lines[idx]:
                lines[idx] = "@media (max-width: 1024px) {\n"
                print(f"Successfully changed breakpoint to 1024px at deep scan line {idx+1}")
                break

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Breakpoint change applied successfully!")
