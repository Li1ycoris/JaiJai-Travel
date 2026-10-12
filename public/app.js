import {flatten,fullCode,selectPlaces} from './model.js';
import {loadWeather} from './weather.js';
const {catalog,destinations}=window.TRAVEL_DATA;
const sections={遊:{title:'景點',label:'PLACES',note:'展開景點查看詳細資訊與所屬活動。'},活動:{title:'活動',label:'ACTIVITIES',note:'比較活動費用與場次，也可回到所屬景點。'},食:{title:'餐廳與小吃',label:'FOOD & LOCAL FLAVOURS',note:'依區域找到餐廳、在地小吃與點心。'},住:{title:'住宿',label:'STAYS',note:'比較設施與位置；房價依房型與方案而異。'},行:{title:'交通與寄物',label:'GETTING AROUND',note:'車站、報到與寄物資訊；實際入口依業者指引。'},衣:{title:'攜帶用品',label:'PACKING',note:'依活動與天氣，準備需要的日用品。'}};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const google=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.name+' '+p.address);
const directions=p=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.name+' '+p.address);
let destinationId=catalog.defaultDestination,areaId='all',category='遊',map,layer;
let markers=new Map();
const getDestination=id=>Object.hasOwn(destinations,id)?destinations[id]:undefined;
const destination=()=>getDestination(destinationId);
const places=()=>destination()?flatten(destination()):[];
const visible=()=>destination()?selectPlaces(destination(),category,areaId):[];
const children=p=>places().filter(a=>a.type==='activity'&&a.parentId===p.id);
const code=p=>areaId==='all'?fullCode(destination(),p):p.prefix+p.number;
function updateURL(){const params=new URLSearchParams({destination:destinationId});if(areaId!=='all')params.set('area',areaId);if(category!=='遊')params.set('category',category);history.replaceState(null,'','#'+params);}
function readURL(){const p=new URLSearchParams(location.hash.slice(1));const id=p.get('destination');destinationId=catalog.destinations.some(d=>d.id===id)?id:catalog.defaultDestination;const area=p.get('area');areaId=destination()?.areas.some(a=>a.id===area)?area:'all';category=Object.hasOwn(sections,p.get('category'))?p.get('category'):'遊';}
function openMenu(){$('#destination-drawer').showModal();$('#menu-toggle').setAttribute('aria-expanded','true');}
function closeMenu(){$('#destination-drawer').close();}
$('#menu-toggle').addEventListener('click',openMenu);$('#choose-destination').addEventListener('click',openMenu);$('#menu-close').addEventListener('click',closeMenu);
$('#destination-drawer').addEventListener('close',()=>{$('#menu-toggle').setAttribute('aria-expanded','false');$('#menu-toggle').focus();});
$('#destination-drawer').addEventListener('click',e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX>r.right||e.clientX<r.left||e.clientY<r.top||e.clientY>r.bottom)closeMenu();}});
function renderDestination(){
 const entry=catalog.destinations.find(d=>d.id===destinationId),d=destination();
 $('#destination-list').innerHTML=catalog.destinations.map(e=>`<button class="destination-choice ${e.id===destinationId?'active':''}" data-destination="${e.id}" ${e.id===destinationId?'aria-current="page"':''}><span><strong>${esc(e.name)}</strong><small>${esc(e.nameEn)}</small></span><span class="destination-status">${e.status==='ready'?'探索 →':'資料整理中'}</span></button>`).join('');
 $('#destination-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{destinationId=b.dataset.destination;areaId='all';category='遊';closeMenu();renderDestination();updateURL();}));
 $('#current-destination').textContent=entry.name;document.title=`${entry.name}｜JaiJai Travel`;
 $('#destination-eyebrow').textContent=entry.nameEn;$('#destination-title').textContent=entry.name+'，隨手查。';
 $('#destination-description').textContent=d?.description||'下一座城市，下一段旅程。';
 $('#destination-count').textContent=d?`${d.areas.length} 個區域 · ${places().length} 筆資訊`:'資料整理中';
 $('#ready-content').hidden=!d;$('#planned-content').hidden=!!d;$('#destination-photo').hidden=!d?.image;$('#photo-credit').hidden=!d?.image;
 if(d?.image){$('#coast-photo').src=d.image.src;$('#coast-photo').alt=d.image.alt;$('#photo-caption').textContent=d.image.caption;const c=d.image.credit;$('#photo-credit-content').innerHTML=c?`<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)}</a> · <a href="${esc(c.licenseUrl)}" target="_blank" rel="noopener">${esc(c.license)}</a>（畫面裁切）`:'';}
 loadWeather(d);
 if(!d){layer?.clearLayers();markers.clear();$('#records').replaceChildren();return;}
 $('#area-list').innerHTML=`<button data-area="all">全部區域</button>`+d.areas.map(a=>`<button data-area="${a.id}"><small>${esc(a.code)}</small>${esc(a.name)}</button>`).join('');
 $('#area-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{areaId=b.dataset.area;render();updateURL();}));
 render();if(!map)initMap();else{map.invalidateSize();drawMarkers();}
}
function openRecord(id){const d=$('#record-'+id);if(!d)return null;const parent=d.parentElement.closest('details');if(parent)parent.open=true;d.open=true;return d;}
function recordHTML(p,nested=false){
 const parent=places().find(x=>x.id===p.parentId),related=category==='遊'?children(p):[];
 return `<details class="record ${nested?'activity-record':''}" id="record-${p.id}"><summary><div class="name-line"><span class="number" title="${esc(fullCode(destination(),p))}">${esc(code(p))}</span><div><h3>${esc(p.name)}</h3><p class="sub">${esc(p.sub)}</p>${related.length?`<span class="activity-count">${related.length} 項活動 · 展開查看</span>`:''}</div></div><div class="cell">${esc(p.price)}<small>${esc(p.priceNote)}</small></div><div class="cell">${esc(p.hours)}<small>${esc(p.hoursNote)}</small></div></summary><div class="detail-body">${parent?`<p class="parent-place">所屬景點：<button data-parent="${parent.id}">${esc(parent.name)} ↗</button></p>`:''}<p>${esc(p.feature)}</p><dl><dt>使用提醒</dt><dd>${esc(p.family)}</dd>${p.sessions?'<dt>活動場次</dt><dd>'+esc(p.sessions)+'</dd>':''}${p.entry?'<dt>入場資訊</dt><dd>'+esc(p.entry)+'</dd>':''}<dt>位置</dt><dd>${esc(p.address)}</dd><dt>提醒</dt><dd>${esc(p.note)}</dd></dl><div class="actions"><button class="primary" data-focus="${p.id}">地圖定位</button><a href="${google(p)}" target="_blank" rel="noopener">Google 地圖</a><a href="${directions(p)}" target="_blank" rel="noopener">導航</a><a href="${esc(p.source)}" target="_blank" rel="noopener">資料來源</a>${p.source2?`<a href="${esc(p.source2)}" target="_blank" rel="noopener">補充來源</a>`:''}</div>${related.length?`<section class="related-activities" aria-label="${esc(p.name)}的活動"><h4>這裡的活動</h4>${related.map(a=>recordHTML(a,true)).join('')}</section>`:''}</div></details>`;
}
function render(){
 const d=destination();if(!d)return;const s=sections[category],rows=visible();
 $('#section-title').textContent=s.title;$('#section-label').textContent=s.label;$('#section-note').textContent=s.note;$('#map-category').textContent=category==='衣'?'目前區域':s.title;
 $('#result-count').textContent=category==='衣'?`${d.packing.length} 組建議`:`${rows.length} 筆資訊`;
 $('#area-summary').textContent=areaId==='all'?'選擇一個區域，查看附近的地方':d.areas.find(a=>a.id===areaId).name;
 $('#area-list').querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.area===areaId);b.setAttribute('aria-pressed',String(b.dataset.area===areaId));});
 document.querySelectorAll('[data-category]').forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));const count=b.querySelector('small');if(count)count.textContent=selectPlaces(d,b.dataset.category,areaId).length;});
 const container=$('#records');
 if(category==='衣')container.innerHTML='<div class="gear-grid">'+d.packing.map(g=>`<article class="gear-card"><h3>${esc(g.title)}</h3><ul>${g.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></article>`).join('')+'</div>';
 else if(!rows.length)container.innerHTML='<div class="empty-state"><h3>這個區域尚未收錄此類資訊</h3><p>可以切換分類，或查看全部區域。</p><button id="show-all-areas">查看全部區域</button></div>';
 else if(areaId==='all')container.innerHTML=d.areas.map(a=>{const local=rows.filter(p=>p.areaId===a.id);return local.length?`<section class="area-group"><h3 class="area-group-heading"><span>${a.code}</span>${esc(a.name)}<small>${local.length} 筆</small></h3>${local.map(p=>recordHTML(p)).join('')}</section>`:'';}).join('');
 else container.innerHTML=rows.map(p=>recordHTML(p)).join('');
 $('#show-all-areas')?.addEventListener('click',()=>{areaId='all';render();updateURL();});
 container.querySelectorAll('[data-focus]').forEach(b=>b.addEventListener('click',()=>focusPlace(b.dataset.focus)));
 container.querySelectorAll('[data-parent]').forEach(b=>b.addEventListener('click',()=>{category='遊';render();updateURL();const el=openRecord(b.dataset.parent);el?.scrollIntoView({block:'center'});focusPlace(b.dataset.parent);}));
 container.querySelectorAll('details.record').forEach(el=>el.addEventListener('toggle',()=>{if(el.open){const marker=markers.get(el.id.slice(7));if(marker){map.panTo(marker.getLatLng());marker.openPopup();}}}));
 drawMarkers();
}
function initMap(){if(!window.L){$('#map-fallback').hidden=false;return;}map=L.map('map',{scrollWheelZoom:false}).setView(destination().center,destination().zoom);let errors=0;L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).on('tileerror',()=>{if(++errors>3)$('#map-fallback').hidden=false;}).addTo(map);layer=L.layerGroup().addTo(map);drawMarkers();}
function fitMap(){const rows=visible();if(!map||!destination())return;if(rows.length)map.fitBounds(rows.map(p=>p.coords),{padding:[45,45],maxZoom:14});else map.setView(destination().center,destination().zoom);}
function drawMarkers(){if(!map||!destination())return;layer.clearLayers();markers.clear();visible().forEach(p=>{
 const cls=({restaurant:'food',stay:'stay',transport:'transit',activity:'activity'})[p.type]||'';
 const marker=L.marker(p.coords,{icon:L.divIcon({className:'',html:`<span class="map-pin ${cls}">${esc(code(p))}</span>`,iconSize:[58,32],iconAnchor:[29,16]}),title:p.name,keyboard:true}).bindPopup(`<strong>${esc(p.name)}</strong><p>${esc(fullCode(destination(),p))} · ${esc(p.address)}</p><div class="popup-actions"><a href="#record-${p.id}" data-record="${p.id}">查看資訊</a><a href="${directions(p)}" target="_blank" rel="noopener">Google 導航</a></div>`);
 marker.on('popupopen',()=>{document.querySelector(`[data-record="${p.id}"]`)?.addEventListener('click',e=>{e.preventDefault();if(category==='衣'){category=p.category;render();updateURL();}openRecord(p.id)?.scrollIntoView({block:'center'});});});marker.addTo(layer);markers.set(p.id,marker);
 });fitMap();}
function focusPlace(id){const p=places().find(p=>p.id===id);if(!p)return;const marker=markers.get(id)||markers.get(p.parentId);if(marker){map.setView(marker.getLatLng(),15);marker.openPopup();if(innerWidth<761)$('#map').scrollIntoView({block:'center'});}else window.open(google(p),'_blank','noopener');}
function showPlace(id,target=destinationId){if(!getDestination(target))throw Error('目的地尚未收錄資料');const p=flatten(destinations[target]).find(p=>p.id===id);if(!p)throw Error('找不到地點');destinationId=target;areaId=p.areaId;category=p.category;renderDestination();updateURL();const el=openRecord(id);focusPlace(id);return {id,destination:target,expanded:!!el?.open};}
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'list_travel_places',title:'查詢旅遊地點',description:'依目的地、區域與分類查詢公開旅遊資料。',inputSchema:{type:'object',properties:{destination:{type:'string'},area:{type:'string'},category:{type:'string',enum:['遊','活動','食','住','行']}},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input={}){if(Object.keys(input).some(k=>!['destination','area','category'].includes(k)))throw Error('不支援的參數');const d=getDestination(input.destination||destinationId);if(!d)return [];if(input.category&&!['遊','活動','食','住','行'].includes(input.category))throw Error('不支援的分類');return (input.category?selectPlaces(d,input.category,input.area||'all'):flatten(d).filter(p=>!input.area||input.area==='all'||p.areaId===input.area)).map(p=>({...p,code:fullCode(d,p),destination:d.id}));}});
 register({name:'show_travel_place',title:'顯示旅遊地點',description:'切換目的地、區域與分類，展開地點並定位地圖。',inputSchema:{type:'object',properties:{id:{type:'string'},destination:{type:'string'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.id!=='string'||Object.keys(input).some(k=>!['id','destination'].includes(k)))throw Error('請提供地點ID');return showPlace(input.id,input.destination||destinationId);}});window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;render();updateURL();}));$('#reset-map').addEventListener('click',fitMap);$('#weather-retry').addEventListener('click',()=>loadWeather(destination()));
window.addEventListener('hashchange',()=>{readURL();renderDestination();});readURL();renderDestination();
