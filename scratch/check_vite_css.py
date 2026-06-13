import urllib.request
url = "http://localhost:8080/src/components/tarot-patch.css"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    css = response.read().decode('utf-8')
    if "padding: 1rem 1rem !important;" in css:
        print("YES, CSS IS UPDATED ON SERVER!")
    else:
        print("NO, CSS IS STALE!")
except Exception as e:
    print("Error:", e)
