const local=()=>['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&location.port==='4189';
async function json(url,signal){const r=await fetch(url,{signal,cache:'no-store'});if(!r.ok)throw Error('资料暂时无法读取');return r.json()}
export async function loadWikiCatalog(signal){
  const catalog=await json(local()?'/api/aero-library/catalog?refresh=1':'/assets/wiki/catalog.json',signal);
  if(local()){
    // Published title metadata supplements the same local page IDs; public files never replace live local data.
    try{const snapshot=await json('/assets/wiki/catalog.json',signal),titles=new Map([snapshot.home,...snapshot.topics].filter(Boolean).map(p=>[p.id,p.englishTitle]));for(const p of [catalog.home,...catalog.topics].filter(Boolean))p.englishTitle=titles.get(p.id)||'';}catch(error){if(signal?.aborted)throw error;}
  }
  return catalog;
}
export async function loadWikiPage(id,catalog,signal){
  if(!/^[1-9]\d{0,11}$/.test(String(id)))throw Error('条目标识无效');
  return json(catalog.mode==='published'?'/assets/wiki/pages/'+id+'.json':'/api/aero-library/page?id='+id,signal);
}
export async function loadWikiGraph(catalog,signal){
  const ids=[catalog.home,...catalog.topics].filter(Boolean).map(p=>p.id),pages=[];
  for(let i=0;i<ids.length;i+=3)pages.push(...await Promise.all(ids.slice(i,i+3).map(id=>loadWikiPage(id,catalog,signal))));
  return pages;
}
