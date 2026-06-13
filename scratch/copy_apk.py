import shutil
import pathlib

src = pathlib.Path(r'd:\TT_BaiTarot\app_web_view (1)\build\app\outputs\flutter-apk\app-release.apk')
dest_dir = pathlib.Path(r'd:\TT_BaiTarot\static')
dest_dir.mkdir(parents=True, exist_ok=True)
dest = dest_dir / 'app-release.apk'

if src.exists():
    shutil.copy2(src, dest)
    print(f"Successfully copied newer APK from app_web_view (1) to {dest.absolute()}")
else:
    print(f"Source APK does not exist at {src.absolute()}")
