import pathlib
data = pathlib.Path(r'd:\TT_BaiTarot\src\components\UI.css').read_bytes()
if b'content: " \\;' in data:
    print("Found exact bad string")
    data = data.replace(b'content: " \\;', b'content: "";')
    pathlib.Path(r'd:\TT_BaiTarot\src\components\UI.css').write_bytes(data)
    print("Fixed!")
else:
    print("Not found. Checking if it already says content: '';")
    if b'content: "";' in data:
        print("Already fixed!")
    else:
        print("Neither found. Let me show you a snippet near line 3242.")
        lines = data.split(b'\n')
        for i in range(3240, 3250):
            print(lines[i])
