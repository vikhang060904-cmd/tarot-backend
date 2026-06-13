path = "d:/TT_BaiTarot/src/components/tarot-patch.css"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Replace the previous V2 mobile styles for arc-spread-shell and arc-spread-board
target_shell = """.arc-spread-shell {
  min-height: 250px !important;
  height: 250px !important;
  margin-bottom: 12px !important;
}"""

replacement_shell = """.arc-spread-shell {
  min-height: 320px !important;
  height: 320px !important;
  margin-bottom: 24px !important;
}"""

target_board = """.arc-spread-board {
  transform: scale(0.32) !important;
  min-height: 250px !important;
  height: 250px !important;
  margin-top: -20px !important; /* Prevent overlap with purple button below */
}"""

replacement_board = """.arc-spread-board {
  transform: scale(0.36) !important;
  min-height: 320px !important;
  height: 320px !important;
  margin-top: -35px !important; /* Pull the fanned cards upward to clear button entirely */
}"""

if target_shell in content:
    content = content.replace(target_shell, replacement_shell)
    print("Replaced target_shell successfully!")
else:
    print("target_shell not found in file!")

if target_board in content:
    content = content.replace(target_board, replacement_board)
    print("Replaced target_board successfully!")
else:
    print("target_board not found in file!")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Applied final overlap spacing patch successfully!")
