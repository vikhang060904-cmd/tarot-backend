import urllib.request
import urllib.parse
import pathlib

# URL to encode into QR code (Catbox direct link)
download_url = 'https://files.catbox.moe/3ojk8e.apk'
encoded_url = urllib.parse.quote_plus(download_url)

# Call QR Code API
qr_api_url = f'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data={encoded_url}'

dest_dir = pathlib.Path(r'd:\TT_BaiTarot\static')
dest_dir.mkdir(parents=True, exist_ok=True)
dest_file = dest_dir / 'download_qr.png'

try:
    print(f"Downloading QR Code for: {download_url}")
    urllib.request.urlretrieve(qr_api_url, dest_file)
    print(f"Successfully saved QR code image to: {dest_file.absolute()}")
except Exception as e:
    print(f"Error downloading QR Code: {e}")
