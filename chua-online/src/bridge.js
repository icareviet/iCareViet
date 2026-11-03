import * as T from 'three';
import {CHANNEL,BRIDGE} from './world-layout.js';
import {groundHeight} from './navigation.js';

// Deck, collision and avatar height use the same quadratic arch.
export function buildBridge(host,{box,cyl,beam,mesh,mergeGroup,materials:m}){
  const g=new T.Group();host.scene.add(g);g.name='Cầu qua hồ';
  const center=(CHANNEL.back+CHANNEL.front)/2,depth=CHANNEL.front-CHANNEL.back;
  const water=new T.MeshStandardMaterial({color:'#244c48',metalness:.48,roughness:.22});
  box(g,CHANNEL.right-CHANNEL.left,.1,depth,water,0,.145,center);
  for(const z of [CHANNEL.back-.17,CHANNEL.front+.17])for(const side of [-1,1])box(g,27,.28,.4,m.stone,side*17.8,.04,z);
  const length=BRIDGE.front-BRIDGE.back,segments=48,step=length/segments;
  for(let i=0;i<segments;i++){
    const z=BRIDGE.back+(i+.5)*step,y=groundHeight(0,z),board=box(g,8.05,.22,step*.98,m.wood,0,y-.11,z);
    board.rotation.x=-Math.atan((groundHeight(0,z+.01)-groundHeight(0,z-.01))/.02);
    for(const side of [-1,1])box(g,.1,.025,step,m.gold,side*3.75,y+.012,z);
  }
  for(const side of [-1,1]){
    const rail=new T.Group();rail.userData.occlusionGroup=true;host.scene.add(rail);
    for(let i=0;i<=8;i++){
      const z=BRIDGE.back+i*length/8,y=groundHeight(0,z),x=side*4;
      cyl(rail,.12,.17,1.5,m.red,x,y+.72,z);cyl(rail,.19,.19,.12,m.gold,x,y+1.48,z);
      mesh(rail,new T.SphereGeometry(.18,12,8),m.gold,x,y+1.65,z);
    }
    for(const height of [.53,1.35])for(let i=0;i<segments;i++){
      const z1=BRIDGE.back+i*step,z2=z1+step;
      beam(rail,[side*4,groundHeight(0,z1)+height,z1],[side*4,groundHeight(0,z2)+height,z2],height>1?.1:.055,height>1?m.red:m.gold);
    }
    mergeGroup(rail);
  }
  // Lotus leaves float beside the crossing; no decorative geometry blocks the deck.
  const leaf=new T.MeshStandardMaterial({color:'#48664a',roughness:.8});
  for(let i=0;i<24;i++){const x=(i%2?1:-1)*(6+(i*3.7)%23),z=31+(i*.83)%5.7,o=mesh(g,new T.CircleGeometry(.3+(i%3)*.09,16),leaf,x,.205,z);o.rotation.x=-Math.PI/2;o.castShadow=false;}
  mergeGroup(g);
  host.walkSurfaces=g.children.filter(o=>o.material===m.wood);
}
