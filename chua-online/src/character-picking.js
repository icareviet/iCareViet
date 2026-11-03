export function pickCharacter(ray,avatars,blockers=[]){
  const visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
  const hit=ray.intersectObjects(avatars.filter(Boolean),true).find(h=>visible(h.object));if(!hit)return null;
  const far=ray.far;ray.far=hit.distance-.06;
  const blocked=ray.intersectObjects(blockers.filter(o=>visible(o)&&!(o.material?.transparent&&o.material.opacity<.2)),false).length>0;ray.far=far;
  if(blocked)return null;
  for(let o=hit.object;o;o=o.parent)if(o.userData.characterId)return o.userData.characterId;
  return null;
}
