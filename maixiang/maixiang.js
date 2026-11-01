// 脉象 mount. The static shell may be copied to Pages and the GitHub mirror.
// It must not contain personal health details. Notes stay in this tab's
// sessionStorage and in a same-page event for a later Grok Bot handoff.
// Do not POST notes, do not report visits, and do not render API bodies:
// /api/maixiang/v1/* stays 401 until an auth-gated store exists.
export const MAIXIANG_EVENT = 'zhushi:maixiang';
export const QUEUE_KEY = 'zhushi-daji-maixiang-queue-v1';
export const TASK_CONTRACT = 'maixiang.task.v1';
const LOG_KINDS = [['movement', '走动'], ['meal', '饮食'], ['rest', '休息'], ['note', '其他']];

export const EMPTY_BOARD = {
  synthetic: false,
  nearTerm: '私人档案还未接通。',
  focus: [],
  nextStep: '先记一笔今天的走动、饮食或休息，或问小护士一句。文字只留在这个标签页，不会上传。'
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
        storage: 'session-preview',
        api: {method: 'POST', path: '/api/maixiang/v1/tasks', status: 'auth-required'}
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

const KIND_LABEL = Object.fromEntries([...LOG_KINDS, ['question', '提问']]);

export function mountMaixiang(root, {
  location: pageLocation = root.ownerDocument?.defaultView?.location,
  storage = root.ownerDocument?.defaultView?.sessionStorage,
  fetchImpl = root.ownerDocument?.defaultView?.fetch?.bind(root.ownerDocument.defaultView),
  dispatch = (task, view) => view.dispatchEvent(new view.CustomEvent(MAIXIANG_EVENT, {detail: task}))
} = {}) {
  const view = root.ownerDocument.defaultView;
  const doc = root.ownerDocument;
  let board = EMPTY_BOARD;
  let intent = '';
  try {
    const requested = new URL(pageLocation.href).searchParams.get('intent');
    if (requested === 'log' || requested === 'ask') intent = requested;
  } catch { intent = ''; }
  const paint = () => {
    root.querySelector('[data-board]').innerHTML = renderBoard(board);
    root.querySelector('[data-sample]').textContent = board.synthetic ? '回到空态' : '看合成样例';
    root.querySelector('[data-sample]').setAttribute('aria-pressed', String(board.synthetic));
  };
  const showForm = next => {
    intent = next;
    const form = root.querySelector('[data-form]');
    form.hidden = !next;
    root.querySelector('[data-log-kind]').hidden = next !== 'log';
    root.querySelector('[data-form-title]').textContent = next === 'ask' ? '问小护士' : '记一笔';
    root.querySelector('[data-submit]').textContent = next === 'ask' ? '交给小护士' : '记下';
    const field = root.querySelector('[data-text]');
    field.placeholder = next === 'ask' ? '想问的一句，例如：晚饭后走一走合适吗？' : '今天的走动、饮食或休息，一句就好。';
    if (next) field.focus();
  };
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !root.contains(button)) return;
    if ('open' in button.dataset) showForm(button.dataset.open);
    if (button.hasAttribute('data-sample')) {
      board = board.synthetic ? EMPTY_BOARD : SYNTHETIC_BOARD;
      paint();
    }
  });
  root.querySelector('[data-form]').addEventListener('submit', event => {
    event.preventDefault();
    const kind = intent === 'ask' ? 'question' : root.querySelector('[data-kind]').value;
    const result = createMaixiangTask({intent, kind, text: root.querySelector('[data-text]').value, origin: pageLocation.origin});
    const status = root.querySelector('[data-status]');
    if (!result.ok) { status.textContent = result.error; return; }
    let count;
    try { count = rememberTask(storage, result.task); }
    catch { status.textContent = '这个标签页暂时存不下，请把这句话留在输入框里。'; return; }
    try { dispatch(result.task, view); } catch { /* the queue still holds the task */ }
    root.querySelector('[data-text]').value = '';
    status.textContent = `已收下这句${KIND_LABEL[kind] || ''}。共 ${count} 条留在这个标签页，没有上传，也不会进入搜索或访问统计。`;
    try { view.history.replaceState(null, '', '/maixiang/'); } catch { /* keep the current address */ }
  });
  paint();
  showForm(intent);
  const access = root.querySelector('[data-access]');
  probeMaixiangApi(fetchImpl).then(state => {
    if (!root.isConnected) return;
    access.textContent = state === 'locked'
      ? '私人档案需要登录后才打开。当前接口拒绝匿名读取，页面不会展示返回内容。'
      : '档案接口未开放。这里只保留空态，或一页标明的合成样例。';
  });
  try {
    const saved = JSON.parse(view.localStorage.getItem('zhushi-daji-appearance-v1') || 'null');
    const mode = saved?.mode;
    const dark = mode === 'dark' || (mode !== 'light' && view.matchMedia?.('(prefers-color-scheme: dark)').matches);
    doc.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch { /* keep the light paper */ }
  return () => {};
}
