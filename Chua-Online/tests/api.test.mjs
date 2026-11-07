import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {existsSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';

let server,storage,base;let stderr='';
before(async()=>{
  storage=await mkdtemp(join(tmpdir(),'chua-online-test-'));
  const port=19000+Math.floor(Math.random()*1000);base=`http://127.0.0.1:${port}`;
  const php=process.env.PHP_BIN||(existsSync('.runtime/php/php.exe')?resolve('.runtime/php/php.exe'):'php');
  server=spawn(php,['-S',`127.0.0.1:${port}`,'-t','public','router.php'],{env:{...process.env,APP_ENV:'local',APP_STORAGE:storage},stdio:['ignore','ignore','pipe']});
  server.stderr.on('data',b=>stderr+=b);server.on('error',e=>stderr+=e.message);
  for(let i=0;i<80;i++){try{const r=await fetch(base+'/api.php');if(r.ok)return;}catch{}await delay(100);}
  throw new Error('PHP server did not become ready: '+stderr);
});
after(async()=>{
  server?.kill();await delay(100);
  if(storage){const safe=await realpath(storage),root=await realpath(tmpdir());assert.equal(dirname(safe).toLowerCase(),root.toLowerCase());assert.ok(basename(safe).startsWith('chua-online-test-'));await rm(safe,{recursive:true,force:true});}
});
class Client{
  cookie='';csrf='';
  async request(route,data,extras={},params={}){
    const r=await fetch(`${base}/api.php?${new URLSearchParams({route,...params})}`,{method:data===undefined?'GET':'POST',headers:{...(this.cookie?{Cookie:this.cookie}:{}),...(data===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':this.csrf}),...extras},body:data===undefined?undefined:JSON.stringify(data)});
    const set=r.headers.get('set-cookie');if(set)this.cookie=set.split(';')[0];
    const body=await r.json();if(body.csrf)this.csrf=body.csrf;
    return{status:r.status,body,headers:r.headers};
  }
  async guest(name='Đạo hữu thử nghiệm'){await this.request('bootstrap');return this.request('guest',{name});}
}

test('public member profiles and private conversations enforce identity, ownership and unread boundaries',async()=>{
  const a=new Client(),b=new Client(),third=new Client(),anonymous=new Client();
  const alice=(await a.guest('Khách kiểm tra một')).body.user,bob=(await b.guest('Khách kiểm tra hai')).body.user;await third.guest('Khách kiểm tra ba');
  assert.equal((await anonymous.request('member',undefined,{}, {id:alice.id})).status,401);
  const profile=await b.request('member',undefined,{}, {id:alice.id});assert.equal(profile.status,200);assert.equal(profile.body.member.name,alice.name);
  for(const field of ['email','password_hash','settings','jade','x','z','last_seen','muted_until'])assert.ok(!(field in profile.body.member));
  assert.deepEqual(profile.body.member.stats,{bow:0,beads:0,chant:0,meditation:0});assert.equal((await a.request('member',undefined,{}, {id:'../bad'})).status,404);
  assert.equal((await a.request('direct/send',{peer:bob.id,body:'Xin chào'},{'X-CSRF-Token':''})).status,403);assert.equal((await a.request('direct/send')).status,405);
  assert.equal((await a.request('direct/send',{peer:alice.id,body:'Tự gửi'})).status,400);assert.equal((await a.request('direct/send',{peer:bob.id,body:' '})).status,400);
  const body='<img src=x onerror=alert(1)> chỉ là văn bản';assert.equal((await a.request('direct/send',{peer:bob.id,body})).status,201);
  let received=(await b.request('direct/messages',undefined,{}, {peer:alice.id})).body;assert.equal(received.messages.length,1);assert.equal(received.messages[0].body,body);const message=received.messages[0];
  assert.equal((await third.request('direct/messages',undefined,{}, {peer:alice.id})).body.messages.length,0);
  assert.equal((await third.request('direct/report',{id:message.id})).status,404);assert.equal((await b.request('direct/delete',{id:message.id})).status,403);
  assert.equal((await third.request('direct/read',{peer:alice.id,through:message.id})).status,200);assert.equal((await b.request('pulse',{})).body.inboxUnread,1);
  assert.equal((await b.request('direct/read',{peer:alice.id,through:message.id})).status,200);assert.equal((await b.request('pulse',{})).body.inboxUnread,0);
  assert.equal((await b.request('direct/threads')).body.threads[0].peer.id,alice.id);assert.equal((await third.request('direct/threads')).body.threads.length,0);
  await b.request('enter',{room:'truc-lam'});assert.equal((await b.request('direct/messages',undefined,{}, {peer:alice.id})).body.messages.length,1);
  assert.equal((await b.request('direct/report',{id:message.id})).status,200);assert.equal((await a.request('direct/delete',{id:message.id})).status,200);assert.equal((await b.request('direct/messages',undefined,{}, {peer:alice.id})).body.messages.length,0);
  assert.equal((await b.request('user/block',{peer:alice.id,blocked:true})).status,200);assert.equal((await b.request('member',undefined,{}, {id:alice.id})).body.member.blocked,true);
  assert.equal((await a.request('direct/send',{peer:bob.id,body:'Đã chặn'})).status,403);assert.equal((await b.request('direct/send',{peer:alice.id,body:'Đã chặn'})).status,403);
  await b.request('user/block',{peer:alice.id,blocked:false});assert.equal((await b.request('direct/send',{peer:alice.id,body:'Đã bỏ chặn'})).status,201);
  const php=process.env.PHP_BIN||resolve('.runtime/php/php.exe');execFileSync(php,['-r',"$db=new PDO('sqlite:'.$argv[1]);$q=$db->prepare('UPDATE users SET muted_until=? WHERE id=?');$q->execute([time()+60,$argv[2]]);",join(storage,'temple.sqlite'),bob.id]);
  assert.equal((await b.request('direct/send',{peer:alice.id,body:'Tạm ngưng gửi'})).status,403);
});

test('anonymous bootstrap, security headers, CSRF and method boundaries',async()=>{
  const c=new Client(),r=await c.request('bootstrap');assert.equal(r.status,200);assert.equal(r.body.user,null);assert.equal(r.headers.get('x-frame-options'),'DENY');assert.ok(r.headers.get('content-security-policy').includes("script-src 'self'"));assert.match(r.headers.get('set-cookie'),/HttpOnly/i);assert.match(r.headers.get('set-cookie'),/SameSite=Lax/i);
  assert.equal((await c.request('guest',{name:'Test'},{'X-CSRF-Token':''})).status,403);
  assert.equal((await c.request('guest',{name:'Test'},{Origin:'https://evil.example'})).status,403);
  assert.equal((await c.request('guest')).status,405);
  assert.equal((await c.request('profile',{name:'Other'})).status,401);
});
test('guest creation, input validation, session rotation and private data',async()=>{
  const c=new Client();await c.request('bootstrap');const old=c.cookie;
  assert.equal((await c.request('guest',{name:'a'})).status,400);
  const r=await c.request('guest',{name:'An Nhiên'});assert.equal(r.status,201);assert.notEqual(c.cookie,old);assert.equal(r.body.user.guest,true);assert.equal(r.body.user.jade,30);assert.ok(!('password_hash'in r.body.user));assert.equal(r.body.inventory.length,4);
  assert.equal((await c.request('profile',{appearance:{robe:'url(javascript:1)',skin:'#bb8963'}})).status,400);
});
test('server validates practice ownership, idempotency, cooldowns and timer duration',async()=>{
  const a=new Client(),b=new Client();await a.guest();await b.guest('Người khác');
  const start=await a.request('practice/start',{kind:'beads'});assert.equal(start.status,200);
  assert.equal((await b.request('practice/tick',{id:start.body.id,nonce:'test-event-0000001'})).status,409);
  const tick=await a.request('practice/tick',{id:start.body.id,nonce:'test-event-0000001',amount:999999,points:999999});assert.equal(tick.status,200);assert.equal(tick.body.user.points,1);
  const duplicate=await a.request('practice/tick',{id:start.body.id,nonce:'test-event-0000001'});assert.equal(duplicate.status,200);assert.equal(duplicate.body.user.points,1);
  // Freeze the stored tick ahead of the request; GPU-heavy browser QA must not make a 120ms assertion flaky.
  const php=process.env.PHP_BIN||resolve('.runtime/php/php.exe');execFileSync(php,['-r',"$db=new PDO('sqlite:'.$argv[1]);$q=$db->prepare('UPDATE practice_sessions SET last_tick=? WHERE id=?');$q->execute([microtime(true)+60,$argv[2]]);",join(storage,'temple.sqlite'),start.body.id]);
  assert.equal((await a.request('practice/tick',{id:start.body.id,nonce:'test-event-0000002'})).status,429);
  await a.request('practice/finish',{id:start.body.id});assert.equal((await a.request('practice/tick',{id:start.body.id,nonce:'test-event-0000003'})).status,409);
  const meditation=await a.request('practice/start',{kind:'meditation'});const end=await a.request('practice/finish',{id:meditation.body.id,seconds:999999});assert.ok(end.body.seconds<=2);assert.equal(end.body.user.jade,30);
  assert.equal((await a.request('tasks/claim',{task:'daily-beads'})).status,409);
});
test('shop inventory and offerings use atomic server balances',async()=>{
  const c=new Client();await c.guest();assert.equal((await c.request('shop/buy',{item:'missing',price:-999})).status,400);
  for(let i=0;i<10;i++)assert.equal((await c.request('shop/buy',{item:'incense',price:0})).status,200);
  const noMoney=await c.request('shop/buy',{item:'incense'});assert.equal(noMoney.status,409);
  const data=(await c.request('bootstrap')).body;assert.equal(data.user.jade,0);assert.equal(Number(data.inventory.find(i=>i.item==='incense').quantity),13);
  for(let i=0;i<3;i++)assert.equal((await c.request('offer',{item:'candle'})).status,i<2?200:409);
  const saved=await c.request('lantern',{body:'Nguyện cho mọi người an lành.'});assert.equal(saved.status,200);assert.match(saved.body.lanternId,/^[a-f0-9]{32}$/);const visible=await c.request('pulse',{x:0,z:12});assert.ok(visible.body.lanterns.some(l=>l.id===saved.body.lanternId));assert.equal((await c.request('lantern',{body:'Một lời nguyện nữa.'})).status,409);
});
test('account upgrade preserves guest progress; auth protects session',async()=>{
  const c=new Client();const guest=await c.guest('Tâm An');const userId=guest.body.user.id;
  assert.equal((await c.request('register',{email:'not-an-email',password:'password1234',name:'Tâm An'})).status,400);
  assert.equal((await c.request('register',{email:'tam@example.test',password:'short',name:'Tâm An'})).status,400);
  const oldCookie=c.cookie,registered=await c.request('register',{email:'tam@example.test',password:'a-secure-test-password',name:'Tâm An'});assert.equal(registered.status,201);assert.equal(registered.body.user.id,userId);assert.equal(registered.body.user.guest,false);assert.notEqual(c.cookie,oldCookie);
  const stale=new Client();stale.cookie=oldCookie;assert.equal((await stale.request('bootstrap')).body.user,null);
  await c.request('logout',{});assert.equal((await c.request('profile',{name:'Hacker'})).status,401);
  assert.equal((await c.request('login',{email:'tam@example.test',password:'wrong-password'})).status,401);
  const login=await c.request('login',{email:'tam@example.test',password:'a-secure-test-password'});assert.equal(login.status,200);assert.equal(login.body.user.id,userId);assert.ok(!('password_hash'in login.body.user));
});
test('shared chat is room scoped, messages are owned, and reports are recorded',async()=>{
  const a=new Client(),b=new Client();await a.guest('Người gửi');await b.guest('Đạo hữu khác');
  await a.request('enter',{room:'an-lac'});await b.request('enter',{room:'truc-lam'});
  const body='<img src=x onerror=alert(1)> Nam mô A Di Đà Phật';assert.equal((await a.request('message',{body})).status,201);
  assert.equal((await b.request('messages')).body.messages.length,0);
  await b.request('enter',{room:'an-lac'});const shared=(await b.request('messages')).body.messages;assert.equal(shared[0].body,body);
  await b.request('message/delete',{id:shared[0].id});assert.equal((await a.request('messages')).body.messages.length,1);
  assert.equal((await b.request('report',{id:shared[0].id})).status,200);
  await a.request('message/delete',{id:shared[0].id});assert.equal((await a.request('messages')).body.messages.length,0);
});
test('presence, appearance, schools, history and private-file routing',async()=>{
  const c=new Client();await c.guest();assert.equal((await c.request('enter',{room:'made-up-room'})).status,400);
  await c.request('enter',{room:'tinh-tam'});const pulse=await c.request('pulse',{x:99999,z:-99999});assert.equal(pulse.status,200);assert.ok(pulse.body.online>=1);
  const u=(await c.request('bootstrap')).body.user;assert.equal(Number(u.x),33);assert.equal(Number(u.z),-14);
  const school=await c.request('school',{school:'Tịnh Độ'});assert.equal(school.body.user.school,'Tịnh Độ');assert.equal(school.body.user.jade,30);
  const changed=await c.request('school',{school:'Thiền Tông'});assert.equal(changed.body.user.jade,10);
  assert.equal((await c.request('school',{school:'Mật Tông'})).status,409);
  assert.equal((await c.request('history')).status,200);
  for(const path of ['/storage/temple.sqlite','/app/schema.sql','/app/world-layout.json','/.env','/.git/config','/PRODUCT.md'])assert.equal((await fetch(base+path)).status,404);
});

test('seats are exclusive per room, require arrival, and synchronize real names and seated poses',async()=>{
  const a=new Client(),b=new Client();const person=(await a.guest('Tịnh An')).body.user;await b.guest('Diệu Tâm');await a.request('enter',{room:'an-lac'});await b.request('enter',{room:'an-lac'});
  assert.equal((await a.request('seat/claim',{seatId:'not-a-seat'})).status,400);
  const competing=await Promise.all([a.request('seat/claim',{seatId:'a1'}),b.request('seat/claim',{seatId:'a1'})]);assert.deepEqual(competing.map(r=>r.status).sort(),[200,409]);if(competing[0].status!==200){await b.request('seat/release',{seatId:'a1'});await a.request('seat/claim',{seatId:'a1'});}
  assert.equal((await a.request('seat/sit',{seatId:'a1',x:'invalid',z:0})).status,400);
  assert.equal((await a.request('seat/sit',{seatId:'a1'})).status,409,'a reservation alone does not seat someone from outside');
  await b.request('seat/release',{seatId:'a1'});
  await a.request('pulse',{x:-9.8,z:-3,state:'walk'});const seated=await a.request('seat/sit',{seatId:'a1'});assert.equal(seated.status,200);assert.equal(seated.body.user.seatId,'a1');assert.equal(seated.body.user.state,'seated');
  const presence=(await b.request('pulse',{x:0,z:39})).body,peer=presence.peers.find(p=>p.id===person.id);assert.equal(peer.name,'Tịnh An');assert.equal(peer.seatId,'a1');assert.equal(peer.state,'seated');assert.ok(!('email' in peer));
  await a.request('pulse',{x:999,z:999,state:'seated',seatId:'a1'});let own=(await a.request('bootstrap')).body.user;assert.equal(Number(own.x),-9.8);assert.equal(Number(own.z),-3);
  await a.request('enter',{room:'an-lac'});assert.equal((await a.request('bootstrap')).body.user.seatId,'a1','reload/same-room entry retains the seat');
  await a.request('seat/release',{seatId:'a1'});assert.equal((await b.request('seat/claim',{seatId:'a1'})).status,200);
  await a.request('enter',{room:'truc-lam'});assert.equal((await a.request('seat/claim',{seatId:'a1'})).status,200,'a different room has an independent seat');
  await a.request('enter',{room:'tinh-tam'});const otherRoom=new Client();await otherRoom.guest();await otherRoom.request('enter',{room:'truc-lam'});assert.equal((await otherRoom.request('seat/claim',{seatId:'a1'})).status,200,'changing rooms releases a reservation');
  await b.request('logout',{});const c=new Client();await c.guest();await c.request('enter',{room:'an-lac'});assert.equal((await c.request('seat/claim',{seatId:'a1'})).status,200,'logout releases the seat');
});

test('an expired seat recovers to standing, and delayed releases cannot remove a different seat',async()=>{
  const c=new Client(),created=(await c.guest('An trú')).body.user;await c.request('enter',{room:'an-lac'});await c.request('seat/claim',{seatId:'b3'});await c.request('pulse',{x:-4.6,z:.2,state:'walk'});await c.request('seat/sit',{seatId:'b3'});
  const php=process.env.PHP_BIN||resolve('.runtime/php/php.exe');execFileSync(php,['-r',"$db=new PDO('sqlite:'.$argv[1]);$q=$db->prepare('UPDATE seat_claims SET expires_at=0 WHERE user_id=?');$q->execute([$argv[2]]);",join(storage,'temple.sqlite'),created.id]);
  const expired=(await c.request('pulse',{x:-4.6,z:.2,state:'seated',seatId:'b3'})).body;assert.equal(expired.seat,null);assert.equal((await c.request('bootstrap')).body.user.state,'idle');
  await c.request('seat/claim',{seatId:'c3'});await c.request('pulse',{x:-4.6,z:3.4,state:'walk'});await c.request('seat/sit',{seatId:'c3'});await c.request('seat/release',{seatId:'b3'});assert.equal((await c.request('bootstrap')).body.user.seatId,'c3');
  await c.request('pulse',{x:-4.6,z:5,state:'walk'});assert.equal((await c.request('bootstrap')).body.user.seatId,null,'walking out releases the seated pose');await c.request('seat/claim',{seatId:'c4'});assert.equal((await c.request('seat/sit',{seatId:'c4',x:4.6,z:3.4})).status,200);await c.request('pulse',{x:4.6,z:4.8,state:'idle',releaseSeatId:'c4'});assert.equal((await c.request('bootstrap')).body.user.seatId,null,'a heartbeat also conveys a pending release');
});
