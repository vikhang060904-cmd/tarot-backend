import urllib.request
url = "http://localhost:8080/src/main.tsx"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    js = response.read().decode('utf-8')
    if "tarot-patch.css" in js:
        print("YES, MAIN.TSX IMPORTS CSS!")
    else:
        print("NO, MAIN.TSX DOES NOT IMPORT CSS!")
except Exception as e:
    print("Error:", e)
