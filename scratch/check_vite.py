import urllib.request
import re

url = "http://localhost:8080/"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    print("HTML Length:", len(html))
    
    # Check if tarot-patch.css is referenced anywhere in the HTML or injected JS
    if "tarot-patch.css" in html:
        print("YES! tarot-patch.css is in the HTML!")
    else:
        print("NO! tarot-patch.css is NOT in the HTML!")
        
    # Check if the text "QUAY LẠI TRANG" is in the HTML
    if "QUAY" in html:
         print("YES! QUAY is in the HTML!")
    else:
         print("NO! QUAY is NOT in the HTML (probably rendered by JS).")
except Exception as e:
    print("Error:", e)
