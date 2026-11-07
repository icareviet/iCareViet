import * as T from 'three';
import {SEATS,seatById} from './world-layout.js';
import {safePosition,groundHeight,planPath} from './navigation.js';
import {animateCharacter} from './characters.js';

export class SeatController {
  constructor(host){this.host=host;this.claims=new Map();this.target=null;this.seated=false;this.awaiting=false;}
  restore(user){
    this.target=null;this.seated=false;this.awaiting=false;this.lastReleasedId=null;
    const seat=seatById(user.seatId);if(seat){this.target=seat;this.confirm(seat.id);}else{if(this.host.player)this.host.player.userData.seated=false;this.host.onSeatChange?.(null);}
  }
  updateClaims(claims=[]){
    this.claims=new Map(claims.map(claim=>[claim.id,claim]));const tops=this.host.seatTops;
    if(tops){SEATS.forEach((seat,index)=>{const owner=this.claims.get(seat.id);tops.setColorAt(index,new T.Color(owner?(owner.userId===this.host.userId?'#f1c75b':'#9c6d36'):'#d99426'));});tops.instanceColor.needsUpdate=true;}
  }
  pick(ray){
    if(!this.host.seatMeshes?.length)return null;
    const hit=ray.intersectObjects(this.host.seatMeshes,false)[0];if(!hit)return null;
    const visible=object=>{for(let p=object;p;p=p.parent)if(!p.visible)return false;return true;};
    const blockers=(this.host.staticMeshes||[]).filter(o=>!o.isInstancedMesh&&visible(o)&&!(o.material?.transparent&&o.material.opacity<.2));
    ray.far=hit.distance-.08;const blocked=ray.intersectObjects(blockers,false).length>0;ray.far=Infinity;
    return blocked?null:SEATS[hit.instanceId];
  }
  begin(id){
    const seat=seatById(id),host=this.host;if(!seat||!host.player)return false;
    this.leave(false);host.stopMoving();if(host.riding)host.companion(false);const path=planPath(host.player.position,seat,{seatId:id});if(!path.length)return false;
    this.target=seat;this.lastReleasedId=null;this.awaiting=false;this.seated=false;host.path=path;host.currentView='follow';host.overview=false;host.focusPlayer(true);host.onCameraChange?.('follow');
    if(host.destinationMarker){host.destinationMarker.position.set(seat.x,.54,seat.z);host.destinationMarker.visible=true;}
    host.onSeatChange?.({seat,phase:'walking'});return true;
  }
  reached(){
    if(!this.target||this.seated||this.awaiting||this.host.path.length)return;
    const p=this.host.player.position;if(Math.hypot(p.x-this.target.x,p.z-this.target.z)>.25)return;
    this.host.velocity.set(0,0,0);p.set(this.target.x,groundHeight(this.target.x,this.target.z),this.target.z);this.awaiting=true;
    this.host.onSeatChange?.({seat:this.target,phase:'arriving'});this.host.onSeatArrived?.(this.target.id);
  }
  confirm(id){
    const host=this.host;if(this.target?.id!==id||!host.player)return false;
    this.seated=true;this.awaiting=false;host.stopMoving();host.state='seated';host.player.userData.seated=true;
    host.player.position.set(this.target.x,groundHeight(this.target.x,this.target.z)+.38,this.target.z);host.player.rotation.set(0,Math.PI,0);host.player.scale.y=1;
    animateCharacter(host.player,false,0,host.reduced);host.onSeatChange?.({seat:this.target,phase:'seated'});return true;
  }
  cancelJourney(){if(this.target&&!this.seated)this.leave();}
  leave(notify=true){
    const old=this.target;if(!old)return;const host=this.host,wasSeated=this.seated;
    this.target=null;this.seated=false;this.awaiting=false;this.lastReleasedId=old.id;
    if(host.player){host.player.userData.seated=false;if(wasSeated){const p=safePosition(old.x,old.z+1.4);host.player.position.set(p.x,groundHeight(p.x,p.z),p.z);}animateCharacter(host.player,false,0,host.reduced);}
    host.state='idle';host.path=[];host.velocity.set(0,0,0);if(host.destinationMarker)host.destinationMarker.visible=false;
    if(wasSeated&&!host.overview)host.focusPlayer(false);
    host.onSeatChange?.(null);if(notify)host.onSeatLeave?.(old.id);
  }
}
