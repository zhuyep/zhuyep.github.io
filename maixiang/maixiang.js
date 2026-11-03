import {TASK_STATES,validateSnapshot} from './contract.js';
// Public shell has no personal data. Authenticated data stays in memory only.
export const MAIXIANG_EVENT = 'zhushi:maixiang';
export const QUEUE_KEY = 'zhushi-daji-maixiang-queue-v1';
export const TASK_CONTRACT = 'maixiang.task.v1';
const LOG_KINDS = [['movement', '走动'], ['meal', '饮食'], ['rest', '休息'], ['note', '其他']];

export const EMPTY_BOARD = {
  synthetic: false,
  nearTerm: '私人档案还未接通。',
  focus: [],
  nextStep: '验证本人后，可以保存一笔记录或交给小护士处理。'
};

// Obviously fictional UI fixture. No name, id, contact, or lab values.
export const SYNTHETIC_BOARD = {
  synthetic: true,
  nearTerm: '样例：作息大致平稳，晚饭后的走动偏少。',
  focus: ['把散步放进晚饭后（样例）', '把入睡时间说定（样例）'],
  nextStep: '晚饭后走一刻钟（样例，不是医嘱）。'
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

export function healthDeepLink(origin, intent) {
  if (intent !== 'log' && intent !== 'ask') throw Error('意图无效');
  const base = String(origin || '').replace(/\/$/, '');
  return `${base}/maixiang/?intent=${intent}`;
}

export function createMaixiangTask({intent, kind, text, now = new Date(), origin = '', id} = {}) {
  const body = String(text ?? '').trim();
  if (intent !== 'log' && intent !== 'ask') return {ok: false, error: '意图无效'};
  const allowed = intent === 'ask' ? ['question'] : LOG_KINDS.map(([key]) => key);
  if (!allowed.includes(kind)) return {ok: false, error: '类型无效'};
  if (!body) return {ok: false, error: '写一句就好'};
  if ([...body].length > 500) return {ok: false, error: '最多 500 字'};
  const createdAt = now.toISOString();
  const taskId = id || `mx_${createdAt.replace(/\D/g, '').slice(0, 17)}_${globalThis.crypto?.randomUUID?.().slice(0, 8) || 'local'}`;
  const deepLink = healthDeepLink(origin, intent);
  const linkUrl = new URL(deepLink, 'https://zhushi-daji.invalid');
  if ([...linkUrl.searchParams.keys()].some(key => !['intent'].includes(key))) return {ok: false, error: '深链不能带正文'};
  return {
    ok: true,
    task: {
      contract: TASK_CONTRACT,
      id: taskId,
      intent,
      kind,
      text: body,
      createdAt,
      handoff: {
        event: MAIXIANG_EVENT,
        deepLink,
        assistant: 'grok-bot-nurse',
        storage: 'private-task-queue',
        api: {method: 'POST', path: '/api/maixiang/v1/tasks', status: 'requires-owner-verification'}
      }
    }
  };
}

function validTask(task) {
  return task && task.contract === TASK_CONTRACT && (task.intent === 'log' || task.intent === 'ask') && typeof task.text === 'string' && task.text.length <= 500 && typeof task.id === 'string';
}

export function rememberTask(storage, task) {
  let tasks = [];
  try {
    const parsed = JSON.parse(storage.getItem(QUEUE_KEY) || '{"tasks":[]}');
    if (Array.isArray(parsed?.tasks)) tasks = parsed.tasks.filter(validTask);
  } catch { tasks = []; }
  tasks.push(task);
  tasks = tasks.slice(-20);
  storage.setItem(QUEUE_KEY, JSON.stringify({contract: 'maixiang.queue.v1', tasks}));
  return tasks.length;
}

export function renderBoard(board) {
  const focus = board.focus.length
    ? `<ul>${board.focus.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`
    : '<p class="maixiang-empty">还没有关注项。</p>';
  const banner = board.synthetic ? '<p class="maixiang-banner" role="status">合成样例，不是任何人的档案。</p>' : '';
  return `${banner}<div class="maixiang-grid"><article><h2>近期</h2><p>${esc(board.nearTerm)}</p></article><article><h2>关注</h2>${focus}</article><article><h2>下一步</h2><p>${esc(board.nextStep)}</p></article></div>`;
}

export async function probeMaixiangApi(fetchImpl) {
  try {
    const response = await fetchImpl('/api/maixiang/v1/dashboard', {method: 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
    try { await response.body?.cancel(); } catch { /* ignore unread payloads */ }
    return response.status === 401 || response.status === 403 ? 'locked' : 'closed';
  } catch { return 'closed'; }
}

function rangeStart(snapshot,range){return range==='all'||!snapshot.coverage.daily_end?null:new Date(Date.parse(snapshot.coverage.daily_end+'T12:00:00Z')-(Number(range)-1)*86400000).toISOString().slice(0,10);}
export function rangeRows(snapshot, range='30') {
  const end=snapshot.coverage.daily_end;
  const start=rangeStart(snapshot,range);
  return snapshot.daily.filter(r=>(!start||r.date>=start)&&(!end||r.date<=end));
}
const statusLabel=s=>({suggested:'建议中',planned:'计划中',active:'进行中',completed:'已完成',observed:'仅观察到',consumed:'已确认摄入',not_eaten:'未吃',uncertain:'待确认',negated:'未执行',user_reported:'本人陈述',user_confirmed:'本人确认',ai_estimate:'识别估计',pending:'待核验',estimated:'厂商估计',present:'有值',missing:'未提供',partial:'未结束日',invalid:'无效值',conflict:'口径冲突'}[s]||s);
const valid=(row,key)=>!row.partial&&['present','estimated'].includes(row.quality[key])&&Number.isFinite(row[key]);
export function summarizeDaily(rows,key){const values=rows.filter(r=>valid(r,key)).map(r=>r[key]);return {mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,valid:values.length,total:rows.length};}
function trend(rows,key){
 if(!rows.length)return '<p class="maixiang-empty">暂无日资料</p>';
 const values=rows.filter(r=>valid(r,key)).map(r=>r[key]);if(!values.length)return '<p class="maixiang-empty">此区间没有有效值</p>';
 const lo=Math.min(...values),hi=Math.max(...values),span=hi-lo||1,start=Date.parse(rows[0].date),days=Math.max(1,(Date.parse(rows.at(-1).date)-start)/86400000);
 let segments=[],current=[],last=null;
 for(const r of rows){if(!valid(r,key)||last&&(Date.parse(r.date)-Date.parse(last)>86400000)){if(current.length)segments.push(current);current=[];}if(valid(r,key)){current.push([20+((Date.parse(r.date)-start)/86400000)/days*560,100-(r[key]-lo)/span*76]);last=r.date;}else last=null;}if(current.length)segments.push(current);
 return `<svg viewBox="0 0 600 120" role="img" aria-label="按日期绘制；缺测处断开">${segments.map(points=>points.length===1?`<circle cx="${points[0][0]}" cy="${points[0][1]}" r="3"/>`:`<polyline points="${points.map(p=>p.join(',')).join(' ')}"/>`).join('')}</svg><p class="mx-caption">${esc(rows[0].date)} — ${esc(rows.at(-1).date)} · ${esc(lo.toFixed(key==='steps'?0:1))}–${esc(hi.toFixed(key==='steps'?0:1))}</p>`;
}
export function renderSnapshot(snapshot,range='30',metric='steps'){
 const rows=rangeRows(snapshot,range),labels={steps:['步数','步'],sleep_minutes:['睡眠','分钟'],resting_hr:['静息心率','次/分'],hrv:['HRV','毫秒']};
 const metrics=Object.entries(labels).map(([key,[label,unit]])=>{const s=summarizeDaily(rows,key);return `<article><h3>${label}</h3><strong>${s.mean==null?'—':Math.round(s.mean).toLocaleString('zh-CN')}</strong><span> ${unit}</span><p class="mx-caption">有效 ${s.valid}/${s.total} 日</p></article>`;}).join('');
 const start=rangeStart(snapshot,range),end=snapshot.coverage.daily_end;
 const activities=snapshot.activities.filter(a=>(range==='all'||!start||a.date>=start)&&(!end||a.date<=end));
 const clinical=snapshot.clinical.map(r=>`<tr><td>${esc(r.date||'日期不详')}</td><td>${esc(r.label)}</td><td>${esc(r.value??'—')} ${esc(r.unit)}</td><td>${esc(r.evidence)}${r.pages.length?' · 第 '+r.pages.join('、')+' 页':''}</td></tr>`).join('');
 const lives=snapshot.lifestyle.map(r=>`<li>${esc(r.date||'日期待确认')} · ${esc(r.description)} · ${esc(statusLabel(r.status))}${r.possible_duplicate?' · 可能重复，未合计':''}</li>`).join('');
 return `<p class="maixiang-banner">档案摘要更新于 ${esc(snapshot.generated_at.replace('T',' '))}。展示已保存资料；刷新不会拉取手表。</p>
 <div class="maixiang-grid"><article><h2>关注</h2>${snapshot.focus.map(r=>`<p><b>${esc(r.title)}</b><br>${esc(r.summary)}</p>`).join('')||'<p>暂无关注项</p>'}</article><article><h2>下一小步</h2>${snapshot.plans.map(r=>`<p><b>${esc(r.title)}</b><br>${esc(r.detail)}<br><small>${esc(statusLabel(r.status))}</small></p>`).join('')||'<p>暂无计划</p>'}</article><article><h2>资料范围</h2><p>${esc(snapshot.coverage.daily_start||'—')} 至 ${esc(snapshot.coverage.daily_end||'—')}</p><p>${snapshot.coverage.daily_dates} 个日期；${snapshot.coverage.full_history?'已声明完整历史':'仅当前交付范围'}</p><p>${esc(snapshot.report_status||'暂无新报告状态')}</p></article></div>
 <section class="mx-section"><h2>近期趋势</h2><div class="mx-filters"><label>区间<select data-range><option value="7" ${range==='7'?'selected':''}>近 7 日</option><option value="30" ${range==='30'?'selected':''}>近 30 日</option><option value="all" ${range==='all'?'selected':''}>已保存全部</option></select></label><label>曲线<select data-metric>${Object.entries(labels).map(([k,[v]])=>`<option value="${k}" ${metric===k?'selected':''}>${v}</option>`).join('')}</select></label></div><div class="mx-metrics">${metrics}</div><div class="mx-chart">${trend(rows,metric)}</div><p class="mx-caption">缺测不补零，未结束日不参与均值与趋势；可穿戴数值为厂商估计。</p></section>
 <section class="mx-section"><h2>计时活动 · ${activities.length} 次</h2><p class="mx-caption">仅已核验设备活动，按活动标识去重；口述活动单独保留。</p><ul class="mx-list">${activities.slice(-12).reverse().map(a=>`<li>${esc(a.date)} ${esc(a.time||'')} · ${esc(a.type||'类型未提供')} · ${a.duration_minutes==null?'时长未提供':Math.round(a.duration_minutes)+' 分钟'} · ${esc(a.source)}</li>`).join('')||'<li>此区间暂无计时活动</li>'}</ul></section>
 <details class="mx-section"><summary>历史体检与生活记录</summary><p class="mx-caption">历史指标不代表当前结果；原报告参考范围不等于个人治疗目标。</p><div class="mx-table"><table><thead><tr><th>检查日期</th><th>指标</th><th>原值</th><th>依据</th></tr></thead><tbody>${clinical}</tbody></table></div><ul>${lives||'<li>尚无有效生活事件</li>'}</ul></details>
 <details class="mx-section"><summary>资料来源与缺测</summary><ul>${snapshot.source_coverage.map(s=>`<li>${esc(s.kind)} · ${esc(s.status)}</li>`).join('')}</ul><div class="mx-table"><table><thead><tr><th>日期</th>${Object.values(labels).map(([l])=>`<th>${l}</th>`).join('')}<th>来源</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.date)}${r.partial?'（未结束日）':''}</td>${Object.keys(labels).map(k=>`<td>${esc(r[k]??'—')}<small> ${esc(statusLabel(r.quality[k]))}</small></td>`).join('')}<td>${esc(r.source)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
const taskTime=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date)+' 北京时间':'时间待确认';};
export function renderTasks(tasks){return tasks.length?tasks.map(t=>`<article class="mx-task"><p><b>${esc(TASK_STATES[t.status]||'未知状态')}</b> · ${t.intent==='ask'?'提问':'记录'} · ${esc(taskTime(t.createdAt))}</p><p class="mx-task-text">${esc(t.text)}</p>${t.leaseExpired?'<p>处理连接已超时，等待重新接手。</p>':''}${t.status==='queued'?'<p class="mx-caption">已保存任务，等待小护士或助手接手；尚未写入健康主档。</p>':''}${t.reply?`<p class="mx-reply">${esc(t.reply)}</p>`:''}${t.status==='recorded'?'<p class="mx-caption">主档保存与摘要版本已收到对应回执。</p>':''}${t.status==='failed'?`<button data-task-action="retry" data-id="${esc(t.id)}">重试</button>`:''}${['queued','failed'].includes(t.status)?`<button data-task-action="cancel" data-id="${esc(t.id)}">取消待办</button>`:''}</article>`).join(''):'<p class="maixiang-empty">还没有网页任务。</p>';}

export function mountMaixiang(root,{location:loc=root.ownerDocument.defaultView.location,fetchImpl=root.ownerDocument.defaultView.fetch.bind(root.ownerDocument.defaultView)}={}){
 const view=root.ownerDocument.defaultView,$=s=>root.querySelector(s);let snapshot=null,tasks=[],intent='',range='30',metric='steps',authenticated=false,sample=false,pending=null;
 const status=text=>{$('[data-status]').textContent=text;};
 const paint=()=>{const local=$('[data-local-access]');if(local)local.hidden=Boolean(snapshot)||sample;$('[data-board]').innerHTML=sample?renderBoard(SYNTHETIC_BOARD):snapshot?renderSnapshot(snapshot,range,metric):renderBoard(EMPTY_BOARD);$('[data-tasks]').innerHTML=renderTasks(tasks);$('[data-sample]').setAttribute('aria-pressed',String(sample));$('[data-sample]').textContent=sample?'回到我的档案':'看合成样例';};
 async function api(path,options={}){const response=await fetchImpl('/api/maixiang/v1'+path,{credentials:'same-origin',cache:'no-store',redirect:'error',...options});if(response.status===401||response.status===403){authenticated=false;snapshot=null;tasks=[];paint();throw Error('云端本人验证尚未接通；请先通过本机入口查看健康看板。文字仍保留在输入框中。');}const data=await response.json();if(!response.ok)throw Error(data.error||'暂时无法完成，请稍后重试。');return data;}
 async function load(){try{const session=await api('/session');authenticated=session.authenticated&&session.storageReady;$('[data-access]').textContent=authenticated?'本人验证已通过。网页任务已可保存；Grok 自动接单接口尚未接通，可由已授权助手处理。':'本人验证已通过，私密存储尚未接通。';if(authenticated){const board=await api('/dashboard');snapshot=board.snapshot?validateSnapshot(board.snapshot):null;tasks=(await api('/tasks')).tasks;paint();}}catch(e){$('[data-access]').textContent=snapshot?'连接暂时中断，以下仍是上次读取的摘要。':e.message;}}
 function show(next){intent=next;$('[data-form]').hidden=!next;$('[data-log-kind]').hidden=next!=='log';$('[data-log-operation]').hidden=next!=='log';$('[data-form-title]').textContent=next==='ask'?'问小护士':'记一笔';$('[data-submit]').textContent='保存任务';if(next)$('[data-text]').focus();}
 root.addEventListener('change',e=>{if(e.target.matches('[data-range]')){range=e.target.value;paint();}if(e.target.matches('[data-metric]')){metric=e.target.value;paint();}if(e.target.matches('[data-operation]'))$('[data-target-label]').hidden=e.target.value==='capture';});
 root.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if('open'in b.dataset)show(b.dataset.open);if(b.hasAttribute('data-sample')){sample=!sample;paint();}if(b.hasAttribute('data-refresh'))await load();if(b.dataset.taskAction){b.disabled=true;try{await api('/tasks/'+encodeURIComponent(b.dataset.id)+'/'+b.dataset.taskAction,{method:'POST'});tasks=(await api('/tasks')).tasks;paint();status('任务状态已更新。');}catch(e){status(e.message);}finally{b.disabled=false;}}});
 $('[data-form]').addEventListener('submit',async e=>{e.preventDefault();if(!authenticated){status('请先验证本人并接通私密存储，文字保留在输入框中。');return;}const result=createMaixiangTask({intent,kind:intent==='ask'?'question':$('[data-kind]').value,text:$('[data-text]').value,origin:loc.origin});if(!result.ok){status(result.error);return;}const payload={intent:result.task.intent,kind:result.task.kind,text:result.task.text,operation:intent==='log'?$('[data-operation]').value:'capture',target:intent==='log'&&$('[data-operation]').value!=='capture'?$('[data-target]').value.trim()||null:null};if(!pending||Object.entries(payload).some(([k,v])=>pending[k]!==v))pending={id:result.task.id,...payload};$('[data-submit]').disabled=true;try{await api('/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending)});$('[data-text]').value='';pending=null;status('任务已保存，等待处理；尚未入档或答复。');tasks=(await api('/tasks')).tasks;paint();}catch(e){status(e.message);}finally{$('[data-submit]').disabled=false;}});
 try{const mode=JSON.parse(view.localStorage.getItem('zhushi-daji-appearance-v1')||'null')?.mode;root.ownerDocument.documentElement.dataset.theme=mode==='dark'||mode!=='light'&&view.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch{}
 paint();const requested=new URL(loc.href).searchParams.get('intent');show(['ask','log'].includes(requested)?requested:'');load();return ()=>{snapshot=null;tasks=[];};
}
