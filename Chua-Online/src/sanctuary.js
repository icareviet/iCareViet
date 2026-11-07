import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {HALL,COLUMN_X,COLUMN_Z,BASINS,CUSHION_X,CUSHION_Z,SEATS} from './world-layout.js';
import {buildOutdoors} from './outdoors.js';

const mat=(color,options={})=>new T.MeshStandardMaterial({color,roughness:.55,...options});
const materials={
  lacquer:new T.MeshPhysicalMaterial({color:'#490b05',metalness:.05,roughness:.43,clearcoat:.35,clearcoatRoughness:.4}),
  wood:mat('#2e100b',{roughness:.4}),black:mat('#1b100a'),
  gold:mat('#c89539',{metalness:.85,roughness:.31}),lightGold:mat('#efc96b',{metalness:.78,roughness:.26}),
  darkGold:mat('#78501d',{metalness:.8,roughness:.42}),stone:mat('#3c3026',{roughness:.35}),
  cushion:mat('#b46b16',{roughness:.9}),cloth:mat('#d99426',{roughness:.92}),
  leaf:mat('#31462c'),water:mat('#233c36',{metalness:.45,roughness:.15}),
  glow:mat('#ffcc71',{emissive:'#ff9b28',emissiveIntensity:2.6}),
};

// Merge the authored joinery by material, retaining separate column groups for occlusion.
function consolidate(group){
  group.updateMatrixWorld(true);
  const byMaterial=new Map(),inverse=group.matrixWorld.clone().invert();
  group.traverse(node=>{if(!node.isMesh||node.isInstancedMesh||Array.isArray(node.material))return;const geo=node.geometry.clone().applyMatrix4(inverse.clone().multiply(node.matrixWorld));if(geo.index)geo.setIndex(geo.index);const list=byMaterial.get(node.material)||[];list.push(geo);byMaterial.set(node.material,list);});
  group.clear();
  for(const [material,geometries] of byMaterial){const geometry=mergeGeometries(geometries);for(const item of geometries)item.dispose();if(!geometry)continue;const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
}
function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const box=(g,w,h,d,m,x,y,z)=>mesh(g,new T.BoxGeometry(w,h,d),m,x,y,z);
const cyl=(g,rt,rb,h,m,x,y,z,n=24)=>mesh(g,new T.CylinderGeometry(rt,rb,h,n),m,x,y,z);
const torus=(g,r,t,m,x,y,z)=>mesh(g,new T.TorusGeometry(r,t,8,64),m,x,y,z);
function tube(g,points,r,m){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,5,false),m);}
function petalGeometry(length=1,width=.35,depth=.18){
  const positions=[],uvs=[],indices=[],rows=14,cols=12;
  for(let i=0;i<=rows;i++){const t=i/rows;for(let j=0;j<=cols;j++){const a=j/cols*Math.PI*2,s=Math.sin(Math.PI*t);positions.push(Math.cos(a)*s*width,t*length,Math.sin(a)*s*depth+.18*Math.sin(Math.PI*t));uvs.push(j/cols,t);}}
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function rosette(g,r,x,y,z,horizontal=false){
  const flower=new T.Group();flower.position.set(x,y,z);if(horizontal)flower.rotation.x=Math.PI/2;g.add(flower);
  torus(flower,r,.045,materials.gold,0,0,0);torus(flower,r*.86,.025,materials.darkGold,0,0,.025);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,p=mesh(flower,petalGeometry(r*.78,r*.13,.045),i%2?materials.lightGold:materials.gold);p.rotation.z=a;p.position.set(Math.sin(-a)*r*.12,Math.cos(a)*r*.12,.06);}
  const center=mesh(flower,new T.SphereGeometry(r*.19,16,10),materials.lightGold,0,0,.12);center.scale.z=.35;
  return flower;
}
function woodTexture(){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d');ctx.fillStyle='#5b2d18';ctx.fillRect(0,0,1024,1024);
  let seed=8129;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let row=0;row<8;row++){ctx.fillStyle=`hsl(${19+rnd()*7} 47% ${17+rnd()*9}%)`;ctx.fillRect(0,row*128,1024,127);
    for(let i=0;i<180;i++){const y=row*128+rnd()*128;ctx.strokeStyle=`rgba(${rnd()>.5?'223,164,87':'23,9,3'},${.03+rnd()*.12})`;ctx.lineWidth=.4+rnd();ctx.beginPath();for(let x=0;x<=1024;x+=16){const yy=y+Math.sin(x*.009+i)*1.9+Math.sin(x*.04+i)*.6;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();}
    ctx.fillStyle='#1c0d08';ctx.fillRect(0,row*128,1024,1);ctx.fillRect((row%2)*512+255,row*128,2,128);
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,5);texture.anisotropy=8;return texture;
}
function lantern(g,x,y,z,scale=1){
  const l=new T.Group();l.position.set(x,y,z);l.scale.setScalar(scale);g.add(l);
  box(l,.66,1,.66,materials.glow,0,0,0);box(l,.84,.12,.84,materials.gold,0,.56,0);box(l,.8,.12,.8,materials.gold,0,-.56,0);
  for(const a of [-1,1])for(const b of [-1,1])box(l,.065,1.1,.065,materials.wood,a*.36,0,b*.36);
  for(let i=-.3;i<=.31;i+=.15){box(l,.022,.94,.018,materials.gold,i,0,.344);box(l,.018,.94,.022,materials.gold,.344,0,i);}
  cyl(l,0,.65,.35,materials.wood,0,.8,0,4).rotation.y=Math.PI/4;cyl(l,.075,.075,.25,materials.gold,0,1.1,0);cyl(l,.018,.018,1.6,materials.gold,0,1.9,0);cyl(l,.025,.025,.6,materials.gold,0,-.9,0);
}
function column(scene,x,z){
  const group=new T.Group();group.position.set(x,0,z);group.userData.occlusionGroup=true;scene.add(group);
  cyl(group,.83,.98,.45,materials.stone,0,.3,0);cyl(group,.75,.85,.3,materials.gold,0,.65,0);
  cyl(group,.52,.65,12.6,materials.lacquer,0,7,0,40);
  for(const y of [1,1.15,11.9,12.1,12.55,13])cyl(group,.68,.68,.095,materials.gold,0,y,0,32);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const leaf=mesh(group,petalGeometry(1.2,.14,.07),materials.gold,Math.sin(a)*.57,11.2,Math.cos(a)*.57);leaf.rotation.y=a;}
  for(const y of [13,13.45,13.9]){box(group,1.55+(y-13)*1.6,.23,1.55+(y-13)*1.6,materials.lacquer,0,y,0);box(group,1.6+(y-13)*1.6,.07,1.6+(y-13)*1.6,materials.gold,0,y+.13,0);}
  for(const sign of [-1,1]){tube(group,[[0,12.5,0],[sign*.8,12.7,0],[sign*1.5,13.6,0],[sign*2.15,13.9,0]],.12,materials.gold);tube(group,[[0,12.5,0],[0,12.7,sign*.8],[0,13.6,sign*1.5],[0,13.9,sign*2.15]],.12,materials.gold);}
  consolidate(group);
}
function buildShrine(scene){
  const group=new T.Group();scene.add(group);
  for(let i=0;i<4;i++){box(group,14-i*.8,.3,6-i*.3,materials.wood,0,.28+i*.29,-10.5);box(group,14.1-i*.8,.055,6.1-i*.3,materials.gold,0,.445+i*.29,-10.5);}
  cyl(group,4.7,5.2,.6,materials.darkGold,0,1.5,-11,64);cyl(group,4.5,4.9,.3,materials.gold,0,1.92,-11,64);
  for(const [row,count,radius,y,length] of [[0,28,4,1.8,1.45],[1,24,3.6,2.2,1.2]])for(let i=0;i<count;i++){const a=(i+(row*.5))*Math.PI*2/count;const p=mesh(group,petalGeometry(length,.48,.18),materials.lightGold,Math.sin(a)*radius,y,Math.cos(a)*radius-11);p.rotation.y=a;p.rotation.x=.48;}
  cyl(group,3.7,4.05,.26,materials.gold,0,2.65,-11,64);
  // Three concentric chased-brass aureoles sit behind the sculpture.
  for(const [r,t] of [[5.5,.11],[5.15,.045],[4.75,.035]])torus(group,r,t,materials.gold,0,8,-13.25);
  for(let i=0;i<48;i++){const a=i*Math.PI/24;const p=mesh(group,petalGeometry(i%2?.48:.75,.1,.04),materials.gold,Math.sin(a)*5.28,8+Math.cos(a)*5.28,-13.2);p.rotation.z=-a;}
  for(const x of [-7,7]){box(group,.28,11.8,.4,materials.gold,x,6.2,-13.2);box(group,.65,12,.3,materials.lacquer,x,6.2,-13.4);for(let y=2;y<12;y+=1.6)rosette(group,.28,x,y,-13.15);}
  // Offering table; brass burners, candle stands, fruit bowls, and flowers.
  box(group,6.6,.3,1.6,materials.lacquer,0,1.4,-6.85);box(group,6.8,.1,1.8,materials.gold,0,1.6,-6.85);
  for(const x of [-2.8,2.8])box(group,.24,1.15,.65,materials.lacquer,x,.8,-6.85);
  for(const x of [-2.65,2.65]){cyl(group,.16,.3,.15,materials.gold,x,1.75,-6.85);cyl(group,.045,.07,.75,materials.gold,x,2.2,-6.85);cyl(group,.14,.16,.09,materials.gold,x,2.6,-6.85);cyl(group,.055,.07,.28,materials.glow,x,2.78,-6.85);}
  const burner=mesh(group,new T.SphereGeometry(.52,24,12),materials.gold,0,1.93,-6.85);burner.scale.y=.55;cyl(group,.44,.44,.08,materials.darkGold,0,2.1,-6.85);for(const x of [-.17,0,.17])cyl(group,.012,.012,.75,materials.wood,x,2.5,-6.85);
  for(const sign of [-1,1]){cyl(group,.16,.25,.7,materials.gold,sign*1.65,1.99,-6.85);for(let i=0;i<5;i++){const a=i*2.4;const x=sign*1.65+Math.sin(a)*.25;const z=-6.85+Math.cos(a)*.22;tube(group,[[sign*1.65,2.1,-6.85],[x,2.65,z],[x,3,z]],.013,materials.leaf);for(let j=0;j<6;j++){const b=j*Math.PI/3;mesh(group,petalGeometry(.24,.08,.04),materials.cloth,x+Math.sin(b)*.1,2.95,z+Math.cos(b)*.1).rotation.y=b;}}}
  consolidate(group);
  const statue=new T.Group();statue.name='Tượng Phật — Scan-the-World';scene.add(statue);
  // The licensed mesh is local, with compression removed before shipping.
  const promise=new GLTFLoader().loadAsync('/assets/models/kamakura-buddha.glb').then(gltf=>{
    const root=gltf.scene,bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    const scale=9.4/size.y;root.position.set(-center.x,-bounds.min.y,-center.z);const normalizer=new T.Group();normalizer.add(root);normalizer.scale.setScalar(scale);normalizer.position.set(0,2.78,-10.8);
    root.traverse(node=>{if(node.isMesh){node.material=materials.gold;node.castShadow=true;node.receiveShadow=true;}});statue.add(normalizer);
    return statue;
  }).catch(error=>{document.getElementById('scene-asset-status')?.removeAttribute('hidden');console.error('Không tải được tượng Phật:',error);});
  return promise;
}
function basin(scene,basin){
  const g=new T.Group();scene.add(g);const {x,z,rx,rz}=basin;
  const rim=cyl(g,rx+.16,rx+.26,.45,materials.stone,x,.27,z,48);rim.scale.z=rz/rx;
  const edge=torus(g,rx,.055,materials.gold,x,.5,z);edge.rotation.x=Math.PI/2;edge.scale.y=rz/rx;
  const water=cyl(g,rx-.08,rx-.08,.025,materials.water,x,.5,z,48);water.scale.z=rz/rx;
  for(let i=0;i<7;i++){const a=i*2.4,xx=x+Math.sin(a)*(rx*.58),zz=z+Math.cos(a)*(rz*.65);const leaf=cyl(g,.36,.36,.025,materials.leaf,xx,.54,zz);leaf.scale.z=.8;if(i%2===0)for(let j=0;j<7;j++){const b=j*Math.PI/3.5,p=mesh(g,petalGeometry(.34,.11,.045),mat('#dcaa86'),xx+Math.sin(b)*.14,.56,zz+Math.cos(b)*.14);p.rotation.y=b;p.rotation.x=.65;}}
  consolidate(g);
}
export function buildSanctuary(host){
  const scene=host.scene;
  const carving=new T.TextureLoader().load('/assets/textures/gilded-lotus.jpg');carving.colorSpace=T.SRGBColorSpace;carving.anisotropy=8;
  const relief=mat('#b68b52',{map:carving,bumpMap:carving,bumpScale:.12,metalness:.45,roughness:.57});
  const pmrem=new T.PMREMGenerator(host.renderer),environment=new RoomEnvironment();host.environment=pmrem.fromScene(environment,.04);scene.environment=host.environment.texture;scene.environmentIntensity=.4;environment.dispose();pmrem.dispose();
  scene.background=new T.Color('#21130d');scene.fog=new T.FogExp2('#321a0e',.007);
  scene.add(new T.HemisphereLight('#ffc87e','#3a160c',1.2));
  const sunlight=new T.DirectionalLight('#ffc578',2.4);sunlight.position.set(-18,24,7);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);Object.assign(sunlight.shadow.camera,{left:-27,right:27,top:27,bottom:-27,far:90});sunlight.shadow.normalBias=.03;sunlight.shadow.bias=-.0002;scene.add(sunlight);host.moonLight=sunlight;
  const key=new T.PointLight('#ffd290',150,32,2);key.position.set(0,10,-4);scene.add(key);
  for(const z of [-5,9,21]){const light=new T.PointLight('#ffbd68',110,25,2);light.position.set(0,12,z);scene.add(light);}

  const reflection=new Reflector(new T.PlaneGeometry(44,42),{color:0x8c7459,textureWidth:Math.min(innerWidth,1024),textureHeight:Math.min(innerHeight,768),clipBias:.005});reflection.rotation.x=-Math.PI/2;reflection.position.set(0,.09,5);reflection.userData.ignoreOcclusion=true;scene.add(reflection);host.floorReflection=reflection;
  const floorMat=new T.MeshPhysicalMaterial({color:'#ba8861',map:woodTexture(),roughness:.32,metalness:.12,transparent:true,opacity:.8,depthWrite:false});
  const floor=mesh(scene,new T.PlaneGeometry(44,42),floorMat,0,.12,5);floor.rotation.x=-Math.PI/2;floor.castShadow=false;floor.userData.ignoreOcclusion=true;host.floorSurface=floor;
  const architecture=new T.Group();scene.add(architecture);
  // Dark plinth and thin brass marquetry run down the central aisle.
  for(const x of [-2.1,2.1])box(architecture,.045,.012,34,materials.gold,x,.145,8);
  for(const z of [-4,2,8,14,20]){const medallion=rosette(architecture,.58,0,.15,z,true);medallion.rotation.x=-Math.PI/2;medallion.scale.z=.03;}
  // Side windows repeat through deep, shadowed carved surrounds.
  for(const sign of [-1,1]){
    box(architecture,.65,16,40,materials.wood,sign*22,8,5);
    for(const z of [-10,-2,6,14,22]){
      box(architecture,.2,9,5.4,mat('#7c948d',{emissive:'#a7bbad',emissiveIntensity:.28,roughness:.8}),sign*21.62,7.4,z);
      for(const y of [2.7,3,11.8,12.1])box(architecture,.36,.13,5.85,materials.gold,sign*21.38,y,z);
      for(let zz=-2.6;zz<=2.61;zz+=.65)box(architecture,.25,9,.07,materials.wood,sign*21.28,7.4,z+zz);
      for(let yy=3.5;yy<12;yy+=1.2)box(architecture,.25,.065,5.6,materials.wood,sign*21.27,yy,z);
      for(const offset of [-3.6,3.6])box(architecture,.55,13,.6,materials.lacquer,sign*21.2,6.6,z+offset);
      for(const offset of [-2.7,2.7])box(architecture,.35,9,.12,materials.gold,sign*21.24,7.4,z+offset);
    }
    box(architecture,.5,2.5,40,materials.lacquer,sign*21.5,1.3,5);
    for(let z=-12;z<25;z+=2.8){box(architecture,.09,1.5,2.3,materials.darkGold,sign*21.18,1.35,z);box(architecture,.1,1.32,2.1,materials.lacquer,sign*21.1,1.35,z);}
    box(architecture,.8,.45,40,materials.gold,sign*21.3,13.6,5);
  }
  box(architecture,44,17,.6,materials.lacquer,0,8.5,-14.3);
  // Deep carved bays and gilded friezes give the timber its reference-specific detail.
  for(const x of [-18,-10,10,18])box(architecture,4.35,10.7,.14,relief,x,6.4,-13.83);
  for(const x of [-7.6,7.6])box(architecture,1.1,12.5,.15,relief,x,6.7,-13.75);
  for(const x of [-18,-10,10,18]){box(architecture,4.5,11,.12,materials.wood,x,6.4,-13.94);for(const side of [-1,1])box(architecture,.08,11,.15,materials.gold,x+side*2.2,6.4,-13.8);for(const y of [1,11.8])box(architecture,4.5,.08,.15,materials.gold,x,y,-13.8);for(let y=2;y<11;y+=2.1)rosette(architecture,.55,x,y,-13.7);}
  // Entry door is open; its lintel and lattice panels still frame the reverse view.
  const entranceLintel=new T.Group();entranceLintel.userData.occlusionGroup=true;scene.add(entranceLintel);box(entranceLintel,44,2,.7,materials.wood,0,14.8,25.3);
  host.frontScreens=[entranceLintel];for(const x of [-17,17]){const facade=new T.Group();facade.userData.occlusionGroup=true;scene.add(facade);host.frontScreens.push(facade);box(facade,9,13,.4,materials.lacquer,x,6.5,25.3);for(let xx=-4;xx<4.1;xx+=.65)box(facade,.065,10,.14,materials.gold,x+xx,7,25.6);for(let y=2;y<=12;y+=1.25)box(facade,8.5,.065,.14,materials.gold,x,y,25.6);consolidate(facade);}
  for(const x of COLUMN_X)for(const z of COLUMN_Z)column(scene,x,z);
  const overhead=new T.Group();scene.add(overhead);
  for(const z of COLUMN_Z){box(overhead,43,.65,.8,materials.lacquer,0,14.2,z);box(overhead,25,.52,.04,relief,0,14.2,z+.43);box(overhead,43,.08,.85,materials.gold,0,14.55,z);box(overhead,43,.08,.85,materials.gold,0,13.85,z);for(const x of [-8,-4,0,4,8]){const frame=rosette(overhead,.52,x,14.2,z+.47);frame.scale.y=.65;}}
  for(const x of [-21,-12.8,0,12.8,21]){box(overhead,.65,.55,40,materials.lacquer,x,15.15,5);box(overhead,.75,.07,40,materials.gold,x,14.86,5);}
  consolidate(overhead);
  consolidate(architecture);

  const ceiling=new T.Group();scene.add(ceiling);host.hallRoofs=[ceiling,overhead];
  box(ceiling,44,.35,41,materials.wood,0,16.7,5);
  for(let x=-18;x<=18;x+=6)for(let z=-10;z<=22;z+=8){
    box(ceiling,5.7,.1,7.7,relief,x,16.45,z);
    for(const side of [-1,1]){box(ceiling,.07,.2,7.6,materials.gold,x+side*2.7,16.3,z);box(ceiling,5.5,.2,.07,materials.gold,x,16.3,z+side*3.7);}
    const rosetteGroup=rosette(ceiling,1.15,x,16.24,z,true);rosetteGroup.rotation.x=Math.PI/2;
    for(const side of [-1,1])for(const end of [-1,1]){const r=rosette(ceiling,.31,x+side*2.15,16.23,z+end*3.1,true);r.rotation.x=Math.PI/2;}
  }
  // A large central circular canopy follows the visual axis to the shrine.
  for(const radius of [2.8,3.05,3.55]){const ring=torus(ceiling,radius,.09,materials.gold,0,16.05,-7);ring.rotation.x=Math.PI/2;}
  rosette(ceiling,2.65,0,16,-7,true);consolidate(ceiling);

  const furnishings=new T.Group();scene.add(furnishings);
  for(const x of [-16.8,16.8])for(const z of [-7,1,9,17])lantern(furnishings,x,10.5,z,1.1);
  for(const x of [-8.7,8.7])for(const z of [-5,11,23])lantern(furnishings,x,12.6,z,.85);
  // Repeated cushions and their seams are instanced instead of one draw call each.
  const count=CUSHION_X.length*CUSHION_Z.length,matrix=new T.Matrix4();let index=0;
  const cushion=new T.InstancedMesh(new T.CylinderGeometry(.88,.93,.26,32),materials.cushion,count),top=new T.InstancedMesh(new T.CylinderGeometry(.81,.86,.1,32),materials.cloth,count),seam=new T.InstancedMesh(new T.TorusGeometry(.86,.018,5,32),materials.gold,count);
  for(const x of CUSHION_X)for(const z of CUSHION_Z){matrix.makeTranslation(x,.28,z);cushion.setMatrixAt(index,matrix);matrix.makeTranslation(x,.46,z);top.setMatrixAt(index,matrix);matrix.makeRotationX(Math.PI/2);matrix.setPosition(x,.39,z);seam.setMatrixAt(index,matrix);index++;}
  for(const object of [cushion,top,seam]){object.castShadow=true;object.receiveShadow=true;object.userData.ignoreOcclusion=true;scene.add(object);}
  top.material=top.material.clone();top.material.color.set('#ffffff');SEATS.forEach((_seat,i)=>top.setColorAt(i,new T.Color('#d99426')));host.seatMeshes=[cushion,top];host.seatTops=top;
  // Brass votive lights line the raised altar and the window ledges.
  for(const sign of [-1,1])for(let z=-12;z<24;z+=1.2){cyl(furnishings,.15,.2,.16,materials.gold,sign*20.4,2.7,z);cyl(furnishings,.055,.07,.18,materials.glow,sign*20.4,2.86,z);}
  for(const x of [-8.7,8.7]){cyl(furnishings,.5,.8,.3,materials.gold,x,.28,-8);cyl(furnishings,.1,.24,2.8,materials.gold,x,1.8,-8);cyl(furnishings,.52,.3,.3,materials.gold,x,3.3,-8);for(let i=0;i<5;i++){const a=i*Math.PI*.4;cyl(furnishings,.065,.09,.33,materials.glow,x+Math.sin(a)*.32,3.56,-8+Math.cos(a)*.32);}}
  consolidate(furnishings);
  for(const b of BASINS)basin(scene,b);
  const plants=new T.Group();scene.add(plants);box(plants,4.2,.65,3,materials.stone,18.3,.35,0);box(plants,3.8,.06,2.6,materials.black,18.3,.7,0);
  tube(plants,[[18,.7,0],[18.4,2,0],[18,3,0],[18.5,4,-.3]],.17,materials.wood);
  for(let i=0;i<8;i++){const angle=i*2.4,x=18.3+Math.sin(angle)*(1+(i%2)*.35),y=2.5+(i%3)*.6,z=Math.cos(angle)*.9;tube(plants,[[18.2,2,0],[x,y-.3,z],[x,y,z]],.045,materials.wood);const leaf=mesh(plants,new T.SphereGeometry(.78,12,8),materials.leaf,x,y,z);leaf.scale.set(1,.35,.8);}consolidate(plants);
  host.fireflies=new T.Group();scene.add(host.fireflies); // calm air; no unrelated floating particles
  host.statueReady=buildShrine(scene);
  buildOutdoors(host);
}
