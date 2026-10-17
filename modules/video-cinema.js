const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let names = {};
const collections = {recent: '新近电影', hot: '热门电影', tv: '热门剧集', rated: '高分佳片'};
const plain = value => value.replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();

export function cinemaShell() {
  return `<section class="cinema" id="daji-cinema" aria-label="大吉放映室"><header class="cinema-heading"><div><span class="eyebrow">光影小憩 · 电影与剧集</span><h1>大吉放映室<span class="cinema-stub" aria-hidden="true">映</span></h1><p>搜一部片，留一点好时光。</p></div><span class="cinema-heading-note">诸事大吉 · 私人放映室</span></header><p class="cinema-message" role="status">正在打开影院……</p></section>`;
}

export function mountCinema(host) {
  if (location.hostname === 'zhuyep.github.io') {
    host.innerHTML += '<div class="cinema-door"><h2>去影院坐坐</h2><p>在线搜索和观看在诸事大吉主站提供。</p><a class="primary-button" href="https://zhushi-daji-preview.pages.dev/#video">打开大吉放映室 ↗</a></div>';
    return () => {};
  }
  const lifecycle = new AbortController();
  let disposed = false, verified = false, configured = true, busy = false, message = '', requestId = 0;
  let detail = null, episodeIndex = 0, stopPlayer = () => {}, playVersion = 0, pending;
  const state = {query: '', list: [], failures: [], selected: null};
  let collection = 'recent', discoveryData, discoveryBusy = true, discoveryError = '', homeRequestId = 0;
  try { localStorage.removeItem('zhushi-daji-cinema-v1'); } catch {}

  async function api(path, options = {}) {
    const response = await fetch('/api/video/' + path, {credentials: 'same-origin', cache: 'no-store', ...options});
    let data; try { data = await response.json(); } catch { throw Error('影院暂时没有响应，请稍后再试'); }
    if (!response.ok) {
      if (response.status === 401) { verified = false; stopPlayer(); detail = null; }
      throw Error(data.error || (data.failures?.length ? '片源暂时没有响应，请稍后重试或更换来源' : '暂时未能打开，请稍后再试'));
    }
    return data;
  }
  function groups() {
    const grouped = new Map();
    for (const item of state.list) {
      const key = plain(item.name) + ':' + item.year;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }
    return [...grouped.values()];
  }
  function homeMarkup() {
    const items = discoveryData?.items || [];
    const featureIndex = Math.max(0, items.findIndex(item => Number(item.rating) >= 7));
    const featured = items[featureIndex];
    const updated = discoveryData?.updatedAt ? new Intl.DateTimeFormat('zh-CN', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai'}).format(new Date(discoveryData.updatedAt)) : '';
    return `<section class="cinema-discovery" aria-label="影片推荐"><div class="cinema-discovery-top"><div><span class="eyebrow">给自己留一点好时光</span><h2>今晚，放映什么？</h2></div><p>从近期片单开始，或搜一部一直想看的片。</p></div><nav class="cinema-collections" aria-label="推荐片单">${Object.entries(collections).map(([key, title]) => `<button data-cinema-collection="${key}" aria-pressed="${key === collection}">${title}</button>`).join('')}</nav><div class="cinema-discovery-meta"><span>${discoveryData ? `豆瓣 · ${esc(collections[collection])} · ${esc(updated)}更新${discoveryData.stale ? '（最近可用片单）' : ''}` : '正在读取近期片单'}</span><span>点影片，搜索观看来源</span></div>${discoveryBusy ? '<div class="cinema-recommend-loading" role="status">正在挑选片单……</div>' : discoveryError ? `<p class="cinema-warning" role="status">${esc(discoveryError)} <button data-cinema-retry>重新读取</button></p>` : `${featured ? `<div class="cinema-feature"><div class="cinema-feature-copy"><span class="eyebrow">${esc(collections[collection])} · 本期一瞥</span><h3>${esc(featured.name)}</h3><p>${featured.rating ? `豆瓣 ${esc(featured.rating)} 分 · ` : ''}看看故事简介，再选一个来源开始放映。</p><button class="primary-button" data-cinema-recommend="${featureIndex}">搜片观看 <span aria-hidden="true">↗</span></button><a href="${esc(featured.subjectUrl)}" target="_blank" rel="noopener noreferrer">在豆瓣了解这部${collection === 'tv' ? '剧' : '电影'} ↗</a></div><button class="cinema-feature-poster" data-cinema-recommend="${featureIndex}" aria-label="搜片观看：${esc(featured.name)}"><span aria-hidden="true">映</span>${featured.cover ? `<img src="${esc(featured.cover)}" alt="${esc(featured.name)}" fetchpriority="high">` : ''}</button></div>` : ''}<div class="cinema-grid cinema-recommendations">${items.map((item, i) => `<button class="cinema-card" data-cinema-recommend="${i}" aria-label="搜片观看：${esc(item.name)}"><span class="cinema-poster"><span aria-hidden="true">大吉放映</span>${item.cover ? `<img src="${esc(item.cover)}" alt="${esc(item.name)}" loading="lazy">` : ''}${item.rating ? `<small class="cinema-rating">豆瓣 ${esc(item.rating)}</small>` : '<small>暂无评分</small>'}</span><strong>${esc(item.name)}</strong><span class="cinema-card-note">搜片观看 <i aria-hidden="true">↗</i></span></button>`).join('')}</div><p class="cinema-list-note">片单来自豆瓣，顺序与评分随来源更新。推荐不代表已找到可播来源。</p>`}</section>`;
  }
  function refreshDiscovery() {
    const target = host.querySelector('[data-cinema-discovery]');
    if (!disposed && target) target.innerHTML = homeMarkup();
  }
  async function loadDiscovery(key) {
    const id = ++homeRequestId; collection = key; discoveryError = '';
    discoveryBusy = true; discoveryData = null; refreshDiscovery();
    try {
      const result = await api('discover?' + new URLSearchParams({collection: key}), {signal: lifecycle.signal});
      if (disposed || id !== homeRequestId) return;
      discoveryData = result;
    } catch (error) { if (disposed || id !== homeRequestId) return; discoveryError = '片单暂时没有响应，仍可输入片名搜索。'; }
    if (!disposed && id === homeRequestId) { discoveryBusy = false; refreshDiscovery(); }
  }
  function resultMarkup() {
    if (busy) return '<div class="cinema-empty" role="status"><span class="cinema-reel" aria-hidden="true">◉</span><h2>正在搜片</h2><p>逐个查询已选来源，请稍等片刻。</p></div>';
    if (!verified || !state.query) return `<div data-cinema-discovery>${homeMarkup()}</div>`;
    const grouped = groups();
    return `${state.failures.length ? `<p class="cinema-warning" role="status">${esc(state.failures.join('、'))}暂时未能响应，已展示其余来源的结果。</p>` : ''}<div class="cinema-result-heading"><h2>“${esc(state.query)}”</h2><button class="text-button" data-cinema-home>← 回到片单</button><span>${grouped.length}部 · ${state.list.length}条结果</span></div>${!grouped.length ? '<div class="cinema-empty"><h2>暂时没有找到</h2><p>试试片名简称，或勾选其他来源后重新搜索。</p></div>' : `<div class="cinema-grid">${grouped.map((items, i) => { const item = items[0]; return `<button class="cinema-card" data-cinema-open="${i}" aria-label="选集观看：${esc(item.name)}，${esc(item.year)}，${items.length}个来源"><span class="cinema-poster"><span aria-hidden="true">光影</span>${item.cover ? `<img src="${esc(item.cover)}" alt="${esc(item.name)}" loading="lazy" referrerpolicy="no-referrer">` : ''}<small>${items.length}个来源</small></span><strong>${esc(item.name)}</strong><span class="cinema-card-meta">${esc(item.year || '年份未标注')} · ${esc(item.type || '影视')}</span><span class="cinema-card-note">${esc(item.remarks)} <i aria-hidden="true">↗</i></span></button>`; }).join('')}</div>`}`;
  }
  function playerMarkup() {
    if (!detail) return '';
    if (detail.loading) return '<section class="cinema-player-panel"><p role="status">正在打开剧集信息……</p><button class="text-button" data-cinema-back>← 返回搜索结果</button></section>';
    const alternatives = state.list.filter(v => plain(v.name) === plain(detail.name) && v.year === detail.year);
    return `<section class="cinema-player-panel" aria-label="${esc(detail.name)}播放器"><header><button class="text-button" data-cinema-back>← 返回搜索结果</button><span>${esc(detail.sourceName)} · 第${episodeIndex + 1}/${detail.episodes.length}集</span></header><h2>${esc(detail.name)}</h2><div class="cinema-screen"><video controls playsinline preload="metadata" crossorigin="anonymous" aria-label="${esc(detail.name)}视频"></video></div><p class="cinema-play-error" role="alert" hidden></p><div class="cinema-play-actions"><button class="secondary-button" data-cinema-previous ${episodeIndex <= 0 ? 'disabled' : ''}>上一集</button><button class="primary-button" data-cinema-next ${episodeIndex >= detail.episodes.length - 1 ? 'disabled' : ''}>下一集</button><span>支持全屏、拖动与倍速</span></div><div class="cinema-alternatives"><span>换个来源</span>${alternatives.map((v, i) => `<button data-cinema-source="${i}" aria-pressed="${v.sourceKey === detail.sourceKey}">${esc(v.sourceName)}</button>`).join('') || `<span>${esc(detail.sourceName)}</span>`}</div><details class="cinema-episodes" open><summary>剧集列表 · ${detail.episodes.length}集</summary><div>${detail.episodes.map((e, i) => `<button data-cinema-episode="${i}" aria-label="播放第${i + 1}集" aria-pressed="${i === episodeIndex}">${esc(e.name || String(i + 1))}</button>`).join('')}</div></details></section>`;
  }
  function draw() {
    if (disposed) return;
    const sourceCount = Object.keys(names).length;
    host.innerHTML = `<header class="cinema-heading"><div><span class="eyebrow">诸事大吉 · 电影与剧集</span><h1>大吉放映室<span class="cinema-stub" aria-hidden="true">映</span></h1><p>忙完诸事，放映一段好时光。</p></div>${verified ? '<button class="text-button" data-cinema-logout>退出观影</button>' : '<span class="cinema-heading-note">你的私人放映室</span>'}</header><form class="cinema-search" data-cinema-search><label for="cinema-query">找一部想看的片</label><div class="cinema-search-line"><input id="cinema-query" type="search" value="${esc(state.query)}" maxlength="80" placeholder="输入电影、电视剧名称" required autocomplete="off"><button class="primary-button" type="submit" ${busy || !sourceCount ? 'disabled' : ''}>${busy ? '搜索中…' : '搜片'}</button></div><details class="cinema-source-picker"><summary>${sourceCount}个片源 · 调整搜索来源</summary><fieldset><legend>搜索来源</legend>${Object.entries(names).map(([key, name]) => `<label><input type="checkbox" data-cinema-filter="${key}" ${state.selected?.includes(key) ? 'checked' : ''}>${esc(name)}</label>`).join('')}</fieldset></details></form>${!verified ? `<section class="cinema-door cinema-door-compact"><span class="cinema-door-mark" aria-hidden="true">映</span><div><h2>${configured ? '输入密码，开始放映' : '观影服务暂时不可用'}</h2><p>${configured ? '片单可以直接浏览，搜索和播放沿用此前的观影密码。' : '可以先浏览片单，稍后刷新再试。'}</p>${configured ? '<form data-cinema-login><label for="cinema-password">观影密码</label><div><input id="cinema-password" type="password" placeholder="输入观影密码" aria-describedby="cinema-password-hint" autocomplete="current-password" required maxlength="200"><button class="primary-button" type="submit">进入放映室</button></div><p id="cinema-password-hint" class="cinema-password-hint">看片不迷路，<strong>密码找老猪。</strong></p></form>' : ''}</div></section>` : ''}<p class="cinema-message" role="alert">${esc(message)}</p><div class="cinema-content">${detail ? playerMarkup() : resultMarkup()}</div><p class="cinema-footnote">影片来自所选第三方来源，清晰度和可播情况会有变化。不保留播放历史和进度。启用管理统计后，影院访问与搜索词仅管理员可见，展示近30天，过期明细在后续访问或管理查询时清理。<a href="https://github.com/LibreSpark/LibreTV" target="_blank" rel="noopener noreferrer">灵感来自LibreTV ↗</a></p>`;
  }
  async function search(query) {
    query = query.trim(); if (!query || !state.selected?.length) { message = '请输入片名，并至少勾选一个来源'; draw(); return; }
    if (!verified) { state.query = query; message = `输入观影密码后，为你搜索“${query}”`; draw(); host.querySelector('#cinema-password')?.focus(); return; }
    pending?.abort(); pending = new AbortController(); const id = ++requestId;
    stopPlayer(); detail = null; state.query = query; busy = true; message = ''; draw();
    try {
      const response = await api('search?' + new URLSearchParams({q: query, sources: state.selected.join(',')}), {signal: pending.signal});
      if (disposed || id !== requestId) return;
      state.list = response.list; state.failures = response.failures;
    } catch (error) { if (id !== requestId || disposed || error.name === 'AbortError') return; state.list = []; state.failures = []; message = error.message; }
    if (id === requestId && !disposed) { busy = false; draw(); }
  }
  async function open(item, index = 0) {
    stopPlayer(); const id = ++requestId; message = ''; detail = {loading: true}; draw();
    try {
      const next = await api('detail?' + new URLSearchParams({source: item.sourceKey, id: item.id}));
      if (disposed || id !== requestId) return;
      detail = next; episodeIndex = Math.min(Math.max(index, 0), detail.episodes.length - 1); draw(); startPlayer();
    } catch (error) { if (!disposed && id === requestId) { detail = null; message = error.message; draw(); } }
  }
  function startPlayer() {
    const video = host.querySelector('video'), current = detail, index = episodeIndex, version = ++playVersion;
    const episode = current.episodes[index]; let hls;
    const error = () => { const el = host.querySelector('.cinema-play-error'); if (el && version === playVersion) { el.hidden = false; el.textContent = '这个来源暂时无法播放，试试下方的其他来源。'; } };
    video.addEventListener('loadedmetadata', () => { video.play().catch(() => {}); }, {once: true});
    video.addEventListener('error', error);
    video.addEventListener('ended', () => { if (index < current.episodes.length - 1 && version === playVersion) changeEpisode(index + 1); });
    stopPlayer = () => { ++playVersion; video.pause(); hls?.destroy(); video.removeAttribute('src'); video.load(); stopPlayer = () => {}; };
    if (!/\.m3u8(?:[?#]|$)/i.test(episode.url) || video.canPlayType('application/vnd.apple.mpegurl')) { video.src = episode.url; return; }
    const hlsPath = '/vendor/hls.light.mjs';
    import(hlsPath).then(({default: Hls}) => {
      if (disposed || version !== playVersion || !video.isConnected) return;
      if (!Hls.isSupported()) { error(); return; }
      hls = new Hls({maxBufferLength: 30, backBufferLength: 30, maxMaxBufferLength: 60, enableWorker: true});
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) error(); });
      hls.loadSource(episode.url); hls.attachMedia(video);
    }).catch(error);
  }
  function changeEpisode(index) { stopPlayer(); episodeIndex = index; draw(); startPlayer(); }
  host.addEventListener('submit', async event => {
    event.preventDefault();
    if (event.target.matches('[data-cinema-search]')) { search(host.querySelector('#cinema-query').value); return; }
    if (event.target.matches('[data-cinema-login]')) {
      const submit = event.target.querySelector('button'); submit.disabled = true;
      try { await api('auth', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password: host.querySelector('#cinema-password').value})}); if (disposed) return; verified = true; message = ''; if (state.query) search(state.query); else draw(); }
      catch (error) { if (!disposed) { message = error.message; draw(); } }
    }
  }, {signal: lifecycle.signal});
  host.addEventListener('click', async event => {
    const b = event.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-cinema-open')) { const item = groups()[Number(b.dataset.cinemaOpen)]?.[0]; if (item) open(item); }
    if (b.hasAttribute('data-cinema-collection')) loadDiscovery(b.dataset.cinemaCollection);
    if (b.hasAttribute('data-cinema-retry')) loadDiscovery(collection);
    if (b.hasAttribute('data-cinema-recommend')) { const item = discoveryData?.items[Number(b.dataset.cinemaRecommend)]; if (item) search(item.name); }
    if (b.hasAttribute('data-cinema-home')) { pending?.abort(); ++requestId; busy = false; stopPlayer(); detail = null; state.query = ''; message = ''; draw(); }
    if (b.hasAttribute('data-cinema-example')) search(b.dataset.cinemaExample);
    if (b.hasAttribute('data-cinema-back')) { stopPlayer(); ++requestId; detail = null; draw(); }
    if (b.hasAttribute('data-cinema-episode')) changeEpisode(Number(b.dataset.cinemaEpisode));
    if (b.hasAttribute('data-cinema-next')) changeEpisode(episodeIndex + 1);
    if (b.hasAttribute('data-cinema-previous')) changeEpisode(episodeIndex - 1);
    if (b.hasAttribute('data-cinema-source')) { const alternatives = state.list.filter(v => plain(v.name) === plain(detail.name) && v.year === detail.year); const item = alternatives[Number(b.dataset.cinemaSource)]; if (item) open(item, episodeIndex); }
    if (b.hasAttribute('data-cinema-logout')) { try { await api('auth', {method: 'DELETE'}); } finally { if (!disposed) { pending?.abort(); ++requestId; busy = false; stopPlayer(); verified = false; detail = null; state.query = ''; message = ''; draw(); } } }
  }, {signal: lifecycle.signal});
  host.addEventListener('change', event => {
    if (!event.target.hasAttribute('data-cinema-filter')) return;
    const key = event.target.dataset.cinemaFilter;
    state.query = host.querySelector('#cinema-query').value;
    state.selected = event.target.checked ? [...new Set([...state.selected, key])] : state.selected.filter(v => v !== key);
  }, {signal: lifecycle.signal});
  host.addEventListener('error', event => { if (event.target.tagName === 'IMG') event.target.remove(); }, {capture: true, signal: lifecycle.signal});
  api('status').then(status => { if (!disposed) { configured = status.configured; verified = status.verified; names = Object.fromEntries((status.sources || []).map(v => [v.key, v.name])); state.selected = state.selected === null ? Object.keys(names) : state.selected.filter(key => names[key]); draw(); } }).catch(() => { if (!disposed) { configured = false; message = '请稍后刷新重试'; draw(); } });
  api('visit', {method: 'POST'}).catch(() => {});
  loadDiscovery('recent');
  return () => { disposed = true; ++requestId; pending?.abort(); stopPlayer(); lifecycle.abort(); };
}
