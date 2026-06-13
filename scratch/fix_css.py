import pathlib
p = pathlib.Path(r'd:\TT_BaiTarot\src\components\UI.css')
data = p.read_bytes()
data = data.replace(b'content: " \\;', b'content: "";')
p.write_bytes(data)
