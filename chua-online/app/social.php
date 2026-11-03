<?php
declare(strict_types=1);

function member_id(mixed $value): string {
    if(!is_string($value)||!preg_match('/^[a-f0-9]{32}$/D',$value))fail('Không tìm thấy đạo hữu.',404);
    if(!query('SELECT 1 FROM users WHERE id=?',[$value])->fetchColumn())fail('Không tìm thấy đạo hữu.',404);
    return $value;
}
function member_profile(string $member,string $viewer): array {
    $p=query('SELECT id,name,appearance,school,points,created_at,room,last_seen FROM users WHERE id=?',[$member])->fetch();
    if(!$p)fail('Không tìm thấy đạo hữu.',404);
    $online=$p['last_seen']>time()-30;
    $stats=['bow'=>0,'beads'=>0,'chant'=>0,'meditation'=>0];
    foreach(query('SELECT kind,SUM(amount) AS amount,SUM(seconds) AS seconds FROM practices WHERE user_id=? GROUP BY kind',[$member])->fetchAll() as $row)$stats[$row['kind']]=(int)($row['kind']==='meditation'?$row['seconds']:$row['amount']);
    return ['id'=>$p['id'],'name'=>$p['name'],'appearance'=>json_decode($p['appearance'],true),'school'=>$p['school'],'points'=>(int)$p['points'],'joined'=>date('Y-m-d',$p['created_at']),'online'=>$online,'room'=>$online?$p['room']:null,'stats'=>$stats,'blocked'=>(bool)query('SELECT 1 FROM user_blocks WHERE user_id=? AND blocked_id=?',[$viewer,$member])->fetchColumn()];
}
function direct_blocked(string $a,string $b): bool {return (bool)query('SELECT 1 FROM user_blocks WHERE (user_id=? AND blocked_id=?) OR (user_id=? AND blocked_id=?)',[$a,$b,$b,$a])->fetchColumn();}

if($route==='member')output(['member'=>member_profile(member_id($_GET['id']??null),$id)]);
if($route==='direct/threads'){
    $rows=query('SELECT m.*,CASE WHEN m.sender_id=? THEN m.recipient_id ELSE m.sender_id END AS peerId FROM direct_messages m WHERE m.id IN (SELECT MAX(id) FROM direct_messages WHERE (sender_id=? OR recipient_id=?) AND deleted=0 GROUP BY CASE WHEN sender_id=? THEN recipient_id ELSE sender_id END) ORDER BY m.id DESC LIMIT 40',[$id,$id,$id,$id])->fetchAll();
    $threads=[];foreach($rows as $row){$peer=query('SELECT id,name,appearance FROM users WHERE id=?',[$row['peerId']])->fetch();$peer['appearance']=json_decode($peer['appearance'],true);$threads[]=['peer'=>$peer,'body'=>$row['body'],'createdAt'=>(int)$row['created_at'],'unread'=>(int)query('SELECT COUNT(*) FROM direct_messages WHERE sender_id=? AND recipient_id=? AND read_at IS NULL AND deleted=0',[$peer['id'],$id])->fetchColumn()];}
    output(['threads'=>$threads]);
}
if($route==='direct/messages'){
    $peer=member_id($_GET['peer']??null);
    output(['peer'=>member_profile($peer,$id),'blocked'=>direct_blocked($id,$peer),'messages'=>query('SELECT id,sender_id AS user_id,body,created_at FROM direct_messages WHERE ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)) AND deleted=0 ORDER BY id DESC LIMIT 60',[$id,$peer,$peer,$id])->fetchAll()]);
}
if($route==='direct/send'){
    rate_limit('direct:'.$id,12,60);if($u['muted_until']>time())fail('Tài khoản đang tạm ngưng gửi tin nhắn.',403);
    $peer=member_id($data['peer']??null);if($peer===$id)fail('Hãy chọn một đạo hữu khác để nhắn tin.');
    if(direct_blocked($id,$peer))fail('Cuộc trò chuyện đang bị chặn.',403);
    $body=text_value($data['body']??'',1,300,'Tin nhắn');query('INSERT INTO direct_messages(sender_id,recipient_id,body,created_at) VALUES(?,?,?,?)',[$id,$peer,$body,time()]);output(['ok'=>true],201);
}
if($route==='direct/read'){
    $peer=member_id($data['peer']??null);$through=filter_var($data['through']??null,FILTER_VALIDATE_INT);if(!$through||$through<1)fail('Tin nhắn không hợp lệ.');
    query('UPDATE direct_messages SET read_at=? WHERE recipient_id=? AND sender_id=? AND id<=? AND read_at IS NULL',[time(),$id,$peer,$through]);output(['ok'=>true]);
}
if($route==='direct/delete'||$route==='direct/report'){
    $messageId=filter_var($data['id']??null,FILTER_VALIDATE_INT);if(!$messageId)fail('Tin nhắn không hợp lệ.');
    $message=query('SELECT sender_id,recipient_id FROM direct_messages WHERE id=? AND (sender_id=? OR recipient_id=?)',[$messageId,$id,$id])->fetch();if(!$message)fail('Không tìm thấy tin nhắn.',404);
    if($route==='direct/delete'){if($message['sender_id']!==$id)fail('Bạn chỉ có thể xóa tin do mình gửi.',403);query('UPDATE direct_messages SET deleted=1 WHERE id=?',[$messageId]);}
    else{rate_limit('direct-report:'.$id,10,3600);query('INSERT OR IGNORE INTO direct_reports VALUES(?,?,?,?)',[uid(),$id,$messageId,time()]);}
    output(['ok'=>true]);
}
if($route==='user/block'){
    $peer=member_id($data['peer']??null);if($peer===$id||!is_bool($data['blocked']??null))fail('Yêu cầu chặn không hợp lệ.');rate_limit('block:'.$id,30,60);
    if($data['blocked'])query('INSERT OR IGNORE INTO user_blocks VALUES(?,?,?)',[$id,$peer,time()]);else query('DELETE FROM user_blocks WHERE user_id=? AND blocked_id=?',[$id,$peer]);
    output(['ok'=>true,'blocked'=>$data['blocked']]);
}
