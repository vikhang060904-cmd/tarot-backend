# 🚀 Tarot Talk - React + Vite - Hướng dẫn Nhanh

## 📦 Bước 1: Cài đặt (1 phút)

```bash
# Di chuyển vào thư mục dự án
cd d:\TT_BaiTarot

# Cài đặt dependencies
npm install
```

## 📁 Bước 2: Copy Assets (1 phút)

**Windows PowerShell:**
```powershell
Copy-Item -Path ".\static\images" -Destination ".\public\" -Recurse -Force
Copy-Item -Path ".\static\audio" -Destination ".\public\" -Recurse -Force
```

**Windows Command Prompt:**
```cmd
xcopy .\static\images .\public\images /S /Y
xcopy .\static\audio .\public\audio /S /Y
```

## 🔧 Bước 3: Chạy Backend (Nếu chưa chạy)

```bash
# Trong terminal khác
cd d:\TT_BaiTarot
python app.py
# Backend sẽ chạy trên http://localhost:8002
```

## 🎨 Bước 4: Chạy React Development Server

```bash
# Trong terminal gốc
npm run dev
```

Sẽ thấy:
```
  VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

## ✅ Bước 5: Kiểm tra

1. Mở trình duyệt: `http://localhost:5173/`
2. Bạn sẽ thấy giao diện Tarot Talk với:
   - 🔮 Tiêu đề "Tarot Talk - Thấu Hiểu Vận Mệnh"
   - 🎴 Nút "Chia Toàn Bộ Bài"
   - 🎵 Nút âm nhạc
   - ✨ Scene 3D với bàn tarot, mage
   - 💬 Bubble chat cho wizard

3. Nhấp "Chia Toàn Bộ Bài" để bắt đầu!

## 🏗️ Build Production (Khi hoàn tất)

```bash
npm run build
```

Output sẽ ở `dist/` folder - có thể deploy lên server

## 📂 Cấu trúc thư mục

```
d:\TT_BaiTarot\
├── src/                    ← React source files
│   ├── App.tsx
│   ├── index.tsx
│   └── components/
├── public/                 ← Static assets (images, audio)
├── templates/index.html    ← Root HTML template
├── app.py                  ← Python FastAPI backend
├── vite.config.ts
├── package.json
└── SETUP_GUIDE.md          ← Chi tiết hơn
```

## 🔗 Kết nối Frontend ↔ Backend

**Vite Proxy** (tự động):
- Frontend: `http://localhost:5173/` (React)
- Backend: `http://localhost:8002/` (Python FastAPI)
- Tất cả `/api/*` requests → `localhost:8002` tự động

## 🐛 Troubleshooting

### ❌ "Cannot find module 'react'"
```bash
npm install
```

### ❌ Port 5173 đã được dùng
Thay port trong `vite.config.ts`:
```typescript
server: {
  port: 3000,  // Thay 5173 thành 3000
}
```

### ❌ Assets không tải (ảnh trắng)
Kiểm tra:
1. Folder `public/images/` tồn tại?
2. File `public/audio/` tồn tại?
3. Chạy lại `npm run dev`

### ❌ Backend connection error
```
Failed to fetch /api/all_cards
```
Kiểm tra:
1. Python backend đang chạy? `python app.py`
2. Port là 8002?
3. CORS enabled trong app.py?

## 📝 Các lệnh hữu ích

```bash
# Development
npm run dev           # Chạy dev server (http://localhost:5173)

# Production
npm run build         # Build tối ưu cho production
npm run preview       # Preview production build

# Clean up
rm -rf node_modules dist  # Xóa cache (nếu cần)
npm install               # Cài lại
```

## 🎯 Tiếp theo

Sau khi chạy thành công, bạn có thể:
- Chỉnh sửa React components (auto reload)
- Thay đổi CSS (auto reload)
- Deploy lên Vercel/Netlify
- Thêm features mới

## 📖 Thêm thông tin

Xem [SETUP_GUIDE.md](SETUP_GUIDE.md) để biết chi tiết hơn về cấu hình, structure, và advanced features.

---

**Happy Tarot Reading! 🔮✨**
