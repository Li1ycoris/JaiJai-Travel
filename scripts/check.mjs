import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {kinds,flatten,fullCode} from '../public/model.js';
export const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>JSON.parse(fs.readFileSync(root+path,'utf8'));
const idPattern=/^[a-z][a-z0-9-]*$/;
export function validateDestination(d) {
  assert(idPattern.test(d.id),'Invalid destination ID');
  assert(d.name&&d.nameEn,'Missing destination name');
  assert(Array.isArray(d.center)&&d.center.length===2&&d.center.every(Number.isFinite),'Invalid center');
  assert(d.timezone,'Missing timezone');
  new Intl.DateTimeFormat('en',{timeZone:d.timezone});
  assert(typeof d.description==='string'&&Number.isFinite(d.zoom),'Missing destination display metadata');
  assert(Array.isArray(d.packing)&&d.packing.every(g=>typeof g.title==='string'&&Array.isArray(g.items)&&g.items.every(x=>typeof x==='string')),'Invalid packing data');
  const https=url=>assert(new URL(url).protocol==='https:','Metadata URL must use HTTPS');
  if(d.weather){assert(d.weather.name&&d.weather.label&&typeof d.weather.note==='string','Missing weather labels');assert(Array.isArray(d.weather.coords)&&d.weather.coords.length===2&&d.weather.coords.every(Number.isFinite)&&Math.abs(d.weather.coords[0])<=90&&Math.abs(d.weather.coords[1])<=180,'Invalid weather coordinates');https(d.weather.url);}
  if(d.image){assert(/^[a-zA-Z0-9_./-]+$/.test(d.image.src)&&!d.image.src.startsWith('/')&&!d.image.src.split('/').includes('..'),'Image must be a relative asset path');assert(d.image.alt&&d.image.caption&&d.image.credit?.name&&d.image.credit?.license,'Missing image attribution');https(d.image.credit.url);https(d.image.credit.licenseUrl);}
  const areaIds=new Set(), areaCodes=new Set();
  for(const a of d.areas){assert(idPattern.test(a.id)&&!areaIds.has(a.id),'Invalid/duplicate area ID');assert(/^[A-Z]{2,4}$/.test(a.code)&&!areaCodes.has(a.code),'Invalid/duplicate area code');assert(a.name,'Missing area name');areaIds.add(a.id);areaCodes.add(a.code);}
  assert(areaIds.size,'Destination requires areas');
  for(const key of Object.keys(d.collections))assert(kinds[key]&&Array.isArray(d.collections[key]),'Unknown collection');
  for(const key of Object.keys(kinds))assert(Array.isArray(d.collections[key]),'Missing collection');
  const records=flatten(d), ids=new Set(), codes=new Set();
  for(const p of records){
    assert(idPattern.test(p.id)&&!ids.has(p.id),'Invalid/duplicate place ID');ids.add(p.id);
    assert(areaIds.has(p.areaId),'Unknown area');assert(Number.isInteger(p.number)&&p.number>0,'Invalid number');
    const code=fullCode(d,p);assert(!codes.has(code),'Duplicate display code');codes.add(code);
    for(const key of ['name','sub','price','priceNote','hours','hoursNote','address','feature','family','note','source'])assert(typeof p[key]==='string'&&p[key].trim(),`Missing ${key}: ${p.id}`);
    assert(Array.isArray(p.coords)&&p.coords.length===2&&p.coords.every(Number.isFinite)&&Math.abs(p.coords[0])<=90&&Math.abs(p.coords[1])<=180,'Invalid coordinates');
    for(const key of ['source','source2'])if(p[key])assert(new URL(p[key]).protocol==='https:','Source must use HTTPS');
    assert(!p.status,'Do not publish personal booking status');
  }
  for(const p of records){
    if(p.type==='activity'){const parent=records.find(x=>x.id===p.parentId);assert(parent&&parent.type!=='activity','Activity needs a valid place');assert(parent.areaId===p.areaId,'Activity must share its parent area');}
    else assert(p.parentId===undefined,'Only activities have a parent');
  }
  return records.length;
}
export const catalog=read('data/destinations.json');
assert(catalog.schemaVersion===1,'Unsupported schema');
const destinationIds=new Set();export const destinations={};let count=0;
for(const entry of catalog.destinations){
 assert(idPattern.test(entry.id)&&!destinationIds.has(entry.id),'Invalid/duplicate destination ID');destinationIds.add(entry.id);
 assert(['ready','planned'].includes(entry.status),'Invalid destination status');assert(entry.name&&entry.nameEn,'Missing catalog name');
 if(entry.status==='planned')continue;
 const dir=`data/${entry.id}/`;
 const meta=read(dir+'destination.json');assert(meta.id===entry.id,'Destination path mismatch');
 assert(meta.collections.length===Object.keys(kinds).length&&new Set(meta.collections).size===meta.collections.length,'Invalid collection manifest');
 const collections=Object.fromEntries(meta.collections.map(key=>{assert(kinds[key],'Invalid collection path');return [key,read(dir+key+'.json')];}));
 const d={...meta,areas:read(dir+'areas.json'),collections};count+=validateDestination(d);destinations[entry.id]=d;
}
assert(destinations[catalog.defaultDestination],'Default destination must be ready');
console.log(`Validated ${Object.keys(destinations).length} destinations, ${count} records`);
