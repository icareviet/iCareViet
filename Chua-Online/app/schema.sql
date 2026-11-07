CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT NOT NULL,
 appearance TEXT NOT NULL DEFAULT '{"robe":"#747d69","skin":"#bb8963"}',
 settings TEXT NOT NULL DEFAULT '{"sound":true,"volume":0.35,"quality":"auto","reducedMotion":false}',
 points INTEGER NOT NULL DEFAULT 0 CHECK(points>=0), jade INTEGER NOT NULL DEFAULT 30 CHECK(jade>=0),
 room TEXT NOT NULL DEFAULT 'an-lac', school TEXT NOT NULL DEFAULT '',
 x REAL NOT NULL DEFAULT 0, z REAL NOT NULL DEFAULT 12, state TEXT NOT NULL DEFAULT 'idle',
 created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL DEFAULT 0, muted_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS inventory (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,item TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>=0),PRIMARY KEY(user_id,item));
CREATE TABLE IF NOT EXISTS practices (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,amount INTEGER NOT NULL DEFAULT 1,seconds INTEGER NOT NULL DEFAULT 0,day TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS practices_user_day ON practices(user_id,day,kind);
CREATE TABLE IF NOT EXISTS practice_sessions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,started_at INTEGER NOT NULL,last_tick REAL NOT NULL DEFAULT 0,finished INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS active_practices ON practice_sessions(user_id,finished);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL REFERENCES users(id),room TEXT NOT NULL,body TEXT NOT NULL,created_at INTEGER NOT NULL,deleted INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS messages_room ON messages(room,id);
CREATE TABLE IF NOT EXISTS lanterns (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),room TEXT NOT NULL,body TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS offerings (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),room TEXT NOT NULL,item TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS claims (user_id TEXT NOT NULL REFERENCES users(id),task TEXT NOT NULL,day TEXT NOT NULL,PRIMARY KEY(user_id,task,day));
CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),body TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),message_id INTEGER NOT NULL REFERENCES messages(id),created_at INTEGER NOT NULL,UNIQUE(user_id,message_id));
CREATE TABLE IF NOT EXISTS limits (key TEXT NOT NULL,bucket INTEGER NOT NULL,hits INTEGER NOT NULL,PRIMARY KEY(key,bucket));
CREATE TABLE IF NOT EXISTS direct_messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 sender_id TEXT NOT NULL REFERENCES users(id), recipient_id TEXT NOT NULL REFERENCES users(id),
 body TEXT NOT NULL, created_at INTEGER NOT NULL, read_at INTEGER, deleted INTEGER NOT NULL DEFAULT 0,
 CHECK(sender_id<>recipient_id)
);
CREATE INDEX IF NOT EXISTS direct_recipient ON direct_messages(recipient_id,id);
CREATE INDEX IF NOT EXISTS direct_sender ON direct_messages(sender_id,id);
CREATE TABLE IF NOT EXISTS direct_reports (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),message_id INTEGER NOT NULL REFERENCES direct_messages(id),created_at INTEGER NOT NULL,UNIQUE(user_id,message_id));
CREATE TABLE IF NOT EXISTS user_blocks (user_id TEXT NOT NULL REFERENCES users(id),blocked_id TEXT NOT NULL REFERENCES users(id),created_at INTEGER NOT NULL,PRIMARY KEY(user_id,blocked_id),CHECK(user_id<>blocked_id));
CREATE TABLE IF NOT EXISTS seat_claims (
 room TEXT NOT NULL, seat_id TEXT NOT NULL,
 user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 phase TEXT NOT NULL CHECK(phase IN ('reserved','seated')), expires_at INTEGER NOT NULL,
 PRIMARY KEY(room,seat_id)
);
