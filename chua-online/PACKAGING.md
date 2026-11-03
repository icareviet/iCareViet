# Gói source Chùa Online

Gói giữ đầy đủ mã nguồn ứng dụng và tài nguyên cần cho bản hiện tại: chánh điện, sân/cầu/hồ, nhân vật/chỗ ngồi, tài khoản, các hoạt động tu tập, chat chung, tin riêng và hồ sơ công khai.

## Thành phần

- `app/`: PHP, schema SQLite, catalog, mặt bằng dùng chung và API xã hội.
- `public/`: entry point, API và toàn bộ asset đã build, mô hình 3D, texture, font, giấy phép.
- `src/`: JavaScript/Three.js và CSS gốc để tiếp tục sửa giao diện.
- `scripts/`, `tests/`, `router.php`, `package.json`, `package-lock.json`: công cụ build/chạy/cài PHP/quản trị/đóng gói và kiểm thử.
- `storage/.gitkeep`: thư mục trống để ứng dụng khởi tạo dữ liệu mới.
- `PRODUCT.md`, `DESIGN.md`, `.impeccable/config.json`, `.impeccable/design.json`, `.impeccable/surfaces/` và hồ sơ nguồn texture: ngữ cảnh thiết kế của dự án.
- `SOURCE-MANIFEST.json`: danh sách từng tệp, kích thước và SHA-256 tại thời điểm đóng gói; không tự bao gồm chính manifest.

Không phân phối tài khoản, tin nhắn, lịch sử tu tập, session, log, `.env`, cơ sở dữ liệu SQLite hoặc dữ liệu thử. `node_modules`, `.runtime`, `.git`, engine `.agents`, cấu hình công cụ `.codex`, cache, ảnh review và các thư mục tạm được loại khỏi gói. Có thể cài lại dependency bằng lockfile; PHP portable cài bằng `scripts/setup-php.ps1`; Impeccable là công cụ phát triển tùy chọn.

## Chạy sau khi giải nén

1. Mở thư mục `chua-online`.
2. Cài PHP 8.3+ cùng SQLite/mbstring/OpenSSL, hoặc chạy `./scripts/setup-php.ps1` trên Windows.
3. Cài Node.js/npm nếu cần dùng các lệnh npm. Bản frontend đã có sẵn: `npm run dev` mở server cục bộ ở `http://127.0.0.1:8080`.
4. Khi sửa source frontend: `npm ci --ignore-scripts`, `npm run build`, rồi `npm test`.

Không cần nhập database mẫu; ứng dụng tự tạo schema khi chạy. Khi đưa lên hosting, làm theo mục hosting trong `README.md`, đặc biệt document root phải là `public/`.

## Kiểm tra và tạo lại

`npm run package:source` tạo một ZIP mới trong `dist/` cùng tệp `.sha256`, không xóa bản cũ. Trên PowerShell, dùng `Get-FileHash -Algorithm SHA256 <đường-dẫn-zip>` để đối chiếu checksum. Manifest trong ZIP đối chiếu từng tệp với source đã đóng gói.

Script dùng danh sách cho phép, từ chối đóng gói nếu phát hiện tệp dữ liệu/môi trường riêng hoặc mẫu khóa bí mật trong nội dung. Đây là bước kiểm tra trước khi chia sẻ source; không thay thế một cuộc đánh giá bảo mật sản phẩm.

## Giấy phép tài nguyên

Giữ các tệp ghi công và giấy phép trong `public/assets/licenses/`. Tượng Kamakura của Scan-the-World có giấy phép **CC BY-NC-SA 4.0**, giới hạn phi thương mại và giữ điều kiện chia sẻ tương tự cho mô hình. Việc đưa source vào repository công khai không đổi giấy phép của mô hình hoặc các thư viện/font bên thứ ba. Chi tiết nguồn và xử lý mô hình có trong `README.md` và tệp ghi công.
