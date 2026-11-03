import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {TempleScene} from '../src/scene.js';
import {DESTINATIONS,isWalkable,groundHeight} from '../src/navigation.js';
import {SeatController} from '../src/seating.js';
import {seatById} from '../src/world-layout.js';

function runningScene(){
  globalThis.document={hidden:false};
  const scene=Object.create(TempleScene.prototype);
  const camera=new T.PerspectiveCamera(50,1440/900,.1,160);camera.position.set(9,8,24);
  const controls={target:new T.Vector3(0,1,12),enableDamping:true,getAzimuthalAngle:()=>0,update(){camera.lookAt(this.target);camera.updateMatrixWorld();}};
  Object.assign(scene,{scene:new T.Scene(),camera,clock:{getDelta:()=>1/60},elapsed:0,player:new T.Group(),active:true,inputEnabled:true,keys:{},moveInput:{x:0,z:0},velocity:new T.Vector3(),path:[],walkPhase:0,state:'idle',peers:new Map(),lanterns:new Map(),fireflies:{children:[]},reduced:true,controls,renderer:{render(){scene.frames++;}},frames:0});
  return scene;
}
test('an active character without a companion continues rendering',()=>{const scene=runningScene();scene.animate();scene.animate();assert.equal(scene.frames,2);assert.equal(typeof scene.companion,'function');});
test('movement and an equipped mount update the scene without corrupting its methods',()=>{const scene=runningScene();scene.companionMesh=new T.Group();scene.riding=true;scene.keys.w=true;scene.animate();assert.ok(scene.player.position.z<0);assert.ok(scene.player.position.y>.6);assert.equal(scene.frames,1);assert.equal(typeof scene.companion,'function');});
test('presence preserves zero coordinates',()=>{const scene=runningScene();scene.player.position.set(0,0,0);assert.equal(scene.position().z,0);});

test('walking over the bridge follows its arch and returns to courtyard level',()=>{
  const scene=runningScene();scene.player.position.set(0,.13,27);scene.focusPlayer(true);scene.keys.s=true;let highest=.13;
  for(let i=0;i<270;i++){scene.animate();highest=Math.max(highest,scene.player.position.y);assert.equal(scene.player.position.y,groundHeight(scene.player.position.x,scene.player.position.z));}
  assert.ok(highest>1.6);assert.ok(scene.player.position.z>40);assert.equal(scene.player.position.y,.13);
});
test('a saved lantern rises and polling does not duplicate its server identity',()=>{const scene=runningScene();scene.reduced=false;scene.launchLantern('saved-wish-identity');const lantern=scene.lanterns.get('saved-wish-identity');assert.ok(lantern.position.y<.1);for(let i=0;i<240;i++)scene.animate();assert.ok(lantern.position.y>1.9);scene.updateLanterns([{id:'saved-wish-identity'}]);assert.equal(scene.lanterns.size,1);});
test('every map destination keeps the same character visible and able to leave',()=>{
  for(const aspect of [1440/900,390/843])for(const [place,destination] of Object.entries(DESTINATIONS)){
    const scene=runningScene(),player=scene.player;scene.camera.aspect=aspect;scene.camera.updateProjectionMatrix();scene.keys.w=true;scene.velocity.set(8,0,8);scene.path=[{x:22,z:22}];
    assert.equal(scene.teleport(place),true);assert.equal(scene.player,player);assert.ok(isWalkable(player.position.x,player.position.z));assert.equal(player.position.y,groundHeight(destination.x,destination.z));assert.deepEqual(scene.keys,{});assert.equal(scene.path.length,0);
    for(let i=0;i<30;i++)scene.animate();assert.equal(player.position.x,destination.x);assert.equal(player.position.z,destination.z);
    const projected=player.position.clone().add(new T.Vector3(0,.8,0)).project(scene.camera);assert.ok(Math.abs(projected.x)<.9&&Math.abs(projected.y)<.9&&projected.z<1,`${place} must remain in the camera frame at aspect ${aspect}`);
    scene.setMoveInput(0,1);for(let i=0;i<15;i++)scene.animate();assert.ok(Math.hypot(player.position.x-destination.x,player.position.z-destination.z)>.1,`${place} must not trap the character`);
  }
});
test('teleport rejects unknown locations without changing the scene',()=>{const scene=runningScene(),before=scene.player.position.clone();assert.equal(scene.teleport('missing'),false);assert.ok(scene.player.position.equals(before));});
test('opening a panel cancels keyboard, touch, and click-to-move momentum',()=>{const scene=runningScene();scene.player.position.set(0,.13,12);scene.keys.w=true;scene.setMoveInput(1,0);scene.path=[{x:0,z:23}];scene.setInputEnabled(false);const before=scene.player.position.clone();for(let i=0;i<30;i++)scene.animate();assert.ok(scene.player.position.equals(before));scene.setInputEnabled(true);scene.keys.w=true;scene.animate();assert.ok(scene.player.position.z<12);});
test('restoring a character preserves zero coordinates and repairs old water spawns',()=>{for(const point of [{x:0,z:0},{x:-8,z:14}]){const scene=runningScene();scene.applySettings=()=>{};scene.setUser({id:'user',appearance:{},...point},{restorePosition:true});assert.ok(isWalkable(scene.player.position.x,scene.player.position.z));if(point.z===0)assert.equal(scene.player.position.z,0);assert.equal(scene.player.position.y,groundHeight(scene.player.position.x,scene.player.position.z));}});
test('camera follows a walking character without changing the chosen orbit',()=>{const scene=runningScene();scene.player.position.set(0,.13,12);scene.focusPlayer(true);const offset=scene.camera.position.clone().sub(scene.controls.target);scene.keys.w=true;for(let i=0;i<120;i++)scene.animate();const newOffset=scene.camera.position.clone().sub(scene.controls.target);assert.ok(offset.distanceTo(newOffset)<1e-6);assert.ok(Math.abs(scene.controls.target.z-scene.player.position.z)<.01);});
test('foreground geometry fades without changing shared materials and restores afterwards',()=>{const scene=runningScene();scene.player.position.set(0,.13,12);scene.focusPlayer(true);const original=new T.MeshStandardMaterial({color:'#254d3c'}),wall=new T.Mesh(new T.BoxGeometry(5,5,1),original);wall.position.copy(scene.camera.position).lerp(scene.player.position,.5);scene.scene.add(wall);scene.scene.updateMatrixWorld(true);scene.worldOccluders=[wall];scene.occlusionFades=new Map();scene.updateOcclusion();assert.notEqual(wall.material,original);assert.equal(original.opacity,1);assert.ok(wall.material.opacity<.2);wall.position.set(24,4,-10);scene.scene.updateMatrixWorld(true);scene.updateOcclusion();assert.equal(wall.material,original);});
test('camera presets preserve the character and movement restores follow framing',()=>{for(const preset of ['front','left','right','high']){const scene=runningScene(),player=scene.player;player.position.set(0,.13,12);const changes=[];scene.onCameraChange=name=>changes.push(name);scene.setCameraPreset(preset);assert.equal(scene.player,player);assert.equal(scene.overview,true);assert.equal(changes.at(-1),preset);if(preset==='high'){const head=new T.Vector3(0,12.4,-13).project(scene.camera);assert.ok(Math.abs(head.y)<.95,'the upper Buddha must be contained in the high view');}scene.setMoveInput(0,1);for(let i=0;i<15;i++)scene.animate();assert.equal(scene.overview,false);assert.equal(scene.camera.fov,55);assert.equal(changes.at(-1),'follow');assert.ok(player.position.z>12);}});
test('walking to a cushion waits for confirmation, folds the legs, and stands safely on manual input',()=>{
  const scene=runningScene();scene.player=scene.avatar();scene.player.position.set(0,.13,12);scene.seating=new SeatController(scene);const reached=[],released=[];scene.onSeatArrived=id=>reached.push(id);scene.onSeatLeave=id=>released.push(id);
  assert.equal(scene.seating.begin('f3'),true);for(let i=0;i<900&&!reached.length;i++)scene.animate();assert.deepEqual(reached,['f3']);assert.equal(scene.seating.seated,false);assert.equal(scene.seating.confirm('f3'),true);
  const rig=scene.player.userData.rig;assert.equal(rig.foldedLegs.visible,true);assert.ok(rig.feet.every(f=>!f.visible));assert.equal(scene.position().seatId,'f3');assert.equal(scene.position().state,'seated');
  scene.keys.w=true;scene.animate();assert.equal(scene.seating.seated,false);assert.deepEqual(released,['f3']);assert.ok(isWalkable(scene.player.position.x,scene.player.position.z));assert.ok(rig.feet.every(f=>f.visible));
});
test('a cancelled seating journey cannot be confirmed by a late response',()=>{const scene=runningScene();scene.player.position.set(0,.13,12);scene.seating=new SeatController(scene);assert.equal(scene.seating.begin('h3'),true);scene.setInputEnabled(false);assert.equal(scene.seating.target,null);assert.equal(scene.path.length,0);assert.equal(scene.seating.confirm('h3'),false);});
