import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildSanctuary } from './sanctuary.js';
import { HALL, BOUNDS, SPAWN, BASINS, seatById } from './world-layout.js';
import { SeatController } from './seating.js';
import {pickCharacter} from './character-picking.js';
import {setCharacterName,disposeCharacterName,animateCharacter} from './characters.js';
import { DESTINATIONS, safePosition, groundHeight, moveOnGround, planPath, locationAt } from './navigation.js';

const clamp=T.MathUtils.clamp;
const material=(color,options={})=>new T.MeshStandardMaterial({color,roughness:.8,...options});
const palette={stone:material('#747b70'),step:material('#8b9180'),wood:material('#492c20'),red:material('#783e29'),gold:material('#c6a058',{metalness:.65,roughness:.4}),roof:material('#29493d',{metalness:.15,roughness:.7}),leaf:material('#254d3c'),darkLeaf:material('#183d32'),bark:material('#4e4b34'),glow:material('#ffd38a',{emissive:'#ffab37',emissiveIntensity:1.8}),pink:material('#b88280'),water:material('#245b60',{metalness:.55,roughness:.23})};

export class TempleScene {
  constructor(container) {
    this.container=container;this.scene=new T.Scene();this.scene.background=new T.Color('#263e48');this.scene.fog=new T.FogExp2('#314d51',.013);
    this.camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.1,160);this.camera.position.set(22,19,91);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    container.append(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost',()=>{document.getElementById('scene-fallback').hidden=false;});
    this.renderer.domElement.addEventListener('webglcontextrestored',()=>{document.getElementById('scene-fallback').hidden=true;});
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,4,36);this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.minDistance=8;this.controls.maxDistance=110;this.controls.maxPolarAngle=1.5;this.controls.minPolarAngle=.06;this.controls.enablePan=false;
    this.keys={};this.moveInput={x:0,z:0};this.velocity=new T.Vector3();this.path=[];this.walkPhase=0;this.inputEnabled=true;this.overview=false;this.peers=new Map();this.lanterns=new Map();this.elapsed=0;this.clock=new T.Clock();this.active=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.buildWorld();this.seating=new SeatController(this);this.staticMeshes=[];this.scene.traverse(o=>{if(o.isMesh)this.staticMeshes.push(o);});
    this.worldOccluders=[];this.scene.traverse(object=>{if(!object.isMesh||object.userData.ignoreOcclusion)return;for(let parent=object.parent;parent;parent=parent.parent)if(parent.userData.occlusionGroup){this.worldOccluders.push(object);break;}});this.occlusionFades=new Map();this.scene.updateMatrixWorld(true);
    window.addEventListener('resize',()=>this.resize());
    window.addEventListener('keydown',e=>{if(!this.inputEnabled||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){this.keys[e.key.toLowerCase()]=true;e.preventDefault();}});
    window.addEventListener('keyup',e=>{this.keys[e.key.toLowerCase()]=false;});window.addEventListener('blur',()=>this.stopMoving());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stopMoving();});
    let tap=null;
    this.renderer.domElement.addEventListener('pointerdown',event=>{if(tap)tap=null;else if(event.button===0)tap={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};},{capture:true});
    this.renderer.domElement.addEventListener('pointermove',event=>{if(tap&&tap.id===event.pointerId&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>7)tap.moved=true;},{capture:true});
    this.renderer.domElement.addEventListener('pointerup',event=>{const last=tap;tap=null;if(last&&last.id===event.pointerId&&!last.moved)this.walkToScreen(event.clientX,event.clientY);},{capture:true});
    this.renderer.domElement.addEventListener('pointercancel',()=>{tap=null;});
    this.renderer.domElement.addEventListener('lostpointercapture',()=>{tap=null;});
    window.addEventListener('blur',()=>{tap=null;});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)tap=null;});
    this.destinationMarker=this.mesh(new T.RingGeometry(.27,.34,40),new T.MeshBasicMaterial({color:'#ddbc7a',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));this.destinationMarker.rotation.x=-Math.PI/2;this.destinationMarker.castShadow=false;this.destinationMarker.visible=false;
    this.renderer.setAnimationLoop(()=>this.animate());
  }
  mesh(geometry,mat,x=0,y=0,z=0,parent=this.scene){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  box(w,h,d,mat,x,y,z,parent){return this.mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent);}
  cylinder(rt,rb,h,mat,x,y,z,parent,segments=16){return this.mesh(new T.CylinderGeometry(rt,rb,h,segments),mat,x,y,z,parent);}
  ball(radius,mat,x,y,z,parent){return this.mesh(new T.SphereGeometry(radius,20,14),mat,x,y,z,parent);}
  beam(from,to,r,mat,parent=this.scene){const a=new T.Vector3(...from),b=new T.Vector3(...to),m=this.mesh(new T.CylinderGeometry(r,r,a.distanceTo(b),10),mat,0,0,0,parent);m.position.copy(a).lerp(b,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());return m;}
  buildWorld(){buildSanctuary(this);}
  avatar(appearance={}){
    const g=new T.Group(),body=new T.Group(),arms=[],feet=[];g.add(body);const robe=material(appearance.robe||'#747d69'),skin=material(appearance.skin||'#bb8963');
    this.cylinder(.26,.4,.85,robe,0,.65,0,body,20);this.ball(.27,skin,0,1.35,0,body);this.ball(.09,skin,-.27,1.33,0,body);this.ball(.09,skin,.27,1.33,0,body);
    const eyes=material('#372c22');for(const s of [-1,1]){
      this.ball(.021,eyes,s*.09,1.39,.25,body);
      const arm=new T.Group();arm.position.set(s*.26,.96,0);body.add(arm);this.beam([0,0,0],[s*.035,-.4,.02],.09,robe,arm);this.ball(.085,skin,s*.035,-.43,.02,arm);arms.push(arm);
      feet.push(this.box(.15,.12,.3,palette.wood,s*.17,.1,.05,g));
    }
    this.cylinder(.2,.23,.08,palette.gold,0,1.07,0,body);const foldedLegs=new T.Group();g.add(foldedLegs);for(const side of [-1,1]){const leg=this.ball(.37,robe,side*.2,.13,.15,foldedLegs);leg.scale.set(1.15,.48,1);leg.rotation.y=side*.5;}foldedLegs.visible=false;g.userData.rig={body,arms,feet,foldedLegs};return g;
  }
  setUser(user,{restorePosition=false}={}){
    if(!user)return;const old=this.player,keepView=!!old&&!restorePosition&&this.userId===user.id;const saved=keepView?old.position:{x:user.x??0,z:user.z??12};const p=safePosition(saved.x,saved.z,{seatId:user.seatId});
    if(old){disposeCharacterName(old);this.scene.remove(old);}this.userId=user.id;this.player=this.avatar(user.appearance);this.player.position.set(p.x,groundHeight(p.x,p.z),p.z);this.player.rotation.y=keepView?old.rotation.y:Math.atan2(-p.x,-11-p.z);this.scene.add(this.player);setCharacterName(this.player,user.name);this.state='idle';this.active=true;this.stopMoving();this.applySettings(user.settings);this.seating?.restore(user);if(!keepView)this.overview=false;if(!this.overview)this.focusPlayer(!keepView);this.updateLocation();
  }
  applySettings(settings={}){this.quality=settings.quality||'auto';this.reduced=settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;this.renderer.setPixelRatio(settings.quality==='low'?1:Math.min(devicePixelRatio,settings.quality==='high'?2:1.5));this.renderer.shadowMap.enabled=settings.quality!=='low';if(this.floorReflection)this.floorReflection.visible=settings.quality!=='low';if(this.floorSurface)this.floorSurface.material.opacity=settings.quality==='low'?1:.8;}
  setRoom(id){const themes={'an-lac':['#788a90','#7a8784',1.1],'truc-lam':['#b2bdb4','#a5b2aa',1.2],'tinh-tam':['#b28a74','#ab9580',1.1]};const [bg,fog,exposure]=themes[id]||themes['an-lac'];this.scene.background.set(bg);this.scene.fog.color.set(fog);this.renderer.toneMappingExposure=exposure;this.scene.fog.density=.0048;}
  updatePeers(peers){const ids=new Set(peers.map(p=>p.id));for(const[id,g]of this.peers)if(!ids.has(id)){disposeCharacterName(g);this.scene.remove(g);this.peers.delete(id);}for(const p of peers){const seat=seatById(p.seatId),point=safePosition(p.x,p.z,{seatId:seat?.id}),target=new T.Vector3(point.x,groundHeight(point.x,point.z)+(seat?.38:0),point.z);let g=this.peers.get(p.id);if(!g){g=this.avatar(p.appearance);this.peers.set(p.id,g);this.scene.add(g);g.position.copy(target);}setCharacterName(g,p.name);g.userData.target=target;g.userData.state=p.state;g.userData.seated=!!seat;if(seat)g.rotation.y=Math.PI;}}
  updateLanterns(list){for(const item of list)if(!this.lanterns.has(item.id)){const i=this.lanterns.size;const g=new T.Group();const basin=BASINS[0],x=basin.x+Math.sin(i*2.4)*1.3,z=basin.z+Math.cos(i*2.4)*2.8;g.position.set(x,.5,z);g.userData.baseHeight=.5;for(let j=0;j<8;j++){const a=j*Math.PI/4;const petal=this.ball(.15,palette.pink,Math.sin(a)*.22,0,Math.cos(a)*.22,g);petal.scale.y=.6;}this.cylinder(.09,.12,.15,palette.glow,0,.12,0,g);this.scene.add(g);this.lanterns.set(item.id,g);}}
  launchLantern(id){if(!id)return;this.updateLanterns([{id}]);const g=this.lanterns.get(id);g.userData.riseStarted=this.elapsed;g.userData.baseHeight=2;g.position.y=this.reduced?2:.08;}
  companion(show){if(this.companionMesh){this.scene.remove(this.companionMesh);this.companionMesh=null;}this.riding=show;if(!show)return;const g=new T.Group(),fur=material('#b68c55');this.ball(.25,fur,0,.45,0,g).scale.set(.65,.9,1.7);this.ball(.18,fur,0,.8,-.35,g);for(const x of [-.12,.12])for(const z of [-.22,.22])this.beam([x,.4,z],[x,.05,z],.045,fur,g);for(const x of [-.1,.1]){this.beam([x,.9,-.35],[x*2,1.23,-.45],.035,palette.gold,g);this.beam([x*1.5,1.08,-.4],[x*3,1.15,-.31],.025,palette.gold,g);}g.scale.setScalar(1.7);this.scene.add(g);this.companionMesh=g;}
  setState(state){if(state==='bow')this.seating?.leave();this.state=state;if(state!=='walk')this.stopMoving();}
  setMoveInput(x,z){if(!this.inputEnabled)return;this.moveInput={x:clamp(Number(x)||0,-1,1),z:clamp(Number(z)||0,-1,1)};if(x||z)this.path=[];}
  stopMoving(){this.seating?.cancelJourney();this.keys={};this.moveInput={x:0,z:0};this.path=[];this.velocity.set(0,0,0);if(this.state==='walk')this.state='idle';if(this.destinationMarker)this.destinationMarker.visible=false;}
  setInputEnabled(enabled){this.inputEnabled=enabled;if(!enabled)this.stopMoving();}
  teleport(place){
    const target=DESTINATIONS[place];if(!this.player||!target)return false;
    this.seating?.leave();const p=safePosition(target.x,target.z);this.stopMoving();this.state='idle';this.player.rotation.x=0;this.player.scale.y=1;this.player.position.set(p.x,groundHeight(p.x,p.z)+(this.riding?.7:0),p.z);
    this.player.rotation.y=Math.atan2(-p.x,-11-p.z);this.currentView='follow';this.overview=false;this.onCameraChange?.('follow');this.focusPlayer(true);if(this.companionMesh)this.companionMesh.position.copy(this.player.position).add(new T.Vector3(0,-.7,0));this.updateLocation();return true;
  }
  focusPlayer(resetView=false){
    if(!this.player)return;
    const views={hall:[0,2.2,13.8],courtyard:[0,.9,23],pond:[10,3,14],garden:[-11,3,14],gate:[0,.9,14]};
    const offset=resetView?new T.Vector3(...views[locationAt(this.player.position.x,this.player.position.z)]):this.camera.position.clone().sub(this.controls.target);
    if(resetView){this.camera.fov=55;this.camera.updateProjectionMatrix();if(locationAt(this.player.position.x,this.player.position.z)==='hall'&&this.player.position.z<0)offset.z=20;}
    this.controls.target.copy(this.player.position).add(new T.Vector3(0,this.focusHeight(),0));this.camera.position.copy(this.controls.target).add(offset);
    const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=damping;
  }
  focusHeight(){return this.player&&this.player.position.z<25.4&&Math.abs(this.player.position.x)<21?4:6;}
  resetCamera(){this.currentView='follow';this.overview=false;this.onCameraChange?.('follow');if(this.player)this.focusPlayer(true);else{this.camera.position.set(0,6.8,25);this.controls.target.set(0,4,-1);this.controls.update();}}
  setCameraPreset(name){
    if(name==='follow'){this.resetCamera();return;}
    const views={front:{eye:[0,7,28],target:[0,4,-3]},left:{eye:[-10.5,8,13],target:[0,5.5,-8.8]},right:{eye:[10.5,8,13],target:[0,5.5,-8.8]},courtyard:{eye:[28,23,87],target:[0,5,36]},high:{eye:[0,92,33],target:[0,0,33]}};
    const view=views[name];if(!view)return;this.stopMoving();this.currentView=name;this.overview=true;this.camera.fov=name==='high'?70:55;this.camera.updateProjectionMatrix();this.camera.position.set(...view.eye);this.controls.target.set(...view.target);const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=damping;this.onCameraChange?.(name);
  }
  toggleOverview(){if(this.overview){this.resetCamera();return false;}this.setCameraPreset('high');return true;}
  updateLocation(){if(!this.player)return;const place=locationAt(this.player.position.x,this.player.position.z);if(place!==this.location){this.location=place;this.onLocationChange?.(place,DESTINATIONS[place]);}}
  walkToScreen(clientX,clientY){
    if(!this.player||!this.active||!this.inputEnabled)return;
    const bounds=this.renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-bounds.left)/bounds.width*2-1,-(clientY-bounds.top)/bounds.height*2+1),this.camera);
    this.player.userData.characterId=this.userId;for(const[id,g]of this.peers)g.userData.characterId=id;
    const character=pickCharacter(ray,[this.player,...this.peers.values()],this.staticMeshes);if(character){this.stopMoving();this.onCharacterSelected?.(character);return;}
    const seat=this.seating?.pick(ray);if(seat){this.onSeatRequested?.(seat.id);return;}
    const deck=ray.intersectObjects(this.walkSurfaces||[],false)[0];const target=deck?.point||ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-.13),new T.Vector3());if(!target||target.x<BOUNDS.left||target.x>BOUNDS.right||target.z<BOUNDS.back||target.z>BOUNDS.front)return;
    this.seating?.leave();const path=planPath(this.player.position,{x:target.x,z:target.z});if(!path.length)return;
    this.path=path;this.moveInput={x:0,z:0};this.keys={};const goal=path.at(-1);this.destinationMarker.position.set(goal.x,groundHeight(goal.x,goal.z)+.025,goal.z);this.destinationMarker.visible=true;
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
  position(){const seated=this.seating?.seated;return{x:this.player?.position.x??SPAWN.x,z:this.player?.position.z??SPAWN.z,state:seated&&!['meditation','beads','chant'].includes(this.state)?'seated':this.state||'idle',seatId:seated?this.seating.target.id:null,releaseSeatId:this.seating?.lastReleasedId||null};}
  animate(){
    const dt=Math.min(this.clock.getDelta(),.05);this.elapsed+=dt;
    if(document.hidden)return;
    if(this.player&&this.active)this.updatePlayer(dt);
    for(const g of this.peers.values()){g.position.lerp(g.userData.target,1-Math.exp(-8*dt));g.scale.y=1;if(g.userData.nameLabel)g.userData.nameLabel.visible=this.camera.position.distanceTo(g.position)<42;this.animateAvatar(g,g.userData.state==='walk',this.elapsed*8);}
    if(!this.reduced){for(const f of this.fireflies.children){const b=f.userData.base;f.position.y=b.y+Math.sin(this.elapsed*.65+b.x)*.2;f.position.x=b.x+Math.sin(this.elapsed*.3+b.z)*.35;}for(const g of this.lanterns.values()){const start=g.userData.riseStarted;const t=start===undefined?1:clamp((this.elapsed-start)/4,0,1);const height=start===undefined?g.userData.baseHeight:.08+(g.userData.baseHeight-.08)*(1-Math.pow(1-t,3));g.position.y=height+Math.sin(this.elapsed*.8+g.position.x)*.04;}}
    this.controls.update();if(!this.overview){const interior=this.player&&this.player.position.z<25&&Math.abs(this.player.position.x)<21;this.camera.position.x=clamp(this.camera.position.x,interior?HALL.left+.2:BOUNDS.left+.2,interior?HALL.right-.2:BOUNDS.right-.2);this.camera.position.z=Math.max(HALL.back+.3,this.camera.position.z);if(this.player?.position.z>26)this.camera.position.z=Math.max(27.2,this.camera.position.z);else if(this.player?.position.x>22)this.camera.position.x=Math.max(23.2,this.camera.position.x);else if(this.player?.position.x<-22)this.camera.position.x=Math.min(-23.2,this.camera.position.x);this.camera.lookAt(this.controls.target);}for(const roof of this.hallRoofs||[])roof.visible=this.camera.position.y<HALL.ceiling-.4;const inside=this.player&&this.player.position.z<25.4&&Math.abs(this.player.position.x)<21,cutaway=(!this.overview&&inside&&this.camera.position.z>25)||['front','left','right','high'].includes(this.currentView);if(this.frontFacade)this.frontFacade.visible=!cutaway;for(const screen of this.frontScreens||[])screen.visible=!cutaway;if(this.exteriorRoof)this.exteriorRoof.visible=!cutaway&&this.camera.position.z>27&&this.camera.position.y<45;if(this.floorReflection){this.floorReflection.visible=this.quality!=='low'&&this.camera.position.z<28&&this.camera.position.y<16&&Math.abs(this.camera.position.x)<22;if(this.floorSurface)this.floorSurface.material.opacity=this.floorReflection.visible?.8:1;}if(this.player?.userData.nameLabel)this.player.userData.nameLabel.visible=this.camera.position.distanceTo(this.player.position)<42;this.updateOcclusion();this.renderer.render(this.scene,this.camera);
  }
  updateOcclusion(){
    if(!this.worldOccluders||!this.occlusionFades)return;
    const faded=new Set();
    if(this.player&&this.active&&!this.overview){
      const visible=object=>{for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;};
      const candidates=this.worldOccluders.filter(visible),ray=new T.Raycaster();
      for(const height of [.45,1.25]){
        const target=this.player.position.clone().add(new T.Vector3(0,height,0)),direction=target.sub(this.camera.position),distance=direction.length();
        ray.set(this.camera.position,direction.normalize());ray.far=Math.max(0,distance-.25);
        for(const hit of ray.intersectObjects(candidates,false)){
          let group=hit.object;for(let parent=hit.object.parent;parent;parent=parent.parent)if(parent.userData.occlusionGroup){group=parent;break;}
          group.traverse(mesh=>{if(mesh.isMesh)faded.add(mesh);});
        }
      }
    }
    for(const [mesh,original]of this.occlusionFades)if(!faded.has(mesh)){mesh.material=original;this.occlusionFades.delete(mesh);}
    for(const mesh of faded)if(!this.occlusionFades.has(mesh)){
      this.occlusionFades.set(mesh,mesh.material);
      if(!mesh.userData.seeThroughMaterial){const transparent=mesh.material.clone();transparent.transparent=true;transparent.opacity=.13;transparent.depthWrite=false;mesh.userData.seeThroughMaterial=transparent;}
      mesh.material=mesh.userData.seeThroughMaterial;
    }
  }
  updatePlayer(dt){
    const k=this.keys,manual=new T.Vector3((k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0)+this.moveInput.x,0,(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0)+this.moveInput.z);
    let desired=new T.Vector3();
    if(this.inputEnabled){
      if(manual.lengthSq()>.001){this.seating?.leave();if(this.overview)this.resetCamera();this.path=[];if(this.destinationMarker)this.destinationMarker.visible=false;desired.copy(manual).clampLength(0,1).applyAxisAngle(new T.Vector3(0,1,0),this.controls.getAzimuthalAngle());}
      else if(this.path.length){
        if(this.overview)this.resetCamera();
        while(this.path.length&&Math.hypot(this.path[0].x-this.player.position.x,this.path[0].z-this.player.position.z)<.18)this.path.shift();
        if(this.path.length){const next=this.path[0];desired.set(next.x-this.player.position.x,0,next.z-this.player.position.z).normalize();}
        else{this.velocity.set(0,0,0);if(this.destinationMarker)this.destinationMarker.visible=false;}
      }
    }
    desired.multiplyScalar(this.riding?4.8:3.6);this.velocity.lerp(desired,1-Math.exp(-12*dt));
    if(this.velocity.lengthSq()<.002)this.velocity.set(0,0,0);
    const previous=this.player.position.clone(),next=moveOnGround(previous,this.velocity.x*dt,this.velocity.z*dt,{seatId:this.seating?.target?.id});
    this.player.position.set(next.x,groundHeight(next.x,next.z)+(this.seating?.seated?.38:this.riding?.7:0),next.z);
    const moving=Math.hypot(next.x-previous.x,next.z-previous.z)>.0005;
    if(moving){this.state='walk';const heading=Math.atan2(this.velocity.x,this.velocity.z),difference=Math.atan2(Math.sin(heading-this.player.rotation.y),Math.cos(heading-this.player.rotation.y));this.player.rotation.y+=difference*(1-Math.exp(-14*dt));this.walkPhase+=dt*9;}
    else if(this.state==='walk')this.state='idle';
    this.player.rotation.x=this.state==='bow'?Math.sin(clamp((this.elapsed-this.bowTime)/2,0,1)*Math.PI)*.9:0;
    if(this.state==='bow'&&this.elapsed-this.bowTime>2)this.state='idle';
    this.player.scale.y=1;this.animateAvatar(this.player,moving&&!this.riding,this.walkPhase);
    if(this.companionMesh){const dest=this.player.position.clone();dest.y-=.7;this.companionMesh.position.lerp(dest,1-Math.exp(-14*dt));this.companionMesh.rotation.y=this.player.rotation.y;}
    if(!this.overview){const focus=this.player.position.clone().add(new T.Vector3(0,this.focusHeight(),0)),delta=focus.sub(this.controls.target).multiplyScalar(this.reduced?1:1-Math.exp(-10*dt));this.camera.position.add(delta);this.controls.target.add(delta);}
    for(const roof of this.hallRoofs||[])roof.visible=this.camera.position.y<HALL.ceiling-.4;
    this.seating?.reached();this.updateLocation();
  }
  animateAvatar(avatar,moving,phase){animateCharacter(avatar,moving,phase,this.reduced);}
  bow(){this.seating?.leave();if(this.player)this.player.rotation.y=Math.atan2(-this.player.position.x,-11-this.player.position.z);this.state='bow';this.bowTime=this.elapsed;}
}
