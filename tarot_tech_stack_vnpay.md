# THÔNG TIN THƯ VIỆN VÀ HỆ CÔNG NGHỆ (CHỈ SỬ DỤNG VNPAY)

Tài liệu này cung cấp thông tin chi tiết về hệ công nghệ (Tech Stack) và toàn bộ các thư viện được sử dụng trong dự án **Tarot Talk AI Chatbot**. Hệ thống đã được lược bỏ cổng thanh toán SePay và chỉ tập trung tích hợp cổng thanh toán **VNPay**.

---

## 1. PHÂN HỆ FRONTEND (GIAO DIỆN NGƯỜI DÙNG)
Được phát triển bằng **React 18** kết hợp với **TypeScript**, biên dịch và đóng gói bằng công cụ **Vite**.

### Danh sách thư viện Frontend (`package.json`):
* **React** (`^19.0.0`): Thư viện cốt lõi để xây dựng giao diện người dùng dựa trên các thành phần (Components) tái sử dụng.
* **React DOM** (`^19.0.0`): Hỗ trợ React tương tác trực tiếp với DOM của trình duyệt.
* **TypeScript** (`^5.2.2`): Tăng cường tính chặt chẽ của mã nguồn bằng cách khai báo kiểu dữ liệu tĩnh, giảm thiểu lỗi runtime.
* **Vite** (`^5.0.0`): Công cụ build thế hệ mới giúp tối ưu hóa thời gian chạy thử nghiệm (Development) và đóng gói (Production).
* **React Router DOM** (`^7.14.2`): Quản lý luồng chuyển trang (Routing) mượt mà trên nền tảng Single Page Application (SPA).
* **Ant Design (antd)** (`^6.3.6`): Bộ thư viện UI Components (Nút bấm, Modals nhập liệu, Tables, Báo lỗi, Popups) với thiết kế tối giản, cao cấp.
* **Recharts** (`^3.8.1`): Thư viện hiển thị biểu đồ thống kê trực quan lượng nạp tiền và lượt trải bài trên trang Admin Dashboard.
* **html2canvas** (`^1.4.1`): Cho phép người dùng chụp lại toàn bộ màn hình trải bài Tarot dưới dạng file ảnh để lưu trữ hoặc chia sẻ.
* **@react-oauth/google** (`^0.13.5`): Thư viện tích hợp cổng đăng nhập một chạm bằng tài khoản Google.

---

## 2. PHÂN HỆ BACKEND (MÁY CHỦ API)
Xây dựng trên nền tảng **FastAPI (Python)** bất đồng bộ, mang lại tốc độ xử lý nhanh và độ trễ cực thấp.

### Danh sách thư viện Backend (`requirements.txt`):
* **FastAPI** (`0.104.1`): Framework tối tân để xây dựng các API nhanh chóng, hỗ trợ xử lý luồng bất đồng bộ (async/await).
* **Uvicorn** (`0.24.0`): Máy chủ chạy ứng dụng FastAPI trên môi trường Local và Production.
* **MySQL Connector Python**: Thư viện kết nối trực tiếp đến cơ sở dữ liệu MySQL để thực hiện truy vấn.
* **Requests** (`2.31.0`): Gửi yêu cầu HTTP ra bên ngoài (để gọi mô hình AI trên OpenRouter và kiểm tra trạng thái giao dịch).
* **PyJWT**: Mã hóa và giải mã mã xác thực JWT khi người dùng đăng nhập hệ thống.
* **python-dotenv**: Đọc các cấu hình nhạy cảm (API Keys, cấu hình database) từ file `.env` lên môi trường chạy.
* **python-multipart**: Xử lý định dạng dữ liệu gửi lên dạng form-data từ client.

---

## 3. CƠ SỞ DỮ LIỆU VÀ TRÍ TUỆ NHÂN TẠO (AI)
* **Hệ quản trị cơ sở dữ liệu:** **MySQL** (lưu trữ thông tin tài khoản, lịch sử trải bài, phiên hỏi đáp AI và lịch sử hóa đơn thanh toán VNPay).
* **Trí tuệ nhân tạo (AI):** Sử dụng model **Google Gemini 2.5 Flash** kết nối qua cổng API **OpenRouter** để luận giải ý nghĩa các lá bài dựa trên chủ đề và câu hỏi của người dùng.

---

## 4. TÍCH HỢP CỔNG THANH TOÁN VNPAY (VNPAY ONLY)
Hệ thống thanh toán của ứng dụng hoạt động **chỉ thông qua VNPay** với quy trình tự động:

### Cấu hình môi trường (`.env`):
```env
# Kích hoạt chế độ hiển thị cổng VNPay
SHOW_VNPAY=true
SHOW_SEPAY=false

# Thông tin tài khoản Sandbox/Production VNPay
VNPAY_TMN_CODE=CSJCACKX                                    # Mã định danh website tại VNPay
VNPAY_HASH_SECRET=48Z5A1LS9IKD41P0LW1QUO8909EM7OST         # Chuỗi bảo mật dùng để tạo chữ ký số (Checksum)
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://uncover-projector-dastardly.ngrok-free.dev/payment/vnpay/return # URL nhận kết quả thanh toán
```

### Luồng xử lý thanh toán VNPay:
1. **Khởi tạo đơn hàng:** Khi người dùng chọn gói nạp năng lượng, Frontend gọi API tạo hóa đơn.
2. **Tạo URL thanh toán:** Backend (`vnpay.py`) sử dụng mã hash secret và thông tin đơn hàng để tạo một URL thanh toán bảo mật có chữ ký số (Secure Hash) và trả về cho Frontend.
3. **Thanh toán:** Người dùng được chuyển hướng sang cổng thanh toán của VNPay để thực hiện quét mã QR ngân hàng hoặc nhập thẻ ATM.
4. **Xử lý phản hồi (IPN / Return):** VNPay chuyển hướng người dùng quay lại đường dẫn `VNPAY_RETURN_URL`. Backend kiểm tra tính chính xác của chữ ký bảo mật từ VNPay gửi về, nếu hợp lệ thì tự động cộng số lượng Token tương ứng cho tài khoản người dùng và cập nhật trạng thái đơn hàng thành `paid`.

```mermaid
flowchart TD
    A[Khởi tạo đơn hàng] --> B[Frontend gọi API tạo hóa đơn]
    B --> C[Backend tạo URL thanh toán với Secure Hash]
    C --> D[Frontend trả URL cho người dùng]
    D --> E[Người dùng thanh toán tại VNPay (QR/ATM)]
    E --> F[VNPay chuyển hướng tới VNPAY_RETURN_URL]
    F --> G[Backend kiểm tra chữ ký bảo mật]
    G --> H{Chữ ký hợp lệ?}
    H -- Yes --> I[Thêm Token cho người dùng, cập nhật trạng thái "paid"]
    H -- No --> J[Thông báo lỗi thanh toán]
    I --> K[Hiển thị kết quả thanh toán cho người dùng]
    J --> K
```

```mermaid
flowchart TD
    Start[Start: User opens Tarot App] --> AuthCheck{Is user logged in?}
    AuthCheck -- Yes --> Dashboard[Show Dashboard]
    AuthCheck -- No --> Login[Show Login / Admin Access Modal]
    Login --> LoginSuccess{Login successful?}
    LoginSuccess -- Yes --> Dashboard
    LoginSuccess -- No --> Login
    Dashboard --> LangToggle[User selects language (VI/EN)]
    LangToggle --> ServiceSelect[Choose Tarot service]
    ServiceSelect --> StartReading[Click “Start Reading”]
    StartReading --> PaymentNeeded{Payment required?}
    PaymentNeeded -- Yes --> VNPayCheckout[Redirect to VNPay Checkout]
    VNPayCheckout --> VNPayProcess[VNPay processes payment]
    VNPayProcess --> PaymentResult{Payment successful?}
    PaymentResult -- Yes --> AIRequest[Call FastAPI / Gemini model]
    PaymentResult -- No --> PaymentError[Show payment error & retry]
    PaymentError --> StartReading
    AIRequest --> AIProcess[FastAPI composes prompt, calls Gemini]
    AIProcess --> AIResult[Model returns Tarot reading]
    AIResult --> ShowResult[Display reading with animations/audio]
    ShowResult --> End[User can save/share or start new reading]
    End --> Start
```
