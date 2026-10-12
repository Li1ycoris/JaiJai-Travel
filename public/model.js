export const kinds = {
  attractions: {type:'attraction',prefix:'P',category:'遊'},
  activities: {type:'activity',prefix:'A',category:'活動'},
  restaurants: {type:'restaurant',prefix:'F',category:'食'},
  stays: {type:'stay',prefix:'S',category:'住'},
  transport: {type:'transport',prefix:'T',category:'行'}
};
export function flatten(destination) {
  return Object.entries(destination.collections).flatMap(([key,rows])=>rows.map(p=>({...p,...kinds[key]})));
}
export function fullCode(destination,p) {
  return `${destination.areas.find(a=>a.id===p.areaId).code}-${p.prefix}${p.number}`;
}
export function selectPlaces(destination,category,areaId='all') {
  const places=flatten(destination);
  const parents=new Set(places.filter(p=>p.type==='activity').map(p=>p.parentId));
  return places.filter(p=>(areaId==='all'||p.areaId===areaId) && (category==='衣'||(category==='遊'?(p.type==='attraction'||parents.has(p.id)):p.category===category)));
}
