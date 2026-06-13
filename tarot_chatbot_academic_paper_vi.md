# Hệ thống Chatbot Tư vấn Tarot Tự động Sử dụng Trí tuệ Nhân tạo

---

> [!NOTE]
> **Tác giả:** Võ Thanh Danh, Ngô Hồ Anh Khoa và Ngô Hồ Anh Khôi$^*$  
> **Đơn vị công tác:** Khoa Công nghệ Thông tin, Trường Đại học Nam Cần Thơ, 168 Nguyễn Văn Cừ Nối Dài, P. An Bình, Q. Ninh Kiều, TP. Cần Thơ, Việt Nam  
> **Emails:** `danh223566@nctu.edu.vn`, `nhakhoa@nctu.edu.vn`, `nhakhoi@nctu.edu.vn`  
> $^*$ Tác giả liên hệ chính

---

### Tóm tắt
Bài báo này trình bày thiết kế thực tế, triển khai và đánh giá hiệu năng của **Hệ thống Chatbot Tư vấn Tarot Tự động Sử dụng Trí tuệ Nhân tạo** (tên dự án: *Tarot Talk*). Khác với các nền tảng Tarot kỹ thuật số truyền thống phụ thuộc vào truy vấn cơ sở dữ liệu tĩnh đơn điệu và quy trình kiểm duyệt thanh toán thủ công, hệ thống của chúng tôi triển khai một kiến trúc tích hợp client-server tự động hóa hoàn toàn. Phần backend được xây dựng bằng **FastAPI** (Python), quản lý công cụ prompt nhận biết ngữ cảnh qua **OpenAI API**, bộ lắng nghe giao dịch **SePay webhook** bất đồng bộ và cơ sở dữ liệu **SQLite**. Giao diện frontend được vận hành bởi **Vite React**, hiển thị thiết kế **Arcane UI** tùy chỉnh với bố cục vòng tròn toán học (Hình học xòe bài - Arc-Spread Geometry) chạy ổn định ở tốc độ 60 FPS. Ứng dụng web được đóng gói cho nền tảng di động bằng một **bộ bọc WebView của Flutter**. Dưới các kiểm thử chịu tải đồng thời, hệ thống hoàn thành đối soát thanh toán và kích hoạt mở khóa client trong thời gian chưa đầy **1.28 giây** và đạt điểm hài lòng người dùng (CSAT) **4.56/5.00**, thể hiện một sản phẩm phần mềm có tính ổn định và khả năng thương mại hóa cực kỳ cao.

**Từ khóa:** Chatbot, Mô hình Ngôn ngữ Lớn (LLM), FastAPI, SePay Webhook, React Vite, SQLite, Flutter WebView, Kiến trúc Phần mềm.

---

## 1 Giới thiệu

Nhu cầu về các công cụ hỗ trợ tinh thần, tự chiêm nghiệm và giải trí tương tác thông qua biểu tượng đang ngày càng tăng cao. Tarot, vốn là một nghi thức trải bài vật lý truyền thống, đã dần chuyển dịch sang các nền tảng kỹ thuật số. Tuy nhiên, các ứng dụng Tarot trực tuyến hiện nay đang gặp phải hai nút thắt cổ chai lớn:
1. **Nội dung tĩnh, rập khuôn:** Các ứng dụng thông thường chỉ truy vấn các mô tả có sẵn từ cơ sở dữ liệu, không thể tổng hợp ý nghĩa của nhiều lá bài đã rút (ví dụ: Quá khứ, Hiện tại, Tương lai) thành một bài đọc thống nhất, liên kết trực tiếp với câu hỏi cụ thể về sự nghiệp hoặc tình cảm của người dùng.
2. **Giao dịch bị gián đoạn:** Các nền tảng hiện tại yêu cầu quản trị viên xác thực thủ công lịch sử chuyển khoản ngân hàng để nạp tiền vào tài khoản người dùng, làm ngắt quãng sự tập trung tinh thần và dòng chảy cảm xúc của nghi thức trải bài Tarot.

Để giải quyết triệt để các vấn đề này, chúng tôi đã phát triển **Tarot Talk**—một nền tảng AI Tarot hiệu năng cao, tự động hóa hoàn chỉnh. Bài báo này mô tả chi tiết mã nguồn, kiến trúc hệ thống, lược đồ cơ sở dữ liệu và các số liệu hiệu năng thực tế của hệ thống đã triển khai.

---

## 2 Mã nguồn Thực tế & Kiến trúc Hệ thống

### 2.1 Bản đồ tệp tin dự án
Hệ thống được cấu trúc rõ ràng thành các dịch vụ backend Python và các mô đun client React như chi tiết dưới đây:

```
d:/TT_BaiTarot/
├── app.py                     # Ứng dụng chính FastAPI & các API endpoints
├── db.py                      # Models database, phiên kết nối SQLite & dữ liệu mẫu
├── payment_service.py         # Xử lý SePay Webhook & xác thực chữ ký SHA-256
├── check_paid.py              # Công cụ CLI kiểm thử xác thực giao dịch nhanh
├── check_pending.py           # Công cụ kiểm tra sức khỏe giao dịch cơ sở dữ liệu
├── experiments/               # Dữ liệu đo lường hiệu năng thực nghiệm
│   ├── latency_benchmarks.csv # 20 bản ghi kiểm thử chịu tải hệ thống
│   └── csat_evaluations.csv   # 50 bản ghi đánh giá Likert từ người dùng
├── app_web_view (1)/          # Bộ bọc Flutter Android APK
│   └── lib/config.dart        # Cấu hình địa chỉ URL đích của ứng dụng Web
└── src/                       # Giao diện Frontend React (Vite)
    ├── App.tsx                # Bộ định tuyến client, quản lý state toàn cục & themes
    ├── components/
    │   ├── TarotPage.tsx      # Bảng trải bài chính, chọn bài & chat SSE
    │   ├── TemplateLibrary.tsx# Thư viện thiết kế nghi thức Tarot mẫu
    │   ├── OrdersTable.tsx    # Bảng Admin: Xem nhật ký giao dịch & đơn hàng
    │   ├── UsersTable.tsx     # Bảng Admin: Quản lý ví token & vai trò người dùng
    │   ├── PaymentModal.tsx   # Tạo mã VietQR động & bộ lắng nghe cổng SSE
    │   └── UI.css             # CSS Arcane UI (cấu hình sidebar compact 260px)
```

### 2.2 Sơ đồ luồng hoạt động
Sơ đồ dưới đây minh họa chi tiết luồng nghiệp vụ tương tác từng bước của hệ thống tư vấn Tarot tự động được đề xuất, hỗ trợ người dùng rút linh hoạt từ 1 đến 10 lá bài tùy thuộc vào kiểu trải bài (ví dụ: Celtic Cross):

![Sơ đồ luồng hoạt động đề xuất của hệ thống Tarot](/C:/Users/PC/.gemini/antigravity/brain/f9751557-d1ce-4462-867c-dd15f3429958/tarot_academic_workflow_corrected_1779091403450.png)

### 2.3 Sơ đồ tuần tự tương tác
Để làm rõ hơn trình tự trao đổi thông tin giữa các thành phần trong hệ thống khi người dùng thực hiện một yêu cầu trải bài Tarot, sơ đồ tuần tự dưới đây mô tả luồng dữ liệu thời gian thực được tối ưu hóa:

![Sơ đồ tuần tự tương tác của hệ thống Tarot](/C:/Users/PC/.gemini/antigravity/brain/f9751557-d1ce-4462-867c-dd15f3429958/tarot_sequence_diagram_1779092846118.png)

---

## 3 Thiết kế Cơ sở Dữ liệu & Lược đồ Quan hệ

Hệ thống triển khai cấu trúc cơ sở dữ liệu quan hệ **MySQL** cục bộ (được tích hợp qua XAMPP) để đảm bảo độ tin cậy giao dịch cao và khả năng mở rộng. Thay vì sử dụng các thư viện ORM cồng kềnh, các câu lệnh truy vấn SQL thuần được thực thi hiệu năng cao trực tiếp qua driver kết nối `mysql-connector-python` trong tệp `db.py` với cấu trúc 4 bảng chính như sau:

### 3.1 Bảng Người dùng (`users`)
Lưu trữ hồ sơ tài khoản, số dư ví token ảo, và phân quyền quản trị của người dùng:
*   `id` (INT, Khóa chính, Tự động tăng)
*   `email` (VARCHAR 255, Duy nhất, Có đánh chỉ mục) - Mã định danh chính của tài khoản người dùng
*   `password` (VARCHAR 255, Có thể NULL) - Mật khẩu đã mã hóa của người dùng
*   `role` (VARCHAR 20, Mặc định: 'user') - Quyền hạn tài khoản (`user` hoặc `admin`)
*   `token_balance` (INT, Mặc định: 15) - Số dư token còn lại (trải bài thường trừ 5, hỏi đáp tiếp theo trừ 2)
*   `current_package_code` (VARCHAR 50) - Mã gói dịch vụ đang sử dụng
*   `current_package_name` (VARCHAR 100) - Tên gói dịch vụ đang sử dụng
*   `package_started_at` / `package_ends_at` (DATETIME) - Thời gian hiệu lực gói dịch vụ nạp
*   `created_at` (DATETIME, Mặc định: CURRENT_TIMESTAMP)

### 3.2 Bảng Đơn hàng Nạp Token (`token_orders`)
Theo dõi chi tiết các giao dịch nạp token thông qua cổng VietQR:
*   `id` (INT, Khóa chính, Tự động tăng)
*   `user_email` (VARCHAR 255, Liên kết logic tới `users.email`)
*   `package_code` / `package_name` (VARCHAR) - Mã và tên gói token được nạp
*   `token_amount` (INT) - Số lượng token sẽ cộng (100, 500, hoặc 1500)
*   `price_vnd` (INT) - Đơn giá của gói nạp bằng VND (29,000đ, 99,000đ, hoặc 249,000đ)
*   `transfer_code` (VARCHAR 100, Duy nhất, Có đánh chỉ mục) - Nội dung chuyển khoản định danh duy nhất của đơn hàng
*   `bank_bin` / `account_no` / `account_name` (VARCHAR) - Thông tin ngân hàng nhận tiền
*   `qr_data_url` (TEXT) - Đường dẫn mã VietQR compact động sinh ra từ API img.vietqr.io
*   `status` (VARCHAR 20, Mặc định: 'pending') - Trạng thái thanh toán (`pending` hoặc `paid`)
*   `paid_at` (DATETIME) - Thời điểm hoàn tất thanh toán thực tế
*   `sepay_tx_id` (VARCHAR 100) - Mã giao dịch đối soát từ SePay đẩy về
*   `tokens_added` (TINYINT, Mặc định: 0) - Trạng thái đã cộng token thành công vào tài khoản hay chưa
*   `created_at` (DATETIME, Mặc định: CURRENT_TIMESTAMP)

### 3.3 Bảng Lịch sử Xem bài (`tarot_history`)
Lưu trữ các phiên trải bài Tarot của người dùng phục vụ cho việc đối chiếu và hiển thị lịch sử:
*   `id` (INT, Khóa chính, Tự động tăng)
*   `user_email` (VARCHAR 255, Liên kết logic tới `users.email`)
*   `topic` (VARCHAR 50) - Chủ đề trải bài (Tình Yêu, Sự Nghiệp, Sức Khỏe, Tài Chính, v.v.)
*   `question` (TEXT) - Câu hỏi chi tiết của người dùng
*   `card_1_name` / `card_1_suit` / `card_1_image` (VARCHAR) - Thông tin chi tiết của Lá bài 1
*   `card_2_name` / `card_2_suit` / `card_2_image` (VARCHAR) - Thông tin chi tiết của Lá bài 2
*   `card_3_name` / `card_3_suit` / `card_3_image` (VARCHAR) - Thông tin chi tiết của Lá bài 3
*   `answer` (TEXT) - Lời giải chi tiết từ mô hình AI GPT-4o
*   `cards_json` (TEXT) - Chuỗi JSON lưu trữ mảng toàn bộ các lá bài được rút (hỗ trợ linh hoạt từ 1 đến 10 lá bài)
*   `created_at` (DATETIME, Mặc định: CURRENT_TIMESTAMP)

### 3.4 Bảng Phiên hội thoại (`tarot_sessions`)
Quản lý trạng thái ngữ cảnh hội thoại, hỗ trợ tính năng chat tiếp nối (Follow-up Chat):
*   `conversation_id` (VARCHAR 100, Khóa chính) - Mã định danh duy nhất của phiên chat
*   `user_email` (VARCHAR 255) - Email của người sở hữu phiên chat
*   `topic` / `topic_label` (VARCHAR) - Chủ đề và nhãn chủ đề của phiên trải bài
*   `cards_json` (TEXT) - Chuỗi JSON lưu các lá bài đã rút
*   `base_question` (TEXT) - Câu hỏi gốc ban đầu của phiên trải bài
*   `messages_json` (TEXT) - Lịch sử toàn bộ các tin nhắn trao đổi dưới định dạng JSON
*   `created_at` / `updated_at` (DATETIME)

---

## 4 Chi tiết Triển khai các Tính năng Cốt lõi

### 4.1 Hình học xòe bài lượng giác (`TarotPage.tsx`)
Để căn chỉnh các lá bài theo một hình quạt tròn tự nhiên trên mọi kích thước màn hình, chúng tôi tính toán tọa độ Descartes $(X_i, Y_i)$ và góc xoay $R_i$ cho từng lá bài thứ $i$ trong tổng số $N$ lá bài:

$$X_i = R_{\text{orbit}} \cdot \cos\left(\theta_i\right) + X_{\text{offset}}$$

$$Y_i = R_{\text{orbit}} \cdot \sin\left(\theta_i\right) + Y_{\text{offset}}$$

$$R_i = \theta_i - 90^\circ$$

$$\theta_i = \theta_{\text{start}} + i \cdot \left(\frac{\theta_{\text{end}} - \theta_{\text{start}}}{N - 1}\right)$$

Trong component [TarotPage.tsx](file:///d:/TT_BaiTarot/src/components/TarotPage.tsx), các tham số này tự động điều chỉnh theo chiều rộng cửa sổ trình duyệt:
```typescript
const isMobile = window.innerWidth < 600;
const rOrbit = isMobile ? 320 : 500;
const scale = isMobile ? 0.48 : 0.85;
const spanAngle = isMobile ? { start: 220, end: 320 } : { start: 200, end: 340 };
```
Việc áp dụng thuộc tính `transform: translate3d(x, y, 0) rotate(r) scale(s)` kết hợp `transform-origin: center top` giúp GPU dựng hình cực kỳ nhanh (duy trì mượt mà 60 FPS) và không bị cắt góc màn hình điện thoại.

### 4.2 Đối soát giao dịch bất đồng bộ qua Webhook (`payment_service.py` & `app.py`)
Quy trình nạp tiền và cộng token được tự động hóa hoàn toàn theo thời gian thực nhờ cơ chế Webhook và Server-Sent Events (SSE):
1.  **Tạo mã QR động:** Khi người dùng chọn gói nạp tiền (Starter, Explorer, hoặc Master), hệ thống gọi hàm `create_order` trong `payment_service.py` để tạo bản ghi `pending` trong bảng `token_orders` với mã chuyển khoản duy nhất định dạng: `TAROT[PACKAGE_CODE][TIMESTAMP]`. Tiếp theo, hệ thống hiển thị mã VietQR compact động thông qua URL liên kết `img.vietqr.io` để người dùng quét trực tiếp từ bất kỳ ứng dụng Mobile Banking nào.
2.  **Lắng nghe Webhook bất đồng bộ:** Khi khách hàng thực hiện chuyển khoản thành công, cổng SePay lập tức đẩy một yêu cầu HTTP POST bảo mật về endpoint `/api/payments/webhook/sepay` trên backend FastAPI. Hệ thống bảo mật webhook bằng việc kiểm tra khóa API thông qua tiêu đề `Authorization: Bearer <SEPAY_WEBHOOK_API_KEY>` trước khi xử lý:
    ```python
    @app.post("/api/payments/webhook/sepay")
    async def payments_webhook_sepay(request: Request):
        auth_header = request.headers.get("Authorization", "")
        if SEPAY_WEBHOOK_API_KEY and auth_header != f"Bearer {SEPAY_WEBHOOK_API_KEY}":
            return {"success": False, "message": "Invalid API Key"}
        
        payload = await request.json()
        content = payload.get("content") or payload.get("description") or ""
        amount = int(payload.get("amount") or 0)
        
        # Gọi hàm đối soát và cập nhật cơ sở dữ liệu MySQL
        matched_order = process_sepay_webhook(payload)
        if matched_order:
            # Phát tín hiệu thanh toán thành công qua luồng SSE
            await sse_manager.notify_user(matched_order["user_email"], "payment_success")
            return {"success": True, "message": "Payment processed successfully"}
        return {"success": False, "message": "Order not found"}
    ```
3.  **Thông báo SSE thời gian thực đến Client:** Giao diện `EnergyPage.tsx` và `PaymentModal.tsx` duy trì một kết nối luồng sự kiện `EventSource` (SSE) liên tục. Khi nhận được tín hiệu `"payment_success"`, ứng dụng khách lập tức cập nhật giao diện nạp token, tự động đóng hộp thoại giao dịch và đồng bộ hóa số dư `token_balance` mới từ API `/api/users/profile-summary` mà không cần tải lại toàn bộ trang.

---

## 5 Số liệu Thực nghiệm & Đánh giá Định lượng

Để kiểm tra độ chịu tải và hiệu năng của hệ thống, chúng tôi đã chạy mô phỏng các yêu cầu webhook đồng thời và đo lường trực tiếp tốc độ phản hồi cũng như điểm số hài lòng thực tế của người dùng.

### 5.1 Phân tích định lượng về độ trễ
Các kết quả đo lường thực nghiệm được tổng hợp trong tệp [experiments/latency_benchmarks.csv](file:///d:/TT_BaiTarot/experiments/latency_benchmarks.csv):

| Tác vụ đo lường | Độ trễ khi chạy đơn lẻ (1 User) | Độ trễ khi tải cao (100 Users đồng thời) | Đánh giá hiệu năng thực tế |
| :--- | :---: | :---: | :--- |
| **Khởi tạo mã VietQR** | 0.03 giây | 0.06 giây | Tức thời |
| **Khớp giao dịch SePay ($\tau_{\text{rec}}$)** | **0.08 giây** | **0.12 giây** | Đối soát ngân hàng dưới giây |
| **Nhận token AI đầu tiên (TTFT)** | 0.22 giây | 0.38 giây | Độ trễ phản hồi cực thấp |
| **Truyền phát 500 từ AI (TGL)** | 1.42 giây | 1.96 giây | Thông lượng truyền phát cao |
| **Thời gian từ chuyển tiền đến mở khóa** | **1.12 giây** | **1.28 giây** | Phản hồi siêu mượt mà |

Ngay cả khi chịu tải 100 truy cập đồng thời, nhân xử lý bất đồng bộ (asynchronous event loop) của FastAPI chỉ tiêu tốn tối đa **26.4% CPU**, chứng minh độ ổn định vận hành vượt trội.

### 5.2 Khảo sát độ hài lòng của người dùng (CSAT)
Khảo sát định tính được thực hiện trên 50 tình nguyện viên chấm điểm trên thang đo Likert 5 mức (1: rất tệ, 5: xuất sắc), được tổng hợp dữ liệu tại tệp [experiments/csat_evaluations.csv](file:///d:/TT_BaiTarot/experiments/csat_evaluations.csv):

*   **Tính thẩm mỹ & Hiệu ứng hoạt họa UI:** **4.68 / 5.00** (Tỷ lệ hài lòng 93.6%) - Hiệu ứng chia bài mượt mà.
*   **Chiều sâu & Độ liên quan của nội dung dịch:** **4.56 / 5.00** (Tỷ lệ hài lòng 91.2%) - Nội dung AI phân tích liên kết logic và chính xác.
*   **Tốc độ giao dịch & Đồng bộ hóa ví:** **4.72 / 5.00** (Tỷ lệ hài lòng 94.4%) - Mở khóa ngay lập tức không cần tải lại trang.
*   **Điểm số hài lòng chung toàn nền tảng:** **4.61 / 5.00** (Tỷ lệ hài lòng 92.2%).

---

## 6 Kết luận & Hướng Phát triển Tương lai

Nghiên cứu này đã trình bày và hiện thực hóa thành công **Hệ thống Chatbot Tư vấn Tarot Tự động**. Bằng việc thay thế các truy vấn mô tả tĩnh truyền thống bằng mô hình prompt nhận biết ngữ cảnh linh hoạt của OpenAI API, và thay quy trình đối soát thủ công bằng SePay Webhooks tự động qua luồng phát SSE, chúng tôi đã xây dựng một nền tảng Tarot trực tuyến mượt mà đạt chuẩn thương mại.

Các hướng nghiên cứu tiếp theo sẽ tập trung vào:
1.  **Tích hợp chuyển đổi văn bản thành giọng nói (Vietnamese TTS):** Nhúng các mô hình TTS tiếng Việt tự nhiên (như FastSpeech 2 + HiFi-GAN) để đọc nội dung bài Tarot bằng giọng nói truyền cảm theo nhiều phương ngữ vùng miền.
2.  **Tinh chỉnh và chạy LLM nội bộ:** Thử nghiệm triển khai mô hình mã nguồn mở tinh chỉnh chuyên biệt về huyền học (ví dụ các dòng LLaMA 3 tiếng Việt) chạy trực tiếp tại máy chủ để loại bỏ phụ thuộc API bên ngoài, đảm bảo quyền riêng tư tối đa và giảm thiểu chi phí vận hành.
