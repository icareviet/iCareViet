<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/app/bootstrap.php';
$command=$argv[1]??'help';
if ($command==='reports') { echo json_encode(query('SELECT r.id,r.message_id,m.body,u.name FROM reports r JOIN messages m ON m.id=r.message_id JOIN users u ON u.id=m.user_id WHERE m.deleted=0 ORDER BY r.created_at DESC LIMIT 100')->fetchAll(),JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE); }
elseif($command==='feedback') { echo json_encode(query('SELECT f.body,f.created_at,u.name FROM feedback f JOIN users u ON u.id=f.user_id ORDER BY f.created_at DESC LIMIT 100')->fetchAll(),JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE); }
elseif($command==='direct-reports') { echo json_encode(query('SELECT r.id,r.message_id,m.body,u.name FROM direct_reports r JOIN direct_messages m ON m.id=r.message_id JOIN users u ON u.id=m.sender_id WHERE m.deleted=0 ORDER BY r.created_at DESC LIMIT 100')->fetchAll(),JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE); }
elseif($command==='hide-direct'&&isset($argv[2])&&ctype_digit($argv[2])) { query('UPDATE direct_messages SET deleted=1 WHERE id=?',[(int)$argv[2]]);echo "Direct message hidden.\n"; }
elseif($command==='hide-message'&&isset($argv[2])&&ctype_digit($argv[2])) { query('UPDATE messages SET deleted=1 WHERE id=?',[(int)$argv[2]]); echo "Message hidden.\n"; }
elseif($command==='mute'&&isset($argv[2])) { $hours=max(1,min(720,(int)($argv[3]??24)));query('UPDATE users SET muted_until=? WHERE id=?',[time()+$hours*3600,$argv[2]]);echo "Mute updated.\n"; }
else { echo "Commands: reports | direct-reports | feedback | hide-message <id> | hide-direct <id> | mute <user-id> [hours]\n"; }
