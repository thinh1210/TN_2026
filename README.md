# Web Thiệp Mời 2 Cơ Chế (Nâng cấp từ `NN_card`)

Dự án Next.js (App Router + TypeScript) tại `/home/thinh/TN`, phát triển theo đề xuất tại [DESIGN_PROPOSAL.md](./DESIGN_PROPOSAL.md) và tham khảo cơ chế tạo slug cá nhân hoá của [thinh1210/NN_card](https://github.com/thinh1210/NN_card).

## Tính năng chính
1. **Cơ chế 1 — Template điền tên khách mời**:
   - Tạo link cá nhân hoá `/invite/[slug]` cho từng khách hoặc tạo hàng loạt từ danh sách tên.
   - Hỗ trợ xem thử nhanh `/invite/demo?to=Tên+Khách`.
   - Sinh OpenGraph metadata động theo tên khách mời và lịch trình sự kiện.
2. **Cơ chế 2 — Thiệp Ngày tháng & Địa điểm có thể "Fill sau"**:
   - Mặt sau dùng template HTML/CSS động (có 3 chủ đề màu: `ocean`, `classic-gold`, `pastel-rose`).
   - Khi bật *"Đang chờ chốt lịch"* (hoặc để trống ngày giờ/địa điểm), thiệp tự động hiển thị trạng thái chờ cập nhật.
   - Khi chủ thiệp điền thông tin trong `/admin`, toàn bộ các link đã gửi tự động hiển thị lịch trình mới.
3. **Nút gửi nội dung tới chủ thiệp**:
   - Khách mời bấm **"💌 Gửi lời nhắn tới ..."** ngay trên thiệp để chọn trạng thái tham dự (RSVP) và viết lời chúc/tin nhắn gửi thẳng về hộp thư trong `/admin`.

## Khởi chạy local
```bash
npm run dev
```
- Trang chủ xem thử tương tác: `http://localhost:3000`
- Thiệp mẫu: `http://localhost:3000/invite/khach-moi-mau`
- Trang quản trị: `http://localhost:3000/admin` (mật khẩu mặc định `123456`, cấu hình qua biến `ADMIN_PASSWORD`).

## Lưu trữ dữ liệu
- **Mặc định (không cần cấu hình)**: Tự động lưu tại `data/db.json`.
- **Tuỳ chọn Supabase**: Thiết lập `.env.local` với `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD` và chạy script `supabase-schema.sql` trong Supabase SQL Editor.
