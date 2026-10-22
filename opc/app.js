import { createOfficeScene } from '/opc/vendor/office-scene.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {office:'M3 21V3h12v18M15 9h6v12M7 7h4M7 11h4M7 15h4M7 19h4M18 13h1M18 17h1M1 21h22',people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',tasks:'M9 3h6v4H9zM9 5H5v16h14V5h-4M8 12h8M8 16h6',activity:'M3 12h4l3-8 4 16 3-8h4',files:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',arrow:'M7 17 17 7M7 7h10v10',help:'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',import:'M12 3v12M7 10l5 5 5-5M4 16v5h16v-5',reset:'M3 11a9 9 0 1 1 2.6 7M3 4v7h7',play:'m8 5 12 7-12 7z',clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',check:'m5 12 4 4L19 6',close:'M6 6l12 12M6 18 18 6'};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.office}"/></svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
const names = {unconnected:'等待接入',working:'正在工作',blocked:'需要确认',completed:'本轮已交付',failed:'执行失败',stale:'状态待更新',idle:'等待任务'};
const pageInfo = {office:['团队办公室','先看真实工作，再看每一次交付。'],employees:['数字员工','岗位、职责和最近一次工作回报。'],tasks:['任务中心','从实际回报中，看见任务的进展与交付。'],pipeline:['打星工作流','发现需求、筛选机会、验证差异，再决定发布。'],activity:['运行记录','保留事实发生的时间，也保留回报到达的时间。'],files:['交付与迁移','云端保存工作记录，执行环境独立承担任务。']};
let actual = null, mode = 'actual', demo = null, page = 'office', selected = 'michelle', taskFilter = 'all', scene = null, events = null, connected = false, toastTimer;
const initialView=new URLSearchParams(location.search).get('view');if(pageInfo[initialView])page=initialView;
const data = () => mode === 'demo' ? demo : actual;
const time = value => value ? new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)) : '—';
const age = value => { if (!value) return '尚无回报'; const s = Math.max(0, Math.floor((Date.now()-Date.parse(value))/1000)); return s<60?`${s}秒前` : s<3600?`${Math.floor(s/60)}分钟前` : `${Math.floor(s/3600)}小时前`; };
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
  const [title,description]=pageInfo[page];$('#page-title').innerHTML=`${title}<span class="heading-dot">.</span>`;$('#page-description').textContent=description;$('#breadcrumb').textContent=title;
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  document.querySelectorAll('.mode-switch button').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));$('#demo-banner').hidden=mode!=='demo';
  const working=state.tasks.filter(t=>t.status==='working').length, blocked=state.tasks.filter(t=>['blocked','failed','stale'].includes(t.status)).length, reported=state.workers.filter(w=>w.last_seen).length;
  $('#metrics').innerHTML=[['people',7,'个','已配置岗位'],['play',working,'项','正在工作'],['clock',blocked,'项','需要关注'],['activity',reported,'/ 7','收到岗位回报']].map(([ic,n,unit,label])=>`<div class="metric"><span class="metric-icon">${icon(ic)}</span><div><strong>${n}<small>${unit}</small></strong><p>${label}</p></div></div>`).join('');
  $('#connection-note').innerHTML=icon(mode==='demo'?'play':'activity')+`<div><strong>${mode==='demo'?'正在查看演示办公室':state.event_count?`已收到 ${state.event_count} 条岗位回报`:'办公室已准备好，等待第一条回报'}</strong>　${mode==='demo'?'示例状态只用于体验，不写入真实记录。':state.event_count?'下方显示已接收的回报；不代表已读取 dot 的全部内部任务。':'Michelle 内部任务尚未接入；可先体验演示，再接入本地任务或导入回报。'}</div><button class="text-button" data-action="help">了解接入 ${icon('arrow')}</button>`;
  $('#task-count').textContent=state.tasks.length;$('#office-page').hidden=page!=='office';$('#other-page').hidden=page==='office';
  renderStaff(state);
  $('#desk-strip').innerHTML=state.workers.map(w=>`<button class="desk-chip ${w.id===selected?'selected':''}" data-worker="${w.id}" aria-label="查看${esc(w.name)}详情"><span class="dot ${w.status==='working'?'blue':w.status==='blocked'?'amber':w.status==='completed'?'green':''}"></span>${esc(w.name)}<span>${names[w.status]}</span></button>`).join('');
  renderInspector();if(page!=='office')renderOther();
  scene?.setDemo(mode==='demo');scene?.setWorkers(state.workers);if(page==='office')requestAnimationFrame(()=>scene?.resize());
  $('#transport-dot').className=`dot ${connected?'green':''}`;$('#transport-label').textContent=connected?'云端回报已连接 · 每15秒刷新':'回报通道连接中断，保留最后状态';
  $('#last-received').textContent=mode==='demo'?'演示数据 · 不计入实际记录':actual.event_count?`最近回报 ${age(actual.events[0]?.received_at)}`:'尚无真实工作回报';
}
function renderStaff(state) {
  const panel=$('#staff-status');panel.hidden=page!=='office';
  panel.innerHTML=`<div class="staff-heading"><div><strong>全员工作状态</strong><p>${mode==='demo'?'演示任务，仅用于体验':'查看各岗位最近一次真实回报；历史本地记录与新云端任务按来源区分。'}</p></div><button class="text-button" data-page="pipeline">查看打星工作流 →</button></div><div class="staff-grid">${state.workers.map(w=>`<button class="staff-card ${esc(w.status)} ${selected===w.id?'chosen':''}" data-worker="${w.id}"><div class="staff-card-head"><strong>${esc(w.name)}</strong>${badge(w.status)}</div><p class="staff-task">${esc(w.task?.title||(w.last_seen?'等待下一项任务':'尚未收到实际任务回报'))}</p><small>${age(w.last_seen)}${w.last_event?.source?.label?` · ${esc(w.last_event.source.label)}`:''}</small></button>`).join('')}</div>`;
}
function renderInspector() {
  const state=data(), w=worker(selected)||state.workers[0], task=w.task;
  const recent=state.events.filter(e=>e.worker_id===w.id).slice(0,3);
  $('#inspector').innerHTML=`<div class="inspector-title">员工详情 <span>SELECTED DESK</span></div><div class="employee-profile"><div class="employee-head">${avatar(w)}<div><h2>${esc(w.name)}</h2><p>${w.id==='michelle'?'项目总管 · 云端协调':'数字岗位 · 按任务执行'}</p></div></div><div class="status-row">${badge(w.status)}<small>${age(w.last_seen)}</small></div><p class="employee-mission">${esc(w.mission)}</p></div><div class="inspector-section"><div class="section-label">最近任务${task?'<button class="text-button" data-page="tasks">查看全部 →</button>':''}</div>${task?`<div class="current-task">${esc(task.title)}<p>${esc(task.project)}${task.version?` · ${esc(task.version)}`:''}</p>${task.progress!==null&&task.progress!==undefined?`<div class="progress-track"><span style="width:${Number(task.progress)}%"></span></div>`:''}</div>`:'<div class="current-task empty">尚未收到该岗位的任务回报<p>接入后，这里会显示任务与交付。</p></div>'}</div><div class="inspector-section"><div class="section-label">岗位交付物</div><ul class="deliverables">${w.deliverables.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="inspector-section"><div class="section-label">最近回报</div><div class="mini-timeline">${recent.length?recent.map(e=>`<p>${eventName(e.type)}<small>${time(e.at)} · ${esc(e.source?.label||'岗位回报')}</small></p>`).join(''):'<div class="empty-copy">回报到达后，会保留来源、时间和证据。<br>没有回报，工作状态保持未知。</div>'}</div></div>`;
}
function empty(title,description) { return `<div class="large-empty">${icon('tasks')}<h3>${title}</h3><p>${description}</p><button class="text-button" data-mode="demo">体验演示办公室 ${icon('arrow')}</button></div>`; }
function renderOther() {
  const state=data(), container=$('#other-page');
  if(page==='pipeline'){
    if(mode==='demo'){container.innerHTML='<div class="content-panel"><h2>工作流记录来自实际执行</h2><p class="empty-copy">演示模式只展示示例岗位任务。返回实际状态，查看本轮候选、阶段与交付。</p><button class="outline-button" data-mode="actual">返回实际状态</button></div>';return;}
    const flow=actual.workflow;
    if(!flow){container.innerHTML=`<div class="content-panel"><h2>工作流尚未登记</h2><p class="empty-copy">任务准备后，显示真实阶段、候选与证据。</p></div>`;return;}
    const stageName={pending:'未开始',working:'进行中',completed:'已完成',blocked:'等待条件',rejected:'已淘汰'};
    container.innerHTML=`<div class="content-panel pipeline-panel"><div class="pipeline-intro"><div><span class="eyebrow">从机会到作品</span><h2>${esc(flow.title)}</h2><p>${esc(flow.summary)}</p>${flow.demo_ready?'<a class="outline-button" style="display:inline-block" href="/opc/pilot/office-diff" target="_blank" rel="noreferrer">打开本轮改进的实际预检报告 ↗</a>':''}</div><span class="status working">${esc(flow.mode_label)}</span></div><div class="workflow-stages">${flow.stages.map((s,i)=>`<div class="workflow-stage ${esc(s.status)}"><span class="stage-number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(s.name)}</h3><p>${esc(s.result||s.gate)}</p><small>${esc(s.owner)} · ${stageName[s.status]||'未知'}</small></div></div>`).join('')}</div><div class="pipeline-section-title"><h3>本轮候选与判断</h3><small>判断依据来自已读资料，评分不代表增长保证</small></div><div class="candidate-grid">${(flow.candidates||[]).map(c=>`<article class="candidate-card"><div><h3>${esc(c.name)}</h3><span class="status ${c.decision==='优先验证'?'working':''}">${esc(c.decision)}</span></div><p>${esc(c.reason)}</p><small>${esc(c.evidence_note||'')}</small>${safeLink(c.url)?`<a href="${safeLink(c.url)}" target="_blank" rel="noreferrer">查看 GitHub 来源 ↗</a>`:''}</article>`).join('')||'<p class="empty-copy">正在读取候选资料，尚无筛选结论。</p>'}</div><div class="pipeline-next"><strong>接下来做什么</strong><p>${esc(flow.next_action)}</p><small>${esc(flow.execution_note)}</small></div><p class="source-note">更新 ${esc(flow.updated_at)} · Star、试用与留存分别观察；未知数据保留未知。</p></div>`;
  }
  if(page==='employees'){container.innerHTML=`<div class="content-panel"><div class="panel-title"><div><h2>Michelle 与六个数字岗位</h2><p>岗位定义已配置；是否实际工作，以收到的回报为准。</p></div></div><div class="employee-grid">${state.workers.map(w=>`<button class="employee-tile" data-worker="${w.id}" data-open-office="true">${avatar(w)}<h3>${esc(w.name)}</h3>${badge(w.status)}<p>${esc(w.mission)}</p></button>`).join('')}</div></div>`;}
  if(page==='tasks'){
    const filters=[['all','全部任务'],['working','工作中'],['attention','需要关注'],['completed','已交付']];
    const tasks=state.tasks.filter(t=>taskFilter==='all'||(taskFilter==='attention'?['failed','blocked','stale'].includes(t.status):t.status===taskFilter));
    container.innerHTML=`<div class="content-panel"><div class="panel-title"><div><h2>任务交接墙</h2><p>这里展示接收到的任务，不自动分派或启动员工。</p></div></div><div class="task-filters">${filters.map(([id,name])=>`<button data-filter="${id}" class="${taskFilter===id?'active':''}">${name}</button>`).join('')}</div>${tasks.length?tasks.map(t=>`<button class="task-row" data-task="${esc(t.id)}" data-task-worker="${esc(t.worker_id)}">${avatar(worker(t.worker_id))}<div><strong>${esc(t.title)}</strong><p>${esc(t.worker_name)} · ${esc(t.project)}</p></div>${badge(t.status)}<time>${time(t.updated_at)}</time></button>`).join(''):empty('还没有可见的工作任务','先接入一个本地任务，或导入 Michelle 交付的标准回报文件。<br>这里不会把旧盘点自动变成正在执行的任务。')}</div>`;
  }
  if(page==='activity')container.innerHTML=`<div class="content-panel"><div class="panel-title"><div><h2>工作室运行记录</h2><p>实际事件与收到时间分开记录，最近显示100条。</p></div><button class="outline-button" data-action="export">导出记录</button></div>${state.events.length?state.events.map(e=>`<div class="activity-row"><time>${time(e.at)}</time><span class="dot ${e.type==='task.completed'?'green':'blue'}"></span><div><strong>${esc(worker(e.worker_id)?.name)} · ${eventName(e.type)}</strong><p>${esc(e.task?.title||e.message||'岗位状态回报')}</p><small>${esc(e.source?.label||'岗位回报')} · 到达 ${time(e.received_at)}</small></div></div>`).join(''):empty('第一条回报还在路上','开始、进度、需要确认、交付与失败，都可以在这里留下一条真实记录。')}</div>`;
  if(page==='files')container.innerHTML=`<div class="content-panel"><div class="panel-title"><div><h2>让公司可以接续，也可以迁移</h2><p>网站代码、岗位定义与事件记录分开保存。</p></div></div><div class="two-column"><div class="info-card">${icon('files')}<h3>公司岗位配置</h3><p>Michelle 与六个岗位的名称、职责和交付物。当前网页读取配置，不会修改 dot 设置。</p><button class="outline-button" data-action="download-company">下载岗位配置</button></div><div class="info-card">${icon('activity')}<h3>实际工作记录</h3><p>导出已接收的事件，再导入到新的运行位置。重复导入会按事件身份去重。</p><button class="outline-button" data-action="export">导出实际记录</button></div></div><div class="baseline-card"><strong>${esc(state.company.baseline.product.name)} · ${esc(state.company.baseline.product.description)}</strong><p>${esc(state.company.baseline.product.state)}</p><small>来自 ${esc(state.company.baseline.source)}，盘点日期2026-10-22；这是历史交接信息，不是实时任务或采用证明。</small></div><div class="info-card" style="margin-top:20px"><h3>云端运行与任务接续</h3><p>本地先跑通办公室、任务回报和记录。之后把网站放到持续在线的服务，将新回报地址交给 Michelle。dot 承担协调与执行，网站承担显示与记录。</p><p>这个办公室地址持续在线；是否有员工在工作，以任务回报及交付证据为准。</p><button class="text-button" data-action="migration">查看迁移步骤 ${icon('arrow')}</button></div></div>`;
  if(page==='tasks'&&actual.cloud)container.innerHTML+=cloudJobsMarkup(actual);
}
function openModal(title,body) { $('#modal-content').innerHTML=`<div class="modal-body"><div class="modal-top"><h2>${title}</h2><button class="icon-button" data-action="close-modal" aria-label="关闭">${icon('close')}</button></div>${body}</div>`;if(!$('#modal').open)$('#modal').showModal(); }
function showHelp(){openModal('云端工作与回报','<p>办公室部署在诸事大吉，工作记录保存在云端数据库，每15秒读取一次。执行任务使用现有 Codex 云端或 Michelle 的获准执行环境。</p><p>每个任务只拿到有期限的回报凭证，可以报告开始、进度和结果。回报显示真实来源；没有收到回报，员工不会自动显示工作中。</p><p>Michelle 的原生直接派活接口尚未验证。当前是否有真实云端任务，请查看任务中心及运行记录。</p>');}
function showMigration(){openModal('云端办公室','<p>当前地址已独立于笔记本运行，采用诸事大吉的网站管理密码保护。</p><p>网页负责展示，Cloudflare 保存任务与状态，Codex/Michelle 云端负责执行。仅本地运行的进程仍会随电脑关机停止。</p><p>电脑断开后是否能完成某次工作，以云端任务实际回报和交付证据为准。</p>');}
function showTask(id,workerId) { const t=data().tasks.find(t=>t.id===id&&t.worker_id===workerId);if(!t)return;openModal(esc(t.title),`${badge(t.status)}<p>${esc(t.worker_name)} · ${esc(t.project)}</p><p>${esc(t.message||'暂无补充说明。')}</p><p>版本：${esc(t.version||'未提供')}<br>事件时间：${esc(t.updated_at)}<br>来源：${esc(t.source?.label||'岗位回报')}</p><h3>交付证据</h3>${t.evidence?.length?t.evidence.map(e=>`<p>${esc(e.label)}${e.ref?`<br><span class="source-note">${esc(e.ref)}</span>`:''}${safeLink(e.url)?`<a class="evidence-link" href="${safeLink(e.url)}" target="_blank" rel="noreferrer">打开证据链接 ↗</a>`:''}</p>`).join(''):'<p>没有提供可点击的交付证据。任务完成状态属于执行者回报，不能单独代替验收。</p>'}`);}
async function boot() {
  try { actual=await api('/api/opc/state');demo=makeDemo(actual);render();
    if(!scene){try{scene=createOfficeScene($('#office-canvas'),{workers:actual.workers,onWorkerSelect:id=>{selected=id;render();}});$('#scene-loading').hidden=true;new ResizeObserver(()=>scene?.resize()).observe($('#office-canvas'));}catch(e){$('#scene-loading').textContent='当前浏览器暂不支持3D视图；仍可通过下方工位查看任务。';console.warn('Office scene unavailable:',e.message);}}
    connected=true;render();if(!events){events=setInterval(async()=>{if(document.hidden)return;try{actual=await api('/api/opc/state');connected=true;}catch(e){connected=false;if(e.auth)location.reload();}if(mode==='actual')render();},15000);}
  }catch(error){if(error.auth){openModal('打开你的工作室','<p>这台在线服务已设置访问口令。口令只提交到当前服务，不保存在浏览器本地存储。</p><form id="login-form"><input id="access-token" type="password" autocomplete="current-password" placeholder="输入访问口令" aria-label="访问口令" required><button class="primary-button" type="submit">进入工作室</button></form>');}else{$('#connection-note').textContent=`暂时无法读取看板：${error.message}`;}}
}
document.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.page){page=b.dataset.page;render();window.scrollTo(0,0);}
  if(b.dataset.mode){if(!actual)return toast('请先连接工作室');mode=b.dataset.mode;if(mode==='demo')demo=makeDemo(actual);render();}
  if(b.dataset.worker){selected=b.dataset.worker;if(b.dataset.openOffice)page='office';render();}
  if(b.dataset.filter){taskFilter=b.dataset.filter;renderOther();}
  if(b.dataset.task)showTask(b.dataset.task,b.dataset.taskWorker);
  try{switch(b.dataset.action){case'collect-cloud':await post('/api/opc/collect',{});toast('云端采集已登记，请查看后续工作回报');break;case'michelle':prepareMichelle();break;case'copy-michelle':await navigator.clipboard.writeText($('#michelle-instruction').value);toast('已复制，请交给 Michelle');break;case'help':showHelp();break;case'migration':showMigration();break;case'close-modal':$('#modal').close();break;case'import':if(mode==='demo')return toast('请先返回实际状态，再导入真实工作回报');$('#import-file').click();break;case'export':if(mode==='demo')return toast('演示数据不会导出，请先返回实际状态');download(await api('/api/opc/export'),'michelle-office-records.json');break;case'download-company':download(actual.company,'michelle-office-company.json');break;case'zoom-in':scene?.zoom(-1);break;case'zoom-out':scene?.zoom(1);break;case'reset-camera':scene?.resetView();break;}}
  catch(e){toast(e.message);}
});
$('#import-file').addEventListener('change',async event=>{try{const f=event.target.files[0];if(!f)return;if(f.size>262144)throw Error('文件超过256 KiB，请分批导入');const input=JSON.parse(await f.text());const result=await post('/api/opc/import',input);toast(`已接收 ${result.accepted} 条回报，跳过 ${result.duplicates} 条重复记录`);}catch(e){toast(`导入未完成：${e.message}`);}finally{event.target.value='';}});
document.addEventListener('submit',async event=>{if(event.target.id!=='login-form')return;event.preventDefault();try{await post('/api/opc/session',{token:$('#access-token').value});$('#access-token').value='';$('#modal').close();await boot();}catch(e){toast(e.message);}});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').close();});
setInterval(()=>{$('#clock').textContent=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());},1000);
window.addEventListener('pagehide',()=>{clearInterval(events);scene?.destroy();});
boot();

function cloudJobsMarkup(state){
 const labels={pending:'等待执行回执',running:'执行端已回报',completed:'执行端已交付',failed:'执行失败',blocked:'等待条件',revoked:'已撤销'};
 const jobs=state.cloud?.jobs||[];
 return `<div class="content-panel" style="margin-top:20px"><div class="panel-title"><div><h2>云端任务接续</h2><p>Michelle 直接派活尚未连接。生成指令后，需交给 Michelle；收到执行回报后才会更新员工状态。</p></div><button class="outline-button" data-action="michelle">准备 Michelle 云端任务</button><button class="outline-button" data-action="collect-cloud">运行一次云端采集</button></div>${jobs.map(j=>`<div class="activity-row"><time>${time(j.created_at)}</time><span class="dot ${j.status==='completed'?'green':''}"></span><div><strong>${esc(j.title)}</strong><p>${esc(j.executor==='michelle-dot'?'Michelle 云端':j.executor==='cloudflare-collector'?'Cloudflare 云端采集':'Codex 云端')} · ${labels[j.status]||'状态未知'}${j.expires_at<Date.now()&&!['completed','failed','revoked'].includes(j.status)?' · 回报凭证已到期':''}</p><small>${j.event_count}条回报 · ${esc(j.id)}</small></div></div>`).join('')||'<p class="empty-copy">还没有登记云端任务。</p>'}</div>`;
}
function prepareMichelle(){openModal('准备 Michelle 云端任务','<p>输入本次任务目标，生成只属于这项任务的接入指令。把它交给 Michelle 后，办公室才能收到她的云端回报。</p><form id="michelle-form"><label for="cloud-title">本次任务</label><input style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:12px 0" id="cloud-title" maxlength="240" required value="OfficeDiff 云端复核与下一步改进建议"><button class="primary-button" type="submit">生成接入指令</button></form><p class="source-note">生成指令会登记一项等待执行的任务，不会自动启动 Michelle。凭证2小时有效，只可回报这一项任务。</p>');}
document.addEventListener('submit',async e=>{
 if(e.target.id!=='michelle-form')return;e.preventDefault();
 try{const title=$('#cloud-title').value;const job=await post('/api/opc/jobs',{title,worker_id:'michelle',executor:'michelle-dot'});
 const instruction=`请在你已有的云端执行环境完成这项 OPC 任务：${title}。保留现有配置和调度，优先使用已有 Codex 额度，不购买新服务。必须确认执行环境独立于我的笔记本；如果只能调用本机，停止并报告阻塞。
开始时和结束时向我的办公室提交真实回报，执行过程中每60秒报告一次进度或心跳。不要把聊天中的承诺当作任务已执行。
POST ${job.callback_url}
Authorization: Bearer ${job.token}
Content-Type: application/json
开始回报示例：{"event_id":"start-1","type":"task.started","message":"实际云端环境与工作内容","progress":0}
进度：type使用task.progress；完成：type使用task.completed、progress为100；失败：task.failed。event_id每条唯一。evidence可含最多12个{label,ref,url}，url只用https，ref说明测试命令、真实结果和交付位置。message最多1500字符。服务端会固定岗位、任务与来源。不要公开或长期保存凭证。
请先做一项有实际输出的最小工作，保留代码/报告/测试日志和SHA256，再回报完成。禁止发布代码、刷Star、改名复制项目。若接口或云端网络不允许，明确报告，不绕过权限。凭证到期时间：${new Date(job.expires_at).toISOString()}。`;
 openModal('把指令交给 Michelle','<p>任务已登记，正在等待执行回报。复制下面的指令到 Michelle 对话。收到她的开始回报后，办公室会自动更新。</p><textarea id="michelle-instruction" readonly style="width:100%;height:280px;box-sizing:border-box;padding:12px"></textarea><button class="primary-button" data-action="copy-michelle">复制指令</button>');$('#michelle-instruction').value=instruction;
 }catch(error){toast(error.message);}
});

