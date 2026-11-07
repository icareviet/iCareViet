<?php
declare(strict_types=1);
function rooms(): array { return [
    ['id'=>'an-lac','name'=>'Chùa An Lạc','caption'=>'Một khoảng lặng giữa đời thường','theme'=>'night','capacity'=>80],
    ['id'=>'truc-lam','name'=>'Thiền viện Trúc Lâm','caption'=>'Lắng nghe hơi thở, trở về bên trong','theme'=>'dawn','capacity'=>80],
    ['id'=>'tinh-tam','name'=>'Chùa Tịnh Tâm','caption'=>'Cùng nhau gieo một niệm lành','theme'=>'sunset','capacity'=>80],
]; }
function catalog(): array { return [
    ['id'=>'incense','name'=>'Nén hương','description'=>'Một nén tâm hương dâng trước Phật.','price'=>3,'icon'=>'flame'],
    ['id'=>'flower','name'=>'Hoa sen','description'=>'Dâng một đóa sen lên chánh điện.','price'=>5,'icon'=>'flower-2'],
    ['id'=>'candle','name'=>'Ngọn nến','description'=>'Thắp sáng một lời nguyện bình an.','price'=>4,'icon'=>'candle'],
    ['id'=>'lantern','name'=>'Đèn hoa đăng','description'=>'Gửi lời nguyện xuống hồ sen.','price'=>8,'icon'=>'lamp'],
    ['id'=>'robe-moss','name'=>'Áo tràng xanh rêu','description'=>'Trang phục cho nhân vật của bạn.','price'=>35,'icon'=>'shirt'],
    ['id'=>'companion','name'=>'Hươu an lành','description'=>'Một người bạn nhỏ đồng hành trong sân chùa.','price'=>60,'icon'=>'rabbit'],
]; }
function tasks(): array { return [
    ['id'=>'daily-beads','title'=>'Một vòng chánh niệm','description'=>'Lần đủ 108 hạt trong ngày.','kind'=>'beads','target'=>108,'reward'=>15],
    ['id'=>'daily-bows','title'=>'Thành tâm đảnh lễ','description'=>'Thực hiện 9 lần lạy Phật trong ngày.','kind'=>'bow','target'=>9,'reward'=>10],
    ['id'=>'daily-meditation','title'=>'Trở về hơi thở','description'=>'Dành 5 phút thiền định trong ngày.','kind'=>'meditation','target'=>300,'reward'=>20],
]; }
function sutras(): array { return [
    ['id'=>'niem-phat','title'=>'Niệm Phật','subtitle'=>'Sáu chữ hồng danh','lines'=>['Nam mô A Di Đà Phật.','Nam mô A Di Đà Phật.','Nam mô A Di Đà Phật.']],
    ['id'=>'bat-nha','title'=>'Bát Nhã Tâm Kinh','subtitle'=>'Trích đoạn · phiên âm Hán–Việt','lines'=>['Quán Tự Tại Bồ Tát, hành thâm Bát Nhã Ba La Mật Đa thời,','Chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.','Xá Lợi Tử! Sắc bất dị không, không bất dị sắc.','Sắc tức thị không, không tức thị sắc.','Thọ, tưởng, hành, thức diệc phục như thị.','Yết đế, yết đế, ba la yết đế, ba la tăng yết đế, bồ đề tát bà ha.']],
    ['id'=>'hoi-huong','title'=>'Kệ hồi hướng','subtitle'=>'Kệ nguyện truyền thống','lines'=>['Nguyện đem công đức này,','Hướng về khắp tất cả.','Đệ tử và chúng sinh,','Đều trọn thành Phật đạo.']],
]; }
