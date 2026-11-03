import test from 'node:test';
import assert from 'node:assert/strict';
import {DESTINATIONS,isWalkable,safePosition,groundHeight,moveOnGround,planPath} from '../src/navigation.js';
import {BASINS,COLUMN_X,COLUMN_Z,HALL,SPAWN,seatById,BRIDGE,CHANNEL} from '../src/world-layout.js';

test('map arrivals are on safe ground outside the basins and shrine',()=>{for(const point of Object.values(DESTINATIONS))assert.ok(isWalkable(point.x,point.z));for(const b of BASINS)assert.equal(isWalkable(b.x,b.z),false);assert.equal(isWalkable(0,-11),false);for(const x of COLUMN_X)for(const z of COLUMN_Z)assert.equal(isWalkable(x,z),false);});
test('old water, non-finite and out-of-bounds positions recover to walkable ground',()=>{for(const [x,z] of [[-8,14],[9,10],[Infinity,0],['invalid',null],[900,-900],[-8.2,-3.5]]){const p=safePosition(x,z);assert.ok(isWalkable(p.x,p.z));}});
test('walking cannot cross water, the shrine or the boundary, including large frame deltas',()=>{for(const [position,dx,dz] of [[{x:0,z:12},20,0],[{x:20,z:23},100,100],[{x:0,z:-5},0,-10]]){const result=moveOnGround(position,dx,dz);assert.ok(isWalkable(result.x,result.z));}const p=moveOnGround({x:-18,z:61.5},0,-20);assert.ok(p.z>58.2);const altar=moveOnGround({x:0,z:-5},0,-20);assert.ok(altar.z>=-6.5);});
test('tap routing finds a continuous path around a outdoor basin',()=>{const start={x:-18,z:39},end={x:-18,z:62};const path=planPath(start,end);assert.ok(path.length>1);let previous=start;for(const point of path){for(let i=0;i<=30;i++)assert.ok(isWalkable(previous.x+(point.x-previous.x)*i/30,previous.z+(point.z-previous.z)*i/30));previous=point;}assert.deepEqual(path.at(-1),end);});
test('all five arrivals share the real finished floor height',()=>{for(const p of Object.values(DESTINATIONS))assert.equal(groundHeight(p.x,p.z),HALL.floor);});
test('the center aisle is open and a character cannot walk through a meditation cushion',()=>{for(let z=-6;z<24;z+=.25)assert.ok(isWalkable(0,z));const next=moveOnGround({x:4.6,z:1.8},0,-3);assert.ok(next.z>1.3);assert.equal(isWalkable(4.6,.2),false);});
test('the outside courtyard connects to all destinations through real door openings',()=>{for(const destination of Object.values(DESTINATIONS)){const path=planPath(SPAWN,destination);assert.ok(path.length);assert.deepEqual(path.at(-1),{x:destination.x,z:destination.z});}assert.equal(isWalkable(5,25.5),false);assert.equal(isWalkable(0,25.5),true);assert.equal(isWalkable(15,25.5),false);});
test('seating routes enter only the selected cushion and can reach both sides of the hall',()=>{for(const id of ['a1','a6','h1','h6']){const seat=seatById(id),options={seatId:id};assert.equal(isWalkable(seat.x,seat.z),false);const path=planPath({x:0,z:12},seat,options);assert.deepEqual(path.at(-1),{x:seat.x,z:seat.z});let previous={x:0,z:12};for(const point of path){for(let i=0;i<=50;i++)assert.ok(isWalkable(previous.x+(point.x-previous.x)*i/50,previous.z+(point.z-previous.z)*i/50,options));previous=point;}}});

test('the hall-to-courtyard route crosses the raised bridge while water and rails block sideways walking',()=>{
  const mid=(BRIDGE.back+BRIDGE.front)/2;assert.equal(groundHeight(0,BRIDGE.back),HALL.floor);assert.equal(groundHeight(0,BRIDGE.front),HALL.floor);assert.equal(groundHeight(0,mid),HALL.floor+BRIDGE.rise);
  assert.equal(isWalkable(10,mid),false);assert.equal(isWalkable(0,mid),true);const stop=moveOnGround({x:0,z:mid},20,0);assert.ok(stop.x<=BRIDGE.halfWidth);
  const route=planPath({x:9,z:24},DESTINATIONS.courtyard);assert.ok(route.length);let previous={x:9,z:24},crossed=false;
  for(const point of route){for(let i=0;i<=200;i++){const x=previous.x+(point.x-previous.x)*i/200,z=previous.z+(point.z-previous.z)*i/200;assert.ok(isWalkable(x,z));if(z>CHANNEL.back&&z<CHANNEL.front){crossed=true;assert.ok(Math.abs(x)<=BRIDGE.halfWidth);assert.ok(groundHeight(x,z)>HALL.floor);}}previous=point;}assert.ok(crossed);
});
