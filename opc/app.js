import {officeRosterKey,workerCenter} from './office-layout.js';
import {businessLines} from './organization.js';
import {statusNames,describeWorker,summarizeWorkers,matchesWorkerFilter,relativeReport,presentOffice} from './ui-state.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {hall:'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',office:'M3 21V3h12v18M15 9h6v12M7 7h4M7 11h4M7 15h4M7 19h4M18 13h1M18 17h1M1 21h22',people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',tasks:'M9 3h6v4H9zM9 5H5v16h14V5h-4M8 12h8M8 16h6',activity:'M3 12h4l3-8 4 16 3-8h4',files:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',map:'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4M8 2v16M16 6v16',arrow:'M7 17 17 7M7 7h10v10',help:'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',import:'M12 3v12M7 10l5 5 5-5M4 16v5h16v-5',reset:'M3 11a9 9 0 1 1 2.6 7M3 4v7h7',play:'m8 5 12 7-12 7z',clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',check:'m5 12 4 4L19 6',close:'M6 6l12 12M6 18 18 6'};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.office}"/></svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
const names = statusNames;
const pageInfo = {hall:['运行大厅','员工状态、任务回报与经营进展。'],map:['作战地图','利润/成本分区甘特 · 近端周/90天 · 一屏主图。'],office:['团队办公室','先看真实工作，再看每一次交付。'],employees:['数字员工','岗位、职责和最近一次工作回报。'],tasks:['任务中心','从实际回报中，看见任务的进展与交付。'],pipeline:['打星工作流','发现需求、筛选机会、验证差异，再决定发布。'],activity:['运行记录','保留事实发生的时间，也保留回报到达的时间。'],files:['交付与迁移','云端指挥部持续在线；以任务回报与交付证据为准。']};
let actual = null, mode = 'actual', demo = null, page = 'hall', selected = 'supervisor', taskFilter = 'all', scene = null, events = null, connected = false, toastTimer;
let officeZone='all';
let staffFilter='all',metricsExpanded=false,sceneLoadingPromise=null,sceneObserver=null;
const initialView=new URLSearchParams(location.search).get('view');if(pageInfo[initialView])page=initialView;
const data = () => presentOffice(mode === 'demo' ? demo : actual);
const time = value => value ? new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)) : '—';
const age = value => relativeReport(value);
const badge = status => `<span class="status ${esc(status)}"><span class="dot ${status==='working'?'blue':status==='blocked'?'amber':status==='completed'?'green':''}"></span>${names[status] || '等待接入'}</span>`;
const avatar = w => `<span class="avatar" style="color:${esc(w.color)};background:${esc(w.color)}20">${esc(w.initial)}</span>`;
const safeLink = value => /^https?:\/\//i.test(value || '') ? esc(value) : '';
const eventName = type => ({'task.started':'开始工作','task.progress':'更新进度','task.blocked':'需要确认','task.completed':'完成交付','task.failed':'执行失败','worker.heartbeat':'更新在岗回报','worker.idle':'等待新任务'}[type] || type);

function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>$('#toast').classList.remove('visible'),4000); }
async function api(path, options = {}) { const response = await fetch(path, options); const body = await response.json(); if (!response.ok) { const e = new Error(body.error || '请求失败'); e.auth = response.status===401; throw e; } return body; }
function post(path, body) { return api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); }
function download(body, filename) { const url=URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }

function makeDemo(state) {
  const result=structuredClone(state);result.mode='demo';result.events=[];result.tasks=[];result.event_count=12;
  const statuses=['working','completed','working','working','blocked','idle','working'];
  const titles=['整理本轮交付与下一步','完成差异化产品简报','制作30秒演示分镜','复现PDF批注迁移核心路径','等待确认重复句匹配结果','','准备首轮定向传播材料'];
  result.workers.forEach((w,i)=>{w.status=statuses[i];w.last_seen=new Date(Date.now()-i*19000).toISOString();w.report_age_seconds=i*19;w.task=titles[i]?{id:`demo-${i}`,title:titles[i],project:'HighlightCarry · 演示项目',worker_id:w.id,worker_name:w.name,status:w.status,progress:[null,100,65,40,null,null,30][i],version:'演示版本',updated_at:w.last_seen,message:'这是一条演示记录，不代表真实执行。',source:{kind:'demo',label:'演示数据'},evidence:[]}:null;w.evidence=[];w.last_event={type:w.status==='completed'?'task.completed':w.status==='blocked'?'task.blocked':w.status==='idle'?'worker.idle':'task.started',at:w.last_seen,received_at:w.last_seen,worker_id:w.id,task:w.task||{},source:{label:'演示数据'},message:'仅用于查看界面效果。',evidence:[]};if(w.task)result.tasks.push(w.task);result.events.push(w.last_event);});return result;
}
function worker(id) { return data()?.workers.find(w=>w.id===id); }

function render() {
  const state=data();if(!state)return;
  const focusKey=document.activeElement?.dataset?.uiKey;
  const [title,description]=pageInfo[page];$('#page-title').innerHTML=`${title}<span class="heading-dot">.</span>`;$('#page-description').textContent=description;$('#breadcrumb').textContent=title;
  document.body.dataset.view=page;
  document.querySelectorAll('.nav,[data-mobile-page]').forEach(b=>{const active=b.dataset.page===page;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  document.querySelectorAll('.mode-switch button').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));$('#demo-banner').hidden=mode!=='demo';
  const working=state.tasks.filter(t=>t.status==='working').length, blocked=state.tasks.filter(t=>['blocked','failed','stale'].includes(t.status)).length, reported=state.workers.filter(w=>w.last_seen).length;
  $('#metrics').innerHTML=[['people',state.workers.length,'个','已配置岗位'],['play',working,'项','正在工作'],['clock',blocked,'项','需要关注'],['activity',reported,'/ '+state.workers.length,'收到岗位回报']].map(([ic,n,unit,label])=>`<div class="metric"><span class="metric-icon">${icon(ic)}</span><div><strong>${n}<small>${unit}</small></strong><p>${label}</p></div></div>`).join('');
  $('#connection-note').innerHTML=icon(mode==='demo'?'play':'activity')+`<div><strong>${mode==='demo'?'正在查看演示办公室':state.event_count?`已收到 ${state.event_count} 条岗位回报`:'办公室已准备好，等待第一条回报'}</strong>　${mode==='demo'?'示例状态只用于体验，不写入真实记录。':state.event_count?'下方显示已接收的回报；不代表已读取 dot 的全部内部任务。':'岗位来自已核对的组织目录；工作状态以实际回报为准。'}</div><button class="text-button" data-action="help">了解接入 ${icon('arrow')}</button>`;
  $('#task-count').textContent=state.tasks.length;$('#staff-count').textContent=state.workers.length;$('#office-roster-label').textContent=`${state.workers.length}位员工 · 利润与成本分区`;for(const center of ['profit','cost'])document.querySelector(`[data-zone-count="${center}"]`).textContent=state.workers.filter(w=>workerCenter(w)===center).length; $('#office-page').hidden=page!=='office';$('#other-page').hidden=page==='office';
  renderStaff(state);
  $('#desk-strip').innerHTML=state.workers.map(w=>`<button class="desk-chip ${w.id===selected?'selected':''}" data-worker="${w.id}" aria-label="查看${esc(w.name)}详情"><span class="dot ${w.status==='working'?'blue':w.status==='blocked'?'amber':w.status==='completed'?'green':''}"></span>${esc(w.name)}<span>${names[w.status]}</span></button>`).join('');
  renderInspector();if(page!=='office')renderOther();
  if(page==='office'){if(scene&&scene.rosterKey!==officeRosterKey(state.workers)){sceneObserver?.disconnect();scene.destroy();scene=null;}void ensureScene();scene?.setDemo(mode==='demo');scene?.setWorkers(state.workers);requestAnimationFrame(()=>scene?.resize());}else if(scene){sceneObserver?.disconnect();scene.destroy();scene=null;$('#scene-loading').hidden=false;}
  $('#transport-dot').className=`dot ${connected?'green':''}`;$('#transport-label').textContent=connected?'看板连接正常 · 员工状态以回报为准':'看板暂未连接 · 保留最近记录';
  $('#last-received').textContent=mode==='demo'?'演示数据 · 不计入实际记录':actual.event_count?`最近回报 ${age(actual.events[0]?.received_at)}`:'尚无真实工作回报';
  if(focusKey&&document.activeElement===document.body)document.querySelector(`[data-ui-key="${CSS.escape(focusKey)}"]`)?.focus({preventScroll:true});
}
function rosterOptions(){return{staleAfterSeconds:actual?.company?.stale_after_seconds||3600};}
function renderRosterPanel(state){
 const summary=summarizeWorkers(state.workers,rosterOptions());
 const filters=[['all','全部',summary.total],['working','进行中',summary.working],['attention','需关注',summary.attention],['completed','已交付',summary.completed],['waiting','待回报',summary.waiting]];
 const visible=summary.items.filter(item=>matchesWorkerFilter(item,staffFilter));
 return `<section class="team-workspace" aria-label="员工工作台"><div class="workspace-heading"><div><h2>员工工作台</h2><p>${mode==='demo'?'演示状态 · 不计入实际工作':'先看正在推进什么，再看上一次回报。'}</p></div><div class="team-totals"><span class="team-total"><b>${summary.working}</b>进行中</span><span class="team-total attention"><b>${summary.attention}</b>需关注</span><span class="team-total"><b>${summary.total}</b>位员工</span></div></div><div class="worker-filters" role="group" aria-label="筛选员工状态">${filters.map(([id,label,count])=>`<button data-worker-filter="${id}" data-ui-key="worker-filter-${id}" class="${staffFilter===id?'active':''}" aria-pressed="${staffFilter===id}">${label}<span>${count}</span></button>`).join('')}</div><div class="worker-board">${visible.map(({worker:w,...info})=>`<button class="worker-card ${info.status}" data-worker="${esc(w.id)}" data-show-worker="true" data-ui-key="worker-${esc(w.id)}" aria-label="查看${esc(w.name)}：${info.label}"><span class="worker-card-title"><span class="worker-identity">${avatar(w)}<strong>${esc(w.name)}</strong></span>${badge(info.status)}</span><span class="worker-dept">${esc(w.dept||w.role||'数字岗位')}</span><span class="worker-current">${esc(info.taskTitle)}</span><span class="worker-card-footer"><time datetime="${info.reportedAt||''}" title="${esc(info.reportedAt?new Date(info.reportedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'尚无回报')}">回报 ${age(info.reportedAt)}</time><span class="worker-open">查看详情 ↗</span></span></button>`).join('')||'<div class="worker-empty">这个状态下暂无员工。可切换“全部”查看最近的工作记录。</div>'}</div><p class="workspace-note">${mode==='demo'?'以上仅为示例。':'“待确认”表示执行中的回报已过期，不能据此判断员工仍在工作。已交付记录保留原有来源。'}</p></section>`;
}
function renderBusinessLines(state){
 const lines=businessLines(state);if(!lines.length)return '';
 const reported=lines.filter(line=>line.funnel).length;
 return `<section class="business-workspace" aria-label="利润线看板"><div class="workspace-heading"><div><h2>${lines.length}条利润线</h2><p>业务与负责人分别列出；有记录才显示进展。</p></div><span class="team-total">${reported}/${lines.length} 流程已接入</span></div><div class="business-line-grid">${lines.map(line=>{const f=line.funnel,w=line.worker;return `<article class="business-line" data-business-line="${esc(line.id)}"><div class="business-line-head"><span class="line-owner">${esc(w?.initial||'·')}</span><div><h3>${esc(line.title)}</h3><span>${esc(w?.name||f?.owner||'负责人待核对')}</span></div></div>${line.simulation?'<p class="simulation-note">研究／模拟 · 模拟结果不计入公司实收</p>':''}<p class="business-line-current">${esc(f?.plain||w?.task?.title||'网页尚无这条业务的进展回报')}</p>${f?.stages?.length?`<ol class="business-stages">${f.stages.map(stage=>`<li class="${esc(stage.status||'pending')}">${esc(stage.name)}</li>`).join('')}</ol>`:'<p class="business-missing">流程回报待接入</p>'}${f?.stuck_at?`<p class="business-blocker">卡在：${esc(f.stuck_at)}</p>`:''}<div class="business-line-footer"><span>${esc(f?.as_of?'流程回报 '+f.as_of:w?.last_seen?'岗位回报 '+age(w.last_seen):'岗位已核对 · 尚无网页回报')}</span>${w?`<button class="text-button" data-worker="${esc(w.id)}" data-show-worker="true">员工详情 →</button>`:''}</div></article>`;}).join('')}</div>${reported<lines.length?'<p class="workspace-note">下方历史经营简报未覆盖全部利润线；缺少的进度与收入保持未知，不记为零。</p>':''}</section>`;
}
function renderStaff(state) {
 const panel=$('#staff-status');panel.hidden=page!=='office';
 if(page==='office')panel.innerHTML=renderRosterPanel(state);
}
function focusOffice(zone){
 officeZone=['profit','cost'].includes(zone)?zone:'all';document.querySelectorAll('[data-action="focus-zone"]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.zone===officeZone)));scene?.focusZone(officeZone);$('#office-canvas').scrollIntoView({block:'center',behavior:'auto'});
}
async function ensureScene(){
 if(scene||sceneLoadingPromise||page!=='office'||!actual)return;
 sceneLoadingPromise=(async()=>{try{const {createOfficeScene}=await import('/opc/vendor/office-scene.js');if(page!=='office')return;scene=createOfficeScene($('#office-canvas'),{workers:data().workers,onWorkerSelect:id=>{selected=id;render();showWorker(id);}});scene.rosterKey=officeRosterKey(data().workers);scene.setDemo(mode==='demo');scene.focusZone(officeZone);$('#scene-loading').hidden=true;sceneObserver=new ResizeObserver(()=>scene?.resize());sceneObserver.observe($('#office-canvas'));}catch(error){$('#scene-loading').textContent='3D视图暂不可用，可通过员工卡片继续查看任务。';console.warn('Office scene unavailable:',error.message);}finally{sceneLoadingPromise=null;}})();
 await sceneLoadingPromise;
}
function showWorker(id){
 const w=worker(id);if(!w)return;
 const info=describeWorker(w,rosterOptions()),task=w.task;
 openModal(esc(w.name),`<div class="worker-dialog-head">${avatar(w)}<div>${badge(info.status)}<p>${esc(w.dept||w.role||'数字岗位')}</p></div></div><p>${esc(w.mission||'')}</p><div class="worker-dialog-current"><strong>最近任务</strong><p>${esc(info.taskTitle)}</p>${task?.message?`<p>${esc(task.message)}</p>`:''}</div><dl class="worker-facts"><dt>最近回报</dt><dd>${info.reportedAt?esc(new Date(info.reportedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})):'尚未收到'} · ${age(info.reportedAt)}</dd><dt>回报来源</dt><dd>${esc(info.source)}</dd><dt>项目</dt><dd>${esc(task?.project||'尚未登记')}</dd><dt>岗位职责</dt><dd>${esc((w.deliverables||[]).join(' · ')||'尚未登记')}</dd>${w.verified_schedule?`<dt>已核对例程</dt><dd>${esc(w.verified_schedule)}<br>2026-11-02 在 Grok 显示已启用；不代表执行成功。</dd>`:''}</dl><p class="source-note">状态来自实际收到的记录；页面连接正常不代表员工正在执行。</p>${task?`<button class="outline-button" data-task="${esc(task.id)}" data-task-worker="${esc(w.id)}">查看任务与交付证据 →</button>`:''}`);
}
function showNavigation(){
 openModal('所有页面',`<div class="navigation-grid">${Object.entries(pageInfo).map(([id,[title]])=>`<button data-page="${id}" ${id===page?'aria-current="page"':''}>${icon(id==='employees'?'people':id==='pipeline'?'arrow':id==='activity'?'activity':id==='files'?'files':id)}${title}</button>`).join('')}<button data-action="help">${icon('help')}回报接入说明</button><button data-action="import">${icon('import')}导入工作回报</button></div>`);
}
function renderInspector() {
  const state=data(), w=worker(selected)||state.workers[0], task=w.task;
  const recent=state.events.filter(e=>e.worker_id===w.id).slice(0,3);
  $('#inspector').innerHTML=`<div class="inspector-title">员工详情 <span>SELECTED DESK</span></div><div class="employee-profile"><div class="employee-head">${avatar(w)}<div><h2>${esc(w.name)}</h2><p>${esc(w.dept||(w.id==='supervisor'?'计划部':'岗位'))} · ${esc(w.role||'数字岗位')}</p></div></div><div class="status-row">${badge(w.status)}<small>${age(w.last_seen)}</small></div><p class="employee-mission">${esc(w.mission)}</p></div><div class="inspector-section"><div class="section-label">最近任务${task?'<button class="text-button" data-page="tasks">查看全部 →</button>':''}</div>${task?`<div class="current-task">${esc(task.title)}<p>${esc(task.project)}${task.version?` · ${esc(task.version)}`:''}</p>${task.progress!==null&&task.progress!==undefined?`<div class="progress-track"><span style="width:${Number(task.progress)}%"></span></div>`:''}</div>`:'<div class="current-task empty">尚未收到该岗位的任务回报<p>接入后，这里会显示任务与交付。</p></div>'}</div><div class="inspector-section"><div class="section-label">岗位交付物</div><ul class="deliverables">${(w.deliverables||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="inspector-section"><div class="section-label">最近回报</div><div class="mini-timeline">${recent.length?recent.map(e=>`<p>${eventName(e.type)}<small>${time(e.at)} · ${esc(e.source?.label||'岗位回报')}</small></p>`).join(''):'<div class="empty-copy">回报到达后，会保留来源、时间和证据。<br>没有回报，工作状态保持未知。</div>'}</div></div>`;
}

function dayMs(s){const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return null;return Date.UTC(+m[1],+m[2]-1,+m[3]);}
function ganttPct(start,end,axisStart,axisEnd){const a=dayMs(axisStart),b=dayMs(axisEnd),x=dayMs(start),y=dayMs(end);if(a==null||b==null||x==null||y==null||b<=a)return{left:0,width:0};const left=Math.max(0,Math.min(100,(x-a)/(b-a)*100));const right=Math.max(0,Math.min(100,(y-a)/(b-a)*100));return{left,width:Math.max(1.2,right-left)};}
function monthTicks(axisStart,axisEnd){const a=dayMs(axisStart),b=dayMs(axisEnd);const out=[];let y=+axisStart.slice(0,4),m=+axisStart.slice(5,7);while(Date.UTC(y,m-1,1)<=b){const t=Date.UTC(y,m-1,1);if(t>=a)out.push({label:`${y}-${String(m).padStart(2,'0')}`,left:(t-a)/(b-a)*100});m+=1;if(m>12){m=1;y+=1;}if(out.length>24)break;}return out;}
function dayTicks(axisStart,axisEnd){const a=dayMs(axisStart),b=dayMs(axisEnd);const out=[];for(let t=a;t<=b;t+=86400000){const d=new Date(t);out.push({label:`${d.getUTCMonth()+1}/${d.getUTCDate()}`,left:(t-a)/(b-a)*100});}return out;}
function lightClass(v){const s=String(v||'黄');return s.includes('红')?'红':s.includes('绿')?'绿':'黄';}
function ganttBar(item,axisStart,axisEnd,{tone,link,stackIndex=0,stackCount=1}={}){const p=ganttPct(item.start||item.month,item.end||item.start,axisStart,axisEnd);if(p.width<=0)return'';const cls=`gantt-bar tone-${esc(tone||lightClass(item.light||item.tone||item.status))} ${item.status==='working'?'is-working':''}`;const title=esc(item.title||item.what||item.task||item.label||'');const who=esc(item.owner||item.who||'');const body=`<span class="gantt-bar-title">${title}</span>${who?`<span class="gantt-bar-owner" title="负责人">${who}</span>`:''}`;const top=5+stackIndex*20;const style=`left:${p.left.toFixed(2)}%;width:${p.width.toFixed(2)}%;top:${top}px`;if(link)return`<a class="${cls}" style="${style}" href="${safeLink(link)}" target="_blank" rel="noreferrer" title="${title}">${body}</a>`;return`<div class="${cls}" style="${style}" title="${title}">${body}</div>`;}
function ganttLane(label,sub,barsHtml,stackCount=1){const h=Math.max(30,8+stackCount*20);return`<div class="gantt-row"><div class="gantt-label"><strong>${esc(label)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div><div class="gantt-track" style="min-height:${h}px">${barsHtml||'<span class="gantt-empty">—</span>'}</div></div>`;}
function ganttChart({title,subtitle,axisStart,axisEnd,today,lanes,tickMode}){
  const ticks=tickMode==='day'?dayTicks(axisStart,axisEnd):monthTicks(axisStart,axisEnd);
  const tp=today?ganttPct(today,today,axisStart,axisEnd):null;
  const head=ticks.map(t=>`<span class="gantt-tick" style="left:${t.left.toFixed(2)}%"><i></i>${esc(t.label)}</span>`).join('');
  const todayLine=tp?`<div class="gantt-today" style="left:${tp.left.toFixed(2)}%" title="今天 ${esc(today)}"><span>今天</span></div>`:'';
  return`<section class="gantt-block"><div class="section-head"><h2>${esc(title)}</h2><p>${esc(subtitle||`${axisStart} → ${axisEnd} · Asia/Shanghai`)}</p></div><div class="gantt-scroll"><div class="gantt-board" style="--gantt-min:${tickMode==='day'?'720px':'980px'}"><div class="gantt-axis"><div class="gantt-label axis-pad"></div><div class="gantt-track axis-track">${head}${todayLine}</div></div>${lanes.join('')}</div></div></section>`;
}
function projectLink(project,links,week){
  const key=project.link_key||'';
  if(key==='this_week')return safeLink(week.canvas||links.this_week);
  if(key==='five_year')return safeLink(links.five_year);
  if(key==='founding')return safeLink(links.founding);
  return safeLink(project.link)||'';
}
function projectLanes(projects,chart,axisStart,axisEnd,links,week){
  const rows=[];
  for(const p of projects||[]){
    const bars=(p.bars||[]).filter(b=>(b.chart||'main')===chart);
    if(!bars.length)continue;
    const link=projectLink(p,links,week);
    const html=bars.map((b,i)=>{
      const tone=b.tone||(b.status==='working'?'amber':lightClass(b.light));
      return ganttBar({...b,owner:b.owner},axisStart,axisEnd,{tone,link:link||undefined,stackIndex:i,stackCount:bars.length});
    }).join('');
    rows.push(ganttLane(p.name,`${p.track||''}${p.subtitle?` · ${p.subtitle}`:''}`,html,bars.length));
  }
  return rows;
}
function centerOf(p){
  if(p.center==='profit'||p.center==='cost')return p.center;
  if(p.track==='利润')return 'profit';
  return 'cost';
}
function filterByCenter(projects,center){return (projects||[]).filter(p=>centerOf(p)===center);}
function centerBanner(kind){
  if(kind==='profit')return`<div class="center-banner profit"><div class="center-banner-kicker">PROFIT</div><h2>利润中心</h2><p>赚钱项目 · KPI / 现金漏斗 · 纵轴=项目</p></div>`;
  return`<div class="center-banner cost"><div class="center-banner-kicker">COST</div><h2>成本中心</h2><p>计划 / 情报 / 行政 / IT · 纵轴=项目</p></div>`;
}
function centerGanttBlock(kind,projects,weekStart,weekEnd,mainStart,mainEnd,today,links,week){
  const list=filterByCenter(projects,kind);
  const weekLanes=projectLanes(list,'week',weekStart,weekEnd,links,week);
  const mainLanes=projectLanes(list,'main',mainStart,mainEnd,links,week);
  const label=kind==='profit'?'利润中心':'成本中心';
  const weekChart=ganttChart({title:`${label} · 本周`,subtitle:`${weekStart}→${weekEnd}`,axisStart:weekStart,axisEnd:weekEnd,today,lanes:weekLanes.length?weekLanes:[ganttLane('—',`${label}本周暂无`,'')],tickMode:'day'});
  const mainChart=ganttChart({title:`${label} · 近端90天`,subtitle:`${mainStart}→${mainEnd} · owner 在条上`,axisStart:mainStart,axisEnd:mainEnd,today,lanes:mainLanes.length?mainLanes:[ganttLane('—',`${label}主轴暂无`,'')],tickMode:'month'});
  return`${centerBanner(kind)}<div class="center-gantt-stack">${weekChart}${mainChart}</div>`;
}
function renderOpsHall(s){
  const hall=s.ops_hall||{};
  const groups=hall.groups||[];
  const byId=id=>groups.find(g=>g.id===id)||{metrics:[]};
  const results=byId('results'), process=byId('process'), resources=byId('resources');
  const all=[...results.metrics||[],...process.metrics||[],...resources.metrics||[]];
  const counts={红:all.filter(m=>lightClass(m.light)==='红').length,黄:all.filter(m=>lightClass(m.light)==='黄').length,绿:all.filter(m=>lightClass(m.light)==='绿').length};
  const live=data();
  const workers=live?.workers||[];
  const workingLive=(live?.tasks||[]).filter(t=>t.status==='working').length;
  const blockedLive=(live?.tasks||[]).filter(t=>['blocked','failed','stale'].includes(t.status)).length;
  const reported=workers.filter(w=>w.last_seen).length;
  const staffN=workers.length;
  const newest=([...((live?.events)||[])].map(e=>e.received_at||e.at).filter(Boolean).sort().slice(-1)[0])||null;
  const ageLabel=newest?age(newest):(live?.event_count?'有记录·龄未知':'尚无回报');
  const staleSec=hall.stale_after_seconds||live?.company?.stale_after_seconds||3600;
  const ageSec=newest?Math.max(0,Math.floor((Date.now()-Date.parse(newest))/1000)):null;
  const stale=ageSec==null?true:ageSec>staleSec;
  const gates=(hall.boss_gates||[]).slice(0,2);
  const redGates=gates.filter(g=>lightClass(g.light)==='红').length;
  const north=hall.north_star||{};
  const charts=hall.charts||{};
  const funnelLegacy=charts.funnel||{stages:[]};
  const funnels=(Array.isArray(charts.funnels)&&charts.funnels.length)
    ?charts.funnels
    :[charts.star_funnel,charts.game_funnel,funnelLegacy].filter(Boolean);
  const uniq=[];const seen=new Set();
  for(const f of funnels){const id=f.id||f.track||f.title;if(seen.has(id))continue;seen.add(id);uniq.push(f);}
  const funnelList=uniq.length?uniq:[funnelLegacy];
  const sparkSvg=(series,tone,tall)=>{
    const h=tall?36:28;
    if(!Array.isArray(series)||series.length<2)return`<div class="spark-mini empty" title="无序列">—</div>`;
    const nums=series.map(Number);
    const max=Math.max(...nums),min=Math.min(...nums);
    const span=Math.max(1e-9,max-min);
    const pts=nums.map((v,i)=>{const x=i/(nums.length-1)*100;const y=(h-2)-((v-min)/span)*(h-4);return`${x.toFixed(1)},${y.toFixed(1)}`;}).join(' ');
    return`<svg class="spark-mini ${esc(tone||'')}" viewBox="0 0 100 ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="2" points="${pts}"/></svg>`;
  };
  const fillLive=m=>{
    if(m.id==='staff-live'){
      const v=`${reported}/${staffN}`;
      const light=reported===0?'红':(reported===staffN?'绿':'黄');
      return{...m,value:v,light,as_of:new Date().toISOString()};
    }
    if(m.id==='probe'&&(m.value==='UNKNOWN'||m.source==='none'))return{...m,light:'黄',value:'UNKNOWN'};
    if(m.id==='burn-proxy'&&(m.value==='—'||m.value===''||m.value==null))return{...m,light:'黄',value:'—'};
    return m;
  };
  const taskOf=w=>{
    const t=(live?.tasks||[]).find(x=>x.worker_id===w.id&&['working','blocked','failed','stale'].includes(x.status))
      ||(live?.tasks||[]).find(x=>x.worker_id===w.id);
    return t;
  };
  const metricCard=m=>{
    const x=fillLive(m);
    const lc=lightClass(x.light);
    const val=x.value==null||x.value===''?'—':x.value;
    const isUnknown=String(val).toUpperCase()==='UNKNOWN'||val==='—';
    const next=x.next?`<p class="kpi-next-line"><strong>下一步</strong>${esc(x.next)}</p>`:'';
    return`<article class="kpi-card dense light-${esc(lc)}${isUnknown?' is-unknown':''}"><div class="kpi-top"><span class="kpi-name">${esc(x.name)}</span><span class="light-pill ${esc(lc)}">${esc(x.light||'黄')}</span></div><div class="kpi-mid"><div class="kpi-value">${esc(val)}${x.unit?`<small>${esc(x.unit)}</small>`:''}</div>${sparkSvg(x.sparkline,lc)}</div><div class="kpi-compare"><span>目标 ${esc(x.target||'—')}</span><span>对比 ${esc(x.prev??'—')}</span></div>${next}<div class="kpi-foot"><span>${esc(x.owner||'—')}</span><span class="kpi-asof" title="as_of">${esc(x.as_of?String(x.as_of).replace(' Asia/Shanghai',''):'—')}</span></div></article>`;
  };
  const band=(g)=>{
    const ms=(g.metrics||[]);
    return`<section class="kpi-band ${esc(g.id||'')}"><div class="kpi-band-head"><span class="kpi-kicker">${esc(g.kicker||'')}</span><h2>${esc(g.title||'')}</h2><span class="band-meta">owner ${esc(g.owner||'—')}</span></div><div class="kpi-grid cols-4">${ms.map(metricCard).join('')}</div></section>`;
  };
  const header=`<div class="hall-sitrep${redGates?' has-red':''}${stale?' is-stale':''}"><div class="sitrep-left"><span class="eyebrow">已接入的经营简报 · 以原回报时间为准</span><h2>${esc(s.brand||'朱家军')}</h2><p class="sitrep-status">${esc(hall.status_line||hall.pulse?.headline||'经营态待更新')}</p></div><div class="sitrep-right"><div class="sitrep-chip red"><span>红项</span><b>${redGates}</b></div><div class="sitrep-chip"><span>在办任务</span><b>${workingLive}</b></div><div class="sitrep-chip"><span>待核任务</span><b>${blockedLive}</b></div><div class="sitrep-chip ${stale?'warn':''}"><span>数据龄</span><b>${esc(ageLabel)}${stale?' · STALE':''}</b></div><div class="sitrep-chip mute"><span>灯</span><b>红${counts.红}/黄${counts.黄}/绿${counts.绿}</b></div><button class="outline-button pulse-map" data-page="map">地图 →</button></div></div>`;
  const rosterChips=workers.map(w=>{
    const t=taskOf(w);
    const st=t?.status||(w.last_seen?'idle':'offline');
    const label=t?.title||w.mission||'待命';
    return`<div class="roster-chip ${esc(st)}"><strong>${esc(w.name)}</strong><small title="${esc(label)}">${esc(label)}</small></div>`;
  }).join('')||'<p class="empty-copy">编制未加载</p>';
  const brief=hall.pulse?.headline||hall.status_line||'';
  const roster=`<article class="roster-panel"><div class="hall-chart-head"><strong>编制 · 近况</strong><span>${reported}/${staffN} 有回报</span></div><p class="roster-brief"><b>${esc(hall.pulse?.overall_label||'经营态')}</b> · ${esc(brief)}</p><div class="roster-grid">${rosterChips}</div><div class="roster-meta">钱卡在「${esc(hall.pulse?.cash_stage||'—')}」· 探针未通=UNKNOWN · 禁假绿</div></article>`;
  const stageCell=st=>`<div class="funnel-stage ${esc(st.status||'pending')}" title="${esc(st.hint||st.name||'')}"><i></i><strong>${esc(st.name)}</strong>${st.hint?`<em>${esc(st.hint)}</em>`:''}</div>`;
  const rail=f=>{
    const stuck=f.stuck_at||'';
    const cur=(f.stages||[]).find(s=>s.status==='current');
    const stuckLine=stuck||(cur?(`当前：${cur.name}${cur.hint?`（${cur.hint}）`:''}`):'');
    return`<div class="funnel-rail track-${esc(f.id||'x')}"><div class="funnel-rail-head"><strong>${esc(f.title||f.track||'漏斗')}</strong><span>${esc(f.owner||'')} · ${esc((f.as_of||'').toString().replace(' Asia/Shanghai',''))}</span></div><p class="funnel-plain">${esc(f.plain||'')}</p><div class="funnel-stages">${(f.stages||[]).map(stageCell).join('')}</div><p class="funnel-caption">卡在：<b>${esc(stuckLine||'—')}</b></p></div>`;
  };
  const funnelPanel=`<article class="funnel-panel dual"><div class="hall-chart-head"><strong>已接入的业务流程</strong><span>${esc(hall.pulse?.cash_stage||'以流程回报为准')}</span></div><div class="funnel-rails">${funnelList.map(rail).join('')}</div><p class="funnel-footnote">钱还没进账前，只看「卡在哪一步」；进账后再看金额</p></article>`;
  const northBlock=`<div class="north-funnel-row"><article class="north-star light-${esc(lightClass(north.light||'黄'))}"><div class="north-kicker">NORTH STAR</div><h3>${esc(north.name||'北星')}</h3><div class="north-value">${esc(north.value||'—')}${north.unit?`<small>${esc(north.unit)}</small>`:''}</div><div class="north-delta">${esc(north.delta||'')}</div><div class="north-meta"><span>目标 ${esc(north.target||'—')}</span><span>${esc(north.owner||'')}</span><span>${esc((north.as_of||'').toString().replace(' Asia/Shanghai',''))}</span></div>${sparkSvg(north.sparkline,lightClass(north.light),true)}<p class="north-note">${esc(north.spark_note||'')}</p></article>${funnelPanel}</div>`;
  const blockers=`<section class="blockers-bar"><div class="blockers-head"><span class="kpi-kicker">BLOCKERS</span><h2>待董事长 · 真闸（≤2）</h2><span class="boss-gates-count">${redGates} 红 / ${gates.length}</span></div><div class="boss-gates-row">${gates.map(g=>`<article class="boss-gate light-${esc(lightClass(g.light))}"><span class="light-pill ${esc(lightClass(g.light))}">${esc(g.light)}</span><strong>${esc(g.title)}</strong><small>${esc(g.why||'')}</small></article>`).join('')||'<p class="empty-copy">暂无人闸</p>'}</div></section>`;
  const kills=(hall.kill_rules||[]).map(r=>`<li>${esc(r)}</li>`).join('');
  return`<div class="content-panel hall-panel tech warroom">${renderBusinessLines(live)}${renderRosterPanel(live)}${header}${northBlock}${blockers}<details class="business-details" id="business-details" ${metricsExpanded?'open':''}><summary>经营指标与简报<span>结果 · 过程 · 资源，展开查看完整指标</span></summary><div class="business-support">${roster}</div><div class="bands-row">${band(results)}${band(process)}${band(resources)}</div></details><footer class="hall-kill"><strong>Kill / 继续</strong><ul>${kills||'<li>尚未配置停转规则</li>'}</ul><span class="source-note">契约 ${(hall.contracts||[]).length} 条 · 响应式看板 · Asia/Shanghai</span></footer></div>`;
}
function renderBattleMap(s){
  const g=s.gantt||{};
  const weekStart=g.week_start||s.this_week?.start||'2026-10-30';
  const weekEnd=g.week_end||s.this_week?.end||'2026-11-06';
  const mainStart=g.main_start||'2026-10-30';
  const mainEnd=g.main_end||'2027-10-31';
  const today=g.today||new Date().toISOString().slice(0,10);
  const links=s.links||{};
  const week=s.this_week||{};
  const projects=g.projects||[];
  const profitBlock=centerGanttBlock('profit',projects,weekStart,weekEnd,mainStart,mainEnd,today,links,week);
  const costBlock=centerGanttBlock('cost',projects,weekStart,weekEnd,mainStart,mainEnd,today,links,week);
  const profit=s.tracks?.profit||{},planning=s.tracks?.planning||{},service=s.tracks?.service||{},ops=s.tracks?.ops||{};
  const trackCard=(t,fallback)=>`<article class="battle-card track-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap"><h3>${esc(t.title||fallback)}</h3><span class="light-pill ${esc(lightClass(t.light))}">${esc(t.light||'黄')}</span></div><p>${esc((t.owners||[]).join(' / '))}</p><p>${esc(t.kpi||'')}</p></article>`;
  const values=(s.values||[]).slice(0,4).map(v=>`<span class="battle-chip">${esc(v)}</span>`).join('');
  const legend=`<div class="gantt-legend"><span><i class="lg amber"></i>黄/进行</span><span><i class="lg red"></i>红</span><span><i class="lg green"></i>绿</span><span><i class="lg slate"></i>待启</span><span class="gantt-legend-note">利润/成本分区 · 纵轴=项目 · owner 在条上</span></div>`;
  const deptNote=`<div class="dept-charter"><div class="section-head"><h2>部门职能</h2><p>董事长定稿</p></div><div class="dept-grid"><article><strong>计划部</strong><p>经营管理、组织改进</p></article><article><strong>情报/战略</strong><p>情报搜集 + 战略复盘</p></article><article><strong>IT</strong><p>基础设施效率</p></article><article><strong>小秘书</strong><p>事务 + 质量回顾</p></article><article><strong>利润中心</strong><p>目标改进与 KPI</p></article></div></div>`;
  return`<div class="content-panel battle-map"><div class="battle-hero"><div class="eyebrow">GANTT · BY CENTER</div><h2>${esc(s.brand||'朱家军')} · 作战地图</h2><p>${esc(s.theme||'')}</p><div class="values">${values}</div></div>${renderBusinessLines(data())}${legend}${profitBlock}${costBlock}${deptNote}<div class="section-head"><h2>中心红黄灯</h2><p>有动作黄 · 空转红 · 达标绿</p></div><div class="battle-grid-4">${trackCard(profit,'利润中心')}${trackCard(planning,'计划部')}${trackCard(service,'情报/行政')}${trackCard(ops,'IT')}</div><div class="section-head"><h2>战略原文</h2><p>条块可点进作战表</p></div><div class="battle-links">${safeLink(links.this_week)?`<a href="${safeLink(links.this_week)}" target="_blank" rel="noreferrer">本周作战表 ↗</a>`:''}${safeLink(links.five_year)?`<a href="${safeLink(links.five_year)}" target="_blank" rel="noreferrer">五年规划 ↗</a>`:''}${safeLink(links.founding)?`<a href="${safeLink(links.founding)}" target="_blank" rel="noreferrer">筹建方案 ↗</a>`:''}<button class="outline-button" data-page="office" style="margin-top:0">团队办公室 →</button></div><p class="source-note">${esc(mainStart)}→${esc(mainEnd)} · ${esc(g.inferred_note||'')} · /opc/ · 规划≠已实现营收</p></div>`;
}
function empty(title,description) { return `<div class="large-empty">${icon('tasks')}<h3>${title}</h3><p>${description}</p><button class="text-button" data-mode="demo">体验演示办公室 ${icon('arrow')}</button></div>`; }
function renderOther() {
  const state=data(), container=$('#other-page');
  if(page==='hall'){
    const s=state.company?.strategy||{};
    container.innerHTML=renderOpsHall(s);
    return;
  }
  if(page==='map'){
    const s=state.company?.strategy||{};
    container.innerHTML=renderBattleMap(s);
    return;
  }
  if(page==='pipeline'){
    if(mode==='demo'){container.innerHTML='<div class="content-panel"><h2>工作流记录来自实际执行</h2><p class="empty-copy">演示模式只展示示例岗位任务。返回实际状态，查看本轮候选、阶段与交付。</p><button class="outline-button" data-mode="actual">返回实际状态</button></div>';return;}
    const flow=actual.workflow;
    if(!flow){container.innerHTML=`<div class="content-panel"><h2>工作流尚未登记</h2><p class="empty-copy">任务准备后，显示真实阶段、候选与证据。</p></div>`;return;}
    const stageName={pending:'未开始',working:'进行中',completed:'已完成',blocked:'等待条件',rejected:'已淘汰'};
    container.innerHTML=`<div class="content-panel pipeline-panel"><div class="pipeline-intro"><div><span class="eyebrow">从机会到作品</span><h2>${esc(flow.title)}</h2><p>${esc(flow.summary)}</p>${flow.demo_ready?'<a class="outline-button" style="display:inline-block" href="/opc/pilot/office-diff" target="_blank" rel="noreferrer">打开本轮改进的实际预检报告 ↗</a>':''}</div><span class="status working">${esc(flow.mode_label)}</span></div><div class="workflow-stages">${flow.stages.map((s,i)=>`<div class="workflow-stage ${esc(s.status)}"><span class="stage-number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(s.name)}</h3><p>${esc(s.result||s.gate)}</p><small>${esc(s.owner)} · ${stageName[s.status]||'未知'}</small></div></div>`).join('')}</div><div class="pipeline-section-title"><h3>本轮候选与判断</h3><small>判断依据来自已读资料，评分不代表增长保证</small></div><div class="candidate-grid">${(flow.candidates||[]).map(c=>`<article class="candidate-card"><div><h3>${esc(c.name)}</h3><span class="status ${c.decision==='优先验证'?'working':''}">${esc(c.decision)}</span></div><p>${esc(c.reason)}</p><small>${esc(c.evidence_note||'')}</small>${safeLink(c.url)?`<a href="${safeLink(c.url)}" target="_blank" rel="noreferrer">查看 GitHub 来源 ↗</a>`:''}</article>`).join('')||'<p class="empty-copy">正在读取候选资料，尚无筛选结论。</p>'}</div><div class="pipeline-next"><strong>接下来做什么</strong><p>${esc(flow.next_action)}</p><small>${esc(flow.execution_note)}</small></div><p class="source-note">更新 ${esc(flow.updated_at)} · Star、试用与留存分别观察；未知数据保留未知。</p></div>`;
  }
  if(page==='employees')container.innerHTML=renderRosterPanel(state);
  if(page==='tasks'){
    const filters=[['all','全部任务'],['working','工作中'],['attention','需要关注'],['completed','已交付']];
    const tasks=state.tasks.filter(t=>taskFilter==='all'||(taskFilter==='attention'?['failed','blocked','stale'].includes(t.status):t.status===taskFilter));
    container.innerHTML=`<div class="content-panel"><div class="panel-title"><div><h2>任务交接墙</h2><p>这里展示接收到的任务，不自动分派或启动员工。</p></div></div><div class="task-filters">${filters.map(([id,name])=>`<button data-filter="${id}" class="${taskFilter===id?'active':''}">${name}</button>`).join('')}</div>${tasks.length?tasks.map(t=>`<button class="task-row" data-task="${esc(t.id)}" data-task-worker="${esc(t.worker_id)}">${avatar(worker(t.worker_id))}<div><strong>${esc(t.title)}</strong><p>${esc(t.worker_name)} · ${esc(t.project)}</p></div>${badge(t.status)}<time>${time(t.updated_at)}</time></button>`).join(''):empty('还没有可见的工作任务','先接入一个本地任务，或导入 Michelle 交付的标准回报文件。<br>这里不会把旧盘点自动变成正在执行的任务。')}</div>`;
  }
  if(page==='activity')container.innerHTML=`<div class="content-panel"><div class="panel-title"><div><h2>工作室运行记录</h2><p>实际事件与收到时间分开记录，最近显示100条。</p></div><button class="outline-button" data-action="export">导出记录</button></div>${state.events.length?state.events.map(e=>`<div class="activity-row"><time>${time(e.at)}</time><span class="dot ${e.type==='task.completed'?'green':'blue'}"></span><div><strong>${esc(worker(e.worker_id)?.name)} · ${eventName(e.type)}</strong><p>${esc(e.task?.title||e.message||'岗位状态回报')}</p><small>${esc(e.source?.label||'岗位回报')} · 到达 ${time(e.received_at)}</small></div></div>`).join(''):empty('第一条回报还在路上','开始、进度、需要确认、交付与失败，都可以在这里留下一条真实记录。')}</div>`;
  if(page==='files')container.innerHTML=`<div class="content-panel"><div class="panel-title"><div><h2>让公司可以接续，也可以迁移</h2><p>网站代码、岗位定义与事件记录分开保存。</p></div></div><div class="two-column"><div class="info-card">${icon('files')}<h3>公司岗位配置</h3><p>朱家军岗位的名称、职责和交付物。当前网页读取配置，不会擅自改动执行端。</p><button class="outline-button" data-action="download-company">下载岗位配置</button></div><div class="info-card">${icon('activity')}<h3>实际工作记录</h3><p>导出已接收的事件，再导入到新的运行位置。重复导入会按事件身份去重。</p><button class="outline-button" data-action="export">导出实际记录</button></div></div><div class="baseline-card"><strong>${esc(state.company.baseline.product.name)} · ${esc(state.company.baseline.product.description)}</strong><p>${esc(state.company.baseline.product.state)}</p><small>来自 ${esc(state.company.baseline.source)}，盘点日期2026-10-22；这是历史交接信息，不是实时任务或采用证明。</small></div><div class="info-card" style="margin-top:20px"><h3>本地 → 云端，迁移什么？</h3><p>本地先跑通办公室、任务回报和记录。之后把网站放到持续在线的服务，将新回报地址交给对应执行 bot。执行端负责干活，网站负责显示与记录。</p><p>改配置不会自动搬走本机进程；电脑关机后，当前本地网址也会停止。</p><button class="text-button" data-action="migration">查看迁移步骤 ${icon('arrow')}</button></div></div>`;
  if(page==='tasks'&&actual.cloud)container.innerHTML+=cloudJobsMarkup(actual);
}
function openModal(title,body) { $('#modal-content').innerHTML=`<div class="modal-body"><div class="modal-top"><h2>${title}</h2><button class="icon-button" data-action="close-modal" aria-label="关闭">${icon('close')}</button></div>${body}</div>`;if(!$('#modal').open)$('#modal').showModal(); }
function showHelp(){openModal('工作状态与回报','<p>网页负责展示与记录，执行端负责工作。页面能刷新，只代表看板连接正常。</p><p>员工的最近任务、回报时间和来源可以在员工详情中查看。进行中的回报超过有效期后显示“待确认”；已经交付的记录保留原始来源。</p><p>在任务中心可以查看云端任务，或生成一次接入指令交给获准执行端。登记任务不等于任务已启动。</p>');}
function showMigration(){openModal('维护与交接','<p>办公室页面和工作记录保存在云端。仅依赖本机运行的任务仍需要电脑在线。</p><p>切换维护者时，共享经过核对的代码版本、测试结果和待办；执行环境、任务调度及密钥由原受控位置管理。</p><p>是否完成一项工作，以执行回报和可取回的交付为准。</p>');}
function showTask(id,workerId) { const t=data().tasks.find(t=>t.id===id&&t.worker_id===workerId);if(!t)return;openModal(esc(t.title),`${badge(t.status)}<p>${esc(t.worker_name)} · ${esc(t.project)}</p><p>${esc(t.message||'暂无补充说明。')}</p><p>版本：${esc(t.version||'未提供')}<br>事件时间：${esc(t.updated_at)}<br>来源：${esc(t.source?.label||'岗位回报')}</p><h3>交付证据</h3>${t.evidence?.length?t.evidence.map(e=>`<p>${esc(e.label)}${e.ref?`<br><span class="source-note">${esc(e.ref)}</span>`:''}${safeLink(e.url)?`<a class="evidence-link" href="${safeLink(e.url)}" target="_blank" rel="noreferrer">打开证据链接 ↗</a>`:''}</p>`).join(''):'<p>没有提供可点击的交付证据。任务完成状态属于执行者回报，不能单独代替验收。</p>'}`);}
async function boot() {
  try { actual=await api('/api/opc/state');demo=makeDemo(actual);render();
    connected=true;render();if(!events){events=setInterval(async()=>{if(document.hidden)return;try{actual=await api('/api/opc/state');connected=true;}catch(e){connected=false;if(e.auth)location.reload();}if(mode==='actual')render();},15000);}
  }catch(error){if(error.auth){openModal('打开你的工作室','<p>这台在线服务已设置访问口令。口令只提交到当前服务，不保存在浏览器本地存储。</p><form id="login-form"><input id="access-token" type="password" autocomplete="current-password" placeholder="输入访问口令" aria-label="访问口令" required><button class="primary-button" type="submit">进入工作室</button></form>');}else{$('#connection-note').textContent=`暂时无法读取看板：${error.message}`;}}
}
document.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.page){if($('#modal').open)$('#modal').close();page=b.dataset.page;history.replaceState(null,'',`?view=${encodeURIComponent(page)}`);render();window.scrollTo(0,0);}
  if(b.dataset.mode){if(!actual)return toast('请先连接工作室');mode=b.dataset.mode;if(mode==='demo')demo=makeDemo(actual);render();}
  if(b.dataset.worker){selected=b.dataset.worker;render();if(b.dataset.showWorker)showWorker(selected);}
  if(b.dataset.workerFilter){staffFilter=b.dataset.workerFilter;render();}
  if(b.dataset.filter){taskFilter=b.dataset.filter;renderOther();}
  if(b.dataset.task)showTask(b.dataset.task,b.dataset.taskWorker);
  try{switch(b.dataset.action){case'collect-cloud':await post('/api/opc/collect',{});toast('云端采集已登记，请查看后续工作回报');break;case'michelle':prepareMichelle();break;case'copy-michelle':await navigator.clipboard.writeText($('#michelle-instruction').value);toast('已复制，请交给执行端');break;case'navigation':showNavigation();break;case'help':showHelp();break;case'migration':showMigration();break;case'close-modal':$('#modal').close();break;case'import':if(mode==='demo')return toast('请先返回实际状态，再导入真实工作回报');$('#import-file').click();break;case'export':if(mode==='demo')return toast('演示数据不会导出，请先返回实际状态');download(await api('/api/opc/export'),'michelle-office-records.json');break;case'download-company':download(actual.company,'michelle-office-company.json');break;case'zoom-in':scene?.zoom(-1);break;case'zoom-out':scene?.zoom(1);break;case'focus-zone':focusOffice(b.dataset.zone);break;case'reset-camera':focusOffice('all');break;}}
  catch(e){toast(e.message);}
});
$('#import-file').addEventListener('change',async event=>{try{const f=event.target.files[0];if(!f)return;if(f.size>262144)throw Error('文件超过256 KiB，请分批导入');const input=JSON.parse(await f.text());const result=await post('/api/opc/import',input);toast(`已接收 ${result.accepted} 条回报，跳过 ${result.duplicates} 条重复记录`);}catch(e){toast(`导入未完成：${e.message}`);}finally{event.target.value='';}});
document.addEventListener('submit',async event=>{if(event.target.id!=='login-form')return;event.preventDefault();try{await post('/api/opc/session',{token:$('#access-token').value});$('#access-token').value='';$('#modal').close();await boot();}catch(e){toast(e.message);}});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').close();});
setInterval(()=>{$('#clock').textContent=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());},1000);
document.addEventListener('toggle',event=>{if(event.target.id==='business-details'&&event.target.isConnected)metricsExpanded=event.target.open;},true);
window.addEventListener('pagehide',()=>{clearInterval(events);sceneObserver?.disconnect();scene?.destroy();});
boot();

function cloudJobsMarkup(state){
 const labels={pending:'等待执行回执',running:'执行端已回报',completed:'执行端已交付',failed:'执行失败',blocked:'等待条件',revoked:'已撤销'};
 const jobs=state.cloud?.jobs||[];
 return `<div class="content-panel" style="margin-top:20px"><div class="panel-title"><div><h2>云端任务接续</h2><p>生成任务指令后交给对应执行端；收到真实回报后才会更新员工状态。</p></div><button class="outline-button" data-action="michelle">准备云端任务</button><button class="outline-button" data-action="collect-cloud">运行一次云端采集</button></div>${jobs.map(j=>`<div class="activity-row"><time>${time(j.created_at)}</time><span class="dot ${j.status==='completed'?'green':''}"></span><div><strong>${esc(j.title)}</strong><p>${esc(j.executor==='michelle-dot'?'Michelle 云端':j.executor==='cloudflare-collector'?'Cloudflare 云端采集':'Codex 云端')} · ${labels[j.status]||'状态未知'}${j.expires_at<Date.now()&&!['completed','failed','revoked'].includes(j.status)?' · 回报凭证已到期':''}</p><small>${j.event_count}条回报 · ${esc(j.id)}</small></div></div>`).join('')||'<p class="empty-copy">还没有登记云端任务。</p>'}</div>`;
}
function prepareMichelle(){openModal('准备云端任务','<p>输入本次任务目标，生成只属于这项任务的接入指令。把它交给执行端后，办公室才能收到云端回报。</p><form id="michelle-form"><label for="cloud-title">本次任务</label><input style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:12px 0" id="cloud-title" maxlength="240" required value="OfficeDiff 云端复核与下一步改进建议"><button class="primary-button" type="submit">生成接入指令</button></form><p class="source-note">生成指令会登记一项等待执行的任务，不会自动启动 Michelle。凭证2小时有效，只可回报这一项任务。</p>');}
document.addEventListener('submit',async e=>{
 if(e.target.id!=='michelle-form')return;e.preventDefault();
 try{const title=$('#cloud-title').value;const job=await post('/api/opc/jobs',{title,worker_id:'supervisor',executor:'codex-cloud'});
 const instruction=`请在你已有的云端执行环境完成这项 OPC 任务（岗位：小朱总/supervisor）：${title}。保留现有配置和调度，优先使用已有 Codex 额度，不购买新服务。必须确认执行环境独立于我的笔记本；如果只能调用本机，停止并报告阻塞。
开始时和结束时向我的办公室提交真实回报，执行过程中每60秒报告一次进度或心跳。不要把聊天中的承诺当作任务已执行。
POST ${job.callback_url}
Authorization: Bearer ${job.token}
Content-Type: application/json
开始回报示例：{"event_id":"start-1","type":"task.started","message":"实际云端环境与工作内容","progress":0}
进度：type使用task.progress；完成：type使用task.completed、progress为100；失败：task.failed。event_id每条唯一。evidence可含最多12个{label,ref,url}，url只用https，ref说明测试命令、真实结果和交付位置。message最多1500字符。服务端会固定岗位、任务与来源。不要公开或长期保存凭证。
请先做一项有实际输出的最小工作，保留代码/报告/测试日志和SHA256，再回报完成。禁止发布代码、刷Star、改名复制项目。若接口或云端网络不允许，明确报告，不绕过权限。凭证到期时间：${new Date(job.expires_at).toISOString()}。`;
 openModal('把指令交给执行端','<p>任务已登记，正在等待执行回报。复制下面的指令到执行端对话。收到开始回报后，办公室会自动更新。</p><textarea id="michelle-instruction" readonly style="width:100%;height:280px;box-sizing:border-box;padding:12px"></textarea><button class="primary-button" data-action="copy-michelle">复制指令</button>');$('#michelle-instruction').value=instruction;
 }catch(error){toast(error.message);}
});

