# Public Assets Folder

Thư mục này chứa tất cả static assets (hình ảnh, âm thanh) phục vụ cho ứng dụng Tarot Talk.

## 📋 Cấu trúc cần có

```
public/
├── images/
│   ├── wizard.png
│   └── tarot/
│       ├── back.png (mặt sau bài)
│       ├── cups/ (Cups suit - 14 lá bài)
│       ├── pentacles/ (Pentacles suit - 14 lá bài)
│       ├── swords/ (Swords suit - 14 lá bài)
│       └── wands/ (Wands suit - 14 lá bài)
└── audio/
    ├── bg.mp3 (Background music - loop)
    └── magic.mp3 (Sound effect - khi chia bài)
```

## 🚀 Hướng dẫn Copy Files

### Windows (PowerShell)
```powershell
# Copy từ thư mục static cũ sang public folder mới
Copy-Item -Path ".\static\images\*" -Destination ".\public\images\" -Recurse -Force
Copy-Item -Path ".\static\audio\*" -Destination ".\public\audio\" -Recurse -Force
```

### Windows (Command Prompt)
```cmd
xcopy .\static\images\* .\public\images\ /S /Y
xcopy .\static\audio\* .\public\audio\ /S /Y
```

### Linux/Mac (Bash/Zsh)
```bash
cp -r ./static/images/* ./public/images/
cp -r ./static/audio/* ./public/audio/
```

## ✅ Kiểm tra kết quả

Sau khi copy, kiểm tra:
```bash
# Linux/Mac
find ./public -type f | head -20

# Windows PowerShell
Get-ChildItem -Path ./public -Recurse | Select-Object FullName | head -20
```

Nên thấy:
- `public/images/wizard.png`
- `public/images/tarot/back.png`
- `public/images/tarot/cups/*.png` (tối thiểu 14 file)
- `public/images/tarot/pentacles/*.png`
- `public/images/tarot/swords/*.png`
- `public/images/tarot/wands/*.png`
- `public/audio/bg.mp3`
- `public/audio/magic.mp3`

## ⚙️ Trong development

Vite sẽ tự động serve files từ `public/` folder khi chạy dev server.

Đường dẫn trong code:
```javascript
// ✅ Đúng (Vite sẽ resolve)
<img src="/images/wizard.png" />
<img src="/images/tarot/back.png" />
<audio src="/audio/bg.mp3" />
```

## 📦 Build production

Khi build, Vite sẽ copy tất cả files từ `public/` vào `dist/public/`

```bash
npm run build
# Output: dist/
```

## ⚠️ Lưu ý quan trọng

1. **Tên file phải chính xác** - Case-sensitive trên Linux/Mac
2. **Format hình ảnh** - Dùng PNG hoặc WebP, tối ưu kích thước
3. **Audio format** - Dùng MP3 hoặc WAV để browser hỗ trợ tốt
4. **Không commit** - `public/images/tarot/` nên ở `.gitignore` nếu files quá lớn
5. **Path tương đối** - Luôn dùng `/images/...` từ root, không phải `./public/images/...`

## 🔗 References

- [Vite Static Assets Documentation](https://vitejs.dev/guide/assets.html)
- [Public Directory](https://vitejs.dev/guide/assets.html#the-public-directory)
