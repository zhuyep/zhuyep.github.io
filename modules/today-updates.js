import {parseWorkBrief,readingReason} from './intel-work-brief.js';
import {GAME_TITLES} from './game-loader.js';
export const SECTIONS=[['intel','情报','#intel'],['books','书房','#books'],['games','放松','#games'],['maixiang','脉象','/maixiang/'],['opc','朱家军','/opc/']];
// Dated changes attested by the published module or the corresponding release receipt.
export const SECTION_RELEASES=[
 {id:'study-library-20261024',kind:'books',date:'2026-10-24',dateLabel:'功能调整',title:'言库并入书房，资料与写作素材一起查',note:'段落检索、收藏与复制保留，原来的素材链接仍可使用。',href:'#books/library'},
 {id:'cinema-public-20261024',kind:'video',date:'2026-10-24',dateLabel:'功能调整',title:'影院免密码进入，搜片后直接播放',note:'“看片不迷路，观影找老猪”保留在影院顶部。',href:'#video'},
 {id:'tianji-20260921',kind:'games',date:'2026-09-21',dateLabel:'内容更新',title:'天机簿：术语、古籍短引与本盘依据',note:'六章逐段解释判断依据，以及哪些条件会改变解读。',href:'#games'},
 {id:'games-20260905',kind:'games',date:'2026-09-05',dateLabel:'栏目上线',title:'Hextris 与 0h h1，随手开一局',note:'六边形消除与二色逻辑，支持手机触控。',href:'#games'}
];
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value))?value:'';
const day=value=>{if(!value||!Number.isFinite(Date.parse(value)))return '';const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)).map(p=>[p.type,p.value]));return [parts.year,parts.month,parts.day].join('-');};
const opcHome=()=>globalThis.location?.hostname==='zhuyep.github.io'?'https://zhushi-daji-preview.pages.dev/opc/':'/opc/';
const sectionHome=(key,href)=>key==='opc'?opcHome():href;
const shortDate=value=>value?.slice(5).replace('-','.')||'';
const sentence=value=>{const s=String(value??'').replace(/\s+/g,' ').trim();return s.match(/^.*?[。！？][”’」』]?/)?.[0]||s;};
export function opcSnapshot(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.events)||raw.mode==='demo'||raw.mode==='simulation')return {status:'unavailable',entries:[]};
 const seen=new Set(),entries=[];
 for(const event of raw.events.slice(0,100)){
  if(!event||event.demo||String(event.id||'').startsWith('demo-'))continue;
  const date=day(event.received_at||event.at);if(!date)continue;
  const message=String(event.message??'').trim();if(!message)continue;
  const id=String(event.id||[event.received_at,event.at,event.worker_id,message].join('|'));if(seen.has(id))continue;seen.add(id);
  entries.push({id:'opc:'+id,kind:'opc',date,sortAt:Date.parse(event.received_at||event.at),dateLabel:event.received_at?'收到回报':'事件记录',title:String(event.task_title||event.title||[event.worker_name||'朱家军','工作回报'].join(' · ')),note:sentence(message),href:'/opc/'});
 }
 return {status:'ready',entries:entries.sort((a,b)=>b.sortAt-a.sortAt).slice(0,5)};
}
export async function fetchOpcSnapshot(fetchImpl=globalThis.fetch){
 if(globalThis.location?.hostname==='zhuyep.github.io')return {status:'primary',entries:[]};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
 try{
  const res=await fetchImpl('/api/opc/state',{method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal});
  if(res.status===401||res.status===403)return {status:'locked',entries:[]};
  if(!res.ok||!res.headers.get('content-type')?.includes('application/json'))return {status:'unavailable',entries:[]};
  const reader=res.body?.getReader();if(!reader)return {status:'unavailable',entries:[]};
  let size=0;const chunks=[];try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>262144)throw Error('Snapshot too large');chunks.push(part.value);}}catch(e){await reader.cancel().catch(()=>{});throw e}finally{reader.releaseLock()}
  const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength}return opcSnapshot(JSON.parse(new TextDecoder().decode(all)));
 }catch{return {status:'unavailable',entries:[]}}finally{clearTimeout(timer)}
}
export function unifiedUpdates({data,payload,opc={status:'pending',entries:[]},releases=SECTION_RELEASES}){
 const intel=(data?.intel||[]).map(r=>({id:'intel:'+r.id,kind:'intel',date:validDate(r.reportDate),dateLabel:'收录',title:r.title,note:readingReason(parseWorkBrief(r.discussion),r),noteLabel:'荐读',category:r.sourceName||r.category,priority:Number(r.score)||0,key:r.key||'intel:'+r.id}));
 const books=(payload?.yanku?.updates||[]).map(u=>({id:'library:'+u.id,kind:'books',date:validDate(u.date),dateLabel:'素材更新',title:u.title,note:sentence(u.detail),category:'言库',updateId:u.id}));
 const order={books:0,intel:1,video:2,games:3,maixiang:4,opc:5},seen=new Set();
 return [...intel,...books,...releases,...(opc.status==='ready'?opc.entries:[])].filter(r=>r.date&&(SECTIONS.some(([key])=>key===r.kind)||r.kind==='video')&&!seen.has(r.id)&&seen.add(r.id)).sort((a,b)=>b.date.localeCompare(a.date)||(b.sortAt||0)-(a.sortAt||0)||order[a.kind]-order[b.kind]||(b.priority||0)-(a.priority||0));
}
function action(row){if(row.kind==='opc')return `href="${opcHome()}"`;if(row.key)return `data-read="${escape(row.key)}"`;if(row.updateId)return `data-update="${escape(row.updateId)}"`;const known=SECTIONS.some(([, ,href])=>href===row.href)||row.href==='#books/library'||row.href==='#video';const fallback=row.kind==='video'?'#video':(SECTIONS.find(([key])=>key===row.kind)?.[2]||'#today');return `href="${escape(known?row.href:fallback)}"`;}
// Public, bounded metadata reads; private OPC data keeps its separate existing path.
async function publicOverviewJson(url,fetchImpl){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{const res=await fetchImpl(url,{method:'GET',credentials:'omit',cache:'no-cache',redirect:'error',signal:controller.signal});if(!res.ok||!res.headers.get('content-type')?.includes('application/json'))throw Error('Unavailable');const reader=res.body?.getReader();if(!reader)throw Error('Unavailable');let size=0;const chunks=[];try{for(;;){const p=await reader.read();if(p.done)break;size+=p.value.byteLength;if(size>65536)throw Error('Too large');chunks.push(p.value)}}catch(e){await reader.cancel().catch(()=>{});throw e}finally{reader.releaseLock()}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}return JSON.parse(new TextDecoder().decode(bytes));}finally{clearTimeout(timer)}
}
export async function fetchSectionOverview(fetchImpl=globalThis.fetch){
 const mirror=globalThis.location?.hostname==='zhuyep.github.io',results=await Promise.allSettled([publicOverviewJson('/assets/wiki/manifest.json',fetchImpl),mirror?Promise.resolve(null):publicOverviewJson('/api/video/status',fetchImpl)]),out={wikiState:'unavailable',videoState:mirror?'primary':'unavailable'};
 const wiki=results[0].status==='fulfilled'?results[0].value:null;if(Number.isInteger(wiki?.pages)&&wiki.pages>=0&&wiki.pages<=100000){out.wikiState='ready';out.wikiPages=wiki.pages;}
 const cinema=results[1].status==='fulfilled'?results[1].value:null;if(Array.isArray(cinema?.sources)&&cinema.sources.length&&cinema.sources.length<=100&&cinema.sources.every(s=>typeof s.key==='string'&&/^[a-z0-9_-]+$/i.test(s.key))){out.videoState='ready';out.videoSources=new Set(cinema.sources.map(s=>s.key)).size;}
 return out;
}
export function overviewCards({updates,total,opc,overview={}}){
 const loading={pending:'读取中',locked:'需登录',ready:opc.entries.length?'已连接':'待回报',unavailable:'暂不可读',primary:'主站查看'},hasWiki=overview.wikiState==='ready',hasVideo=overview.videoState==='ready';
 const videoDetail=hasVideo?`含影院 ${overview.videoSources} 源`:overview.videoState==='primary'?'影院在主站':overview.videoState==='unavailable'?'片源暂不可读':'游戏 · 影院';
 const cards=[{key:'intel',value:total.intel,unit:'条',detail:'快速检索'}, {key:'books',value:hasWiki?overview.wikiPages:'—',unit:hasWiki?'页Wiki':'',detail:`${total.blocks} 段素材`}, {key:'games',value:Object.keys(GAME_TITLES).length,unit:'项',detail:videoDetail}, {key:'maixiang',value:'看板',unit:'',detail:'私人入口',status:true}, {key:'opc',value:loading[opc.status]||'暂不可读',unit:'',detail:opc.status==='ready'?`${opc.entries.length} 条近期回报`:'私人办公室',status:true}];
 return `<section class="today-module-overview" aria-label="工作台总览"><nav class="today-module-grid" aria-label="栏目总览">${cards.map(card=>{const [,label,href]=SECTIONS.find(([key])=>key===card.key),latest=updates.find(r=>r.kind===card.key||(card.key==='games'&&r.kind==='video')),dateText=latest?'更新 '+shortDate(latest.date):card.key==='opc'&&opc.status==='ready'?'尚无回报':'进入查看',accessible=[label,card.value+card.unit,card.detail,latest?latest.date+' '+latest.dateLabel:''].filter(Boolean).join('，');return `<a class="today-module-card${card.status?' is-status':''}" data-overview="${card.key}" href="${sectionHome(card.key,href)}" aria-label="${escape(accessible)}"><span class="today-module-label">${label}</span><strong>${escape(card.value)}<small>${card.unit}</small></strong><span class="today-module-detail">${escape(card.detail)}</span><span class="today-module-date">${escape(dateText)}</span></a>`}).join('')}</nav></section>`;
}

export function renderToday({data,payload,filter='all',limit=18,opc={status:'pending',entries:[]},visits='',overview={},now=new Date()}){
 if(filter==='library')filter='books';if(filter==='video')filter='games';const updates=unifiedUpdates({data,payload,opc}),rows=updates.filter(r=>filter==='all'||r.kind===filter||(filter==='games'&&r.kind==='video')),visible=rows.slice(0,limit),total=payload?.meta?.counts||{intel:data?.intel?.length||0,blocks:data?.blocks?.length||0};
 const currentDate=day(now),dateLabel=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'short'}).format(now);
 let empty='';if(!visible.length){const text=filter==='opc'?({locked:'登录办公室后，这里会汇总最近的真实工作回报。',unavailable:'暂时读不到办公室动态，可以稍后重试。',pending:'正在读取办公室动态……',ready:'尚未收到工作回报，可进入办公室查看任务。',primary:'朱家军的工作回报在主站按登录权限展示。'}[opc.status]):filter==='maixiang'?'脉象是私人看板，动态不放在公开首页。':'这个栏目还没有可展示的更新。';const extra=filter==='opc'?`<a href="${opcHome()}">进入朱家军 ↗</a>${['locked','unavailable'].includes(opc.status)?'<button class="text-button" data-action="today-opc-refresh">刷新动态</button>':''}`:filter==='maixiang'?'<a href="/maixiang/">打开脉象 ↗</a>':'';empty=`<div class="today-feed-empty"><p>${escape(text)}</p>${extra}</div>`;}
 const markup=visible.map(r=>{const tag=r.key||r.updateId?'button':'a',label=r.kind==='video'?'影院':SECTIONS.find(([key])=>key===r.kind)[1];return `<article class="today-entry"><${tag} class="today-entry-open" ${tag==='button'?'type="button" ':''}${action(r)}><span class="today-entry-meta"><span class="today-entry-kind">${label}${r.category?' · '+escape(r.category):''}</span><time datetime="${r.date}">${shortDate(r.date)} ${escape(r.dateLabel)}</time></span><h3>${escape(r.title)}</h3>${r.note?`<p class="today-entry-note">${r.noteLabel?'<span>'+escape(r.noteLabel)+'</span>':''}${escape(r.note)}</p>`:''}</${tag}></article>`}).join('');
 const countText=filter==='opc'&&opc.status!=='ready'?({pending:'读取中',locked:'需登录',unavailable:'暂不可读',primary:'主站查看'}[opc.status]||'暂不可读'):`最近 ${visible.length} 条`;
 const more=rows.length>limit||payload?.meta?.summary&&['all','intel'].includes(filter)?'<button class="today-feed-more" data-action="today-more">再看一些 ↓</button>':'';
 return `<div class="today-dashboard"><section class="today-heading"><div><h1>今日一览</h1><time class="today-date" datetime="${currentDate}">${escape(dateLabel)}</time></div><button data-action="visits" class="today-visits visit-overview" aria-label="今日访问，查看近7天趋势">${visits}</button></section>${payload?.meta?.stale?`<p class="status-warning" role="status">${escape(payload.meta.message||'正在展示上一次可用资料。')}</p>`:''}${overviewCards({updates,total,opc,overview})}<section class="today-feed" aria-labelledby="today-feed-title"><div class="section-heading"><h2 id="today-feed-title">更新动态</h2><small>${countText}</small></div><div class="tabs today-feed-tabs" aria-label="更新分类">${[['all','全部'],...SECTIONS.map(([key,label])=>[key,label])].map(([key,label])=>`<button data-today="${key}" class="${filter===key?'active':''}" aria-pressed="${filter===key}">${label}</button>`).join('')}</div><div class="today-feed-entries">${markup}${empty}</div>${more}</section></div>`;
}
