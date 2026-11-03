import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TREES} from './world-layout.js';
import {buildBridge} from './bridge.js';

const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra});
const m={stone:material('#817967'),paving:material('#b7ae96'),edge:material('#665e4e'),grass:material('#394a32'),leaf:material('#304b31'),leafLight:material('#4e6339'),bark:material('#594534'),wood:material('#421d11'),red:material('#650f09',{roughness:.43}),gold:material('#c89539',{metalness:.65,roughness:.42}),tile:material('#682b20'),tileEdge:material('#903b27'),glow:material('#ffd48b',{emissive:'#ffad45',emissiveIntensity:2})};
function mesh(g,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
const box=(g,w,h,d,mat,x,y,z)=>mesh(g,new T.BoxGeometry(w,h,d),mat,x,y,z);
const cyl=(g,r,rb,h,mat,x,y,z,n=20)=>mesh(g,new T.CylinderGeometry(r,rb,h,n),mat,x,y,z);
function beam(g,a,b,r,mat){const from=new T.Vector3(...a),to=new T.Vector3(...b),o=mesh(g,new T.CylinderGeometry(r,r,from.distanceTo(to),8),mat);o.position.copy(from).lerp(to,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize());return o;}
function mergeGroup(g){g.updateMatrixWorld(true);const inverse=g.matrixWorld.clone().invert(),buckets=new Map();g.traverse(o=>{if(!o.isMesh)return;let geo=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(geo.index)geo=geo.toNonIndexed();const list=buckets.get(o.material)||[];list.push(geo);buckets.set(o.material,list);});g.clear();for(const[mat,geos]of buckets){const combined=mergeGeometries(geos);geos.forEach(geo=>geo.dispose());if(combined){const o=mesh(g,combined,mat);o.castShadow=true;}}}
function roof(parent,w,d,y,x,z){
  const g=new T.Group();g.position.set(x,0,z);parent.add(g);const positions=[],indices=[],uv=[],nx=32,nz=20;
  const height=(px,pz)=>y+2*(1-Math.pow(Math.abs(px/(w/2)),1.1))+.95*Math.pow(Math.abs(px/(w/2)),8)+.7*Math.pow(Math.abs(pz/(d/2)),10);
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const px=(i/nx-.5)*w,pz=(j/nz-.5)*d;positions.push(px,height(px,pz),pz);uv.push(i/nx,j/nz);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const tile=m.tile.clone();tile.side=T.DoubleSide;mesh(g,geo,tile);
  for(let zz=-d/2;zz<=d/2;zz+=.65){const points=[];for(let i=0;i<=24;i++){const xx=(i/24-.5)*w;points.push(new T.Vector3(xx,height(xx,zz)+.035,zz));}mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.045,5,false),m.tileEdge);}
  for(const side of [-1,1]){const points=[];for(let i=0;i<=32;i++){const xx=(i/32-.5)*w;points.push(new T.Vector3(xx,height(xx,side*d/2)+.06,side*d/2));}mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.11,6,false),m.gold);}
  beam(g,[0,y+2.12,-d/2],[0,y+2.12,d/2],.14,m.gold);
  for(const side of [-1,1]){beam(g,[0,y+2.12,side*d/2],[0,y+2.8,side*(d/2+.5)],.11,m.gold);const pearl=mesh(g,new T.SphereGeometry(.25,12,8),m.gold,0,y+2.9,side*(d/2+.5));pearl.castShadow=false;}
  mergeGroup(g);return g;
}
function sign(g,text,w,y,z){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#3b1c11';ctx.fillRect(0,0,768,160);ctx.strokeStyle='#bb9146';ctx.lineWidth=6;ctx.strokeRect(12,12,744,136);ctx.fillStyle='#f3cf7e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 56px BeVietnam, Segoe UI, sans-serif';ctx.fillText(text,384,84,680);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;mesh(g,new T.PlaneGeometry(w,w*160/768),new T.MeshBasicMaterial({map:tex}),0,y,z);}
function tree(scene,x,z,index){
  const g=new T.Group();g.position.set(x,0,z);g.userData.occlusionGroup=true;scene.add(g);
  const h=5.4+(index%3)*.7;beam(g,[0,.1,0],[.3,h*.7,.1],.26,m.bark);
  for(let i=0;i<7;i++){const a=i*2.39996,r=1+(i%3)*.7,xx=Math.sin(a)*r,zz=Math.cos(a)*r,yy=h+(i%3)*.45;beam(g,[.2,h*.48,0],[xx,yy-.25,zz],.09,m.bark);const crown=mesh(g,new T.SphereGeometry(1.65,14,10),i%2?m.leaf:m.leafLight,xx,yy,zz);crown.scale.set(1,.75+(i%2)*.2,.9);}
  for(let i=0;i<4;i++){const a=i*Math.PI/2;beam(g,[0,.35,0],[Math.sin(a)*.8,.12,Math.cos(a)*.8],.12,m.bark);}mergeGroup(g);
}
export function buildOutdoors(host){
  const scene=host.scene,g=new T.Group();scene.add(g);
  const carving=new T.TextureLoader().load('/assets/textures/gilded-lotus.jpg');carving.colorSpace=T.SRGBColorSpace;carving.anisotropy=8;
  const carvedWood=material('#c8a374',{map:carving,bumpMap:carving,bumpScale:.08,metalness:.3,roughness:.6});
  const ground=mesh(g,new T.PlaneGeometry(190,230),m.grass,0,.015,40);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  box(g,62,.1,58,m.stone,0,.065,55);box(g,8,.06,61,m.paving,0,.1,55);
  for(const x of [-4.15,4.15])box(g,.12,.025,60,m.edge,x,.145,55);
  // Real paving joints establish the scale of the exterior, distinct from the timber hall.
  for(let z=27;z<84;z+=2.5){box(g,8,.012,.035,m.edge,0,.137,z);for(const side of [-1,1])box(g,22,.012,.025,m.edge,side*16,.12,z);}
  for(let x=-30;x<=30;x+=3)box(g,.025,.012,57,m.edge,x,.12,55);
  for(const side of [-1,1]){
    for(const[zz,depth]of [[46,29],[68,19]]){const bed=box(g,10,.15,depth,m.grass,side*26,.055,zz);bed.receiveShadow=true;}
    box(g,46,.18,4,m.paving,0,.04,27.4);
    for(let z=42;z<80;z+=7){const x=side*(12+Math.sin(z*.12)*2.5);const stone=cyl(g,.78,.9,.1,m.paving,x,.1,z,8);stone.rotation.y=z*.22;}
    // Stone benches face the garden paths rather than occupying the main aisle.
    for(const z of [46,73]){box(g,3.5,.24,1,m.paving,side*26,.75,z);for(const x of [-1.2,1.2])box(g,.35,.6,.7,m.edge,side*26+x,.35,z);}
    for(const z of [43,56,70]){const x=side*6.5;cyl(g,.18,.32,2.5,m.edge,x,1.25,z);box(g,.72,.85,.72,m.glow,x,2.8,z);cyl(g,.64,.64,.15,m.wood,x,3.3,z,4).rotation.y=Math.PI/4;}
    // A low boundary wall keeps the garden a separate, inhabitable enclosure.
    box(g,.5,1.7,61,m.stone,side*33.8,.85,54);box(g,.75,.2,61,m.edge,side*33.8,1.78,54);
    box(g,22,1.6,.5,m.stone,side*22, .8,84.8);
  }
  // Three entrance portals separate the outside paving from the enclosed timber interior.
  const portal=new T.Group();portal.userData.occlusionGroup=true;scene.add(portal);host.frontFacade=portal;
  for(const x of [-5.1,5.1]){box(portal,1.8,12,1,m.red,x,6.1,25.5);box(portal,1.9,.13,1.1,m.gold,x,10.1,25.5);}
  for(const x of [-11.5,-4.1,4.1,11.5]){box(portal,.18,9,.2,m.gold,x,4.6,26.05);}
  for(const x of [-8.8,0,8.8]){box(portal,x===0?8.3:5.3,.45,.75,m.red,x,9.3,25.6);box(portal,x===0?8.5:5.5,.09,.85,m.gold,x,9.58,25.6);}
  // The curved pediment closes the hall above the three doors, under the eaves.
  const pediment=new T.Shape();pediment.moveTo(-22,9.65);pediment.lineTo(22,9.65);
  for(let i=32;i>=0;i--){const x=(i/32-.5)*44,y=17.2+2*(1-Math.pow(Math.abs(x/24.5),1.1))+.95*Math.pow(Math.abs(x/24.5),8)+.7;pediment.lineTo(x,y-.12);}pediment.closePath();
  mesh(portal,new T.ExtrudeGeometry(pediment,{depth:.55,bevelEnabled:false}),m.red,0,0,25.25);
  for(const y of [10,12.8,15.4,17.8])box(portal,43,.12,.16,m.gold,0,y,25.9);
  for(const x of [-18,-12,-6,0,6,12,18]){box(portal,4.6,3.9,.15,m.wood,x,14.1,25.88);box(portal,4.2,3.5,.16,carvedWood,x,14.1,26);for(const side of [-1,1]){box(portal,.075,3.9,.12,m.gold,x+side*2.3,14.1,26.12);box(portal,4.7,.075,.12,m.gold,x,14.1+side*1.95,26.12);}}
  mergeGroup(portal);
  mergeGroup(g);
  buildBridge(host,{box,cyl,beam,mesh,mergeGroup,materials:m});
  const templeRoofs=new T.Group();scene.add(templeRoofs);host.exteriorRoof=templeRoofs;
  roof(templeRoofs,49,45,17.2,0,5);box(templeRoofs,32,4.2,24,m.red,0,20.8,3);for(const y of [20.7,22.5])box(templeRoofs,32.2,.11,.2,m.gold,0,y,15.1);roof(templeRoofs,37,29,21.3,0,3);
  sign(scene,'CHÁNH ĐIỆN',9.4,11.5,26.1);
  const gate=new T.Group();scene.add(gate);
  for(const x of [-10,-4,4,10]){cyl(gate,.65,.9,.5,m.stone,x,.3,82.5);cyl(gate,.36,.5,7.8,m.red,x,4.3,82.5);for(const y of [1,7.5,8])cyl(gate,.54,.54,.14,m.gold,x,y,82.5);}
  box(gate,21,.9,.7,m.red,0,8,82.5);box(gate,21,.1,.85,m.gold,0,8.5,82.5);mergeGroup(gate);
  roof(gate,11,7,9.1,0,82.5);for(const x of [-8.5,8.5])roof(gate,7,6,7.9,x,82.5);sign(gate,'CHÙA ONLINE',7.2,8.3,83);
  TREES.forEach((t,i)=>tree(scene,t.x,t.z,i));
  // Distant wooded ridges form the landscape without simulated visitors or buildings.
  const horizon=new T.Group();scene.add(horizon);for(let i=0;i<15;i++){const a=i*Math.PI*2/15,o=mesh(horizon,new T.SphereGeometry(18+(i%3)*4,12,7),material(i%2?'#4b6258':'#596b60'),Math.sin(a)*95,1,Math.cos(a)*105+30);o.scale.y=.6+(i%4)*.15;o.castShadow=false;}mergeGroup(horizon);
}
