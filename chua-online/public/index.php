<?php require dirname(__DIR__) . '/app/bootstrap.php'; ?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#2b1410">
  <meta name="description" content="Một không gian chùa trực tuyến để niệm Phật, lần tràng hạt, thiền định và gửi lời nguyện bình an.">
  <title>Chùa Online — Một niệm an lành</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="module" src="/assets/app.js"></script>
</head>
<body>
  <a class="skip-link" href="#practice-dock">Đến các hoạt động tu tập</a>
  <main id="temple" aria-label="Chùa Online — Không gian chùa 3D">
    <div id="scene" tabindex="0" aria-label="Đại điện. Dùng W A S D hoặc các phím mũi tên để di chuyển, kéo chuột để xoay góc nhìn."></div>
    <div id="character-names" class="accessible-names" aria-label="Pháp danh trong chùa"></div>
    <p id="scene-asset-status" class="scene-asset-status" role="status" hidden>Chưa tải được tượng Phật. Tải lại trang để thử lại.</p>
    <div id="scene-fallback" hidden><h2>Không gian tĩnh tâm</h2><p>Thiết bị này chưa hỗ trợ đồ họa 3D. Bạn vẫn có thể sử dụng đầy đủ các hoạt động tu tập bên dưới.</p></div>
    <header class="topbar">
      <div class="temple-identity">
        <button class="icon-button mobile-menu" data-action="menu" aria-label="Mở danh mục" aria-expanded="false"><i data-lucide="menu"></i></button>
        <button class="brand-mark" data-action="home" aria-label="Về chánh điện"><i data-lucide="church"></i></button>
        <div class="identity-copy"><span class="brand-name">Chùa Online</span><button class="room-name" data-action="rooms"><span id="room-name">Chùa An Lạc</span><i data-lucide="chevron-down"></i></button></div>
      </div>
      <div class="topbar-actions">
        <span class="presence" title="Số người kết nối thật trong chùa"><span></span><b id="online-count">0</b><span class="presence-word">đang ở chùa</span></span>
        <button class="balance" data-action="shop" aria-label="Ngọc và cửa hàng"><i data-lucide="gem"></i><b id="jade-count">—</b></button>
        <button class="account-button" data-action="account" aria-label="Mở tài khoản"><i data-lucide="user-round"></i><span id="account-name">Tài khoản</span></button>
      </div>
    </header>
    <nav class="side-nav" id="side-nav" aria-label="Danh mục trong chùa">
      <button data-action="home" class="nav-active"><i data-lucide="church"></i><span>Chánh điện</span></button>
      <button data-action="tasks"><i data-lucide="clipboard-list"></i><span>Công quả</span></button>
      <button data-action="inventory"><i data-lucide="backpack"></i><span>Túi đồ</span></button>
      <button data-action="shop"><i data-lucide="shopping-bag"></i><span>Cửa hàng</span></button>
      <span class="nav-divider"></span>
      <button data-action="community"><i data-lucide="users"></i><span>Cộng đồng</span></button>
      <button data-action="leaderboard"><i data-lucide="trophy"></i><span>Xếp hạng</span></button>
      <button data-action="map"><i data-lucide="map"></i><span>Bản đồ chùa</span></button>
      <button data-action="school"><i data-lucide="leaf"></i><span>Thiền phái</span></button>
      <span class="nav-divider"></span>
      <button data-action="feedback"><i data-lucide="message-circle"></i><span>Góp ý</span></button>
      <button data-action="settings"><i data-lucide="settings"></i><span>Cài đặt</span></button>
    </nav>
    <div class="location-label" id="location-label"><span class="location-rule"></span><span>Chánh điện</span><small>Nam mô A Di Đà Phật</small></div>
    <label class="camera-views"><i data-lucide="scan-eye" aria-hidden="true"></i><select id="camera-view" aria-label="Góc nhìn trong chùa"><option value="follow">Theo nhân vật</option><option value="courtyard">Sân vườn bên ngoài</option><option value="front">Chánh điện chính diện</option><option value="left">Chánh điện bên trái</option><option value="right">Chánh điện bên phải</option><option value="high">Toàn khuôn viên từ trên</option></select></label>
    <div class="seat-status" id="seat-status" hidden><span id="seat-status-text" role="status"></span><button data-action="stand" id="stand-button">Đứng dậy</button></div>
    <aside class="wish-preview" id="wish-preview" aria-label="Đèn nguyện">
      <div class="wish-heading"><i data-lucide="lamp"></i><span>Đèn nguyện</span><button class="icon-button" data-action="lanterns" aria-label="Xem đèn nguyện"><i data-lucide="arrow-right"></i></button></div>
      <p id="latest-wish">Gửi một lời nguyện bình an<br>theo ánh đèn trên hồ sen.</p>
      <button class="text-link" data-action="lanterns">Thả đèn hoa đăng <i data-lucide="arrow-right"></i></button>
    </aside>
    <section class="welcome" id="welcome" aria-labelledby="welcome-title">
      <div class="welcome-copy"><h1 id="welcome-title">Một niệm an lành.</h1><p>Gác lại những bộn bề. Về chùa, trở về với chính mình.</p></div>
      <form id="welcome-form" class="welcome-form">
        <label>Pháp danh của bạn<input name="name" id="guest-name" value="An Nhiên" minlength="2" maxlength="30" autocomplete="nickname" required></label>
        <label>Không gian tu tập<select name="room" id="welcome-room"><option value="an-lac">Chùa An Lạc</option></select></label>
        <button class="primary-button enter-button" type="submit"><i data-lucide="footprints"></i>Vào chùa<i data-lucide="arrow-right"></i></button>
      </form>
      <div class="welcome-footer"><span><i data-lucide="volume-2"></i>Đeo tai nghe để lắng nghe tiếng chuông</span><button class="text-link" data-action="account">Đăng nhập</button></div>
      <p class="form-error" id="welcome-error" role="alert"></p>
    </section>
    <div class="scene-tools"><button class="icon-button" data-action="seats" aria-label="Chọn đệm ngồi" title="Chọn đệm ngồi"><i data-lucide="armchair"></i></button><button class="icon-button" data-action="sound" id="sound-toggle" aria-label="Tắt âm thanh" aria-pressed="true"><i data-lucide="volume-2"></i></button><button class="icon-button" data-action="reset-camera" aria-label="Đặt lại góc nhìn" title="Theo nhân vật"><i data-lucide="rotate-ccw"></i></button><button class="icon-button" data-action="overview" aria-label="Xem toàn cảnh chùa" aria-pressed="false"><i data-lucide="map"></i></button><button class="icon-button" data-action="fullscreen" aria-label="Toàn màn hình"><i data-lucide="maximize"></i></button><button class="icon-button" data-action="help" aria-label="Hướng dẫn di chuyển"><i data-lucide="circle-help"></i></button></div>
    <div class="movement-hint" id="movement-hint"><span class="keycaps"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><span>Chạm lối đi để di chuyển<small>Chạm đệm vàng để ngồi · Kéo để xoay</small></span></div>
    <nav id="practice-dock" class="practice-dock" aria-label="Hoạt động tu tập">
      <button data-action="bow"><i data-lucide="hand-heart"></i><span>Lạy Phật</span></button>
      <button data-action="beads"><i data-lucide="circle-dot"></i><span>Tràng hạt</span></button>
      <button data-action="chant"><i data-lucide="book-open"></i><span>Tụng kinh</span></button>
      <span class="dock-divider"></span>
      <button data-action="meditation"><i data-lucide="leaf"></i><span>Thiền định</span></button>
      <button data-action="offer"><i data-lucide="flower-2"></i><span>Dâng lễ</span></button>
      <button data-action="bell"><i data-lucide="bell"></i><span>Thỉnh chuông</span></button>
      <button data-action="lanterns"><i data-lucide="lamp"></i><span>Hoa đăng</span></button>
    </nav>
    <div id="mobile-controls" class="mobile-controls"><button id="move-stick" class="joystick" aria-label="Cần di chuyển: kéo theo hướng muốn đi, thả tay để dừng" disabled><span class="joystick-track" aria-hidden="true"></span><span class="joystick-thumb" aria-hidden="true"><i data-lucide="move"></i></span></button><span class="joystick-label">Kéo để di chuyển</span></div>
  </main>
  <aside id="panel" class="panel" hidden aria-labelledby="panel-title"><header class="panel-header"><h2 id="panel-title"></h2><button class="icon-button" data-action="close-panel" aria-label="Đóng bảng"><i data-lucide="x"></i></button></header><div id="panel-content" class="panel-content"></div></aside>
  <div id="toast" role="status" aria-live="polite" hidden></div>
  <noscript><div class="noscript">Bạn cần bật JavaScript để sử dụng không gian chùa trực tuyến.</div></noscript>
</body>
</html>
