const $=s=>document.querySelector(s);
let activeController,version=0;
function label(code){if(code===0)return '晴朗';if([1,2].includes(code))return '晴時多雲';if(code===3)return '陰天';if([45,48].includes(code))return '有霧';if([51,53,55,56,57].includes(code))return '毛毛雨';if([61,63,65,66,67].includes(code))return '有雨';if([71,73,75,77,85,86].includes(code))return '降雪';if([80,81,82].includes(code))return '陣雨';if([95,96,99].includes(code))return '雷雨';return '未提供';}
const number=(v,unit)=>Number.isFinite(v)?Math.round(v)+unit:'未提供';
export async function loadWeather(destination){
 const currentVersion=++version;activeController?.abort();const content=$('#weather-content'),retry=$('#weather-retry'),weather=destination?.weather;
 $('#weather-section').hidden=!weather;content.replaceChildren();if(!weather)return;
 $('#weather-title').textContent=weather.name+'天氣';$('#weather-note').textContent=weather.note;$('#weather-official').href=weather.url;$('#weather-official').textContent=weather.label+' ↗';
 retry.disabled=true;content.textContent='正在載入天氣資訊…';const controller=new AbortController();activeController=controller;const timeout=setTimeout(()=>controller.abort(),10000);
 try{
  const params=new URLSearchParams({latitude:String(weather.coords[0]),longitude:String(weather.coords[1]),current:'temperature_2m,apparent_temperature,weather_code',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',timezone:destination.timezone,forecast_days:'3'});
  const response=await fetch('https://api.open-meteo.com/v1/forecast?'+params,{signal:controller.signal});if(!response.ok)throw Error('Unavailable');
  const {current,daily}=await response.json();if(!current||!daily||daily.time?.length!==3||!Number.isFinite(current.temperature_2m)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(current.time))throw Error('Incomplete');if(currentVersion!==version)return;
  const forecast=daily.time.map((date,i)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid date');const day=new Intl.DateTimeFormat('zh-TW',{timeZone:'UTC',month:'numeric',day:'numeric',weekday:'short'}).format(new Date(date+'T12:00:00Z'));return `<div class="weather-day"><strong>${i===0?'今天 · ':''}${day}</strong><span>${label(daily.weather_code?.[i])}</span><span>${number(daily.temperature_2m_min?.[i],'°')}–${number(daily.temperature_2m_max?.[i],'°C')}</span><small>降雨機率 ${number(daily.precipitation_probability_max?.[i],'%')}</small></div>`;}).join('');
  content.innerHTML=`<div class="weather-current"><strong>${number(current.temperature_2m,'°C')}</strong><div>${label(current.weather_code)}<small>體感 ${number(current.apparent_temperature,'°C')} · 資料時間 ${current.time.slice(5,16).replace('T',' ')}（當地時間）</small></div></div><div class="weather-forecast">${forecast}</div>`;
 }catch{if(currentVersion===version)content.textContent='暫時無法取得天氣，請重新整理或查看當地預報。';}
 finally{clearTimeout(timeout);if(currentVersion===version)retry.disabled=false;}
}
