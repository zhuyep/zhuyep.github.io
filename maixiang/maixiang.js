import {GARMIN_DETAILS,TASK_STATES,validateSnapshot} from './contract.js';
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
  return `${banner}<div class="mx-empty-board"><h2>健康看板</h2><p>${esc(board.nearTerm)}</p>${board.synthetic ? focus : ''}<p class="mx-caption">${esc(board.nextStep)}</p></div>`;
}

export async function probeMaixiangApi(fetchImpl) {
  try {
    const response = await fetchImpl('/api/maixiang/v1/dashboard', {method: 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
    try { await response.body?.cancel(); } catch { /* ignore unread payloads */ }
    return response.status === 401 || response.status === 403 ? 'locked' : 'closed';
  } catch { return 'closed'; }
}

const DAY = 86400000;
const HEALTH_MEASURES = {
  steps: {label: '步数', unit: '步', tick: 1000, value: n => Math.round(n).toLocaleString('zh-CN')},
  sleep_minutes: {label: '睡眠', unit: '小时', tick: 60, value: n => (n / 60).toFixed(1)},
  resting_hr: {label: '静息心率', unit: '次/分', tick: 5, value: n => String(Math.round(n))},
  hrv: {label: '心率变异性', unit: '毫秒', tick: 5, value: n => String(Math.round(n))},
};
const GARMIN_MEASURES = Object.fromEntries(Object.entries(GARMIN_DETAILS).map(
  ([key,[label,unit,divisor,decimals,tick]]) => [key,{label,unit,tick,value: value => (value/divisor).toFixed(decimals)}]
));
const RANGES = [['7','近 7 日'], ['30','近 30 日'], ['all','已保存全部']];
const isoDay = ms => new Date(ms).toISOString().slice(0, 10);
const shortDay = date => date ? `${Number(date.slice(5,7))}月${Number(date.slice(8,10))}日` : '日期待确认';
const dateWindow = (start, end) => start && end ? `${start} 至 ${end}` : '暂无日记录';
const minutes = value => value == null ? '时长未记录' : `${Math.round(value)} 分钟`;
const statusLabel = value => ({suggested:'建议中',planned:'计划中',active:'进行中',completed:'已完成',observed:'仅观察到',consumed:'已确认摄入',not_eaten:'未吃',uncertain:'待确认',negated:'未执行',user_reported:'本人陈述',user_confirmed:'本人确认',ai_estimate:'识别估计',pending:'待核验',estimated:'厂商估计',present:'有值',missing:'未提供',partial:'未结束日',invalid:'无效值',conflict:'口径冲突'}[value] || value);

function rangeStart(snapshot, range) {
  const {daily_start: start, daily_end: end} = snapshot.coverage;
  return range === 'all' ? start : end ? isoDay(Date.parse(end) - (Number(range) - 1) * DAY) : null;
}
export function rangeRows(snapshot, range = '30') {
  const start = rangeStart(snapshot, range), end = snapshot.coverage.daily_end;
  return snapshot.daily.filter(row => (!start || row.date >= start) && (!end || row.date <= end))
    .sort((a, b) => a.date.localeCompare(b.date));
}
const metricValue = (row, key) => Object.hasOwn(HEALTH_MEASURES,key) ? row[key] : row.garmin?.[key]?.value;
const metricQuality = (row, key) => Object.hasOwn(HEALTH_MEASURES,key) ? row.quality[key] : row.garmin?.[key]?.quality;
const valid = (row, key) => !row.partial && ['present', 'estimated'].includes(metricQuality(row,key)) && Number.isFinite(metricValue(row,key));
export function summarizeDaily(rows, key) {
  const values = rows.filter(row => valid(row, key)).map(row => metricValue(row,key));
  return {mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null, valid: values.length, total: rows.length};
}

function trend(rows, key, first, last) {
  const metric = HEALTH_MEASURES[key] || GARMIN_MEASURES[key];
  const observed = rows.filter(row => valid(row, key));
  if (!observed.length) return `<div class="mx-chart-empty">此区间没有可绘制的${metric.label}记录</div>`;
  const values = observed.map(row => metricValue(row,key));
  const low = Math.max(0, Math.floor(Math.min(...values) / metric.tick) * metric.tick);
  const high = Math.max(low + metric.tick, Math.ceil(Math.max(...values) / metric.tick) * metric.tick);
  const start = Date.parse(first || rows[0].date), end = Date.parse(last || rows.at(-1).date);
  const span = Math.max(DAY, end - start);
  const x = date => 8 + (Date.parse(date) - start) / span * 704;
  const y = value => 146 - (value - low) / (high - low) * 138;
  const ticks = [high, (high + low) / 2, low];
  const segments = [];
  let previous = null;
  for (const row of observed) {
    if (!previous || Date.parse(row.date) - Date.parse(previous) > DAY) segments.push([]);
    segments.at(-1).push([x(row.date), y(metricValue(row,key))]);
    previous = row.date;
  }
  const marks = segments.map(points => points.length === 1
    ? `<circle cx="${points[0][0]}" cy="${points[0][1]}" r="3.5"/>`
    : `<polyline points="${points.map(point => point.join(',')).join(' ')}"/>`).join('');
  const dates = [...new Set([isoDay(start), isoDay(start + Math.floor(span / DAY / 2) * DAY), isoDay(end)])];
  const recent = observed.at(-1);
  return `<div class="mx-chart-frame" role="img" aria-label="${metric.label}趋势，${esc(dateWindow(first,last))}，最后一条有效记录为${shortDay(recent.date)} ${metric.value(metricValue(recent,key))}${metric.unit}，缺测处断开">
    <div class="mx-y-axis" aria-hidden="true">${ticks.map(value => `<span>${metric.value(value)}</span>`).join('')}</div>
    <svg viewBox="0 0 720 154" preserveAspectRatio="none" aria-hidden="true">
      ${[8,77,146].map(at => `<line x1="0" x2="720" y1="${at}" y2="${at}"/>`).join('')}${marks}
    </svg>
    <div class="mx-x-axis" aria-hidden="true">${dates.map(date => `<span>${shortDay(date)}</span>`).join('')}</div>
  </div>`;
}

function coverageStrip(rows, key, first, last) {
  if (!first || !last || first > last) return '';
  const byDate = new Map(rows.map(row => [row.date, row]));
  const end = Date.parse(last), start = Math.max(Date.parse(first), end - 29 * DAY);
  const dates = Array.from({length: Math.round((end - start) / DAY) + 1}, (_, index) => isoDay(start + index * DAY));
  const states = dates.map(date => {
    const row = byDate.get(date);
    return row?.partial ? 'partial' : row && valid(row, key) ? 'valid' : 'missing';
  });
  const complete = states.filter(state => state === 'valid').length;
  const unfinished = states.filter(state => state === 'partial').length;
  const missing = dates.length - complete - unfinished;
  return `<div class="mx-coverage"><div class="mx-coverage-head"><span>每天的记录</span><span>${shortDay(dates[0])} — ${shortDay(last)}</span></div>
    <div class="mx-day-strip" aria-hidden="true">${states.map((state, index) => `<span class="is-${state}" title="${dates[index]} ${state === 'valid' ? '有效' : state === 'partial' ? '未结束' : '缺测'}"></span>`).join('')}</div>
    <p class="mx-coverage-key"><span><i class="is-valid"></i>有效 ${complete} 日</span><span><i class="is-missing"></i>缺测 ${missing} 日</span><span><i class="is-partial"></i>未结束 ${unfinished} 日</span></p>
  </div>`;
}

const newest = rows => [...rows].sort((a,b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''));
const entries = (items, empty) => items.length ? `<ul class="mx-notes">${items.join('')}</ul>` : `<p class="maixiang-empty">${empty}</p>`;
function activityTable(rows) {
  return `<div class="mx-table"><table><thead><tr><th scope="col">日期</th><th scope="col">活动</th><th scope="col">时长</th><th scope="col">距离</th><th scope="col">来源</th></tr></thead><tbody>${rows.map(row => {
    const heartRate = [[row.average_hr,'平均'],[row.max_hr,'最高']].filter(([value])=>value!=null)
      .map(([value,label])=>label+' '+Math.round(value)).join(' · ');
    return `<tr><td>${esc(row.date || '日期待确认')} ${esc(row.time)}</td><td>${esc(row.type || '类型未记录')}${heartRate ? '<small>心率 '+heartRate+' 次/分</small>' : ''}</td><td>${minutes(row.duration_minutes)}</td><td>${row.distance_km == null ? '—' : `${Number(row.distance_km.toFixed(2))} 公里`}</td><td>${esc(row.source)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function renderGarminDetails(rows, start, end, keys, selected) {
  if (!keys.length) return '';
  const key = keys.includes(selected) ? selected : keys[0];
  const item = GARMIN_MEASURES[key];
  const info = summarizeDaily(rows,key);
  return `<section class="mx-section" id="mx-garmin">
    <div class="mx-heading"><div><h2>Garmin 详细指标</h2><p>与总览使用同一日期区间 · 设备估计</p></div>
    <label>选择指标<select data-garmin-choice>${keys.map(name=>`<option value="${name}" ${key===name?'selected':''}>${GARMIN_MEASURES[name].label}</option>`).join('')}</select></label></div>
    <p class="mx-report">${info.mean==null?'此区间暂无有效值':`日均 <strong>${item.value(info.mean)} ${item.unit}</strong> · 有效 ${info.valid}/${info.total} 日`}</p>
    ${trend(rows,key,start,end)}${coverageStrip(rows,key,start,end)}
    <details class="mx-disclosure"><summary>查看 ${item.label} 的逐日数值</summary>
    <div class="mx-table"><table><thead><tr><th scope="col">日期</th><th scope="col">记录值（${item.unit}）</th><th scope="col">记录状态</th></tr></thead>
    <tbody>${rows.map(row=>{const value=metricValue(row,key);return `<tr><td>${row.date}</td><td>${value==null?'—':item.value(value)}</td><td>${esc(statusLabel(metricQuality(row,key)||'missing'))}</td></tr>`;}).join('')}</tbody></table></div></details>
    <p class="mx-caption">设备日活动时长、强度分钟与计时活动分别记录。</p></section>`;
}

export function renderSnapshot(snapshot, range = '30', metric = 'steps', garminMetric = 'sleep_score') {
  const rows = rangeRows(snapshot, range);
  const end = snapshot.coverage.daily_end, start = rangeStart(snapshot, range);
  const activities = newest(snapshot.activities.filter(row => range === 'all' || row.date && (!start || row.date >= start) && (!end || row.date <= end)));
  const durations = activities.filter(row => row.duration_minutes != null);
  const activeMinutes = durations.reduce((total, row) => total + row.duration_minutes, 0);
  const focus = entries(snapshot.focus.map(row => `<li><strong>${esc(row.title)}</strong><p>${esc(row.summary)}</p></li>`), '暂无已保存的关注事项。');
  const plans = entries(snapshot.plans.map(row => `<li><strong>${esc(row.title)}</strong><span class="mx-tag">${esc(statusLabel(row.status))}</span><p>${esc(row.detail)}</p></li>`), '暂无后续安排。');
  const metrics = Object.entries(HEALTH_MEASURES).map(([key, item]) => {
    const info = summarizeDaily(rows, key);
    return `<button type="button" class="mx-metric" data-metric-choice="${key}" aria-pressed="${metric === key}">
      <span class="mx-metric-label">${item.label}</span><span class="mx-metric-value">${info.mean == null ? '—' : item.value(info.mean)} <small>${item.unit}</small></span>
      <span class="mx-metric-caption">${info.mean == null ? '暂无有效值' : '日均 · 有效 ' + info.valid + '/' + info.total + ' 日'}</span></button>`;
  }).join('');
  const clinical = newest(snapshot.clinical).map(row => `<tr><td>${esc(row.date || '日期待确认')}</td><th scope="row">${esc(row.label)}</th><td class="mx-number">${esc(row.value ?? '—')} ${esc(row.unit)}</td><td>${esc(row.reference || '—')}</td><td>${esc(row.evidence)}${row.pages.length ? ' · 第 ' + row.pages.join('、') + ' 页' : ''}</td></tr>`).join('');
  const lifestyle = entries(newest(snapshot.lifestyle).map(row => `<li><span class="mx-entry-date">${esc(row.date || '日期待确认')} · ${row.kind === 'meal' ? '饮食' : '口述活动'}</span><strong>${esc(row.description)}</strong><span class="mx-tag">${esc(statusLabel(row.status))}</span><p>${esc(statusLabel(row.evidence))}${row.duration_minutes == null ? '' : ` · ${minutes(row.duration_minutes)}`}${row.possible_duplicate ? ' · 可能重复，未计入设备活动' : ''}</p>${row.uncertainties.length ? `<p>${row.uncertainties.map(esc).join(' · ')}</p>` : ''}</li>`), '暂无已保存的饮食或口述活动。');
  const updated = new Intl.DateTimeFormat('zh-CN', {timeZone:'Asia/Shanghai', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false}).format(new Date(snapshot.generated_at));
  const garminKeys = Object.keys(GARMIN_MEASURES).filter(key=>snapshot.daily.some(row=>Number.isFinite(metricValue(row,key))));
  return `<nav class="mx-jump" aria-label="看板目录"><a href="#mx-overview">总览</a><a href="#mx-activity">运动</a>${garminKeys.length?'<a href="#mx-garmin">Garmin</a>':''}<a href="#mx-clinical">体检</a><a href="#mx-lifestyle">生活</a><a href="#mx-sources">来源</a><a href="#mx-nurse">小护士</a></nav>
  <section class="mx-overview" id="mx-overview" aria-labelledby="mx-overview-title">
    <div class="mx-heading"><div><h2 id="mx-overview-title">健康总览</h2><p>${dateWindow(start,end)} · 摘要更新于 ${esc(updated)}</p></div><div class="mx-range" role="group" aria-label="统计区间">${RANGES.map(([value,label]) => `<button type="button" data-range-choice="${value}" aria-pressed="${range === value}">${label}</button>`).join('')}</div></div>
    <div class="mx-metrics" role="group" aria-label="选择趋势指标">${metrics}</div>
    <div class="mx-overview-grid">
      <section class="mx-panel mx-trend" aria-labelledby="mx-trend-title"><div class="mx-panel-heading"><div><span class="mx-eyebrow">近期趋势</span><h3 id="mx-trend-title">${HEALTH_MEASURES[metric].label}</h3></div><span class="mx-unit">单位 · ${HEALTH_MEASURES[metric].unit}</span></div>
      ${trend(rows,metric,start,end)}${coverageStrip(rows,metric,start,end)}<p class="mx-caption">缺测不补零，未结束日不计入均值。设备记录含厂商估计。</p></section>
      <aside class="mx-panel mx-followup"><h3>关注事项</h3>${focus}<h3>后续安排</h3>${plans}</aside>
    </div>
  </section>
  <section class="mx-section" id="mx-activity"><div class="mx-heading"><div><h2>运动记录</h2><p>与总览使用同一日期区间</p></div><p class="mx-section-total">${activities.length} 次${durations.length ? ` · ${minutes(activeMinutes)}` : ''}</p></div>
    ${activities.length ? activityTable(activities.slice(0, 6)) : '<p class="maixiang-empty">此区间没有已核验的设备活动。</p>'}
    ${activities.length > 6 ? `<details class="mx-disclosure"><summary>查看其余 ${activities.length - 6} 条活动</summary>${activityTable(activities.slice(6))}</details>` : ''}
    <p class="mx-caption">活动次数按设备记录去重。总时长只加总有时长的 ${durations.length} 条设备记录，口述活动在下方单独展示。</p></section>
  ${renderGarminDetails(rows,start,end,garminKeys,garminMetric)}
  <section class="mx-section" id="mx-clinical"><div class="mx-heading"><div><h2>体检档案</h2><p>已接入看板的记录，按检查日期排列</p></div><p class="mx-section-total">${snapshot.clinical.length} 项历史记录</p></div>
    <p class="mx-report"><strong>最新报告状态</strong> ${esc(snapshot.report_status || '暂无报告状态')}</p>
    ${clinical ? `<div class="mx-table"><table><thead><tr><th scope="col">检查日期</th><th scope="col">指标</th><th scope="col">结果</th><th scope="col">报告参考</th><th scope="col">依据</th></tr></thead><tbody>${clinical}</tbody></table></div>` : '<p class="maixiang-empty">暂无已保存的体检指标。</p>'}<p class="mx-caption">历史指标按原报告记录。报告参考范围不等于个人治疗目标。</p></section>
  <section class="mx-section" id="mx-lifestyle"><div class="mx-heading"><div><h2>生活记录</h2><p>全部已保存的饮食与口述活动</p></div><p class="mx-section-total">${snapshot.lifestyle.length} 条</p></div>${lifestyle}</section>
  <section class="mx-section" id="mx-sources"><div class="mx-heading"><div><h2>资料来源</h2><p>${dateWindow(snapshot.coverage.daily_start,snapshot.coverage.daily_end)} · ${snapshot.coverage.daily_dates} 个已保存日期</p></div></div>
    ${entries(snapshot.source_coverage.map(row => `<li><strong>${esc(row.kind)}</strong><p>${esc(row.status)}</p></li>`), '暂无资料来源。')}
    <p class="mx-caption">${snapshot.coverage.full_history ? '来源已声明完整历史。' : '范围仅覆盖已导入资料。'}刷新页面读取已保存的摘要。</p>
    ${rows.length ? `<details class="mx-disclosure"><summary>查看所选区间的逐日数据</summary><div class="mx-table"><table><thead><tr><th scope="col">日期</th>${Object.values(HEALTH_MEASURES).map(item => `<th scope="col">${item.label}（${item.unit}）</th>`).join('')}<th scope="col">来源</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(row.date)}${row.partial ? ' · 未结束日' : ''}</td>${Object.entries(HEALTH_MEASURES).map(([key,item]) => `<td>${row[key] == null ? '—' : item.value(row[key])}<small> ${esc(statusLabel(row.quality[key]))}</small></td>`).join('')}<td>${esc(row.source)}</td></tr>`).join('')}</tbody></table></div></details>` : ''}
  </section>`;
}
const taskTime=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date)+' 北京时间':'时间待确认';};
export function renderTasks(tasks){return tasks.length?tasks.map(t=>`<article class="mx-task"><p><b>${esc(TASK_STATES[t.status]||'未知状态')}</b> · ${t.intent==='ask'?'提问':'记录'} · ${esc(taskTime(t.createdAt))}</p><p class="mx-task-text">${esc(t.text)}</p>${t.leaseExpired?'<p>处理连接已超时，等待重新接手。</p>':''}${t.status==='queued'?'<p class="mx-caption">已保存任务，等待小护士或助手接手；尚未写入健康主档。</p>':''}${t.reply?`<p class="mx-reply">${esc(t.reply)}</p>`:''}${t.status==='recorded'?'<p class="mx-caption">主档保存与摘要版本已收到对应回执。</p>':''}${t.status==='failed'?`<button data-task-action="retry" data-id="${esc(t.id)}">重试</button>`:''}${['queued','failed'].includes(t.status)?`<button data-task-action="cancel" data-id="${esc(t.id)}">取消待办</button>`:''}</article>`).join(''):'<p class="maixiang-empty">还没有网页任务。</p>';}

export function mountMaixiang(root,{location:loc=root.ownerDocument.defaultView.location,fetchImpl=root.ownerDocument.defaultView.fetch.bind(root.ownerDocument.defaultView)}={}){
 const view=root.ownerDocument.defaultView,$=s=>root.querySelector(s);let snapshot=null,tasks=[],intent='',range='30',metric='steps',garminMetric='sleep_score',authenticated=false,sample=false,pending=null;
 const status=text=>{$('[data-status]').textContent=text;};
 const paint=()=>{const local=$('[data-local-access]');if(local)local.hidden=Boolean(snapshot)||sample;$('[data-board]').innerHTML=sample?renderBoard(SYNTHETIC_BOARD):snapshot?renderSnapshot(snapshot,range,metric,garminMetric):renderBoard(EMPTY_BOARD);$('[data-tasks]').innerHTML=renderTasks(tasks);$('[data-sample]').setAttribute('aria-pressed',String(sample));$('[data-sample]').textContent=sample?'回到我的档案':'看合成样例';};
 async function api(path,options={}){const response=await fetchImpl('/api/maixiang/v1'+path,{credentials:'same-origin',cache:'no-store',redirect:'error',...options});if(response.status===401||response.status===403){authenticated=false;snapshot=null;tasks=[];paint();throw Error('云端本人验证尚未接通；请先通过本机入口查看健康看板。文字仍保留在输入框中。');}const data=await response.json();if(!response.ok)throw Error(data.error||'暂时无法完成，请稍后重试。');return data;}
 async function load(){
  const access=$('[data-access]');
  try{
   const session=await api('/session');
   authenticated=session.authenticated&&session.storageReady;
   if(!authenticated){
    snapshot=null;
    tasks=[];
    paint();
    access.textContent='本人验证已通过，私密存储尚未接通。';
    return;
   }
   const board=await api('/dashboard');
   snapshot=board.snapshot?validateSnapshot(board.snapshot):null;
   paint();
   access.textContent = root.dataset?.preview === 'synthetic'
    ? '布局预览'
    : snapshot ? '本人验证已通过。' : '本人验证已通过，等待接入健康摘要。';
  }catch(error){
   access.textContent=snapshot?'连接暂时中断，以下仍是上次读取的摘要。':error.message;
   return;
  }
  const taskStatus=$('[data-task-status]');
  taskStatus.hidden=true;
  try{
   tasks=(await api('/tasks')).tasks;
   $('[data-tasks]').innerHTML=renderTasks(tasks);
  }catch(error){
   if(!authenticated)access.textContent=error.message;
   taskStatus.textContent='小护士任务暂时无法读取。';
   taskStatus.hidden=false;
  }
 }
 function show(next){intent=next;$('[data-form]').hidden=!next;$('[data-log-kind]').hidden=next!=='log';$('[data-log-operation]').hidden=next!=='log';$('[data-form-title]').textContent=next==='ask'?'问小护士':'记一笔';$('[data-submit]').textContent='保存任务';if(next)$('[data-text]').focus();}
 root.addEventListener('change',event=>{
  if(event.target.matches('[data-operation]'))$('[data-target-label]').hidden=event.target.value==='capture';
  if(event.target.matches('[data-garmin-choice]')&&Object.hasOwn(GARMIN_MEASURES,event.target.value)){
   garminMetric=event.target.value;
   paint();
   $('[data-garmin-choice]')?.focus({preventScroll:true});
  }
 });
 root.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  const {rangeChoice, metricChoice} = button.dataset;
  if (RANGES.some(([value]) => value === rangeChoice)) {
   range = rangeChoice;
   paint();
   $("[data-range-choice='" + range + "']")?.focus({preventScroll:true});
   return;
  }
  if (Object.hasOwn(HEALTH_MEASURES, metricChoice)) {
   metric = metricChoice;
   paint();
   $("[data-metric-choice='" + metric + "']")?.focus({preventScroll:true});
   return;
  }
  if ('open' in button.dataset) show(button.dataset.open);
  if (button.hasAttribute('data-sample')) { sample = !sample; paint(); }
  if (button.hasAttribute('data-refresh')) await load();
  if (!button.dataset.taskAction) return;
  button.disabled = true;
  try {
   await api('/tasks/' + encodeURIComponent(button.dataset.id) + '/' + button.dataset.taskAction, {method:'POST'});
   tasks = (await api('/tasks')).tasks;
   paint();
   status('任务状态已更新。');
  } catch (error) {
   status(error.message);
  } finally {
   button.disabled = false;
  }
 });
 $('[data-form]').addEventListener('submit',async e=>{e.preventDefault();if(!authenticated){status('请先验证本人并接通私密存储，文字保留在输入框中。');return;}const result=createMaixiangTask({intent,kind:intent==='ask'?'question':$('[data-kind]').value,text:$('[data-text]').value,origin:loc.origin});if(!result.ok){status(result.error);return;}const payload={intent:result.task.intent,kind:result.task.kind,text:result.task.text,operation:intent==='log'?$('[data-operation]').value:'capture',target:intent==='log'&&$('[data-operation]').value!=='capture'?$('[data-target]').value.trim()||null:null};if(!pending||Object.entries(payload).some(([k,v])=>pending[k]!==v))pending={id:result.task.id,...payload};$('[data-submit]').disabled=true;try{await api('/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending)});$('[data-text]').value='';pending=null;status('任务已保存，等待处理；尚未入档或答复。');tasks=(await api('/tasks')).tasks;paint();}catch(e){status(e.message);}finally{$('[data-submit]').disabled=false;}});
 try{const mode=JSON.parse(view.localStorage.getItem('zhushi-daji-appearance-v1')||'null')?.mode;root.ownerDocument.documentElement.dataset.theme=mode==='dark'||mode!=='light'&&view.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch{}
 paint();const requested=new URL(loc.href).searchParams.get('intent');show(['ask','log'].includes(requested)?requested:'');load();return ()=>{snapshot=null;tasks=[];};
}
