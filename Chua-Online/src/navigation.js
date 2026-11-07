import {HALL,BOUNDS,SPAWN,COLUMN_X,COLUMN_Z,BASINS,SHRINE,SEATS,WALLS,TREES,PLACES,CHANNEL,BRIDGE} from './world-layout.js';
export const DESTINATIONS=PLACES;

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function isWalkable(x, z, options={}) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || x < BOUNDS.left || x > BOUNDS.right || z < BOUNDS.back || z > BOUNDS.front) return false;
  if(WALLS.some(([left,right,back,front])=>x>left&&x<right&&z>back&&z<front))return false;
  if(z>CHANNEL.back-.3&&z<CHANNEL.front+.3&&x>CHANNEL.left-.3&&x<CHANNEL.right+.3&&Math.abs(x)>BRIDGE.halfWidth)return false;
  if(z>BRIDGE.back+.2&&z<BRIDGE.front-.2&&Math.abs(x)>BRIDGE.halfWidth&&Math.abs(x)<BRIDGE.halfWidth+.75)return false;
  for (const basin of BASINS) if (((x-basin.x)/(basin.rx+.35))**2+((z-basin.z)/(basin.rz+.35))**2<1) return false;
  if(x>SHRINE.left&&x<SHRINE.right&&z<SHRINE.front) return false;
  for(const cx of COLUMN_X)for(const cz of COLUMN_Z)if(Math.hypot(x-cx,z-cz)<1.12)return false;
  for(const seat of SEATS)if(seat.id!==options.seatId&&Math.hypot(x-seat.x,z-seat.z)<1.12)return false;
  for(const tree of TREES)if(Math.hypot(x-tree.x,z-tree.z)<.8)return false;
  // The planted side bay is bounded by its stone planter.
  if(x>16.2&&x<20.5&&z>-1.5&&z<1.5)return false;
  return true;
}

export function safePosition(x, z, options={}) {
  x = Number(x); z = Number(z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return {...SPAWN};
  x = clamp(x, BOUNDS.left, BOUNDS.right); z = clamp(z, BOUNDS.back, BOUNDS.front);
  if (isWalkable(x, z,options)) return { x, z };
  for (let radius = .35; radius < 9; radius += .35) {
    for (let i = 0; i < 32; i++) {
      const angle = i * Math.PI / 16;
      const point = { x: x + Math.sin(angle) * radius, z: z + Math.cos(angle) * radius };
      if (isWalkable(point.x, point.z,options)) return point;
    }
  }
  return {...SPAWN};
}

export function groundHeight(x, z) {
  if(Math.abs(x)<=BRIDGE.halfWidth+.45&&z>=BRIDGE.back&&z<=BRIDGE.front){const t=(z-BRIDGE.back)/(BRIDGE.front-BRIDGE.back);return HALL.floor+BRIDGE.rise*4*t*(1-t);}
  return HALL.floor;
}

export function moveOnGround(position, dx, dz, options={}) {
  let { x, z } = safePosition(position.x, position.z,options);
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .18));
  for (let i = 0; i < steps; i++) {
    const nextX = clamp(x + dx / steps, BOUNDS.left, BOUNDS.right), nextZ = clamp(z + dz / steps, BOUNDS.back, BOUNDS.front);
    if (isWalkable(nextX, nextZ,options)) { x = nextX; z = nextZ; }
    else if (isWalkable(nextX, z,options)) x = nextX;
    else if (isWalkable(x, nextZ,options)) z = nextZ;
  }
  return { x, z };
}

function clearSegment(start, end, options={}) {
  const steps = Math.ceil(Math.hypot(end.x - start.x, end.z - start.z) / .2);
  for (let i = 1; i <= steps; i++) if (!isWalkable(start.x + (end.x - start.x) * i / steps, start.z + (end.z - start.z) * i / steps,options)) return false;
  return true;
}

// A bounded floor grid routes taps around basins, columns, and the shrine.
export function planPath(start, requested, options={}) {
  start = safePosition(start.x, start.z,options);
  const end = safePosition(requested.x, requested.z,options);
  if (clearSegment(start, end,options)) return [end];
  const gridPoint = point => {
    let nearest = null, distance = Infinity;
    for (let x = Math.round(point.x) - 2; x <= Math.round(point.x) + 2; x++) {
      for (let z = Math.round(point.z) - 2; z <= Math.round(point.z) + 2; z++) {
        const candidate = { x, z }, delta = Math.hypot(x - point.x, z - point.z);
        if (delta < distance && isWalkable(x, z,options) && clearSegment(point, candidate,options)) { nearest = candidate; distance = delta; }
      }
    }
    return nearest;
  };
  const first = gridPoint(start), last = gridPoint(end);
  if (!first || !last) return [];
  const key = p => `${p.x},${p.z}`, goal = key(last);
  const open = [{ ...first, g: 0, f: 0 }], best = new Map([[key(first), 0]]), parents = new Map(), points = new Map([[key(first), first]]);
  while (open.length) {
    open.sort((a, b) => b.f - a.f);
    const current = open.pop(), currentKey = key(current);
    if (current.g !== best.get(currentKey)) continue;
    if (currentKey === goal) {
      const path = [end]; let cursor = goal;
      while (cursor) { path.unshift(points.get(cursor)); cursor = parents.get(cursor); }
      const smooth = []; let anchor = start;
      for (let i = 0; i < path.length;) {
        let farthest = i;
        for (let j = i; j < path.length && clearSegment(anchor, path[j],options); j++) farthest = j;
        smooth.push(path[farthest]); anchor = path[farthest]; i = farthest + 1;
      }
      return smooth;
    }
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue;
      const next = { x: current.x + dx, z: current.z + dz }, nextKey = key(next);
      if (!isWalkable(next.x, next.z,options) || !clearSegment(current, next,options)) continue;
      const cost = current.g + Math.hypot(dx, dz);
      if (cost >= (best.get(nextKey) ?? Infinity)) continue;
      best.set(nextKey, cost); parents.set(nextKey, currentKey); points.set(nextKey, next);
      open.push({ ...next, g: cost, f: cost + Math.hypot(next.x - last.x, next.z - last.z) });
    }
  }
  return [];
}

export function locationAt(x, z) {
  if(z>75)return 'gate';
  if(z<HALL.front&&Math.abs(x)<22)return 'hall';
  if(BASINS.some(b=>Math.hypot((x-b.x)/1.2,z-b.z)<b.rz+5))return 'pond';
  if(Math.abs(x)>12)return 'garden';
  return 'courtyard';
}
