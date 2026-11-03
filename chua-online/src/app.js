import { SEATS, seatById, SPAWN } from './world-layout.js';
import { templeMap } from './temple-map.js';
import { createIcons, Armchair, ScanEye, Menu, UserRound, Volume2, VolumeX, Maximize, X, ArrowRight, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, Send, CircleHelp, Check, LogOut, Gem, ClipboardList, Timer, Footprints, Rabbit, Shirt, Flag, Trash2, Home, Move, RotateCcw, Moon, Sun, Flower2, Flame, Lamp, CircleDot, Settings, HandHeart, Church, Users, BookOpen, Leaf, Bell, ShoppingBag, Backpack, Trophy, Map as MapIcon, MessageCircle } from 'lucide';
import { TempleScene } from './scene.js';
import { DESTINATIONS } from './navigation.js';
import { VirtualJoystick } from './controls.js';
import { TempleSocial } from './social.js';

const templeIcon=[['path',{d:'M3 10c4 0 6-2 9-7 3 5 5 7 9 7H3Z'}],['path',{d:'M5 10v11m14-11v11M3 21h18M9 21v-7h6v7M10 6h4'}]];
const iconSet={Armchair,ScanEye,Menu,UserRound,Volume2,VolumeX,Maximize,X,ArrowRight,ChevronRight,ChevronDown,ChevronUp,ChevronLeft,Send,CircleHelp,Check,LogOut,Gem,ClipboardList,Timer,Footprints,Rabbit,Shirt,Flag,Trash2,Home,Move,RotateCcw,Moon,Sun,Flower2,Flame,Lamp,CircleDot,Settings,HandHeart,Church:templeIcon,Users,BookOpen,Leaf,Bell,ShoppingBag,Backpack,Trophy,Map:MapIcon,MessageCircle};
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<i data-lucide="${esc(name)}"></i>`;
const number=n=>new Intl.NumberFormat('vi-VN').format(n||0);
const state={data:null,panel:null,practice:null,practiceCount:0,interval:null,pulse:null,meditationMinutes:5,sound:true,volume:.35,lanterns:[],lastTrigger:null,seatBusy:false,seatChanged:0,pulsing:false};
let scene,joystick,social,audio,toastTimeout,chantInterval;
function icons(){createIcons({icons:iconSet,attrs:{'aria-hidden':'true'}});}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').hidden=true,4800);}
async function api(route,data,params={}){const response=await fetch(`/api.php?${new URLSearchParams({route,...params})}`,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':state.data?.csrf||''},body:data===undefined?undefined:JSON.stringify(data),credentials:'same-origin',signal:AbortSignal.timeout(12000)});let payload;try{payload=await response.json();}catch{throw new Error('Không kết nối được với chùa. Vui lòng thử lại.');}if(!response.ok)throw new Error(payload.error||'Có lỗi xảy ra. Vui lòng thử lại.');return payload;}
function applySnapshot(data){
  state.data=data;const u=data.user;
  $('account-name').textContent=u?.name||'Tài khoản';$('jade-count').textContent=u?number(u.jade):'—';
  $('welcome-room').innerHTML=data.rooms.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');
  if(u){const room=data.rooms.find(r=>r.id===u.room);$('room-name').textContent=room?.name||'Chùa An Lạc';$('welcome-room').value=u.room;state.sound=u.settings.sound;state.volume=u.settings.volume;document.body.classList.toggle('reduce-motion',u.settings.reducedMotion);scene?.applySettings(u.settings);scene?.setRoom(u.room);if(!scene?.player)scene?.setUser(u);}
  scene?.seating?.updateClaims(data.seats||[]);updateSoundButton();
  social?.sync(data);
}
function updateSoundButton(){$('sound-toggle').innerHTML=icon(state.sound?'volume-2':'volume-x');$('sound-toggle').setAttribute('aria-pressed',String(state.sound));$('sound-toggle').setAttribute('aria-label',state.sound?'Tắt âm thanh':'Bật âm thanh');icons();}
function playTone(kind='bell'){
  if(!state.sound)return;
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const now=audio.currentTime;const base=kind==='wood'?340:kind==='bead'?560:196;
    const harmonics=kind==='bell'?[1,2.76,5.4]:[1,1.6];for(let i=0;i<harmonics.length;i++){const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(base*harmonics[i],now);gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.001,state.volume*.25/(i+1)),now+.012);gain.gain.exponentialRampToValueAtTime(.001,now+(kind==='bell'?4.5:kind==='wood'?.2:.35));oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(now);oscillator.stop(now+(kind==='bell'?5:.45));}
  }catch{/* Text and practice remain available without audio support. */}
}
async function ensureUser(){if(state.data?.user)return true;toast('Nhập pháp danh và chọn “Vào chùa” để bắt đầu.');$('guest-name').focus();return false;}
async function enter(room,name){
  if(!state.data.user)applySnapshot(await api('guest',{name}));
  applySnapshot(await api('enter',{room}));scene?.setUser(state.data.user,{restorePosition:true});scene?.setRoom(room);scene?.setInputEnabled(true);$('move-stick').disabled=!scene;document.querySelector('[data-action="overview"]').setAttribute('aria-pressed','false');
  $('welcome').hidden=true;document.body.classList.remove('welcome-visible');$('location-label').hidden=false;
  await pulse();clearInterval(state.pulse);state.pulse=setInterval(()=>pulse().catch(()=>{}),4000);playTone('bell');toast('Chào đạo hữu. Chúc bạn một thời tu an lành.');
}
function applyPresence(payload){
  if(payload.room&&payload.room!==state.data?.user?.room)return;
  $('online-count').textContent=payload.online;$('character-names').textContent=[state.data.user.name+' (bạn)',...payload.peers.map(p=>p.name)].join(', ');scene?.updatePeers(payload.peers);scene?.seating?.updateClaims(payload.seats);state.data.seats=payload.seats||[];state.lanterns=payload.lanterns;scene?.updateLanterns(payload.lanterns);
  if(scene?.seating?.seated&&!payload.seat&&Date.now()-state.seatChanged>5000){scene.seating.leave(false);toast('Chỗ ngồi đã được trả sau khi mất kết nối. Bạn có thể chọn lại đệm.');}
  const wish=payload.lanterns[0];if(wish)$('latest-wish').textContent=wish.body;
  if(state.panel==='seats')renderSeats();
  social?.presence(payload.peers,payload.inboxUnread);
}
async function pulse(){if(!state.data?.user||!$('welcome').hidden||document.hidden||state.pulsing||state.seatBusy)return;state.pulsing=true;try{applyPresence(await api('pulse',scene?.position()||{...SPAWN,state:'idle'}));}finally{state.pulsing=false;}}
function seatStatus(detail){
  $('seat-status').hidden=!detail;document.body.classList.toggle('is-seated',detail?.phase==='seated');document.body.classList.toggle('seat-journey',!!detail&&detail.phase!=='seated');
  if(detail){$('seat-status-text').textContent=detail.phase==='seated'?`Đệm ${detail.seat.label}`:detail.phase==='arriving'?'Đang ngồi xuống…':`Đang đến đệm ${detail.seat.label}`;$('stand-button').textContent=detail.phase==='seated'?'Đứng dậy':'Hủy';}
}
function renderSeats(){
  const grid=$('seat-grid');if(!grid)return;const claims=new Map((state.data.seats||[]).map(c=>[c.id,c]));let html='';
  for(let row=0;row<8;row++)for(let column=0;column<7;column++){if(column===3){html+='<span class="seat-aisle" aria-hidden="true"></span>';continue;}const seat=SEATS.find(s=>s.row===row&&s.column===(column<3?column:column-1)),claim=claims.get(seat.id),mine=claim?.userId===state.data.user.id,occupied=claim&&!mine;html+=`<button class="seat-choice ${mine?'own-seat':''}" data-action="choose-seat" data-seat="${seat.id}" ${occupied?'disabled':''} aria-label="Đệm ${seat.label}, ${occupied?'đã có người chọn':mine?'chỗ của bạn':'còn trống'}"><span>${seat.label}</span>${icon(occupied?'user-round':'circle-dot')}</button>`;}
  grid.innerHTML=html;icons();
}
async function openSeats(){if(!await ensureUser())return;await pulse();await panel('Chọn đệm ngồi',`<p class="lead">Chọn một đệm trống. Nhân vật sẽ tự đi vào chánh điện và ngồi hướng về Phật. Bạn cũng có thể chạm trực tiếp vào đệm vàng trong cảnh.</p><p class="seat-orientation">Hướng về tòa sen</p><div id="seat-grid" class="seat-grid" aria-label="48 đệm thiền, hàng A ở gần tòa sen"></div><p class="small-note">Đệm sẫm màu đã có người chọn. Nhấn Đứng dậy hoặc di chuyển để rời chỗ.</p>`,'seats');renderSeats();}
async function selectSeat(id){
  if(!await ensureUser()||state.seatBusy)return;if(!scene)return toast('Chức năng ngồi cần thiết bị hỗ trợ đồ họa 3D.');
  state.seatBusy=true;state.seatChanged=Date.now();scene.seating.leave();
  try{const result=await api('seat/claim',{seatId:id});applySnapshot(result);await closePanel();if(!scene.seating.begin(id)){await api('seat/release',{seatId:id});throw new Error('Chưa tìm được lối đến đệm. Hãy di chuyển ra lối đi rồi chọn lại.');}}
  finally{state.seatBusy=false;}
}
async function arriveAtSeat(id){
  try{
    if(scene.seating.target?.id!==id||!scene.seating.awaiting)return;
    const saved=await api('seat/sit',{...scene.position(),seatId:id});if(scene.seating.target?.id!==id||!scene.seating.awaiting){await api('seat/release',{seatId:id});return;}
    state.seatChanged=Date.now();applySnapshot(saved);scene.seating.confirm(id);toast(`Đã ngồi tại đệm ${seatById(id).label}.`);
  }catch(error){if(scene.seating.target?.id===id){scene.seating.leave();toast(error.message);}}
}
async function finishPractice(){clearInterval(state.interval);state.interval=null;clearInterval(chantInterval);chantInterval=null;window.speechSynthesis?.cancel();const p=state.practice;state.practice=null;scene?.setState('idle');if(p){const result=await api('practice/finish',{id:p.id});if(result.user){state.data.user=result.user;state.data.tasks=result.tasks;$('jade-count').textContent=number(result.user.jade);}return result;}return null;}
async function panel(title,content,key){
  $('panel').classList.toggle('map-panel',key==='map');
  joystick?.reset();scene?.setInputEnabled(false);await finishPractice();state.panel=key;$('panel-title').textContent=title;$('panel-content').classList.remove('breathing');$('panel-content').innerHTML=content;$('panel').hidden=false;document.body.classList.add('panel-open');
  $('side-nav').classList.remove('mobile-open');document.querySelector('.mobile-menu').setAttribute('aria-expanded','false');
  document.querySelectorAll('#practice-dock button').forEach(b=>b.classList.toggle('active',b.dataset.action===key));icons();$('panel-content').scrollTop=0;$('panel').querySelector('[data-action="close-panel"]').focus({preventScroll:true});
}
async function closePanel(){await finishPractice();state.panel=null;$('panel').hidden=true;document.body.classList.remove('panel-open');scene?.setInputEnabled(true);document.querySelectorAll('#practice-dock .active').forEach(b=>b.classList.remove('active'));if(state.lastTrigger?.isConnected)state.lastTrigger.focus({preventScroll:true});}
const empty=(symbol,title,body)=>`<div class="empty-state">${icon(symbol)}<h3>${title}</h3><p>${body}</p></div>`;
const errorBox='<p class="form-error" data-error role="alert"></p>';
function quantity(id){return Number(state.data.inventory.find(x=>x.item===id)?.quantity||0);}

async function openRooms(){await panel('Chọn không gian tu tập',`<p class="lead">Mỗi ngôi chùa là một không gian gặp gỡ. Tiến độ tu tập của bạn được giữ khi đổi chùa.</p><div class="list">${state.data.rooms.map(r=>`<div class="list-row">${icon('church')}<div class="list-row-main"><strong>${esc(r.name)}</strong><small>${esc(r.caption)}</small><small class="room-meta">${number(r.online)} / ${r.capacity} người</small></div><button class="secondary-button" data-action="enter-room" data-room="${r.id}">${state.data.user?.room===r.id?'Đang chọn':'Vào chùa'}</button></div>`).join('')}</div>`,'rooms');}
async function openAccount(mode='login'){
  const u=state.data.user;
  if(u&&!u.guest){await panel('Tài khoản của bạn',`<h3>${esc(u.name)}</h3><p>${esc(u.email)}</p><div class="stat-strip"><div><b>${number(u.points)}</b><span>lượt tu tập</span></div><div><b>${number(u.jade)}</b><span>Ngọc</span></div></div><button class="primary-button" data-action="history">${icon('book-open')}Nhật ký tu tập</button><button class="secondary-button space-top" data-action="settings">${icon('settings')}Chỉnh sửa nhân vật</button><button class="text-link space-top" data-action="logout">${icon('log-out')}Đăng xuất</button>`,'account');return;}
  await panel(mode==='register'?'Lưu hành trình của bạn':'Chào mừng trở lại',`<div class="panel-tabs"><button data-action="login-form" class="${mode==='login'?'selected':''}">Đăng nhập</button><button data-action="register-form" class="${mode==='register'?'selected':''}">Tạo tài khoản</button></div><p class="lead">${mode==='register'?'Tạo tài khoản để giữ nhân vật và tiến độ khi đổi thiết bị. Tiến độ khách hiện tại sẽ được giữ lại.':'Tiếp tục hành trình tu tập trên mọi thiết bị.'}</p><form id="auth-form" data-mode="${mode}">${mode==='register'?`<label>Pháp danh<input name="name" required minlength="2" maxlength="30" value="${esc(u?.name||'An Nhiên')}" autocomplete="nickname"></label>`:''}<label>Email<input type="email" name="email" required maxlength="254" autocomplete="email" placeholder="ban@example.com"></label><label>Mật khẩu<input type="password" name="password" minlength="10" maxlength="72" required autocomplete="${mode==='register'?'new-password':'current-password'}" placeholder="Tối thiểu 10 ký tự"></label>${errorBox}<button class="primary-button" type="submit">${mode==='register'?'Tạo tài khoản':'Đăng nhập'}${icon('arrow-right')}</button></form><p class="small-note">${u?.guest?'Bạn đang dùng tài khoản khách. Hãy tạo tài khoản trước khi xóa cookie hoặc đổi thiết bị.':'Bạn cũng có thể vào chùa bằng pháp danh, không cần đăng ký.'}</p>`,'account');
}
async function practicePanel(kind){
  if(!await ensureUser())return;
  const titles={beads:'Lần tràng hạt',bow:'Thành tâm đảnh lễ',chant:'Tụng kinh',meditation:'Thiền định'};
  let content='';
  if(kind==='beads'||kind==='bow'){
    state.practiceCount=kind==='beads'?Number(state.data.tasks.find(t=>t.kind==='beads')?.progress||0):0;
    content=`<div class="practice-view"><p class="practice-intro">${kind==='beads'?'Mỗi hạt là một câu niệm. Chậm rãi, an trú trong hiện tại.':'Chắp tay, hướng về chánh điện. Giữ một niệm thành kính.'}</p><p class="prayer-caption">Nam mô A Di Đà Phật</p><div class="bead-counter" id="practice-count">${kind==='beads'?state.practiceCount%108:0}</div><div class="counter-label" id="counter-label">${kind==='beads'?'/ 108 hạt · Vòng '+(Math.floor(state.practiceCount/108)+1):'lần đảnh lễ trong phiên này'}</div><button class="bead-button" data-action="practice-tick">${icon(kind==='beads'?'circle-dot':'hand-heart')}<span>${kind==='beads'?'Lần một hạt':'Lạy Phật'}</span></button><p class="small-note">${kind==='beads'?'Chạm nút hoặc nhấn Enter khi nút được chọn.':'Mỗi lần lạy có một nhịp nghỉ. Bạn có thể ngồi trước màn hình và thực hành theo khả năng.'}</p></div>`;
  }else if(kind==='chant'){
    content=`<p class="lead">Đọc từng câu, nghe từng tiếng mõ. Không cần vội vàng.</p><label>Bài tụng<select id="sutra-select">${state.data.sutras.map(s=>`<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select></label><div id="sutra-text" class="sutra-content"></div><label class="inline-field"><input type="checkbox" id="auto-wood">Mõ tự động</label><div class="space-top"><button class="secondary-button" data-action="read-sutra">${icon('volume-2')}Đọc thành tiếng</button></div><button class="primary-button space-top" data-action="practice-tick">${icon('circle-dot')}Gõ mõ · <span id="chant-count">0</span></button><p class="small-note">Chỉ tiếng mõ bạn tự gõ được ghi vào nhật ký. Giọng đọc dùng khả năng đọc văn bản của trình duyệt; có thể cần cài giọng tiếng Việt.</p>`;
  }else{
    content=`<button class="secondary-button seat-panel-link" data-action="seats">${icon('armchair')}Chọn đệm ngồi trong chánh điện</button><div class="practice-view"><p>Ngồi thẳng lưng, thả lỏng vai.<br>Để hơi thở đưa bạn về hiện tại.</p><div class="breath-disc" id="breath-label">An trú</div><div class="duration-options">${[5,10,20,30].map(n=>`<button data-action="duration" data-minutes="${n}" class="${n===state.meditationMinutes?'selected':''}">${n} phút</button>`).join('')}</div><div class="timer-digits" id="meditation-clock">${String(state.meditationMinutes).padStart(2,'0')}:00</div><button class="primary-button" data-action="meditation-start">${icon('leaf')}Bắt đầu thời thiền</button><p class="small-note">Thời gian tu tập được máy chủ ghi nhận khi kết thúc. Có thể xả thiền sớm bất cứ lúc nào.</p></div>`;
  }
  await panel(titles[kind],content,kind);
  if(kind!=='meditation'){state.practice={...await api('practice/start',{kind}),kind};scene?.setState(kind==='bow'?'idle':kind);}
  if(kind==='chant')renderSutra();
}
function renderSutra(){const s=state.data.sutras.find(s=>s.id===$('sutra-select').value);$('sutra-text').innerHTML=`<p class="small-note">${esc(s.subtitle)}</p>${s.lines.map(l=>`<p>${esc(l)}</p>`).join('')}`;window.speechSynthesis?.cancel();}
async function tick(){if(!state.practice)return;const kind=state.practice.kind;const result=await api('practice/tick',{id:state.practice.id,nonce:crypto.randomUUID().replaceAll('-','')});state.data.user=result.user;state.data.tasks=result.tasks;state.practiceCount++;playTone(kind==='chant'?'wood':'bead');if(kind==='chant'){$('chant-count').textContent=state.practiceCount;return;}if(kind==='bow')scene?.bow();$('practice-count').textContent=kind==='beads'?state.practiceCount%108:state.practiceCount;if(kind==='beads'){$('counter-label').textContent=`/ 108 hạt · Vòng ${Math.floor(state.practiceCount/108)+1}`;if(state.practiceCount%108===0){playTone('bell');toast('Bạn đã hoàn thành một vòng 108 hạt. An lành.');}}}
async function startMeditation(){
  if(state.practice){const result=await finishPractice();await practicePanel('meditation');toast(`Đã ghi nhận ${Math.floor((result?.seconds||0)/60)} phút ${(result?.seconds||0)%60} giây thiền định.`);return;}
  state.practice={...await api('practice/start',{kind:'meditation'}),kind:'meditation'};const started=Date.now(),duration=state.meditationMinutes*60;
  scene?.setState('meditation');$('panel-content').classList.add('breathing');$('breath-label').textContent='Hít vào';const button=document.querySelector('[data-action="meditation-start"]');button.innerHTML=`${icon('check')}Xả thiền`;document.querySelectorAll('[data-action="duration"]').forEach(b=>b.disabled=true);icons();playTone('bell');
  state.interval=setInterval(()=>{const elapsed=Math.floor((Date.now()-started)/1000),remaining=Math.max(0,duration-elapsed);$('meditation-clock').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;$('breath-label').textContent=elapsed%8<4?'Hít vào':'Thở ra';if(!remaining)startMeditation().catch(e=>toast(e.message));},1000);
}
async function openShop(){if(!await ensureUser())return;await panel('Thỉnh vật phẩm',`<p class="lead">Dùng Ngọc nhận từ công quả để thỉnh vật phẩm. Ngọc chỉ là điểm trong hệ thống, không quy đổi thành tiền.</p><div class="balance-label">${icon('gem')}Bạn có ${number(state.data.user.jade)} Ngọc</div><div class="list">${state.data.catalog.map(item=>`<div class="list-row">${icon(item.icon==='candle'?'flame':item.icon)}<div class="list-row-main"><strong>${esc(item.name)}</strong><small>${esc(item.description)}</small></div><button class="secondary-button" data-action="buy" data-item="${item.id}">${number(item.price)} Ngọc</button></div>`).join('')}</div>`,'shop');}
async function openInventory(){if(!await ensureUser())return;const items=state.data.catalog.filter(i=>quantity(i.id)>0);await panel('Túi đồ của bạn',`<p class="lead">Những vật phẩm đồng hành cùng đạo hữu.</p>${items.length?`<div class="list">${items.map(item=>`<div class="list-row">${icon(item.icon==='candle'?'flame':item.icon)}<div class="list-row-main"><strong>${esc(item.name)}</strong><small>Số lượng: ${quantity(item.id)}</small></div><button class="secondary-button" data-action="use-item" data-item="${item.id}">${item.id==='robe-moss'?'Mặc áo':item.id==='companion'?'Đồng hành':'Sử dụng'}</button></div>`).join('')}</div>`:empty('backpack','Túi đồ đang trống','Hoàn thành công quả để nhận Ngọc, sau đó thỉnh vật phẩm trong cửa hàng.')}<button class="text-link space-top" data-action="shop">Đến cửa hàng ${icon('arrow-right')}</button>`,'inventory');}
async function openOffer(){if(!await ensureUser())return;await panel('Dâng một niệm lành',`<p class="lead">Một nén hương, một ngọn nến, một đóa hoa. Điều quý nhất vẫn là tấm lòng thành.</p><div class="list">${state.data.catalog.filter(i=>['incense','flower','candle'].includes(i.id)).map(item=>`<div class="list-row">${icon(item.id==='flower'?'flower-2':'flame')}<div class="list-row-main"><strong>${esc(item.name)}</strong><small>Còn ${quantity(item.id)} trong túi</small></div><button class="secondary-button" data-action="offer-item" data-item="${item.id}">Dâng lễ</button></div>`).join('')}</div><button class="text-link space-top" data-action="shop">Thỉnh thêm vật phẩm ${icon('arrow-right')}</button>`,'offer');}
async function openLanterns(){if(!await ensureUser())return;await pulse();await panel('Đèn nguyện trên hồ sen',`<p class="lead">Viết một lời nguyện, thắp một ngọn đèn. Lời nguyện được chia sẻ với mọi người trong chùa trong 24 giờ.</p><form id="lantern-form"><label>Lời nguyện của bạn<textarea name="body" minlength="2" maxlength="240" required placeholder="Nguyện cho gia đình và mọi người được bình an…"></textarea></label><p class="small-note">Còn ${quantity('lantern')} đèn hoa đăng trong túi. Tránh ghi thông tin riêng tư vào lời nguyện công khai.</p>${errorBox}<button class="primary-button" type="submit">${icon('lamp')}Thả đèn nguyện</button></form><h3>Những lời nguyện gần đây</h3>${state.lanterns.length?state.lanterns.map(l=>`<div class="wish-entry"><p>${esc(l.body)}</p><small>${esc(l.name)}</small></div>`).join(''):empty('lamp','Hồ sen đang chờ ánh đèn','Bạn có thể gửi lời nguyện đầu tiên trong không gian này.')}`,'lanterns');}
async function openTasks(){if(!await ensureUser())return;applySnapshot(await api('bootstrap'));await panel('Công quả mỗi ngày',`<p class="lead">Gieo một thói quen nhỏ. Nuôi dưỡng sự an định mỗi ngày.</p><div class="list">${state.data.tasks.map(t=>`<div class="list-row"><div class="list-row-main"><strong>${esc(t.title)}</strong><small>${esc(t.description)}</small><progress value="${Math.min(t.progress,t.target)}" max="${t.target}" aria-label="${esc(t.title)}"></progress><small>${number(t.progress)} / ${t.target} ${t.kind==='meditation'?'giây':'lượt'} · ${t.reward} Ngọc</small><button class="${!t.claimed&&t.progress>=t.target?'primary':'secondary'}-button space-top" data-action="claim-task" data-task="${t.id}" ${t.claimed||t.progress<t.target?'disabled':''}>${t.claimed?'Đã nhận thưởng':t.progress>=t.target?'Nhận Ngọc':'Đang thực hành'}</button></div></div>`).join('')}</div><p class="small-note">Công quả làm mới lúc 00:00, giờ Việt Nam. Ngọc là điểm hoạt động trong ứng dụng.</p>`,'tasks');}
async function loadChat(){if(state.panel!=='community')return;const result=await api('messages');const log=$('chat-log');if(!log)return;const fingerprint=JSON.stringify(result.messages);if(log.dataset.fingerprint===fingerprint)return;log.dataset.fingerprint=fingerprint;log.innerHTML=result.messages.length?[...result.messages].reverse().map(m=>`<article class="chat-item"><div class="chat-meta"><strong>${esc(m.name)}</strong><small>${new Date(m.created_at*1000).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</small><button class="icon-button" data-action="${m.user_id===state.data.user.id?'delete-message':'report-message'}" data-id="${m.id}" aria-label="${m.user_id===state.data.user.id?'Xóa tin nhắn của tôi':'Báo cáo tin nhắn'}">${icon(m.user_id===state.data.user.id?'trash-2':'flag')}</button></div><p>${esc(m.body)}</p></article>`).join(''):empty('message-circle','Một lời chào an lành','Chưa có cuộc trò chuyện trong chùa này. Gửi lời chào đến các đạo hữu.');icons();}
async function openCommunity(){if(!await ensureUser())return;await closePanel();$('side-nav').classList.remove('mobile-open');document.querySelector('.mobile-menu').setAttribute('aria-expanded','false');return social.show('room');}
async function openLeaderboard(){if(!await ensureUser())return;await panel('Hành trình tinh tấn','<p class="loading-message">Đang tải bảng xếp hạng…</p>','leaderboard');const data=await api('leaderboard');if(state.panel!=='leaderboard')return;$('panel-content').innerHTML=`<p class="lead">Ghi nhận sự đều đặn của các đạo hữu. Đây là số lượt thực hành trong ứng dụng, không đo lường công đức hay giá trị tâm linh.</p>${data.users.map((u,i)=>`<div class="score-row"><span class="place">${i+1}</span><div><strong>${esc(u.name)}</strong><p class="small-note">${esc(u.school||'Đạo hữu')}</p></div><span class="score">${number(u.points)} lượt</span></div>`).join('')}`;}
async function openHistory(){if(!await ensureUser())return;await panel('Nhật ký tu tập','<p class="loading-message">Đang mở nhật ký…</p>','history');const data=await api('history');if(state.panel!=='history')return;const labels={beads:'Lần tràng hạt',bow:'Lạy Phật',chant:'Gõ mõ tụng kinh',meditation:'Thiền định'};$('panel-content').innerHTML=data.practices.length?`<p class="lead">Mỗi ngày một chút, từng niệm đều được gìn giữ.</p>${data.practices.map(p=>`<div class="list-row"><div class="list-row-main"><strong>${labels[p.kind]}</strong><small>${esc(p.day)}</small></div><span>${p.kind==='meditation'?Math.floor(p.seconds/60)+' phút '+p.seconds%60+' giây':number(p.amount)+' lượt'}</span></div>`).join('')}`:empty('book-open','Trang đầu còn để ngỏ','Bắt đầu một thời tu. Các hoạt động của bạn sẽ được ghi lại tại đây.');icons();}
async function openSchool(){if(!await ensureUser())return;const u=state.data.user;await panel('Chọn đường thực hành',`<p class="lead">Chọn một thiền phái cho nhân vật. Đây là lựa chọn trong ứng dụng, không phải đăng ký tham gia một tổ chức tôn giáo.</p><div class="list">${[['Tịnh Độ','Lấy niệm Phật làm pháp thực hành.'],['Thiền Tông','Trở về tỉnh thức trong từng hơi thở.'],['Mật Tông','Tìm hiểu truyền thống trì chú.']].map(([name,desc])=>`<div class="list-row">${icon('leaf')}<div class="list-row-main"><strong>${name}</strong><small>${desc}</small></div><button class="secondary-button" data-action="choose-school" data-school="${name}" ${u.school===name?'disabled':''}>${u.school===name?'Đang chọn':'Chọn'}</button></div>`).join('')}</div><p class="small-note">Chọn lần đầu miễn phí. Đổi thiền phái sau đó cần 20 Ngọc.</p>`,'school');}
async function openSettings(){if(!await ensureUser())return;const u=state.data.user;await panel('Cài đặt & nhân vật',`<form id="settings-form"><label>Pháp danh<input name="name" value="${esc(u.name)}" minlength="2" maxlength="30" required></label><div class="color-row"><label>Màu áo<input type="color" name="robe" value="${esc(u.appearance.robe)}"></label><label>Màu da<input type="color" name="skin" value="${esc(u.appearance.skin)}"></label></div><label class="inline-field"><input type="checkbox" name="sound" ${state.sound?'checked':''}>Âm thanh chuông và mõ</label><label>Âm lượng<input type="range" name="volume" min="0" max="1" step="0.05" value="${state.volume}"></label><label>Chất lượng đồ họa<select name="quality"><option value="auto" ${u.settings.quality==='auto'?'selected':''}>Tự động</option><option value="low" ${u.settings.quality==='low'?'selected':''}>Tiết kiệm pin</option><option value="high" ${u.settings.quality==='high'?'selected':''}>Chi tiết cao</option></select></label><label class="inline-field"><input type="checkbox" name="reducedMotion" ${u.settings.reducedMotion?'checked':''}>Giảm chuyển động</label>${errorBox}<button class="primary-button" type="submit">${icon('check')}Lưu thay đổi</button></form><button class="text-link space-top" data-action="history">Xem nhật ký tu tập ${icon('arrow-right')}</button>`,'settings');}
async function openMap(){
  const position=scene?.position()||SPAWN;
  await panel('Bản đồ chùa',`<p class="lead">Chánh điện ở bên trong; sân đá, hồ sen và vườn cây nằm ngoài cửa điện. Chọn một điểm đến để di chuyển.</p><div class="map-layout"><div class="temple-plan">${templeMap(position)}<span class="plan-legend"><span></span>Vị trí của bạn</span></div><div class="destination-list">${Object.entries(DESTINATIONS).map(([id,place])=>`<button class="destination-row" data-action="teleport" data-place="${id}" aria-label="Đi đến ${place.label}">${icon({hall:'church',courtyard:'sun',pond:'flower-2',garden:'leaf',gate:'footprints'}[id])}<span><strong>${place.label}</strong><small>${place.description}</small></span>${icon('arrow-right')}</button>`).join('')}</div></div><div class="map-footer"><button class="secondary-button" data-action="seats">${icon('armchair')}Chọn đệm ngồi</button><button class="text-link" data-action="rooms">${icon('users')}Đổi chùa</button></div>`,'map');
}
async function openHelp(){await panel('Một vòng quanh chùa',`<p class="lead">Sân vườn và chánh điện nối qua cửa điện. Camera theo nhân vật; chọn điểm đến trong bản đồ để đi nhanh.</p><dl class="help-keys"><dt>W A S D</dt><dd>Di chuyển theo góc nhìn</dd><dt>Chạm lối đi</dt><dd>Tự đi đến vị trí đã chọn</dd><dt>Kéo chuột</dt><dd>Xoay góc nhìn</dd><dt>Cuộn chuột</dt><dd>Phóng to, thu nhỏ</dd><dt>Escape</dt><dd>Đóng bảng đang mở</dd></dl><p>Trên điện thoại, kéo cần điều khiển ở góc trái để đi. Thả tay để dừng, vuốt trên cảnh chùa để xoay góc nhìn.</p><h3>Ngồi vào đệm thiền</h3><p>Chạm đệm vàng trong chánh điện hoặc mở nút Chọn đệm ngồi. Nhân vật sẽ tự đi tới chỗ trống và ngồi xuống. Nhấn Đứng dậy hoặc di chuyển để rời chỗ. Pháp danh hiện trên đầu mỗi nhân vật.</p><h3>Góc nhìn trong chùa</h3><p>Chọn chính diện, góc trái, góc phải hoặc nhìn từ trên cao trong ô góc nhìn. Bắt đầu di chuyển để camera trở về theo nhân vật.</p><h3>Giữ hành trình của bạn</h3><p>Tài khoản khách gắn với trình duyệt hiện tại. Tạo tài khoản để giữ nhân vật khi đổi thiết bị.</p><button class="primary-button space-top" data-action="register-form">Tạo tài khoản</button><p class="small-note">Mô hình tượng: The Great Buddha at Kamakura, Scan-the-World, <a href="https://zenodo.org/records/20207851" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>. Đã đổi vật liệu và giải nén mô hình.</p>`,'help');}
async function action(name,button){
  const u=state.data?.user;
  switch(name){
    case 'menu':{const on=$('side-nav').classList.toggle('mobile-open');joystick?.reset();scene?.setInputEnabled(!on&&!state.panel);button.setAttribute('aria-expanded',String(on));return;}
    case 'home':await closePanel();scene?.teleport('hall');document.querySelector('[data-action="overview"]').setAttribute('aria-pressed','false');$('side-nav').classList.remove('mobile-open');return;
    case 'close-panel':$('panel-content').classList.remove('breathing');return closePanel();
    case 'rooms':return openRooms();
    case 'enter-room':if(!u){$('welcome-room').value=button.dataset.room;await closePanel();$('guest-name').focus();return;}await closePanel();return enter(button.dataset.room,u.name);
    case 'account':case 'login-form':return openAccount();
    case 'register-form':return openAccount('register');
    case 'logout':await closePanel();clearInterval(state.pulse);applySnapshot(await api('logout',{}));if(scene){scene.seating?.leave(false);seatStatus(null);scene.active=false;if(scene.player){scene.scene.remove(scene.player);scene.player=null;}}$('online-count').textContent='0';$('welcome').hidden=false;document.body.classList.add('welcome-visible');return toast('Bạn đã đăng xuất.');
    case 'bow':case 'beads':case 'chant':case 'meditation':state.practiceCount=0;return practicePanel(name);
    case 'practice-tick':return tick();
    case 'duration':state.meditationMinutes=Number(button.dataset.minutes);return practicePanel('meditation');
    case 'meditation-start':return startMeditation();
    case 'shop':return openShop();
    case 'inventory':return openInventory();
    case 'offer':return openOffer();
    case 'buy':applySnapshot(await api('shop/buy',{item:button.dataset.item}));await openShop();return toast('Đã thêm vật phẩm vào túi.');
    case 'offer-item':applySnapshot(await api('offer',{item:button.dataset.item}));playTone('bell');await openOffer();return toast('Lễ vật đã được dâng tại chánh điện.');
    case 'use-item':{
      const item=button.dataset.item;if(item==='lantern')return openLanterns();if(item==='robe-moss'){applySnapshot(await api('profile',{appearance:{...u.appearance,robe:'#58694b'}}));scene?.setUser(state.data.user);toast('Đã thay áo tràng xanh rêu.');return;}
      if(item==='companion'){const ride=!scene?.riding;scene?.companion(ride);toast(ride?'Bạn đang cưỡi Hươu an lành. Chọn lại để xuống.':'Bạn đã xuống linh thú.');return closePanel();}
      applySnapshot(await api('offer',{item}));playTone('bell');await openInventory();return toast('Đã dâng lễ tại chánh điện.');
    }
    case 'lanterns':return openLanterns();
    case 'tasks':return openTasks();
    case 'claim-task':applySnapshot(await api('tasks/claim',{task:button.dataset.task}));await openTasks();return toast('Đã nhận Ngọc. Chúc đạo hữu tinh tấn.');
    case 'community':return openCommunity();
    case 'report-message':await api('report',{id:Number(button.dataset.id)});return toast('Đã ghi nhận báo cáo để quản trị viên xem xét.');
    case 'delete-message':await api('message/delete',{id:Number(button.dataset.id)});return loadChat();
    case 'leaderboard':return openLeaderboard();
    case 'history':return openHistory();
    case 'school':return openSchool();
    case 'choose-school':applySnapshot(await api('school',{school:button.dataset.school}));await openSchool();return toast('Đã lưu thiền phái cho nhân vật.');
    case 'settings':return openSettings();
    case 'map':return openMap();
    case 'seats':return openSeats();
    case 'choose-seat':return selectSeat(button.dataset.seat);
    case 'stand':scene?.seating?.leave();return;
    case 'teleport':if(!await ensureUser())return;await closePanel();if(scene?.teleport(button.dataset.place)){state.data.user={...state.data.user,...scene.position()};document.querySelector('[data-action="overview"]').setAttribute('aria-pressed','false');toast(`Đã đến ${DESTINATIONS[button.dataset.place].label}.`);await pulse();}return;
    case 'feedback':if(!await ensureUser())return;return panel('Gửi góp ý',`<p class="lead">Đạo hữu muốn không gian này tốt hơn như thế nào? Góp ý được lưu để quản trị viên đọc.</p><form id="feedback-form"><label>Nội dung góp ý<textarea name="body" minlength="10" maxlength="2000" required placeholder="Điều bạn muốn chia sẻ…"></textarea></label>${errorBox}<button type="submit" class="primary-button">${icon('send')}Gửi góp ý</button></form>`,'feedback');
    case 'help':return openHelp();
    case 'bell':playTone('bell');return toast('Lắng nghe tiếng chuông. Trở về với hơi thở.');
    case 'sound':state.sound=!state.sound;updateSoundButton();if(u)applySnapshot(await api('profile',{settings:{...u.settings,sound:state.sound}}));if(state.sound)playTone('bell');return;
    case 'reset-camera':scene?.resetCamera();document.querySelector('[data-action="overview"]').setAttribute('aria-pressed','false');return;
    case 'overview':{const overview=scene?.toggleOverview()||false;button.setAttribute('aria-pressed',String(overview));return;}
    case 'fullscreen':if(document.fullscreenElement)return document.exitFullscreen();return document.documentElement.requestFullscreen?.().catch(()=>toast('Trình duyệt chưa hỗ trợ chế độ toàn màn hình.'));
    case 'read-sutra':{
      if(!('speechSynthesis'in window))return toast('Trình duyệt này chưa hỗ trợ đọc văn bản.');
      if(speechSynthesis.speaking){speechSynthesis.cancel();return;}
      const voices=speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.startsWith('vi'));
      if(!voice)return toast('Chưa có giọng tiếng Việt trên thiết bị. Bạn có thể đọc bài tụng hoặc dùng tiếng mõ.');
      const utterance=new SpeechSynthesisUtterance(state.data.sutras.find(s=>s.id===$('sutra-select').value).lines.join(' '));utterance.lang='vi-VN';utterance.voice=voice;utterance.rate=.75;utterance.volume=state.volume;speechSynthesis.speak(utterance);return;
    }
  }
}

document.addEventListener('click',async e=>{const button=e.target.closest('button[data-action]');if(!button||button.disabled||!state.data)return;state.lastTrigger=button;const originalDisabled=button.disabled;button.disabled=true;try{await action(button.dataset.action,button);}catch(error){toast(error.message);}finally{if(button.isConnected)button.disabled=originalDisabled;icons();}});
document.addEventListener('submit',async e=>{
  if(!e.target.matches('#welcome-form,#auth-form,#settings-form,#lantern-form,#chat-form,#feedback-form'))return;e.preventDefault();const form=e.target,submit=form.querySelector('[type="submit"]');if(submit.disabled)return;submit.disabled=true;const data=Object.fromEntries(new FormData(form));const errorNode=form.querySelector('[data-error]')||$('welcome-error');errorNode.textContent='';
  try{
    if(!state.data)throw new Error('Chùa đang kết nối. Vui lòng thử lại sau một chút.');
    if(form.id==='welcome-form'){await enter(data.room,data.name);}
    if(form.id==='auth-form'){const result=await api(form.dataset.mode,data);applySnapshot(result);await closePanel();await enter(result.user.room,result.user.name);toast(form.dataset.mode==='register'?'Đã lưu tài khoản và hành trình tu tập.':'Đăng nhập thành công.');}
    if(form.id==='settings-form'){applySnapshot(await api('profile',{name:data.name,appearance:{robe:data.robe,skin:data.skin},settings:{sound:data.sound==='on',volume:Number(data.volume),quality:data.quality,reducedMotion:data.reducedMotion==='on'}}));scene?.setUser(state.data.user);toast('Đã lưu cài đặt.');}
    if(form.id==='lantern-form'){const saved=await api('lantern',{body:data.body});applySnapshot(saved);await closePanel();scene?.launchLantern(saved.lanternId);playTone('bell');toast('Lời nguyện đã theo ánh đèn trên hồ sen.');}
    if(form.id==='chat-form'){await api('message',{body:data.body});form.reset();await loadChat();$('chat-input').focus();}
    if(form.id==='feedback-form'){await api('feedback',{body:data.body});form.reset();toast('Đã lưu góp ý của đạo hữu. Cảm ơn bạn.');}
  }catch(error){if(errorNode.isConnected)errorNode.textContent=error.message;else toast(error.message);}finally{if(submit.isConnected)submit.disabled=false;}
});
document.addEventListener('change',e=>{if(e.target.id==='sutra-select')renderSutra();if(e.target.id==='auto-wood'){clearInterval(chantInterval);if(e.target.checked)chantInterval=setInterval(()=>playTone('wood'),1500);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('side-nav').classList.remove('mobile-open');document.querySelector('.mobile-menu').setAttribute('aria-expanded','false');joystick?.reset();if(state.panel)closePanel().catch(error=>toast(error.message));else scene?.setInputEnabled(true);}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)pulse().catch(()=>{});});
async function init(){
  document.body.classList.add('welcome-visible');icons();
  try{scene=new TempleScene($('scene'));scene.onCharacterSelected=id=>social.openProfile(id);scene.onSeatRequested=id=>selectSeat(id).catch(error=>toast(error.message));scene.onSeatArrived=id=>arriveAtSeat(id);scene.onSeatChange=seatStatus;scene.onSeatLeave=id=>{state.seatChanged=Date.now();if(state.data?.user){state.data.user.seatId=null;api('seat/release',{seatId:id}).then(saved=>{if(!scene.seating.target){state.data.seats=saved.seats;scene.seating.updateClaims(saved.seats);}}).catch(()=>{});}};scene.onCameraChange=name=>{$('camera-view').value=name;document.querySelector('[data-action=overview]').setAttribute('aria-pressed',String(name==='high'));};scene.onLocationChange=(_id,place)=>{document.querySelector('#location-label > span:not(.location-rule)').textContent=place.label;};joystick=new VirtualJoystick($('move-stick'),vector=>scene.setMoveInput(vector.x,vector.z));}catch(error){document.body.classList.add('no-3d');$('scene-fallback').hidden=false;console.warn('3D unavailable:',error.message);}
  try{applySnapshot(await api('bootstrap'));if(state.data.user){$('guest-name').value=state.data.user.name;await enter(state.data.user.room,state.data.user.name);}}
  catch(error){$('welcome-error').textContent=error.message;}
}
$('camera-view').addEventListener('change',event=>scene?.setCameraPreset(event.target.value));
social=new TempleSocial({api,icon,icons,panel,closePanel,getData:()=>state.data,ensureUser,stopMoving:()=>{joystick?.reset();scene?.stopMoving();}});
init();
