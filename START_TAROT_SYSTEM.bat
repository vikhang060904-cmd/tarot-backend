@echo off
title Tarot Talk Startup System
echo ===================================================
echo 🔮 KHOI DONG HE THONG TAROT TALK (VITE + FASTAPI + NGROK)
echo ===================================================
echo.

:: 1. Khoi dong FastAPI Backend tren cong 8002
echo [1/3] Dang khoi dong FastAPI Backend (Port 8002)...
start "FastAPI Backend" cmd /k "cd /d d:\TT_BaiTarot && python -m uvicorn app:app --reload --port 8002"

:: 2. Khoi dong React Frontend (Vite) tren cong 8080
echo [2/3] Dang khoi dong React Frontend (Port 8080)...
start "Vite Frontend" cmd /k "cd /d d:\TT_BaiTarot && npm run dev"

:: 3. Khoi dong Ngrok Tunnel vao cong 8080 voi ten mien tinh (Phuc vu ca API va Giao dien cho Mobile App)
echo [3/3] Dang khoi dong Ngrok Tunnel (Port 8080)...
start "Ngrok Tunnel" cmd /k "cd /d d:\TT_BaiTarot && .\ngrok.exe http 127.0.0.1:8080 --url=uncover-projector-dastardly.ngrok-free.dev"

echo.
echo ===================================================
echo ✅ TAT CA CAC DICH VU DANG DUOC KHOI DONG TRONG CAC CUA SO RIENG!
echo.
echo - Ten mien tinh cua ban: https://uncover-projector-dastardly.ngrok-free.dev
echo - Dien thoai / App di dong da co the ket noi va su dung hoan hao!
echo - Vui long khong tat cac cua so cmd vua mo khi dang su dung.
echo ===================================================
pause
