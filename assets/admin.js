const $=s=>document.querySelector(s);
let generation=0,controller;
const time=v=>v?new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'—';
function clearDashboard(){for(const id of ['summary','identity','visitors','recent','cinema-summary','cinema-events'])$('#'+id).replaceChildren();$('#dashboard').hidden=true;$('#login').hidden=false}
function invalidate(){++generation;controller?.abort()}
async function api(path,options={}){const res=await fetch('/api/admin/'+path,{cache:'no-store',...options});const data=await res.json();if(!res.ok){const error=Error(data.error||'暂时无法读取');error.status=res.status;throw error}return data}
function table(target,headers,rows){const t=document.createElement('table'),head=t.createTHead().insertRow();for(const label of headers){const th=document.createElement('th');th.textContent=label;head.append(th)}const body=t.createTBody();for(const values of rows){const row=body.insertRow();for(const v of values)row.insertCell().textContent=v??'未知'}if(!rows.length){const cell=body.insertRow().insertCell();cell.colSpan=headers.length;cell.textContent='所选范围内暂无已采集记录'}$(target).replaceChildren(t)}
async function load(){
 invalidate();const version=generation;controller=new AbortController();const signal=controller.signal,days=$('#days').value;
 $('#status').textContent='正在读取…';
 try{
  const d=await api('visitors?days='+days,{signal});if(version!==generation)return;
  $('#login').hidden=true;$('#dashboard').hidden=false;$('#status').textContent='';$('#summary').replaceChildren();
  for(const [name,value] of [['打开次数',d.summary.views],['不同 IP（非人数）',d.summary.ips]]){const box=document.createElement('div'),label=document.createElement('span'),number=document.createElement('strong');label.textContent=name;number.textContent=value;box.append(label,number);$('#summary').append(box)}
  $('#identity').textContent=d.identity;
  table('#visitors',['IP','打开次数','首次访问','最近访问'],d.visitors.map(x=>[x.ip,x.views,time(x.firstSeen),time(x.lastSeen)]));
  table('#recent',['时间','IP','大致地区','设备'],d.recent.map(x=>[time(x.opened_at),x.ip,[x.country,x.region,x.city].filter(Boolean).join(' · '),x.device]));
  $('#cinema-summary').textContent='正在读取…';$('#cinema-events').replaceChildren();
  try{
   const c=await api('cinema?days='+days,{signal});if(version!==generation)return;
   $('#cinema-summary').textContent=`进入影院 ${c.summary.events-(c.summary.searches||0)} 次 · 搜索 ${c.summary.searches||0} 次 · 不同 IP ${c.summary.ips}`;
   table('#cinema-events',['时间','IP','操作','搜索内容'],c.events.map(x=>[time(x.opened_at),x.ip,x.kind==='search'?'搜索':'进入影院',x.query||'—']));
  }catch(e){if(version!==generation)return;if(e.status===401)throw e;$('#cinema-summary').textContent=e.message}
 }catch(e){if(version!==generation)return;clearDashboard();$('#status').textContent=e.message}
}
$('#login').onsubmit=async e=>{e.preventDefault();invalidate();const version=generation;const button=$('#login button');button.disabled=true;try{await api('session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#password').value})});if(version!==generation)return;$('#password').value='';await load()}catch(e){if(version===generation)$('#status').textContent=e.message}finally{button.disabled=false}};
$('#refresh').onclick=load;$('#days').onchange=load;
$('#logout').onclick=async()=>{invalidate();clearDashboard();const version=generation;$('#status').textContent='正在退出…';try{await api('session',{method:'DELETE'});if(version===generation)$('#status').textContent='已退出网站管理'}catch(e){if(version===generation)$('#status').textContent='退出请求未完成，请重试：'+e.message}};
// A restored back/forward page must verify its session again.
window.addEventListener('pagehide',()=>{invalidate();clearDashboard()});
window.addEventListener('pageshow',e=>{if(e.persisted)load()});
load();
