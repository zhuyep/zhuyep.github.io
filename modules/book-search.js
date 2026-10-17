import {mergeBookFiles} from './book-records.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const kinds = {book: '书籍', chapter: '章节', paper: '论文', report: '报告', thesis: '学位论文', other: '资料'};
const languages = {zh: '中文', en: '英文', fr: '法文'};
const sourceNames = {openalex: 'OpenAlex', hal: 'HAL', crossref: 'Crossref'};
const fileVersions = {submittedVersion: '投稿稿', acceptedVersion: '录用稿', publishedVersion: '出版版', conflict: '来源版本标注不一致', unknown: '版本未标注'};
const external = (url, label, cls = 'secondary-button') => {
  try { const value = new URL(url); if (value.protocol !== 'https:' || value.username || value.password) return ''; }
  catch { return ''; }
  return `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`;
};
function fileLink(file) {
  const label = file.format === 'file' ? '下载全文' : `下载 ${esc(file.format.toUpperCase())}`;
  if (file.source === 'hal' && /^\d{1,12}$/.test(file.sourceId))
    return `<a class="primary-button" href="/api/books/download?source=hal&amp;id=${file.sourceId}" data-book-download="${file.sourceId}">${label}<span aria-hidden="true">↓</span></a>`;
  return external(file.url, label, 'primary-button');
}

export function bookShell() {
  return `<section class="book-room" id="daji-books" aria-label="大吉书房"><header class="book-heading"><div><span class="eyebrow">诸事大吉 · 找书与资料</span><h1>大吉书房<span aria-hidden="true" class="book-seal">读</span></h1><p>搜书名、作者、ISBN，也可以从一个主题开始。</p></div><span class="book-heading-note">书籍 · 论文 · 公开报告</span></header><div class="book-workspace" role="status">正在打开书房……</div></section>`;
}
export function bookCard(item) {
  const citation = [item.authors.join('、'), item.title, item.year].filter(Boolean).join(' · ');
  return `<article class="book-result"><div class="book-result-mark" aria-hidden="true">${esc(kinds[item.kind] || '资料')}</div><div class="book-result-main"><div class="book-meta"><span>${esc(kinds[item.kind] || '资料')}</span><span>${esc(item.year || '年份未标注')}</span>${item.language ? `<span>${esc(languages[item.language] || item.language)}</span>` : ''}<span>${esc(item.sources.map(source => sourceNames[source] || source).join(' / '))}</span><span class="book-access ${item.access === 'download' ? 'has-file' : ''}">${item.downloads.length ? '来源提供下载' : item.access === 'open' ? '开放阅读' : '仅书目信息'}</span></div><h2>${esc(item.title)}</h2><p class="book-authors">${esc(item.authors.join('、') || '作者未标注')}</p>${item.publisher ? `<p class="book-publisher">${esc(item.publisher)}</p>` : ''}<div class="book-result-actions">${item.downloads.map(file => fileLink(file) + `<span class="book-version">${esc(fileVersions[file.version] || fileVersions.unknown)}</span>`).join('')}${item.readUrl ? external(item.readUrl, '在线阅读') : ''}${external(item.sourceUrl, '查看来源', 'book-source-link')}<button class="book-source-link" type="button" data-book-copy="${esc(citation)}">复制书目</button></div>${item.description || item.doi || item.isbn || item.license ? `<details class="book-details"><summary>摘要与出版信息</summary>${item.description ? `<p>${esc(item.description)}</p>` : ''}${item.isbn ? `<p>ISBN：${esc(item.isbn)}</p>` : ''}${item.doi ? `<p>DOI：${esc(item.doi)}</p>` : ''}${item.license ? `<p>来源标注许可：${esc(item.license)}</p>` : ''}</details>` : ''}</div></article>`;
}

export function mergeBookPages(previous, incoming) {
  const merged = new Map();
  for (const item of [...previous, ...incoming]) {
    const key = item.doi || item.id, existing = merged.get(key);
    if (!existing) { merged.set(key, {...item, downloads: [...item.downloads], sources: [...item.sources]}); continue; }
    existing.sources = [...new Set([...existing.sources, ...item.sources])];
    existing.downloads = mergeBookFiles([...existing.downloads, ...item.downloads]);
    for (const field of ['readUrl', 'license', 'isbn', 'description', 'language']) if (!existing[field]) existing[field] = item[field];
    if (existing.downloads.length) existing.access = 'download';
    else if (item.access === 'open') existing.access = 'open';
  }
  return [...merged.values()];
}

export function mountBooks(host) {
  if (location.hostname === 'zhuyep.github.io') {
    host.querySelector('.book-workspace').outerHTML = `<div class="book-empty"><h2>去大吉书房找一找</h2><p>搜索与下载入口在诸事大吉主站提供。</p>${external('https://zhushi-daji-preview.pages.dev/#books', '打开大吉书房', 'primary-button')}</div>`;
    return () => {};
  }
  const lifecycle = new AbortController(); let active;
  let disposed = false, version = 0, items = [], page = 1, hasMore = false, busy = false, searched = false, lastOptions;
  let sources = [], failures = [], notices = [], error = '', checkedAt = '', effectiveQuery = '';
  host.querySelector('.book-workspace').outerHTML = `<div class="book-workspace"><form class="book-search-form" aria-label="搜索书籍与资料"><label class="book-search-input"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m16 16 5 5"/></svg><span class="sr-only">书名、作者、ISBN或主题</span><input name="q" type="search" placeholder="例如：燃气涡轮、管理学、作者或 ISBN" autocomplete="off" required minlength="2" maxlength="160"></label><button class="primary-button red" type="submit">找一找 <span aria-hidden="true">→</span></button><div class="book-filters"><label>资料类型<select name="kind"><option value="all">全部资料</option><option value="book">书籍与章节</option><option value="paper">论文</option><option value="report">报告与学位论文</option></select></label><label>来源<select name="source"><option value="all">全部公开来源</option><option value="openalex">OpenAlex</option><option value="hal">HAL</option><option value="crossref">Crossref</option><option disabled>Z-Library · 待接入</option><option disabled>Anna’s Archive · 待接入</option></select></label><label>语言<select name="language"><option value="all">全部语言</option><option value="zh">中文</option><option value="en">英文</option><option value="fr">法文</option></select></label><label class="book-download-filter"><input type="checkbox" name="files">只看可下载</label></div></form><div class="book-topics" aria-label="试搜一个主题"><span>从这里开始</span>${['航空发动机', '燃气涡轮', '叶轮机械', '管理学', '组织行为学', '项目管理'].map(topic => `<button type="button" data-book-topic="${topic}">${topic}</button>`).join('')}</div><p class="book-live-status" role="status" aria-live="polite"></p><div class="book-results" aria-live="polite" aria-busy="false"></div><section class="book-sources"><div><span class="eyebrow">沿着出处，继续找</span><h2>更多公开入口</h2><p>也可以到这些来源网站直接检索。</p></div><div class="book-source-sites">${external('https://ntrs.nasa.gov/', 'NASA 技术报告')}${external('https://openstax.org/subjects', 'OpenStax 开放教材')}${external('https://arxiv.org/search/', 'arXiv 预印本')}${external('https://www.gutenberg.org/ebooks/', '古腾堡电子书')}</div></section><details class="book-source-settings"><summary>已接入来源与更多书源</summary><div data-book-sources>正在检查来源配置……</div></details><p class="book-file-note">文件由来源网站提供；PDF可能先在浏览器打开，可在阅读器中保存。书目记录不代表有完整电子版。</p></div>`;
  const form = host.querySelector('form'), results = host.querySelector('.book-results'), status = host.querySelector('.book-live-status');
  function draw() {
    if (disposed) return;
    const visible = form.elements.files.checked ? items.filter(item => item.downloads.length) : items;
    results.setAttribute('aria-busy', String(busy));
    form.querySelector('[type=submit]').disabled = busy;
    if (!searched) {
      results.innerHTML = `<div class="book-intro"><span class="book-intro-symbol" aria-hidden="true">阅</span><div><h2>想找的那本书，从这里开始。</h2><p>按书名找版本，按主题找线索。搜索结果会标明来源与可获取方式。</p></div></div>`;
      return;
    }
    const time = checkedAt ? new Intl.DateTimeFormat('zh-CN', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai'}).format(new Date(checkedAt)) : '';
    const note = effectiveQuery && effectiveQuery !== lastOptions?.q ? `同时使用英文主题词“${effectiveQuery}”检索。` : '';
    status.textContent = busy ? '正在检索公开来源，通常需要几秒钟……' : error || (note + (time ? `${time} 读取来源结果。` : ''));
    results.innerHTML = `${failures.length ? `<p class="book-warning" role="status">${esc(failures.map(source => `${source.name}：${source.error}`).join('；'))}。${items.length ? '其余来源的结果如下。' : '可以稍后重试，或使用下方公开入口。'}</p>` : ''}${searched && !error ? `<div class="book-result-count"><h2>“${esc(lastOptions?.q || '')}”</h2><span>已找到 ${items.length} 条${form.elements.files.checked ? ` · 可下载 ${visible.length} 条` : ''}${busy ? ' · 继续读取中' : ''}</span></div>` : ''}${notices.length ? `<p class="book-warning">${esc(notices.join('；'))}。</p>` : ''}${visible.map(bookCard).join('')}${!visible.length ? busy ? '<div class="book-empty"><span class="book-loading" aria-hidden="true"></span><h2>正在找书与资料</h2><p>逐个读取所选来源，请稍等片刻。</p></div>' : `<div class="book-empty"><h2>${error ? '这次暂时没有连上来源' : items.length ? '本页暂未找到可直接下载的文件' : '暂时没有找到匹配资料'}</h2><p>${error ? '可以重试，或到下方来源网站检索。' : items.length ? '可以取消“只看可下载”，查看书目与在线阅读线索，或继续加载。' : '试试作者、英文书名或更简短的主题词，也可以调整类型与语言。'}</p>${error ? '<button type="button" class="secondary-button" data-book-retry>重新检索</button>' : ''}</div>` : ''}${hasMore ? `<button type="button" class="book-load-more secondary-button" data-book-more ${busy ? 'disabled' : ''}>${busy ? '正在读取……' : '继续找更多结果'}</button>` : ''}`;
  }
  async function search(append = false) {
    if (busy && append) return;
    const next = append ? {...lastOptions, page: String(page + 1)} : {q: form.elements.q.value.trim(), kind: form.elements.kind.value, source: form.elements.source.value, language: form.elements.language.value, page: '1'};
    if (next.q.length < 2) { form.elements.q.focus(); return; }
    const id = ++version; active?.abort(); active = new AbortController();
    if (!append) { items = []; page = 1; hasMore = false; failures = []; notices = []; checkedAt = ''; effectiveQuery = ''; }
    lastOptions = {...next}; searched = true; busy = true; error = ''; draw();
    try {
      const response = await fetch('/api/books/search?' + new URLSearchParams(next), {signal: active.signal, cache: 'no-store'});
      const data = await response.json();
      if (disposed || id !== version) return;
      failures = (data.sources || []).filter(source => source.status !== 'ok');
      notices = (data.sources || []).filter(source => source.warning).map(source => `${source.name}：${source.warning}`);
      if (!response.ok) throw Error(data.error || '来源暂时没有响应');
      const incoming = data.items || [];
      items = append ? mergeBookPages(items, incoming) : incoming;
      page = data.page; hasMore = data.hasMore; checkedAt = data.checkedAt; effectiveQuery = data.effectiveQuery;
    } catch (failure) {
      if (disposed || id !== version || failure.name === 'AbortError') return;
      error = failure.message || '这次暂时未能读取结果';
    } finally {
      if (!disposed && id === version) { busy = false; draw(); }
    }
  }
  form.addEventListener('submit', event => {event.preventDefault(); search();}, {signal: lifecycle.signal});
  form.elements.files.addEventListener('change', draw, {signal: lifecycle.signal});
  host.addEventListener('click', async event => {
    const link = event.target.closest('[data-book-download]');
    if (!link) return;
    event.preventDefault();
    if (link.getAttribute('aria-busy') === 'true') return;
    link.setAttribute('aria-busy', 'true');
    const label = link.innerHTML; link.textContent = '正在准备文件……';
    status.textContent = '正在从来源获取PDF，请稍等片刻……';
    try {
      const response = await fetch(link.href, {signal: lifecycle.signal, cache: 'no-store'});
      if (!response.ok) { const data = await response.json(); throw Error(data.error || '暂时未能取得文件'); }
      if (!response.headers.get('content-type')?.includes('application/pdf')) throw Error('来源暂未返回PDF');
      const blob = await response.blob();
      if (disposed) return;
      const disposition = response.headers.get('content-disposition') || '';
      let filename = 'hal-' + link.dataset.bookDownload + '.pdf';
      try { const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]; if (encoded) filename = decodeURIComponent(encoded); } catch {}
      const objectUrl = URL.createObjectURL(blob), save = document.createElement('a');
      save.href = objectUrl; save.download = filename; document.body.append(save); save.click(); save.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      status.textContent = '文件已交给浏览器保存，请查看下载列表。';
    } catch (failure) {
      if (!disposed && failure.name !== 'AbortError') status.textContent = (failure.message || '下载传输中断') + '。也可以使用该条资料的“在线阅读”或“查看来源”前往原站获取。';
    } finally { if (!disposed) { link.innerHTML = label; link.removeAttribute('aria-busy'); } }
  }, {signal: lifecycle.signal});
  host.addEventListener('click', async event => {
    const target = event.target.closest('button'); if (!target) return;
    if (target.dataset.bookTopic) { form.elements.q.value = target.dataset.bookTopic; search(); }
    if (target.hasAttribute('data-book-more')) search(true);
    if (target.hasAttribute('data-book-retry')) search();
    if (target.hasAttribute('data-book-copy')) {
      try { await navigator.clipboard.writeText(target.dataset.bookCopy); status.textContent = '书目信息已复制'; }
      catch { status.textContent = '浏览器未允许复制，可以选中书名与作者手动复制。'; }
    }
  }, {signal: lifecycle.signal});
  fetch('/api/books/sources', {signal: lifecycle.signal, cache: 'no-store'}).then(response => {
    if (!response.ok) throw Error(); return response.json();
  }).then(data => {
    if (disposed) return;
    sources = data.sources;
    host.querySelector('[data-book-sources]').innerHTML = sources.map(source => `<p><strong>${esc(source.name)}</strong><span>${esc(source.description)}</span><small>${source.available ? '已接入' : '待接入'}</small></p>`).join('');
  }).catch(() => {
    if (!disposed) host.querySelector('[data-book-sources]').textContent = '来源配置暂时未能读取，仍可尝试搜索。';
  });
  draw();
  return () => { disposed = true; version++; lifecycle.abort(); active?.abort(); };
}
