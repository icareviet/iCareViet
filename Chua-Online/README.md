# Chùa Online

Hệ thống đi chùa trực tuyến viết riêng bằng PHP và Three.js, tham khảo các nhóm chức năng của niemphat.online. Tên “Chùa Online” và các không gian An Lạc, Trúc Lâm, Tịnh Tâm là tên dùng trong bản hiện tại; không tuyên bố liên kết với một ngôi chùa ngoài đời.

## Chạy trên Windows

Cần Node.js/npm và PHP 8.3+ có SQLite, mbstring và OpenSSL. Bản source không kèm PHP portable hoặc `node_modules`. Nếu chưa có PHP, chạy từ thư mục dự án:

```powershell
./scripts/setup-php.ps1
```

Sau đó cài các thư viện và chạy:

```powershell
npm ci --ignore-scripts
npm run build
npm run dev
```

Mở **http://127.0.0.1:8080**. Giữ cửa sổ lệnh đang chạy. `Ctrl+C` dừng máy chủ.

Nếu cần cài lại PHP portable từ nguồn chính thức, chạy `./scripts/setup-php.ps1`. Script xác minh SHA-256 của bản tải về. Hoặc đặt biến `PHP_BIN` trỏ tới PHP có sẵn.

## Các chức năng đã triển khai

- Đại điện 3D đỏ–vàng theo ảnh tham khảo: tượng Phật quét 3D, tòa sen, cột son, trần chạm khắc, đèn lồng, sàn phản chiếu, 48 đệm thiền và hồ sen ngoài sân. WASD, chạm lối đi hoặc joystick; camera theo nhân vật và 5 góc nhìn kiến trúc/khuôn viên. Bản đồ dùng chung mặt bằng với va chạm, chặn hồ/cột/đệm/bàn thờ.
- Sân đá, hai hồ sen, cây xanh, ghế đá và cổng tam quan ở ngoài chánh điện; ba cửa điện nối khu trong/ngoài liên tục. Bản đồ có năm điểm đến; va chạm, bản đồ và PHP dùng chung `app/world-layout.json`.
- Chạm đệm vàng hoặc dùng bảng 48 đệm để nhân vật tự đi vào ngồi xếp bằng. Chỗ được giữ riêng theo phòng; nút Đứng dậy hoặc di chuyển trả chỗ. Chỗ hết hạn sau khi mất kết nối; tải lại cùng phòng giữ chỗ còn hợp lệ. Pháp danh hiện trên đầu nhân vật và người cùng chùa.
- Ba phòng chùa, danh sách người đang kết nối, đồng bộ vị trí và trạng thái bằng HTTP polling.
- Tài khoản khách; đăng ký, đăng nhập, đăng xuất; nâng cấp tài khoản khách và giữ dữ liệu.
- Lạy Phật, tràng hạt 108, tụng kinh trích đoạn, mõ thủ công/tự động, thiền có hẹn giờ và nhật ký lưu trên máy chủ.
- Chuông và mõ tổng hợp bằng Web Audio. Đọc văn bản bằng giọng tiếng Việt của trình duyệt khi thiết bị có giọng phù hợp.
- Túi đồ, cửa hàng bằng Ngọc ảo, dâng hương/hoa/nến, đèn nguyện công khai trong 24 giờ.
- Công quả hằng ngày, nhận thưởng, xếp hạng, chọn thiền phái, trang phục, linh thú, bản đồ, góp ý, cài đặt.
- Trò chuyện theo phòng; xóa tin của chính mình; báo cáo; công cụ quản trị bằng dòng lệnh.
- Cầu gỗ cong sơn son, lan can và hồ nước ngang trước chánh điện. Nhân vật đi theo cao độ mặt cầu; chọn đường tự động tránh nước và lan can. Cầu cũng xuất hiện trong sơ đồ chùa.
- Khung chat bên cạnh cảnh 3D: chat chung theo chùa, hộp tin riêng, báo chưa đọc và danh sách người đang ở cùng chùa. Bấm nhân vật hoặc pháp danh trong chat để xem hồ sơ công khai và nhắn riêng. Tin riêng chỉ người gửi/người nhận đọc được, có xóa tin của mình, báo cáo, chặn/bỏ chặn.

Đây là một triển khai độc lập đang chạy cục bộ. Tài sản, bản ghi âm, nội dung, dữ liệu và hạ tầng của website tham khảo không được sao chép. Chưa có thanh toán tiền thật, email xác minh/khôi phục mật khẩu, quản trị bằng giao diện hoặc kiểm thử tải đông người. Phần tụng kinh hiện có các trích đoạn, không phải thư viện kinh sách đầy đủ.

## Đưa lên hosting PHP

Yêu cầu PHP **8.3+**, `pdo_sqlite`, `sqlite3`, `mbstring`, `openssl`, HTTPS; thư mục `storage` phải ghi được bởi tiến trình PHP. Không cần Node.js trên hosting nếu đã build ở máy phát triển.

1. Chạy `npm run build` và `npm test` ở máy phát triển.
2. Đưa `app/`, `public/`, `storage/.gitkeep` lên máy chủ. Không đưa `.runtime`, `node_modules`, `.git`, bản SQLite phát triển hoặc các phiên thử nghiệm lên hosting.
3. **Document root phải trỏ vào `public/`**. Giữ `app/` và `storage/` bên ngoài vùng phục vụ HTTP. Không đưa toàn bộ repository vào `public_html` rồi mở trực tiếp.
4. Cấp quyền ghi thư mục `storage` cho tài khoản chạy PHP. Không dùng quyền ghi cho mọi người. Đặt `APP_STORAGE` nếu cần lưu ở một thư mục riêng.
5. Mặc định là môi trường production và bắt buộc HTTPS. Chỉ `npm run dev` đặt `APP_ENV=local`. Nếu proxy tin cậy kết thúc TLS phía trước PHP, cấu hình `TRUST_PROXY=1`; không bật tùy chọn này với nguồn truy cập trực tiếp không được kiểm soát.
6. Thiết lập sao lưu SQLite nhất quán, chính sách dữ liệu và người quản trị trước khi mời người dùng. `storage` chứa dữ liệu tài khoản và nội dung riêng, không được phục vụ như tệp tải xuống.

Giới hạn 80 người/phòng là một ràng buộc của ứng dụng, chưa phải năng lực tải đã được chứng minh. Kiến trúc hiện tại dùng SQLite và polling để chạy được trên hosting PHP thông thường; trước khi phục vụ lượng truy cập lớn, cần đo tải và cân nhắc máy chủ realtime cùng cơ sở dữ liệu phù hợp.

## Bảo mật đã áp dụng

PDO prepared statements; hash mật khẩu Argon2id khi PHP hỗ trợ, fallback `PASSWORD_DEFAULT`; xoay session ID khi xác thực; cookie HttpOnly/SameSite và Secure trên HTTPS; CSRF token; kiểm tra Origin; giới hạn tần suất; kiểm tra quyền sở hữu; giao dịch cho số dư/vật phẩm; chống ghi lặp lượt tu tập; thời gian thiền tính phía server; CSP chỉ cho tài nguyên cùng nguồn; escape nội dung người dùng khi render; dữ liệu lưu ngoài document root.

`npm test` chạy 37 kiểm tra tự động với cơ sở dữ liệu tạm tách riêng: đăng nhập, quyền truy cập, CSRF, session, lặp thao tác, vật phẩm, chat theo phòng, quyền đọc/gửi/xóa tin riêng và báo chưa đọc, hồ sơ công khai, tệp riêng tư, năm điểm đến, va chạm hồ/cầu, cao độ nhân vật trên cầu, chọn nhân vật, camera, joystick và quyền giữ/chọn/rời đệm. Đây không thay thế kiểm thử xâm nhập hoặc đánh giá bảo mật độc lập trước vận hành công khai.

## Quản trị

Chạy trên máy chủ bằng quyền quản trị hệ thống; công cụ không có đường dẫn web:

```text
php scripts/admin.php reports
php scripts/admin.php direct-reports
php scripts/admin.php feedback
php scripts/admin.php hide-message <message-id>
php scripts/admin.php hide-direct <message-id>
php scripts/admin.php mute <user-id> [hours]
```

Nếu dùng công cụ quản trị trên hosting, tải thêm `scripts/admin.php` vào `scripts/` bên ngoài document root.

## Impeccable

Máy phát triển đã dùng Impeccable 4.8.0. Bản source giữ `PRODUCT.md`, `DESIGN.md` và ngữ cảnh thiết kế `.impeccable`; engine và cấu hình công cụ cục bộ không nằm trong gói phân phối. Nếu cần tiếp tục dùng Impeccable trên máy mới, chạy `npx impeccable install` ở thư mục dự án rồi tải lại công cụ coding. Impeccable không phải thành phần cần để chạy website. Cách xây giao diện đã xác nhận là code-first.

Trong chat Codex có thể dùng:

```text
$impeccable polish bảng tràng hạt
$impeccable audit giao diện trên điện thoại
```

Nếu skill chưa xuất hiện trong bộ chọn, tải lại Codex. Các lệnh trên được gửi trong chat, không chạy trong PowerShell.

## Đóng gói source

Chạy `npm run package:source`. Script Node.js tạo ZIP và tệp SHA-256 trong `dist/`; bên trong có thư mục `chua-online/`, source PHP/JavaScript/CSS, bản frontend đã build, mô hình/texture/font và giấy phép, tài liệu, kiểm thử và `SOURCE-MANIFEST.json`. Xem `PACKAGING.md` để biết thành phần và cách kiểm tra.

Gói không chứa dữ liệu tài khoản/chat/nhật ký, SQLite, phiên đăng nhập, log, `.env`, Git metadata, thư viện cài lại được, PHP portable, engine Impeccable hoặc ảnh/phiên kiểm thử cục bộ. Dữ liệu mới được tạo khi khởi chạy. Bản đã build có thể chạy sau khi cài PHP bằng `npm run dev`; chỉ cần `npm ci --ignore-scripts` và `npm run build` khi xây lại frontend.


## Tài sản đại điện

- Kiến trúc, đồ thờ, đệm và nhân vật được dựng trong mã. Vật liệu gỗ sàn được tạo bằng Canvas; các chi tiết lặp dùng mesh gộp và instancing. Chế độ Tiết kiệm pin tắt sàn phản chiếu và bóng đổ.
- Tượng “The Great Buddha at Kamakura, Japan”, Scan-the-World, [Zenodo](https://zenodo.org/records/20207851), **CC BY-NC-SA 4.0**. Giữ ghi công và giấy phép trong `public/assets/licenses/kamakura-buddha.txt`. Đây là tài sản phi thương mại: cần thay mô hình hoặc có quyền riêng trước khi dùng trong một dịch vụ thương mại. Mô hình đã được giải nén Draco để tải cùng nguồn, không nới CSP; `scripts/prepare-statue.mjs` ghi lại bước xử lý từ tệp nguồn.
- Hoa văn sen vàng được tạo bằng ImageGen cho dự án, chuyển JPEG; prompt chính xác được nhúng trong tệp và lưu tại `.impeccable/gilded-lotus-prompt.txt`.
- Kiểm tra giao diện tại 1440×900, 767×800 và 390×843, đủ bốn điểm đến, bốn góc nhìn và kéo/thả joystick. Ảnh và số đo ở `.impeccable/review/sanctuary/`. Đây là thử nghiệm trình duyệt cục bộ, chưa phải đo tải GPU trên nhiều điện thoại thật.

Kiểm tra mở rộng sân vườn/chỗ ngồi: PHP kiểm tra chủ sở hữu, tọa độ tới đệm, CSRF, chỗ trùng, đổi phòng, đăng xuất và hết hạn chỗ. Điều hướng kiểm tra đường qua cửa điện, tránh hồ/cột/đệm khác và chỉ đi vào đệm đã chọn. Tư thế ngồi chờ máy chủ xác nhận; hủy/đứng dậy ngăn phản hồi cũ làm nhân vật ngồi lại. Ảnh kiểm tra mới ở `.impeccable/review/grounds/`.
