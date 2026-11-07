<?php
declare(strict_types=1);
require dirname(__DIR__) . '/app/bootstrap.php';
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $route = $_GET['route'] ?? 'bootstrap';
    if (!is_string($route)) { fail('Đường dẫn không hợp lệ.',404); }
    $data = [];
    if ($method === 'POST') {
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) { fail('Nội dung quá lớn.',413); }
        if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) { fail('Yêu cầu JSON.',415); }
        $data = json_decode(file_get_contents('php://input', false, null, 0, 16385), true, 16, JSON_THROW_ON_ERROR);
        if (!is_array($data)) { fail('Dữ liệu không hợp lệ.'); }
        if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) { fail('Phiên truy cập đã thay đổi. Vui lòng tải lại trang.',403); }
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        if ($origin && parse_url($origin, PHP_URL_HOST) !== explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]) { fail('Nguồn yêu cầu không hợp lệ.',403); }
    } elseif ($method !== 'GET') { header('Allow: GET, POST'); fail('Phương thức không hỗ trợ.',405); }
    $posts = ['guest','register','login','logout','profile','enter','pulse','seat/claim','seat/sit','seat/release','practice/start','practice/tick','practice/finish','shop/buy','offer','message','message/delete','report','lantern','tasks/claim','school','feedback','direct/send','direct/read','direct/delete','direct/report','user/block'];
    if (in_array($route,$posts,true) && $method !== 'POST') { fail('Cần dùng POST.',405); }
    if (!in_array($route,$posts,true) && $method !== 'GET') { fail('Cần dùng GET.',405); }
    if ($route === 'bootstrap') { output(snapshot()); }
    if ($route === 'guest') {
        if (current_user(false)) { output(snapshot()); }
        rate_limit('guest',30,3600);
        $name = text_value($data['name'] ?? 'An Nhiên',2,30,'Pháp danh');
        $id=uid();
        query('INSERT INTO users (id,name,x,z,created_at) VALUES (?,?,?,?,?)',[$id,$name,world_layout()['spawn']['x'],world_layout()['spawn']['z'],time()]);
        foreach (['incense'=>3,'flower'=>2,'candle'=>2,'lantern'=>1] as $item=>$quantity) { query('INSERT INTO inventory VALUES (?,?,?)',[$id,$item,$quantity]); }
        session_regenerate_id(true); $_SESSION['user_id']=$id; $_SESSION['csrf']=uid().uid(); output(snapshot(),201);
    }
    if ($route === 'register') {
        rate_limit('register',10,3600);
        $email = mb_strtolower(text_value($data['email']??'',3,254,'Email'));
        if (!filter_var($email,FILTER_VALIDATE_EMAIL)) fail('Email không hợp lệ.');
        $password = $data['password'] ?? '';
        if (!is_string($password) || strlen($password)<10 || strlen($password)>72) fail('Mật khẩu cần từ 10 đến 72 byte.');
        $name=text_value($data['name']??'An Nhiên',2,30,'Pháp danh');
        if (query('SELECT 1 FROM users WHERE email=?',[$email])->fetchColumn()) fail('Email này đã được đăng ký.',409);
        $hash=password_hash($password,defined('PASSWORD_ARGON2ID')?PASSWORD_ARGON2ID:PASSWORD_DEFAULT);
        $u=current_user(false);
        if ($u && $u['email'] !== null) fail('Bạn đã đăng nhập.',409);
        transaction(function () use ($u,$email,$hash,$name) {
            if ($u) { query('UPDATE users SET email=?,password_hash=?,name=? WHERE id=?',[$email,$hash,$name,$u['id']]); }
            else { $id=uid(); query('INSERT INTO users (id,email,password_hash,name,z,created_at) VALUES (?,?,?,?,?,?)',[$id,$email,$hash,$name,world_layout()['spawn']['z'],time()]); $_SESSION['user_id']=$id; foreach (['incense'=>3,'flower'=>2,'candle'=>2,'lantern'=>1] as $item=>$qty) query('INSERT INTO inventory VALUES (?,?,?)',[$id,$item,$qty]); }
        });
        session_regenerate_id(true); $_SESSION['csrf']=uid().uid(); output(snapshot(),201);
    }
    if ($route === 'login') {
        rate_limit('login',12,900);
        $email=mb_strtolower(text_value($data['email']??'',3,254,'Email'));
        $password=$data['password']??'';
        if (!is_string($password) || strlen($password)>72) fail('Email hoặc mật khẩu chưa đúng.',401);
        $u=query('SELECT * FROM users WHERE email=?',[$email])->fetch();
        $hash=$u['password_hash']??'$2y$12$Bf7VGdpw7jM3AvJszAWlYep1JO69KtEmzUQsr7thzPiXJx.NPuIXG';
        $valid=password_verify($password,$hash);
        if (!$u || !$valid) fail('Email hoặc mật khẩu chưa đúng.',401);
        session_regenerate_id(true); $_SESSION['user_id']=$u['id']; $_SESSION['csrf']=uid().uid(); output(snapshot());
    }
    if ($route === 'logout') { if ($u=current_user(false)){query('DELETE FROM seat_claims WHERE user_id=?',[$u['id']]);query('UPDATE users SET last_seen=0 WHERE id=?',[$u['id']]);} $_SESSION=[]; session_regenerate_id(true); $_SESSION['csrf']=uid().uid(); output(snapshot()); }
    $u=current_user(); $id=$u['id'];
    if($route==='member'||$route==='user/block'||str_starts_with($route,'direct/'))require dirname(__DIR__).'/app/social.php';
    if ($route === 'profile') {
        $name=text_value($data['name']??$u['name'],2,30,'Pháp danh');
        $appearance=$data['appearance']??json_decode($u['appearance'],true);
        if (!is_array($appearance)) fail('Nhân vật không hợp lệ.');
        foreach (['robe','skin'] as $color) if (!preg_match('/^#[a-fA-F0-9]{6}$/',$appearance[$color]??'')) fail('Màu nhân vật không hợp lệ.');
        $settings=$data['settings']??json_decode($u['settings'],true);
        if (!is_array($settings)) fail('Cài đặt không hợp lệ.');
        $clean=['sound'=>(bool)($settings['sound']??true),'volume'=>max(0,min(1,(float)($settings['volume']??0.35))),'quality'=>in_array($settings['quality']??'auto',['auto','low','high'])?($settings['quality']??'auto'):'auto','reducedMotion'=>(bool)($settings['reducedMotion']??false)];
        query('UPDATE users SET name=?,appearance=?,settings=? WHERE id=?',[$name,json_encode(['robe'=>$appearance['robe'],'skin'=>$appearance['skin']]),json_encode($clean),$id]); output(snapshot());
    }
    if ($route === 'enter') {
        $room=$data['room']??''; if (!is_string($room)||!room_exists($room)) fail('Không tìm thấy chùa.');
        transaction(function() use($room,$u,$id) { $count=(int)query('SELECT COUNT(*) FROM users WHERE room=? AND last_seen>? AND id<>?',[$room,time()-30,$id])->fetchColumn(); if ($count>=80) fail('Chùa đã đủ người. Vui lòng chọn chùa khác.',409);if($room!==$u['room']){query('DELETE FROM seat_claims WHERE user_id=?',[$id]);$spawn=world_layout()['spawn'];query('UPDATE users SET room=?,last_seen=?,x=?,z=?,state=\'idle\' WHERE id=?',[$room,time(),$spawn['x'],$spawn['z'],$id]);}else query('UPDATE users SET last_seen=? WHERE id=?',[time(),$id]); }); output(snapshot());
    }
    if(in_array($route,['seat/claim','seat/sit','seat/release'],true)){
        rate_limit('seat:'.$id,40,60);
        $seatId=$data['seatId']??null;$seats=seat_catalog();
        if(!is_string($seatId)||!isset($seats[$seatId]))fail('Không tìm thấy đệm thiền.');
        transaction(function()use($route,$seatId,$seats,$u,$id,$data){
            // Acquire the write lock before checking occupancy: two claims cannot win.
            query('UPDATE users SET last_seen=? WHERE id=?',[time(),$id]);clean_seats();
            if($route==='seat/release'){$released=query('DELETE FROM seat_claims WHERE user_id=? AND seat_id=?',[$id,$seatId])->rowCount();if($released&&$u['state']==='seated')query('UPDATE users SET state=\'idle\' WHERE id=?',[$id]);return;}
            $claim=query('SELECT * FROM seat_claims WHERE room=? AND seat_id=?',[$u['room'],$seatId])->fetch();
            if($route==='seat/claim'){
                if($claim&&$claim['user_id']!==$id)fail('Đệm này đã có người chọn. Bạn hãy chọn đệm khác.',409);
                query('DELETE FROM seat_claims WHERE user_id=?',[$id]);query('INSERT INTO seat_claims VALUES (?,?,?,?,?)',[$u['room'],$seatId,$id,'reserved',time()+45]);query('UPDATE users SET state=\'idle\' WHERE id=?',[$id]);return;
            }
            if(!$claim||$claim['user_id']!==$id)fail('Chỗ ngồi đã hết thời gian giữ. Bạn hãy chọn lại đệm.',409);
            $seat=$seats[$seatId];$px=$data['x']??$u['x'];$pz=$data['z']??$u['z'];
            if(!is_numeric($px)||!is_numeric($pz)||!is_finite((float)$px)||!is_finite((float)$pz))fail('Vị trí ngồi không hợp lệ.');
            if(hypot((float)$px-$seat['x'],(float)$pz-$seat['z'])>.85)fail('Nhân vật cần đi đến đệm trước khi ngồi.',409);
            query('UPDATE seat_claims SET phase=\'seated\',expires_at=? WHERE user_id=?',[time()+45,$id]);query('UPDATE users SET x=?,z=?,state=\'seated\' WHERE id=?',[$seat['x'],$seat['z'],$id]);
        });output(array_merge(snapshot(),['seatId'=>$seatId]));
    }
    if ($route === 'pulse') {
        rate_limit('pulse:'.$id,180,60);
        $x=$data['x']??0; $z=$data['z']??12;
        if (!is_numeric($x)||!is_numeric($z)||!is_finite((float)$x)||!is_finite((float)$z)) fail('Vị trí không hợp lệ.');
        $state=in_array($data['state']??'idle',['idle','walk','bow','meditation','beads','chant','seated'])?($data['state']??'idle'):'idle';$bounds=world_layout()['bounds'];$x=max($bounds['left'],min($bounds['right'],(float)$x));$z=max($bounds['back'],min($bounds['front'],(float)$z));
        $ownSeat=transaction(function()use($id,$u,$data,$state,$x,$z){
            query('UPDATE users SET last_seen=? WHERE id=?',[time(),$id]);clean_seats();
            $claim=query('SELECT * FROM seat_claims WHERE user_id=? AND room=?',[$id,$u['room']])->fetch();
            if($claim&&($data['releaseSeatId']??null)===$claim['seat_id']){query('DELETE FROM seat_claims WHERE user_id=?',[$id]);$claim=false;}
            if($claim&&$claim['phase']==='seated'){
                if(!in_array($state,['walk','bow'],true)){$seat=seat_catalog()[$claim['seat_id']];$x=$seat['x'];$z=$seat['z'];if($state==='idle')$state='seated';}
                else{query('DELETE FROM seat_claims WHERE user_id=?',[$id]);$claim=false;}
            }
            if($state==='seated'&&(!$claim||$claim['phase']!=='seated'))$state='idle';
            if($claim)query('UPDATE seat_claims SET expires_at=? WHERE user_id=?',[time()+45,$id]);
            query('UPDATE users SET last_seen=?,x=?,z=?,state=? WHERE id=?',[time(),$x,$z,$state,$id]);
            return $claim?['id'=>$claim['seat_id'],'phase'=>$claim['phase']]:null;
        });
        $peers=query('SELECT u.id,u.name,u.appearance,u.x,u.z,u.state,CASE WHEN s.phase=\'seated\' THEN s.seat_id END AS seatId FROM users u LEFT JOIN seat_claims s ON s.user_id=u.id AND s.room=u.room AND s.expires_at>? WHERE u.room=? AND u.last_seen>? AND u.id<>? LIMIT 80',[time(),$u['room'],time()-30,$id])->fetchAll();
        foreach ($peers as &$peer) $peer['appearance']=json_decode($peer['appearance'],true);
        output(['room'=>$u['room'],'seat'=>$ownSeat,'seats'=>seat_list($u['room']),'peers'=>$peers,'online'=>count($peers)+1,'inboxUnread'=>(int)query('SELECT COUNT(*) FROM direct_messages WHERE recipient_id=? AND deleted=0 AND read_at IS NULL',[$id])->fetchColumn(),'lanterns'=>query('SELECT l.id,l.body,u.name FROM lanterns l JOIN users u ON u.id=l.user_id WHERE l.room=? AND l.created_at>? ORDER BY l.created_at DESC LIMIT 20',[$u['room'],time()-86400])->fetchAll()]);
    }
    if ($route === 'practice/start') {
        rate_limit('practice:'.$id,60,60);
        $kind=$data['kind']??''; if (!in_array($kind,['beads','bow','chant','meditation'],true)) fail('Hoạt động không hợp lệ.');
        $session=uid(); query('UPDATE practice_sessions SET finished=1 WHERE user_id=? AND finished=0',[$id]); query('INSERT INTO practice_sessions (id,user_id,kind,started_at) VALUES (?,?,?,?)',[$session,$id,$kind,time()]); output(['id'=>$session,'startedAt'=>time()]);
    }
    if ($route === 'practice/tick' || $route === 'practice/finish') {
        rate_limit('ticks:'.$id,240,60);
        $practiceId=text_value($data['id']??'',32,32,'Phiên tu tập');
        $result=transaction(function() use($practiceId,$id,$route,$data) {
            $p=query('SELECT * FROM practice_sessions WHERE id=? AND user_id=?',[$practiceId,$id])->fetch();
            if (!$p || $p['finished']) fail('Phiên tu tập đã kết thúc.',409);
            $elapsed=min(3600,time()-(int)$p['started_at']);
            if ($route==='practice/finish') {
                query('UPDATE practice_sessions SET finished=1 WHERE id=?',[$practiceId]);
                if ($p['kind']==='meditation' && $elapsed>=1) { query('INSERT INTO practices VALUES (?,?,?,?,?,?,?)',[uid(),$id,'meditation',1,$elapsed,date('Y-m-d'),time()]); $bonus=(int)floor($elapsed/60); query('UPDATE users SET points=points+?,jade=jade+? WHERE id=?',[$bonus,$bonus,$id]); }
                return ['seconds'=>$elapsed];
            }
            if ($p['kind']==='meditation') fail('Thiền định được ghi nhận khi kết thúc.');
            $nonce=text_value($data['nonce']??'',16,64,'Mã thao tác');
            if (query('SELECT 1 FROM practices WHERE id=? AND user_id=?',[$nonce,$id])->fetchColumn()) return ['duplicate'=>true];
            $cooldown=$p['kind']==='bow'?1.5:0.12;
            if (microtime(true)-(float)$p['last_tick']<$cooldown) fail('Hãy chậm lại một nhịp.',429);
            query('INSERT INTO practices VALUES (?,?,?,?,?,?,?)',[$nonce,$id,$p['kind'],1,0,date('Y-m-d'),time()]); query('UPDATE practice_sessions SET last_tick=? WHERE id=?',[microtime(true),$practiceId]); query('UPDATE users SET points=points+1 WHERE id=?',[$id]); return ['accepted'=>true];
        }); output(array_merge($result,['user'=>public_user(current_user()),'tasks'=>task_status($id)]));
    }
    if ($route === 'shop/buy') {
        rate_limit('buy:'.$id,30,60);
        $item=null; foreach(catalog() as $entry) if($entry['id']===($data['item']??null)) $item=$entry;
        if (!$item) fail('Vật phẩm không tồn tại.');
        transaction(function() use($item,$id) { $row=query('UPDATE users SET jade=jade-? WHERE id=? AND jade>=?',[$item['price'],$id,$item['price']]); if (!$row->rowCount()) fail('Bạn chưa đủ Ngọc. Hoàn thành công quả để nhận thêm.',409); query('INSERT INTO inventory VALUES (?,?,1) ON CONFLICT(user_id,item) DO UPDATE SET quantity=quantity+1',[$id,$item['id']]); }); output(snapshot());
    }
    if ($route === 'offer' || $route === 'lantern') {
        rate_limit('offer:'.$id,15,60);
        $item=$route==='lantern'?'lantern':($data['item']??''); if(!in_array($item,['incense','flower','candle','lantern'],true)) fail('Lễ vật không hợp lệ.');
        $body=$item==='lantern'?text_value($data['body']??'',2,240,'Lời nguyện'):'';
        $lanternId=$item==='lantern'?uid():null;
        transaction(function() use($item,$body,$id,$u,$lanternId) { if(!query('UPDATE inventory SET quantity=quantity-1 WHERE user_id=? AND item=? AND quantity>0',[$id,$item])->rowCount()) fail('Túi đồ đã hết vật phẩm này. Bạn có thể thỉnh thêm ở cửa hàng.',409); query('INSERT INTO offerings VALUES (?,?,?,?,?)',[uid(),$id,$u['room'],$item,time()]); if($item==='lantern') query('INSERT INTO lanterns VALUES (?,?,?,?,?)',[$lanternId,$id,$u['room'],$body,time()]); }); output(array_merge(snapshot(),['lanternId'=>$lanternId]));
    }
    if ($route === 'messages') { output(['messages'=>query('SELECT m.id,m.user_id,m.body,m.created_at,u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE m.room=? AND m.deleted=0 ORDER BY m.id DESC LIMIT 60',[$u['room']])->fetchAll()]); }
    if ($route === 'message') {
        rate_limit('chat:'.$id,12,60); if($u['muted_until']>time()) fail('Tài khoản đang tạm ngưng gửi tin nhắn.',403);
        $body=text_value($data['body']??'',1,300,'Tin nhắn'); query('INSERT INTO messages (user_id,room,body,created_at) VALUES (?,?,?,?)',[$id,$u['room'],$body,time()]); output(['ok'=>true],201);
    }
    if ($route === 'message/delete') { $messageId=filter_var($data['id']??null,FILTER_VALIDATE_INT); if(!$messageId) fail('Tin nhắn không hợp lệ.'); query('UPDATE messages SET deleted=1 WHERE id=? AND user_id=?',[$messageId,$id]); output(['ok'=>true]); }
    if ($route === 'report') { rate_limit('report:'.$id,10,3600); $messageId=filter_var($data['id']??null,FILTER_VALIDATE_INT); if(!$messageId||!query('SELECT 1 FROM messages WHERE id=? AND room=?',[$messageId,$u['room']])->fetchColumn()) fail('Không tìm thấy tin nhắn.'); query('INSERT OR IGNORE INTO reports VALUES (?,?,?,?)',[uid(),$id,$messageId,time()]); output(['ok'=>true]); }
    if ($route === 'leaderboard') { output(['users'=>query('SELECT name,points,school FROM users ORDER BY points DESC,created_at LIMIT 30')->fetchAll()]); }
    if ($route === 'history') { output(['practices'=>query('SELECT kind,SUM(amount) AS amount,SUM(seconds) AS seconds,day FROM practices WHERE user_id=? GROUP BY day,kind ORDER BY day DESC LIMIT 60',[$id])->fetchAll()]); }
    if ($route === 'tasks/claim') {
        $task=null; foreach(task_status($id) as $entry) if($entry['id']===($data['task']??'')) $task=$entry;
        if(!$task||$task['claimed']||$task['progress']<$task['target']) fail('Công quả chưa hoàn thành hoặc đã nhận thưởng.',409);
        transaction(function() use($task,$id) { if(!query('INSERT OR IGNORE INTO claims VALUES (?,?,?)',[$id,$task['id'],date('Y-m-d')])->rowCount()) fail('Bạn đã nhận thưởng hôm nay.',409); query('UPDATE users SET jade=jade+? WHERE id=?',[$task['reward'],$id]); }); output(snapshot());
    }
    if ($route === 'school') {
        $school=$data['school']??''; if(!in_array($school,['Tịnh Độ','Thiền Tông','Mật Tông'],true)) fail('Thiền phái không hợp lệ.');
        transaction(function() use($school,$id) { $row=query('SELECT school FROM users WHERE id=?',[$id])->fetch(); if($row['school']===$school) return; $price=$row['school']===''?0:20; if(!query('UPDATE users SET school=?,jade=jade-? WHERE id=? AND jade>=?',[$school,$price,$id,$price])->rowCount()) fail('Cần 20 Ngọc để đổi thiền phái.',409); }); output(snapshot());
    }
    if ($route === 'feedback') { rate_limit('feedback:'.$id,5,3600); query('INSERT INTO feedback VALUES (?,?,?,?)',[uid(),$id,text_value($data['body']??'',10,2000,'Góp ý'),time()]); output(['ok'=>true],201); }
    fail('Không tìm thấy chức năng.',404);
} catch (ApiError $e) { output(['error'=>$e->getMessage()],$e->status); }
catch (JsonException $e) { output(['error'=>'Dữ liệu JSON không hợp lệ.'],400); }
catch (Throwable $e) { error_log((string)$e); output(['error'=>'Hệ thống đang bận. Vui lòng thử lại sau.'],500); }
