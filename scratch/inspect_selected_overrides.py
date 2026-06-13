import re

with open("d:/TT_BaiTarot/src/components/tarot-patch.css", "r", encoding="utf-8") as f:
    content = f.read()

classes = [
    "card-visual", "card-icon-wrapper", "mini-layout-preview-v2", 
    "preview-container", "mini-card-dot", "card-info-premium", 
    "card-header-row", "card-category-tag", "energy-badge", 
    "card-name-premium", "card-spirit-text", "spirit-label", 
    "spirit-value", "card-desc-premium", "card-footer-premium", 
    "card-tags-row", "mini-tag", "card-count-indicator", 
    "count-num", "count-label", "card-action-overlay", 
    "action-text", "action-glow"
]

for cls in classes:
    pattern = r"\." + re.escape(cls) + r"[^{]*\{([^}]+)\}"
    matches = list(re.finditer(pattern, content))
    if matches:
        print(f"=== Class: .{cls} ===")
        for m in matches:
            print(m.group(0))
        print("-" * 50)
