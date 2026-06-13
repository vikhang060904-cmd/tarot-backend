with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

stack = []
errors = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            errors.append(f"Extra closing brace at char {i}")
        else:
            stack.pop()

if stack:
    for pos in stack:
        errors.append(f"Unclosed opening brace at char {pos}")

if errors:
    print("\n".join(errors))
else:
    print("Braces are balanced")
