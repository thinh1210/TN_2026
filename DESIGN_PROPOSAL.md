# Đề xuất Ý tưởng & Kiến trúc Hệ thống: Web Thiệp Mời Thông Minh (Nâng cấp từ `NN_card`)

Tài liệu này trình bày **ý tưởng thiết kế, trải nghiệm người dùng (UX/UI) và kiến trúc kỹ thuật** cho hệ thống Web Thiệp Mời được xây dựng tại `/home/thinh/TN`, phát triển trực tiếp từ nền tảng repo [thinh1210/NN_card](https://github.com/thinh1210/NN_card).

---

## 1. Phân tích nền tảng `NN_card` & Bài toán mới

### Những điểm làm tốt ở `NN_card`
- **Cá nhân hoá qua URL slug (`/invite/[slug]`)**: Mỗi khách mời có một đường link riêng thân thiện (ví dụ `/invite/minh-anh`), khi chia sẻ lên Zalo/Facebook/Messenger sẽ hiện OpenGraph preview mang đúng tên khách mời.
- **Hiệu ứng lật thiệp 3D (`flip-card`)**: Tạo cảm giác mở một tấm thiệp thật — mặt trước chào thân mật, mặt sau chứa thông tin sự kiện.
- **Trang `/admin` gọn nhẹ**: Tạo link, copy link và xoá nhanh chỉ bằng mật khẩu quản trị.

### Giới hạn cần giải quyết cho bài toán mới
1. **Mặt sau `NN_card` là ảnh tĩnh (`public/image.png`)**: Muốn sửa giờ, đổi ngày, đổi địa điểm phải sửa lại file ảnh bằng công cụ thiết kế rồi deploy lại code. Không phù hợp với nhu cầu **"ngày tháng, địa điểm sẽ được fill sau"**.
2. **Giao tiếp một chiều**: Khách mời xem thiệp xong phải tự thoát ra mở Zalo/Messenger nhắn lại, không có nút gửi phản hồi hay lời chúc ngay trên tấm thiệp.
3. **Phụ thuộc cứng vào Supabase khi chạy thử**: Nếu chưa thiết lập bảng trên Supabase thì local không chạy lưu dữ liệu ngay được.

---

## 2. Ý tưởng Giải pháp cho 3 Cơ chế Cốt lõi

### Cơ chế 1: Template Thiệp Cá Nhân Hoá Tên Người Được Mời (Mặt trước)
- **Giữ lại tinh thần của `NN_card`**: Một template thiệp thiết kế sẵn với hình minh hoạ (Cú tốt nghiệp, cá heo, minion hoặc hoạ tiết theo chủ đề màu) và câu quote mở đầu.
- **Điền tên động vào vị trí trung tâm**:
  - Qua link cố định lưu trong dữ liệu: `/invite/[slug]` (ví dụ `/invite/khach-moi-mau`).
  - Hỗ trợ thêm chế độ **xem thử nhanh không cần lưu DB**: `/invite/demo?to=Tên%20Bạn` để chủ thiệp kiểm tra ngay bố cục khi tên ngắn/dài khác nhau.
  - Hỗ trợ **lời nhắn phụ riêng cho từng người** (`custom_greeting`, ví dụ: *"Nhớ mặc đồ thật xinh nhé!"*) ngoài phần tên mặc định.
- **Tạo hàng loạt (Bulk Create)** trong `/admin`: Dán danh sách 20–50 tên bạn bè (mỗi dòng 1 người), hệ thống tự sinh hàng loạt slug không trùng lặp và bảng link để copy nhanh.

---

### Cơ chế 2: Thiệp Chi Tiết Ngày Tháng & Địa Điểm Dạng Động ("Fill Sau") (Mặt sau)
Thay thế bức ảnh tĩnh ở mặt sau bằng **Template Thiệp HTML/CSS Động** gồm 4 khối thông tin rõ ràng (kế thừa bố cục 4 thẻ minh hoạ của `NN_card`):

1. **⏰ Thời gian (`event_time` & `event_date`)**
   - Nếu đã điền đầy đủ và tắt cờ *"Chưa chốt lịch (Fill sau)"*: Hiển thị nổi bật ngày tháng, thứ, khung giờ.
   - Nếu **chưa điền** hoặc đang bật **"Chế độ Fill Sau (`is_tba = true`)"**: Tự động hiển thị badge trạng thái:
     > *"⏳ Thời gian chính xác đang được cập nhật — Mình sẽ thông báo sớm nhất!"*
2. **📍 Địa điểm (`location_name`, `location_address`, `map_url`)**
   - Nếu đã điền: Hiển thị tên địa điểm, địa chỉ chi tiết và nút **"🗺️ Mở Google Maps"** dẫn thẳng tới bản đồ.
   - Nếu **chưa điền** hoặc đang bật **Fill Sau**: Hiển thị badge *"📍 Địa điểm tổ chức đang được cập nhật"*.
3. **🚗 Ghi chú Bãi gửi xe & Liên hệ (`parking_notes`, `contact_phone`)**
   - Hiển thị danh sách điểm gửi xe (mỗi dòng 1 điểm) và SĐT bấm gọi trực tiếp (`tel:...`) nếu đã điền.
4. **💌 Lời kết & Nút tương tác (`closing_message`)**
   - Câu cảm ơn chân thành ở cuối thiệp kèm nút gửi nội dung tới chủ thiệp.

**Giá trị thực tế của cơ chế "Fill sau"**:
- Bạn có thể **gửi link thiệp trước cho bạn bè giữ chỗ / tạo bất ngờ** ngay cả khi trường/nhà hàng chưa chốt giờ hoặc phòng cụ thể.
- Ngay khi có lịch chính thức, bạn vào `/admin` → tab **Cài đặt Thiệp (Fill Sau)** → điền Ngày, Giờ, Địa điểm, Link Google Maps và bấm **Lưu**.
- **Tất cả các đường link `/invite/[slug]` đã gửi trước đó sẽ tự động hiển thị đầy đủ thông tin mới** mà không cần gửi lại link!
- Chủ thiệp còn có thể đổi **3 bộ giao diện màu sắc (Theme)**:
  - `ocean` (Xanh đại dương dịu mắt — phong cách `NN_card`)
  - `classic-gold` (Kem ấm & Vàng ánh kim trang trọng)
  - `pastel-rose` (Hồng pastel nhẹ nhàng)

---

### Cơ chế 3: Nút Gửi Nội Dung Muốn Gửi Tới Chủ Thiệp (Guest Message & RSVP)
- **Điểm chạm trực quan (CTA)**:
  - Đặt nút **"💌 Gửi lời nhắn tới mình"** ở **cả thanh điều khiển phía dưới thiệp lẫn bên trong mặt sau của thiệp**, giúp khách bấm vào được ở bất kỳ bước nào mà không bị bỏ lỡ.
- **Hộp thoại tương tác (`<dialog closedby="any">`)**:
  - Khi bấm nút, một modal mượt mà hiện lên (hỗ trợ bấm Esc, bấm ra ngoài nền tối, hoặc nút Đóng).
  - **Các trường thông tin khách gửi**:
    1. **Tên của bạn** (tự động điền sẵn theo tên trên tấm thiệp để khách đỡ phải gõ lại, vẫn cho phép sửa nếu cần).
    2. **Trạng thái tham dự (RSVP)** dạng 3 lựa chọn radio trực quan:
       - `🎉 Mình chắc chắn sẽ tới`
       - `🤔 Mình sẽ cố gắng sắp xếp`
       - `😢 Tiếc quá mình bận mất rồi`
    3. **Nội dung muốn gửi tới chủ thiệp** (`textarea` bắt buộc, tối đa 1000 ký tự): Lời chúc, dặn dò, hỏi đường, hẹn đi chung, hoặc bất kỳ tâm sự nào gửi riêng tới chủ thiệp.
- **Hộp thư quản trị trong `/admin`**:
  - Tab **Lời nhắn từ khách mời** hiển thị thẻ thống kê nhanh (Tổng số phản hồi, Số người sẽ tới, Có thể tới, Bận) và toàn bộ danh sách lời nhắn kèm tên khách, slug thiệp và thời gian gửi.

---

## 3. Kiến trúc Dữ liệu & Hệ thống (Dual-Storage)

Hệ thống hỗ trợ lưu trữ kép để vừa **chạy ngay 100% tại local không cần cấu hình DB**, vừa **sẵn sàng gắn Supabase khi deploy Vercel**:

| Thực thể | Các trường chính | Vai trò |
| :--- | :--- | :--- |
| **`Invitation`** | `id`, `guest_name`, `slug`, `custom_greeting`, `created_at` | Cơ chế 1: Định danh khách mời & tạo URL riêng |
| **`EventSettings`** | `host_name`, `event_title`, `quote`, `is_tba`, `event_date`, `event_time`, `location_name`, `location_address`, `map_url`, `contact_phone`, `parking_notes[]`, `closing_message`, `theme`, `updated_at` | Cơ chế 2: Lưu thông tin sự kiện có thể điền/sửa sau |
| **`GuestMessage`** | `id`, `invite_slug`, `guest_name`, `attendance`, `message`, `created_at` | Cơ chế 3: Lưu nội dung & xác nhận tham dự khách gửi về |

- **Môi trường Local / Tự host**: Dữ liệu được đọc/ghi nguyên tử vào `/home/thinh/TN/data/db.json` (tự khởi tạo dữ liệu mẫu ở lần chạy đầu tiên).
- **Môi trường Production (Supabase)**: Nếu phát hiện `.env.local` có cấu hình `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` hợp lệ (khác giá trị placeholder), ứng dụng có thể đồng bộ song song lên các bảng `invitations`, `event_settings`, `guest_messages` (kèm fallback về storage local nếu bảng mới chưa được migrate trên Supabase).

---

## 4. Ý tưởng Mở rộng Sau Này (Roadmap tuỳ chọn)
1. **Xuất mã QR cá nhân hoá cho từng khách mời** ngay cạnh nút Copy Link trong `/admin`.
2. **Bộ đếm ngược (Countdown Timer)** tự động bật trên mặt sau khi chủ thiệp đã điền ngày giờ cụ thể.
3. **Thông báo Telegram / Discord Webhook** mỗi khi có khách bấm nút *"Gửi lời nhắn tới mình"* để bạn nhận tin nhắn ngay trên điện thoại.
4. **Nút "Thêm vào Google Calendar / `.ics`"** ở mặt sau khi đã chốt lịch.
