# Tarot Talk - React + Vite Project Setup

## ✅ Hoàn thành

Dự án React + Vite đã được tạo hoàn toàn với cấu trúc:

```
d:\TT_BaiTarot\
├── src/
│   ├── index.tsx (entry point)
│   ├── App.tsx (main component)
│   ├── index.css (global styles)
│   ├── App.css
│   └── components/
│       ├── Scene.tsx (3D scene component)
│       ├── Scene.css
│       ├── UI.tsx (user interface component)
│       └── UI.css
├── public/
│   ├── images/ (tarot cards, wizard)
│   └── audio/ (background music, effects)
├── templates/
│   └── index.html (root HTML template)
├── vite.config.ts (Vite configuration)
├── tsconfig.json (TypeScript config)
├── tsconfig.node.json
├── package.json (dependencies)
├── .gitignore
└── static/ (old static files - có thể xóa khi hoàn toàn chuyển sang React)
```

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình Public Folder
**QUAN TRỌNG**: Sao chép các assets vào thư mục `public/`:

```bash
# Copy từ static sang public
cp -r static/images public/
cp -r static/audio public/
```

Hoặc trên Windows (PowerShell):
```powershell
Copy-Item -Path ".\static\images" -Destination ".\public\" -Recurse -Force
Copy-Item -Path ".\static\audio" -Destination ".\public\" -Recurse -Force
```

### 3. Chạy development server
```bash
npm run dev
```

Server sẽ khởi chạy trên `http://localhost:5173`

### 4. Build production
```bash
npm run build
```

Output sẽ ở `dist/` folder

## 📁 Cấu trúc Assets

Dự án cần có `public/` folder với:
```
public/
├── images/
│   ├── wizard.png
│   └── tarot/
│       ├── back.png
│       ├── cups/ (14 card images)
│       ├── pentacles/ (14 card images)
│       ├── swords/ (14 card images)
│       └── wands/ (14 card images)
└── audio/
    ├── bg.mp3 (background music)
    └── magic.mp3 (sound effect)
```

## 🔧 Configuration

### Vite Proxy
`vite.config.ts` đã cấu hình proxy cho API:
- `/api/*` → `http://localhost:8002`

Chắc chắn Python backend đang chạy trên port `8002`

### TypeScript
- Strict mode enabled
- React 19 types
- ES2020 target

## 📦 Dependencies

- **react** 19.0.0
- **react-dom** 19.0.0
- **typescript** 5.2.2
- **vite** 5.0.0
- **@vitejs/plugin-react** 4.3.0

## 🎨 Styling

- Sử dụng CSS modules (Scene.css, UI.css, index.css)
- Google Fonts: Inter, Playfair Display, Outfit
- Dark theme với gradient purple/cyan
- CSS Grid cho layout responsive

## 🎯 Chính sửa chính từ Vanilla JS

1. **React Hooks**: useState, useRef, useEffect thay vì vanilla DOM manipulations
2. **Component-based**: Scene, UI, App thay vì inline HTML
3. **Props-driven**: Data flow từ parent → child components
4. **Build Tool**: Vite thay vì vanilla <script> tags
5. **Module Imports**: ES6 modules thay vì global scope

## ⚠️ Lưu ý Quan Trọng

1. **Public folder**: Assets phải ở `public/` để Vite serve đúng
2. **Backend API**: Phải chạy trên http://localhost:8002
3. **Port development**: Default `5173`, có thể thay đổi trong `vite.config.ts`
4. **Hot Module Reload**: Tự động refresh khi sửa file (dev mode)

## 🧪 Testing

Để test xem React app hoạt động:
1. Chạy `npm run dev`
2. Mở `http://localhost:5173` trong browser
3. Kiểm tra console (F12) xem có errors không
4. Test nút "Chia Toàn Bộ Bài"

## 📝 Tiếp theo (Tùy chọn)

- Thêm error boundary components
- Thêm loading states
- Thêm animations cho card dealing
- Tối ưu bundle size
- Thêm PWA support
- Deploy lên Vercel/Netlify
