import layout from '../app/world-layout.json' with {type:'json'};
// One source for PHP seat ownership, Three.js, routing, and the map.
export const HALL=Object.freeze(layout.hall), BOUNDS=Object.freeze(layout.bounds), SPAWN=Object.freeze(layout.spawn);
export const COLUMN_X=layout.columns.x,COLUMN_Z=layout.columns.z,BASINS=layout.basins,SHRINE=layout.shrine;
export const CUSHION_X=layout.cushions.x,CUSHION_Z=layout.cushions.z,WALLS=layout.walls,TREES=layout.trees;
export const PLACES=Object.freeze(layout.destinations);
export const CHANNEL=Object.freeze(layout.channel),BRIDGE=Object.freeze(layout.bridge);
export const SEATS=CUSHION_X.flatMap((x,column)=>CUSHION_Z.map((z,row)=>({id:`${String.fromCharCode(97+row)}${column+1}`,label:`${String.fromCharCode(65+row)}${column+1}`,x,z,row,column})));
export const seatById=id=>SEATS.find(seat=>seat.id===id);
export const mapPoint=(x,z)=>({x:140+x*3.25,z:16+(z+14)*3.25});
