import test from 'node:test';
import assert from 'node:assert/strict';
import {destinations,validateDestination} from '../scripts/check.mjs';
import {flatten,selectPlaces,fullCode} from '../public/model.js';
const hualien=destinations.hualien;
test('codes remain stable after filtering and reordering',()=>{
 const original=flatten(hualien).map(p=>[p.id,fullCode(hualien,p)]);
 const shuffled=structuredClone(hualien);for(const rows of Object.values(shuffled.collections))rows.reverse();
 const codes=new Map(flatten(shuffled).map(p=>[p.id,fullCode(shuffled,p)]));
 for(const [id,code]of original)assert.equal(codes.get(id),code);
 assert.equal(new Set(original.map(x=>x[1])).size,42);
});
test('area and category intersect; activities retain parent place',()=>{
 const local=selectPlaces(hualien,'食','station');assert(local.length>0);assert(local.every(p=>p.areaId==='station'&&p.type==='restaurant'));
 assert.equal(selectPlaces(hualien,'活動','shoufeng')[0].parentId,'ocean');
 assert(selectPlaces(hualien,'遊','meilun-harbor').some(p=>p.id==='harbor'));
 assert.equal(selectPlaces(hualien,'遊').length,14);assert.equal(selectPlaces(hualien,'食').length,19);
});
test('a second destination supports the same loader and identifiers independently',()=>{
 const second=structuredClone(hualien);second.id='bangkok';second.name='曼谷';second.nameEn='BANGKOK';second.timezone='Asia/Bangkok';
 assert.equal(validateDestination(second),42);assert.equal(selectPlaces(second,'食','station').length,selectPlaces(hualien,'食','station').length);
});
test('invalid IDs, display codes, areas and parent references are rejected',()=>{
 for(const change of [d=>{d.collections.restaurants[0].areaId='missing';},d=>{d.collections.activities[0].parentId='missing';},d=>{d.collections.activities[0].areaId='city';},d=>{d.collections.restaurants.push({...d.collections.restaurants[0],id:'different'});},d=>{d.collections.restaurants[0].number=0;}]){
  const d=structuredClone(hualien);change(d);assert.throws(()=>validateDestination(d));
 }
});
