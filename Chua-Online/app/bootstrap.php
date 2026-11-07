<?php
declare(strict_types=1);
require_once __DIR__ . '/catalog.php';
date_default_timezone_set('Asia/Ho_Chi_Minh');
ini_set('display_errors', '0');
ini_set('log_errors', '1');
$storage = getenv('APP_STORAGE') ?: dirname(__DIR__) . '/storage';
if (!is_dir($storage)) { mkdir($storage, 0700, true); }
if (!is_dir($storage . '/sessions')) { mkdir($storage . '/sessions', 0700, true); }
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
if (getenv('TRUST_PROXY') === '1' && ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') { $secure = true; }
if (PHP_SAPI !== 'cli' && (getenv('APP_ENV') ?: 'production') === 'production' && !$secure) {
    http_response_code(503); exit('Vui lòng cấu hình HTTPS trước khi mở website.');
}
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
if ($secure) { header('Strict-Transport-Security: max-age=31536000'); }
if (session_status() !== PHP_SESSION_ACTIVE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_save_path($storage . '/sessions');
    session_name('chua_session');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
    session_start();
}
if (isset($_SESSION['touched']) && time() - $_SESSION['touched'] > 7200) { $_SESSION = []; session_regenerate_id(true); }
$_SESSION['touched'] = time();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
class ApiError extends RuntimeException { public function __construct(string $message, public int $status = 400) { parent::__construct($message); } }
function database(): PDO {
    static $db;
    global $storage;
    if ($db) { return $db; }
    $db = new PDO('sqlite:' . $storage . '/temple.sqlite', null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $db->exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
    $db->exec(file_get_contents(__DIR__ . '/schema.sql'));
    return $db;
}
function query(string $sql, array $params = []): PDOStatement { $statement = database()->prepare($sql); $statement->execute($params); return $statement; }
function uid(): string { return bin2hex(random_bytes(16)); }
function output(array $value, int $code = 200): never { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); echo json_encode($value, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR); exit; }
function fail(string $message, int $code = 400): never { throw new ApiError($message, $code); }
function text_value(mixed $value, int $min, int $max, string $label): string {
    if (!is_string($value)) { fail($label . ' không hợp lệ.'); }
    $value = trim($value);
    if (!mb_check_encoding($value, 'UTF-8') || mb_strlen($value) < $min || mb_strlen($value) > $max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $value)) { fail($label . " cần từ $min đến $max ký tự."); }
    return $value;
}
function current_user(bool $required = true): ?array {
    $user = isset($_SESSION['user_id']) ? query('SELECT * FROM users WHERE id=?', [$_SESSION['user_id']])->fetch() : false;
    if (!$user && $required) { fail('Vui lòng vào chùa trước.', 401); }
    return $user ?: null;
}
function public_user(array $u): array {
    unset($u['password_hash']);
    $u['appearance'] = json_decode($u['appearance'], true);
    $u['settings'] = json_decode($u['settings'], true);
    $u['guest'] = $u['email'] === null;
    $u['jade'] = (int)$u['jade']; $u['points'] = (int)$u['points'];
    $seat=query('SELECT seat_id,phase FROM seat_claims WHERE user_id=? AND room=? AND expires_at>?',[$u['id'],$u['room'],time()])->fetch();
    $u['seatId']=$seat&&$seat['phase']==='seated'?$seat['seat_id']:null;
    if(!$u['seatId']&&$u['state']==='seated')$u['state']='idle';
    return $u;
}
function world_layout(): array { static $layout; return $layout??=json_decode(file_get_contents(__DIR__.'/world-layout.json'),true,32,JSON_THROW_ON_ERROR); }
function seat_catalog(): array {
    static $seats;
    if($seats!==null)return $seats;
    $seats=[];$layout=world_layout();
    foreach($layout['cushions']['x'] as $column=>$x)foreach($layout['cushions']['z'] as $row=>$z){$seatId=chr(97+$row).($column+1);$seats[$seatId]=['id'=>$seatId,'x'=>$x,'z'=>$z];}
    return $seats;
}
function clean_seats(): void {query('DELETE FROM seat_claims WHERE expires_at<=? OR user_id IN (SELECT id FROM users WHERE last_seen<?)',[time(),time()-35]);}
function seat_list(string $room): array {return query('SELECT s.seat_id AS id,s.user_id AS userId,s.phase,u.name FROM seat_claims s JOIN users u ON u.id=s.user_id WHERE s.room=? AND s.expires_at>? AND u.last_seen>?',[$room,time(),time()-35])->fetchAll();}
function rate_limit(string $scope, int $maximum, int $seconds): void {
    $key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'cli') . ':' . $scope);
    $bucket = (int)floor(time() / $seconds);
    query('INSERT INTO limits (key,bucket,hits) VALUES (?,?,1) ON CONFLICT(key,bucket) DO UPDATE SET hits=hits+1', [$key,$bucket]);
    $hits = query('SELECT hits FROM limits WHERE key=? AND bucket=?', [$key,$bucket])->fetchColumn();
    if ($hits > $maximum) { header('Retry-After: ' . $seconds); fail('Bạn thao tác quá nhanh. Vui lòng thử lại sau.', 429); }
    if (random_int(1,100) === 1) { query('DELETE FROM limits WHERE bucket < ? AND key=?', [$bucket-2,$key]); }
}
function room_exists(string $id): bool { return in_array($id, array_column(rooms(), 'id'), true); }
function room_list(): array { return array_map(function ($r) { $r['online'] = (int)query('SELECT COUNT(*) FROM users WHERE room=? AND last_seen>?', [$r['id'],time()-30])->fetchColumn(); return $r; }, rooms()); }
function task_status(string $id): array {
    $day = date('Y-m-d');
    return array_map(function ($task) use ($id,$day) {
        $column = $task['kind'] === 'meditation' ? 'seconds' : 'amount';
        $task['progress'] = (int)query("SELECT COALESCE(SUM($column),0) FROM practices WHERE user_id=? AND kind=? AND day=?", [$id,$task['kind'],$day])->fetchColumn();
        $task['claimed'] = (bool)query('SELECT 1 FROM claims WHERE user_id=? AND task=? AND day=?',[$id,$task['id'],$day])->fetchColumn();
        return $task;
    }, tasks());
}
function snapshot(): array {
    $u = current_user(false);
    return ['csrf'=>$_SESSION['csrf'],'user'=>$u ? public_user($u) : null,'rooms'=>room_list(),'catalog'=>catalog(),'sutras'=>sutras(),'tasks'=>$u ? task_status($u['id']) : tasks(), 'inventory'=>$u ? query('SELECT item,quantity FROM inventory WHERE user_id=?',[$u['id']])->fetchAll() : [],'seats'=>$u?seat_list($u['room']):[],'serverTime'=>time()];
}
function transaction(callable $fn): mixed { $db=database(); $db->beginTransaction(); try { $result=$fn(); $db->commit(); return $result; } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; } }
