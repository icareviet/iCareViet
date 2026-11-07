import * as T from 'three';

export function setCharacterName(avatar,name){
  name=String(name||'Đạo hữu').replace(/\s+/g,' ').trim();
  if(avatar.userData.displayName===name)return;
  avatar.userData.displayName=name;
  if(typeof document.createElement!=='function')return;
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  context.font='600 26px BeVietnam, Segoe UI, sans-serif';
  canvas.width=Math.min(500,Math.max(120,Math.ceil(context.measureText(name).width)+30));canvas.height=58;
  context.fillStyle='#2b1510ed';context.beginPath();context.roundRect(1,1,canvas.width-2,56,12);context.fill();
  context.strokeStyle='#d6b467';context.lineWidth=2;context.stroke();context.fillStyle='#fff6df';context.font='600 26px BeVietnam, Segoe UI, sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(name,canvas.width/2,30,canvas.width-24);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  let label=avatar.userData.nameLabel;
  if(!label){label=new T.Sprite(new T.SpriteMaterial({transparent:true,depthWrite:false,depthTest:true,sizeAttenuation:false,toneMapped:false}));label.renderOrder=2;avatar.add(label);avatar.userData.nameLabel=label;}
  label.material.map?.dispose();label.material.map=texture;label.material.needsUpdate=true;label.scale.set(.032*canvas.width/58,.032,1);label.position.set(0,1.95,0);
}
export function disposeCharacterName(avatar){const label=avatar.userData.nameLabel;if(label){label.material.map?.dispose();label.material.dispose();}}
export function animateCharacter(avatar,moving,phase,reduced=false){
  const rig=avatar.userData.rig;if(!rig)return;const seated=!!avatar.userData.seated,amount=moving&&!reduced&&!seated?1:0;
  rig.body.position.y=seated?-.35:Math.sin(phase*2)*.018*amount;
  if(rig.foldedLegs)rig.foldedLegs.visible=seated;
  rig.arms.forEach((arm,i)=>{arm.rotation.x=seated?-.72:Math.sin(phase+i*Math.PI)*.23*amount;arm.rotation.z=seated?(i===0?.42:-.42):0;});
  rig.feet.forEach((foot,i)=>{foot.visible=!seated;const stride=Math.sin(phase+i*Math.PI)*amount;foot.position.z=.05+stride*.13;foot.position.y=.1+Math.max(0,stride)*.08;});
  if(avatar.userData.nameLabel)avatar.userData.nameLabel.position.y=seated?1.52:1.95;
}
