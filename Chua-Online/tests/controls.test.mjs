import test from 'node:test';
import assert from 'node:assert/strict';
import {VirtualJoystick,joystickVector} from '../src/controls.js';

class Stick extends EventTarget{
  disabled=false;pointer=null;values={};classes=new Set();
  style={setProperty:(key,value)=>{this.values[key]=value;}};
  classList={add:name=>this.classes.add(name),remove:name=>this.classes.delete(name)};
  getBoundingClientRect(){return{left:0,top:0,width:112,height:112};}
  setPointerCapture(id){this.pointer=id;}
  hasPointerCapture(id){return this.pointer===id;}
  releasePointerCapture(){this.pointer=null;}
}
function pointer(target,type,id,x=90,y=56){const event=new Event(type,{cancelable:true});Object.assign(event,{pointerId:id,clientX:x,clientY:y,button:0});target.dispatchEvent(event);}
function control(){const element=new Stick(),win=new EventTarget(),doc=new EventTarget();doc.hidden=false;let last;const stick=new VirtualJoystick(element,v=>last=v,{windowTarget:win,documentTarget:doc});return{element,win,doc,stick,get last(){return last;}};}
test('joystick has a dead zone and a capped normalized diagonal',()=>{assert.equal(joystickVector(1,1,34).x,0);const vector=joystickVector(90,-90,34);assert.ok(Math.abs(Math.hypot(vector.x,vector.z)-1)<1e-9);assert.ok(vector.z<0);});
test('a second pointer cannot steal or release the active joystick',()=>{const c=control();pointer(c.element,'pointerdown',1);assert.ok(c.last.x>.9);pointer(c.element,'pointerdown',2,0,56);assert.equal(c.stick.pointerId,1);pointer(c.element,'pointerup',2);assert.ok(c.last.x>.9);pointer(c.element,'pointerup',1);assert.equal(c.last.x,0);assert.equal(c.element.pointer,null);});
test('cancel, lost capture and focus loss reset movement and allow another drag',()=>{
  for(const mode of ['pointercancel','lostpointercapture','blur','hidden']){const c=control();pointer(c.element,'pointerdown',1);assert.ok(c.last.x>.9);if(mode==='blur')c.win.dispatchEvent(new Event('blur'));else if(mode==='hidden'){c.doc.hidden=true;c.doc.dispatchEvent(new Event('visibilitychange'));}else pointer(c.element,mode,1);assert.equal(c.last.x,0);assert.equal(c.stick.pointerId,null);assert.equal(c.element.values['--stick-x'],'0px');pointer(c.element,'pointerdown',3,56,20);assert.ok(c.last.z<-.9);pointer(c.element,'pointerup',3);c.stick.dispose();}
});
