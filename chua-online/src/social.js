const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=value=>new Date(value*1000).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});

export class TempleSocial {
  constructor({api,icon,icons,panel,closePanel,getData,ensureUser,stopMoving}){
    Object.assign(this,{api,icon,icons,panel,closePanel,getData,ensureUser,stopMoving});this.mode='room';this.peers=[];this.generation=0;this.profileRequest=0;this.drafts=new Map();
    const root=document.createElement('div');root.id='social-ui';root.innerHTML=`<button id="chat-toggle" class="chat-toggle" data-social="toggle" aria-expanded="false" aria-controls="social-chat">${icon('message-circle')}<span>Trò chuyện</span><span id="chat-unread" class="chat-unread" hidden></span></button><section id="social-chat" class="social-chat" aria-labelledby="social-title" hidden><header class="social-header"><h2 id="social-title">Trò chuyện</h2><button class="icon-button" data-social="close" aria-label="Thu gọn trò chuyện">${icon('chevron-down')}</button></header><nav class="social-tabs" aria-label="Kênh trò chuyện"><button data-social="room" aria-pressed="true">Trong chùa</button><button data-social="inbox" aria-pressed="false">Tin riêng</button><button data-social="people" aria-pressed="false">Đạo hữu</button></nav><div id="social-context" class="social-context"></div><div id="social-log" class="social-log" role="log" aria-label="Nội dung trò chuyện" aria-live="polite" aria-relevant="additions text"></div><button id="social-latest" class="social-latest" data-social="latest" hidden>Tin mới · Xuống cuối ${icon('chevron-down')}</button><form id="social-form" class="social-form"><label id="social-input-label" for="social-input">Gửi lời trong chùa</label><div><input id="social-input" name="body" maxlength="300" autocomplete="off" required placeholder="Gửi một lời chào an lành…"><button type="submit" class="primary-button" aria-label="Gửi tin nhắn">${icon('send')}</button></div><p class="form-error" id="social-error" role="alert"></p></form></section>`;document.body.append(root);
    root.addEventListener('click',event=>this.handle(event).catch(error=>this.error(error.message)));
    document.addEventListener('click',event=>{const button=event.target.closest('[data-social-profile-action]');if(!button)return;event.preventDefault();if(button.dataset.socialProfileAction==='message')this.direct(this.profile).catch(error=>this.error(error.message));else this.block(button).catch(error=>{const node=$('member-error');if(node)node.textContent=error.message;});});
    $('social-form').addEventListener('submit',event=>{event.preventDefault();this.send().catch(error=>this.error(error.message));});
    $('social-input').addEventListener('focus',()=>this.stopMoving());
    $('social-input').addEventListener('input',()=>this.drafts.set(this.key(),$('social-input').value));
    $('social-log').addEventListener('scroll',()=>{if(this.atBottom())$('social-latest').hidden=true;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('social-chat').hidden&&!document.body.classList.contains('panel-open'))this.hide();});
  }
  key(){return this.mode==='direct'?`direct:${this.peer.id}`:`${this.mode}:${this.getData()?.user?.room}`;}
  error(message){$('social-error').classList.remove('social-notice');$('social-error').setAttribute('role','alert');$('social-error').textContent=message;$('social-error').hidden=false;}
  notice(message){$('social-error').classList.add('social-notice');$('social-error').setAttribute('role','status');$('social-error').textContent=message;}
  sync(data){
    const user=data?.user;if(!user){this.hide();this.userId=null;this.peers=[];this.drafts.clear();$('chat-unread').hidden=true;return;}
    if(this.userId!==user.id){this.hide();this.drafts.clear();this.userId=user.id;this.mode='room';this.peer=null;}
    if(this.room!==user.room){this.room=user.room;this.peers=[];if(this.mode==='room'||this.mode==='people'){this.generation++;this.shell();}}
  }
  presence(peers,unread=0){
    this.peers=peers;$('chat-unread').textContent=unread>99?'99+':String(unread);$('chat-unread').hidden=!unread;
    $('chat-toggle').setAttribute('aria-label',unread?`Trò chuyện, ${unread} tin riêng chưa đọc`:'Trò chuyện');
    if(!$('social-chat').hidden&&!document.hidden)this.refresh().catch(error=>this.error(error.message));
  }
  async show(mode=this.mode){if(!await this.ensureUser())return;this.mode=mode;this.generation++;$('social-chat').hidden=false;$('chat-toggle').setAttribute('aria-expanded','true');document.body.classList.add('chat-open');this.shell();await this.refresh();}
  hide(){$('social-chat').hidden=true;$('chat-toggle').setAttribute('aria-expanded','false');document.body.classList.remove('chat-open');this.generation++;}
  shell(){
    const data=this.getData(),room=data?.rooms.find(r=>r.id===data.user?.room)?.name||'chùa';
    document.querySelectorAll('.social-tabs button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.social===(this.mode==='direct'?'inbox':this.mode))));
    $('social-context').innerHTML=this.mode==='direct'?`<button class="text-link" data-social="inbox">${this.icon('chevron-left')}Tin riêng</button><button class="member-link" data-social="profile" data-id="${escape(this.peer.id)}">${escape(this.peer.name)}</button>`:this.mode==='room'?`<span>${escape(room)}</span><small>Mọi người trong chùa đều đọc được.</small>`:this.mode==='inbox'?'<span>Hộp tin riêng của bạn</span>':'<span>Đạo hữu đang ở cùng chùa</span><small>Chọn tên hoặc chạm vào nhân vật để xem hồ sơ.</small>';
    $('social-log').innerHTML='<p class="social-empty">Đang kết nối…</p>';$('social-log').dataset.fingerprint='';this.shown=[];this.readThrough=0;
    $('social-form').hidden=!['room','direct'].includes(this.mode);$('social-input').disabled=false;$('social-input-label').textContent=this.mode==='direct'?`Nhắn riêng tới ${this.peer.name}`:'Gửi lời trong chùa';$('social-input').value=this.drafts.get(this.key())||'';$('social-form').querySelector('button').disabled=false;$('social-error').textContent='';$('social-latest').hidden=true;this.icons();
  }
  atBottom(){const log=$('social-log');return log.scrollHeight-log.scrollTop-log.clientHeight<65;}
  latest(){$('social-log').scrollTop=$('social-log').scrollHeight;$('social-latest').hidden=true;}
  async refresh(){
    if(this.loading)return;this.loading=true;const generation=this.generation,mode=this.mode,peer=this.peer;
    try{
      if(mode==='people'){this.renderPeople();return;}
      const result=await this.api(mode==='room'?'messages':mode==='inbox'?'direct/threads':'direct/messages',undefined,mode==='direct'?{peer:peer.id}:{});
      if(generation!==this.generation||$('social-chat').hidden)return;
      if(mode==='inbox'){
        const fingerprint=JSON.stringify(result.threads);if($('social-log').dataset.fingerprint!==fingerprint){$('social-log').innerHTML=result.threads.length?result.threads.map(t=>`<button class="social-person" data-social="direct" data-id="${escape(t.peer.id)}" data-name="${escape(t.peer.name)}"><span><strong>${escape(t.peer.name)}</strong><small>${escape(t.body)}</small></span><span>${t.unread?`<b class="thread-count">${t.unread}</b>`:time(t.createdAt)}</span></button>`).join(''):'<div class="social-empty"><p>Chưa có tin riêng.</p><button class="text-link" data-social="people">Chọn một đạo hữu để bắt đầu</button></div>';$('social-log').dataset.fingerprint=fingerprint;}return;
      }
      if(mode==='direct'){$('social-input').disabled=result.blocked;$('social-form').querySelector('button').disabled=result.blocked;if(result.blocked)this.error('Cuộc trò chuyện đang bị chặn. Mở hồ sơ để bỏ chặn nếu bạn đã chặn đạo hữu.');else if(this.wasBlocked)$('social-error').textContent='';this.wasBlocked=result.blocked;}
      this.renderMessages([...result.messages].reverse(),mode);
      const incoming=mode==='direct'?result.messages.filter(m=>m.user_id!==this.userId):[],through=incoming.length?Math.max(...incoming.map(m=>m.id)):0;
      if(through>this.readThrough&&!document.hidden&&!document.body.classList.contains('panel-open')){await this.api('direct/read',{peer:peer.id,through});if(generation===this.generation)this.readThrough=through;}
    }finally{this.loading=false;if(generation!==this.generation&&!$('social-chat').hidden)this.refresh().catch(error=>this.error(error.message));}
  }
  renderMessages(messages,mode){
    const log=$('social-log'),fingerprint=JSON.stringify(messages);if(log.dataset.fingerprint===fingerprint)return;
    const bottom=this.atBottom()||!this.shown.length,append=this.shown.length&&messages.length>=this.shown.length&&this.shown.every((m,i)=>JSON.stringify(m)===JSON.stringify(messages[i]));
    const html=(append?messages.slice(this.shown.length):messages).map(m=>{const mine=m.user_id===this.userId,name=mine?this.getData().user.name:mode==='direct'?this.peer.name:m.name;return `<article class="social-message ${mine?'my-message':''}" data-message-id="${m.id}"><div><button class="member-link" data-social="profile" data-id="${escape(m.user_id)}">${escape(name)}</button><time>${time(m.created_at)}</time><button class="icon-button" data-social="${mine?'delete':'report'}" data-id="${m.id}" aria-label="${mine?'Xóa tin nhắn của tôi':'Báo cáo tin nhắn'}">${this.icon(mine?'trash-2':'flag')}</button></div><p>${escape(m.body)}</p></article>`;}).join('');
    if(append)log.insertAdjacentHTML('beforeend',html);else log.innerHTML=html||'<p class="social-empty">Chưa có tin nhắn. Gửi một lời chào để bắt đầu.</p>';
    this.shown=messages;log.dataset.fingerprint=fingerprint;this.icons();if(bottom)this.latest();else $('social-latest').hidden=false;
  }
  renderPeople(){
    const log=$('social-log'),fingerprint=JSON.stringify(this.peers.map(p=>[p.id,p.name,p.state]));if(log.dataset.fingerprint===fingerprint)return;
    log.innerHTML=this.peers.length?this.peers.map(p=>`<button class="social-person" data-social="profile" data-id="${escape(p.id)}">${this.icon('user-round')}<span><strong>${escape(p.name)}</strong><small>${p.seatId?'Đang ngồi tu tập':'Đang ở chùa'}</small></span>${this.icon('chevron-right')}</button>`).join(''):'<p class="social-empty">Hiện chỉ có bạn trong chùa này. Khi có người vào, họ sẽ xuất hiện tại đây.</p>';log.dataset.fingerprint=fingerprint;this.icons();
  }
  async handle(event){
    const button=event.target.closest('button[data-social]');if(!button||button.disabled)return;const action=button.dataset.social;
    if(action==='toggle'){if($('social-chat').hidden){if(document.body.classList.contains('panel-open'))await this.closePanel();await this.show();}else this.hide();}
    else if(action==='close'){this.hide();$('chat-toggle').focus();}
    else if(['room','inbox','people'].includes(action))await this.show(action);
    else if(action==='profile')await this.openProfile(button.dataset.id);
    else if(action==='direct')await this.direct({id:button.dataset.id,name:button.dataset.name});
    else if(action==='latest')this.latest();
    else if(action==='delete'||action==='report'){
      button.disabled=true;try{await this.api(this.mode==='direct'?`direct/${action}`:action==='delete'?'message/delete':'report',{id:Number(button.dataset.id)});if(action==='delete')await this.refresh();else this.notice('Đã gửi báo cáo để quản trị viên xem xét.');}finally{if(button.isConnected)button.disabled=false;}
    }
  }
  async send(){
    const input=$('social-input'),button=$('social-form').querySelector('button'),body=input.value.trim(),key=this.key(),mode=this.mode;if(!body||button.disabled)return;button.disabled=true;input.disabled=true;$('social-error').textContent='';
    try{await this.api(mode==='direct'?'direct/send':'message',mode==='direct'?{peer:this.peer.id,body}:{body});this.drafts.delete(key);if(key===this.key()){input.value='';await this.refresh();this.latest();}}
    finally{if(key===this.key()){input.disabled=false;button.disabled=false;input.focus();}}
  }
  async direct(peer){if(!peer||peer.id===this.userId)return;await this.closePanel();this.peer=peer;await this.show('direct');$('social-input').focus();}
  async openProfile(id){
    if(!await this.ensureUser())return;const request=++this.profileRequest;await this.panel('Hồ sơ đạo hữu','<p class="lead">Đang mở hồ sơ…</p>','member');
    try{
      const result=await this.api('member',undefined,{id});if(request!==this.profileRequest||$('panel').hidden||$('panel-title').textContent!=='Hồ sơ đạo hữu')return;
      const p=result.member;this.profile=p;const own=p.id===this.userId,room=this.getData().rooms.find(r=>r.id===p.room)?.name;
      $('panel-content').innerHTML=`<div class="member-heading">${this.icon('user-round')}<div><h3>${escape(p.name)}</h3><p>${p.online?`Đang ở ${escape(room||'chùa')}`:'Hiện không trực tuyến'}</p></div></div><dl class="member-facts"><div><dt>Thiền phái</dt><dd>${escape(p.school||'Chưa chọn')}</dd></div><div><dt>Tham gia</dt><dd>${escape(new Date(p.joined+'T00:00:00').toLocaleDateString('vi-VN'))}</dd></div><div><dt>Lạy Phật</dt><dd>${p.stats.bow.toLocaleString('vi-VN')} lượt</dd></div><div><dt>Tràng hạt</dt><dd>${p.stats.beads.toLocaleString('vi-VN')} lượt</dd></div><div><dt>Tụng kinh</dt><dd>${p.stats.chant.toLocaleString('vi-VN')} lượt</dd></div><div><dt>Thiền định</dt><dd>${Math.floor(p.stats.meditation/60).toLocaleString('vi-VN')} phút</dd></div></dl><p class="small-note">Thống kê hoạt động trong ứng dụng, không đo lường công đức hay giá trị tâm linh.</p>${own?'<p class="lead">Đây là hồ sơ công khai của bạn.</p>':`<button class="primary-button member-message" data-social-profile-action="message">${this.icon('send')}Nhắn riêng</button><button class="text-link space-top" data-social-profile-action="block" data-blocked="${p.blocked}">${p.blocked?'Bỏ chặn tin riêng':'Chặn tin riêng'}</button>`}<p class="form-error" id="member-error" role="alert"></p>`;this.icons();
    }catch(error){if(request===this.profileRequest&&$('panel-title').textContent==='Hồ sơ đạo hữu')$('panel-content').innerHTML=`<p class="form-error" role="alert">${escape(error.message)}</p>`;}
  }
  async block(button){button.disabled=true;try{await this.api('user/block',{peer:this.profile.id,blocked:button.dataset.blocked!=='true'});await this.openProfile(this.profile.id);}finally{if(button.isConnected)button.disabled=false;}}
}
