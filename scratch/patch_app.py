import pathlib
import os

path = pathlib.Path(r'd:\TT_BaiTarot\app.py')
data = path.read_bytes()

index_str = b'@app.get("/", response_class=HTMLResponse)'
idx = data.find(index_str)
if idx != -1:
    end_signature = b'return templates.TemplateResponse("index.html", {"request": request})'
    end_idx = data.find(end_signature, idx)
    if end_idx != -1:
        old_block = data[idx : end_idx + len(end_signature)]
        new_block = b'''@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    # Serve production built frontend if it exists
    dist_index = os.path.join(BASE_DIR, "dist", "index.html")
    if os.path.isfile(dist_index):
        with open(dist_index, "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())

    if not os.path.isdir(TEMPLATES_DIR):
        return HTMLResponse("<h1>Templates folder not found</h1>", status_code=500)

    return templates.TemplateResponse("index.html", {"request": request})'''
        
        if b'\r\n' in old_block:
            new_block = new_block.replace(b'\n', b'\r\n')
            
        data = data.replace(old_block, new_block)
        path.write_bytes(data)
        print("SUCCESS: Index route patched successfully!")
    else:
        print("ERROR: End signature not found!")
else:
    print("ERROR: Index route not found!")
