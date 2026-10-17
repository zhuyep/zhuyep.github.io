// demo/modules/book-records.js
var known = (value) => ["submittedVersion", "acceptedVersion", "publishedVersion"].includes(value);
function mergeBookFiles(files) {
  const merged = /* @__PURE__ */ new Map();
  for (const file of files) {
    const previous = merged.get(file.url);
    const versions = [...new Set([...previous?.versions || [], ...file.versions || [], previous?.version, file.version].filter(known))];
    const format = previous?.format && previous.format !== "file" ? previous.format : file.format;
    merged.set(file.url, {
      ...previous || file,
      format,
      versions,
      ...previous?.source || file.source ? { source: previous?.source || file.source, sourceId: previous?.sourceId || file.sourceId } : {},
      version: versions.length > 1 ? "conflict" : versions[0] || "unknown"
    });
  }
  return [...merged.values()];
}

// demo/modules/book-search.js
var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var kinds = { book: "\u4E66\u7C4D", chapter: "\u7AE0\u8282", paper: "\u8BBA\u6587", report: "\u62A5\u544A", thesis: "\u5B66\u4F4D\u8BBA\u6587", other: "\u8D44\u6599" };
var languages = { zh: "\u4E2D\u6587", en: "\u82F1\u6587", fr: "\u6CD5\u6587" };
var sourceNames = { openalex: "OpenAlex", hal: "HAL", crossref: "Crossref" };
var fileVersions = { submittedVersion: "\u6295\u7A3F\u7A3F", acceptedVersion: "\u5F55\u7528\u7A3F", publishedVersion: "\u51FA\u7248\u7248", conflict: "\u6765\u6E90\u7248\u672C\u6807\u6CE8\u4E0D\u4E00\u81F4", unknown: "\u7248\u672C\u672A\u6807\u6CE8" };
var external = (url, label, cls = "secondary-button") => {
  try {
    const value = new URL(url);
    if (value.protocol !== "https:" || value.username || value.password) return "";
  } catch {
    return "";
  }
  return `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">\u2197</span></a>`;
};
function fileLink(file) {
  const label = file.format === "file" ? "\u4E0B\u8F7D\u5168\u6587" : `\u4E0B\u8F7D ${esc(file.format.toUpperCase())}`;
  if (file.source === "hal" && /^\d{1,12}$/.test(file.sourceId))
    return `<a class="primary-button" href="/api/books/download?source=hal&amp;id=${file.sourceId}" data-book-download="${file.sourceId}">${label}<span aria-hidden="true">\u2193</span></a>`;
  return external(file.url, label, "primary-button");
}
function bookShell() {
  return `<section class="book-room" id="daji-books" aria-label="\u5927\u5409\u4E66\u623F"><header class="book-heading"><div><span class="eyebrow">\u8BF8\u4E8B\u5927\u5409 \xB7 \u627E\u4E66\u4E0E\u8D44\u6599</span><h1>\u5927\u5409\u4E66\u623F<span aria-hidden="true" class="book-seal">\u8BFB</span></h1><p>\u641C\u4E66\u540D\u3001\u4F5C\u8005\u3001ISBN\uFF0C\u4E5F\u53EF\u4EE5\u4ECE\u4E00\u4E2A\u4E3B\u9898\u5F00\u59CB\u3002</p></div><span class="book-heading-note">\u4E66\u7C4D \xB7 \u8BBA\u6587 \xB7 \u516C\u5F00\u62A5\u544A</span></header><div class="book-workspace" role="status">\u6B63\u5728\u6253\u5F00\u4E66\u623F\u2026\u2026</div></section>`;
}
function bookCard(item) {
  const citation = [item.authors.join("\u3001"), item.title, item.year].filter(Boolean).join(" \xB7 ");
  return `<article class="book-result"><div class="book-result-mark" aria-hidden="true">${esc(kinds[item.kind] || "\u8D44\u6599")}</div><div class="book-result-main"><div class="book-meta"><span>${esc(kinds[item.kind] || "\u8D44\u6599")}</span><span>${esc(item.year || "\u5E74\u4EFD\u672A\u6807\u6CE8")}</span>${item.language ? `<span>${esc(languages[item.language] || item.language)}</span>` : ""}<span>${esc(item.sources.map((source) => sourceNames[source] || source).join(" / "))}</span><span class="book-access ${item.access === "download" ? "has-file" : ""}">${item.downloads.length ? "\u6765\u6E90\u63D0\u4F9B\u4E0B\u8F7D" : item.access === "open" ? "\u5F00\u653E\u9605\u8BFB" : "\u4EC5\u4E66\u76EE\u4FE1\u606F"}</span></div><h2>${esc(item.title)}</h2><p class="book-authors">${esc(item.authors.join("\u3001") || "\u4F5C\u8005\u672A\u6807\u6CE8")}</p>${item.publisher ? `<p class="book-publisher">${esc(item.publisher)}</p>` : ""}<div class="book-result-actions">${item.downloads.map((file) => fileLink(file) + `<span class="book-version">${esc(fileVersions[file.version] || fileVersions.unknown)}</span>`).join("")}${item.readUrl ? external(item.readUrl, "\u5728\u7EBF\u9605\u8BFB") : ""}${external(item.sourceUrl, "\u67E5\u770B\u6765\u6E90", "book-source-link")}<button class="book-source-link" type="button" data-book-copy="${esc(citation)}">\u590D\u5236\u4E66\u76EE</button></div>${item.description || item.doi || item.isbn || item.license ? `<details class="book-details"><summary>\u6458\u8981\u4E0E\u51FA\u7248\u4FE1\u606F</summary>${item.description ? `<p>${esc(item.description)}</p>` : ""}${item.isbn ? `<p>ISBN\uFF1A${esc(item.isbn)}</p>` : ""}${item.doi ? `<p>DOI\uFF1A${esc(item.doi)}</p>` : ""}${item.license ? `<p>\u6765\u6E90\u6807\u6CE8\u8BB8\u53EF\uFF1A${esc(item.license)}</p>` : ""}</details>` : ""}</div></article>`;
}
function mergeBookPages(previous, incoming) {
  const merged = /* @__PURE__ */ new Map();
  for (const item of [...previous, ...incoming]) {
    const key = item.doi || item.id, existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...item, downloads: [...item.downloads], sources: [...item.sources] });
      continue;
    }
    existing.sources = [.../* @__PURE__ */ new Set([...existing.sources, ...item.sources])];
    existing.downloads = mergeBookFiles([...existing.downloads, ...item.downloads]);
    for (const field of ["readUrl", "license", "isbn", "description", "language"]) if (!existing[field]) existing[field] = item[field];
    if (existing.downloads.length) existing.access = "download";
    else if (item.access === "open") existing.access = "open";
  }
  return [...merged.values()];
}
function mountBooks(host) {
  if (location.hostname === "zhuyep.github.io") {
    host.querySelector(".book-workspace").outerHTML = `<div class="book-empty"><h2>\u53BB\u5927\u5409\u4E66\u623F\u627E\u4E00\u627E</h2><p>\u641C\u7D22\u4E0E\u4E0B\u8F7D\u5165\u53E3\u5728\u8BF8\u4E8B\u5927\u5409\u4E3B\u7AD9\u63D0\u4F9B\u3002</p>${external("https://zhushi-daji-preview.pages.dev/#books", "\u6253\u5F00\u5927\u5409\u4E66\u623F", "primary-button")}</div>`;
    return () => {
    };
  }
  const lifecycle = new AbortController();
  let active;
  let disposed = false, version = 0, items = [], page = 1, hasMore = false, busy = false, searched = false, lastOptions;
  let sources = [], failures = [], notices = [], error = "", checkedAt = "", effectiveQuery = "";
  host.querySelector(".book-workspace").outerHTML = `<div class="book-workspace"><form class="book-search-form" aria-label="\u641C\u7D22\u4E66\u7C4D\u4E0E\u8D44\u6599"><label class="book-search-input"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m16 16 5 5"/></svg><span class="sr-only">\u4E66\u540D\u3001\u4F5C\u8005\u3001ISBN\u6216\u4E3B\u9898</span><input name="q" type="search" placeholder="\u4F8B\u5982\uFF1A\u71C3\u6C14\u6DA1\u8F6E\u3001\u7BA1\u7406\u5B66\u3001\u4F5C\u8005\u6216 ISBN" autocomplete="off" required minlength="2" maxlength="160"></label><button class="primary-button red" type="submit">\u627E\u4E00\u627E <span aria-hidden="true">\u2192</span></button><div class="book-filters"><label>\u8D44\u6599\u7C7B\u578B<select name="kind"><option value="all">\u5168\u90E8\u8D44\u6599</option><option value="book">\u4E66\u7C4D\u4E0E\u7AE0\u8282</option><option value="paper">\u8BBA\u6587</option><option value="report">\u62A5\u544A\u4E0E\u5B66\u4F4D\u8BBA\u6587</option></select></label><label>\u6765\u6E90<select name="source"><option value="all">\u5168\u90E8\u516C\u5F00\u6765\u6E90</option><option value="openalex">OpenAlex</option><option value="hal">HAL</option><option value="crossref">Crossref</option><option disabled>Z-Library \xB7 \u5F85\u63A5\u5165</option><option disabled>Anna\u2019s Archive \xB7 \u5F85\u63A5\u5165</option></select></label><label>\u8BED\u8A00<select name="language"><option value="all">\u5168\u90E8\u8BED\u8A00</option><option value="zh">\u4E2D\u6587</option><option value="en">\u82F1\u6587</option><option value="fr">\u6CD5\u6587</option></select></label><label class="book-download-filter"><input type="checkbox" name="files">\u53EA\u770B\u53EF\u4E0B\u8F7D</label></div></form><div class="book-topics" aria-label="\u8BD5\u641C\u4E00\u4E2A\u4E3B\u9898"><span>\u4ECE\u8FD9\u91CC\u5F00\u59CB</span>${["\u822A\u7A7A\u53D1\u52A8\u673A", "\u71C3\u6C14\u6DA1\u8F6E", "\u53F6\u8F6E\u673A\u68B0", "\u7BA1\u7406\u5B66", "\u7EC4\u7EC7\u884C\u4E3A\u5B66", "\u9879\u76EE\u7BA1\u7406"].map((topic) => `<button type="button" data-book-topic="${topic}">${topic}</button>`).join("")}</div><p class="book-live-status" role="status" aria-live="polite"></p><div class="book-results" aria-live="polite" aria-busy="false"></div><section class="book-sources"><div><span class="eyebrow">\u6CBF\u7740\u51FA\u5904\uFF0C\u7EE7\u7EED\u627E</span><h2>\u66F4\u591A\u516C\u5F00\u5165\u53E3</h2><p>\u4E5F\u53EF\u4EE5\u5230\u8FD9\u4E9B\u6765\u6E90\u7F51\u7AD9\u76F4\u63A5\u68C0\u7D22\u3002</p></div><div class="book-source-sites">${external("https://ntrs.nasa.gov/", "NASA \u6280\u672F\u62A5\u544A")}${external("https://openstax.org/subjects", "OpenStax \u5F00\u653E\u6559\u6750")}${external("https://arxiv.org/search/", "arXiv \u9884\u5370\u672C")}${external("https://www.gutenberg.org/ebooks/", "\u53E4\u817E\u5821\u7535\u5B50\u4E66")}</div></section><details class="book-source-settings"><summary>\u5DF2\u63A5\u5165\u6765\u6E90\u4E0E\u66F4\u591A\u4E66\u6E90</summary><div data-book-sources>\u6B63\u5728\u68C0\u67E5\u6765\u6E90\u914D\u7F6E\u2026\u2026</div></details><p class="book-file-note">\u6587\u4EF6\u7531\u6765\u6E90\u7F51\u7AD9\u63D0\u4F9B\uFF1BPDF\u53EF\u80FD\u5148\u5728\u6D4F\u89C8\u5668\u6253\u5F00\uFF0C\u53EF\u5728\u9605\u8BFB\u5668\u4E2D\u4FDD\u5B58\u3002\u4E66\u76EE\u8BB0\u5F55\u4E0D\u4EE3\u8868\u6709\u5B8C\u6574\u7535\u5B50\u7248\u3002</p></div>`;
  const form = host.querySelector("form"), results = host.querySelector(".book-results"), status = host.querySelector(".book-live-status");
  function draw() {
    if (disposed) return;
    const visible = form.elements.files.checked ? items.filter((item) => item.downloads.length) : items;
    results.setAttribute("aria-busy", String(busy));
    form.querySelector("[type=submit]").disabled = busy;
    if (!searched) {
      results.innerHTML = `<div class="book-intro"><span class="book-intro-symbol" aria-hidden="true">\u9605</span><div><h2>\u60F3\u627E\u7684\u90A3\u672C\u4E66\uFF0C\u4ECE\u8FD9\u91CC\u5F00\u59CB\u3002</h2><p>\u6309\u4E66\u540D\u627E\u7248\u672C\uFF0C\u6309\u4E3B\u9898\u627E\u7EBF\u7D22\u3002\u641C\u7D22\u7ED3\u679C\u4F1A\u6807\u660E\u6765\u6E90\u4E0E\u53EF\u83B7\u53D6\u65B9\u5F0F\u3002</p></div></div>`;
      return;
    }
    const time = checkedAt ? new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" }).format(new Date(checkedAt)) : "";
    const note = effectiveQuery && effectiveQuery !== lastOptions?.q ? `\u540C\u65F6\u4F7F\u7528\u82F1\u6587\u4E3B\u9898\u8BCD\u201C${effectiveQuery}\u201D\u68C0\u7D22\u3002` : "";
    status.textContent = busy ? "\u6B63\u5728\u68C0\u7D22\u516C\u5F00\u6765\u6E90\uFF0C\u901A\u5E38\u9700\u8981\u51E0\u79D2\u949F\u2026\u2026" : error || note + (time ? `${time} \u8BFB\u53D6\u6765\u6E90\u7ED3\u679C\u3002` : "");
    results.innerHTML = `${failures.length ? `<p class="book-warning" role="status">${esc(failures.map((source) => `${source.name}\uFF1A${source.error}`).join("\uFF1B"))}\u3002${items.length ? "\u5176\u4F59\u6765\u6E90\u7684\u7ED3\u679C\u5982\u4E0B\u3002" : "\u53EF\u4EE5\u7A0D\u540E\u91CD\u8BD5\uFF0C\u6216\u4F7F\u7528\u4E0B\u65B9\u516C\u5F00\u5165\u53E3\u3002"}</p>` : ""}${searched && !error ? `<div class="book-result-count"><h2>\u201C${esc(lastOptions?.q || "")}\u201D</h2><span>\u5DF2\u627E\u5230 ${items.length} \u6761${form.elements.files.checked ? ` \xB7 \u53EF\u4E0B\u8F7D ${visible.length} \u6761` : ""}${busy ? " \xB7 \u7EE7\u7EED\u8BFB\u53D6\u4E2D" : ""}</span></div>` : ""}${notices.length ? `<p class="book-warning">${esc(notices.join("\uFF1B"))}\u3002</p>` : ""}${visible.map(bookCard).join("")}${!visible.length ? busy ? '<div class="book-empty"><span class="book-loading" aria-hidden="true"></span><h2>\u6B63\u5728\u627E\u4E66\u4E0E\u8D44\u6599</h2><p>\u9010\u4E2A\u8BFB\u53D6\u6240\u9009\u6765\u6E90\uFF0C\u8BF7\u7A0D\u7B49\u7247\u523B\u3002</p></div>' : `<div class="book-empty"><h2>${error ? "\u8FD9\u6B21\u6682\u65F6\u6CA1\u6709\u8FDE\u4E0A\u6765\u6E90" : items.length ? "\u672C\u9875\u6682\u672A\u627E\u5230\u53EF\u76F4\u63A5\u4E0B\u8F7D\u7684\u6587\u4EF6" : "\u6682\u65F6\u6CA1\u6709\u627E\u5230\u5339\u914D\u8D44\u6599"}</h2><p>${error ? "\u53EF\u4EE5\u91CD\u8BD5\uFF0C\u6216\u5230\u4E0B\u65B9\u6765\u6E90\u7F51\u7AD9\u68C0\u7D22\u3002" : items.length ? "\u53EF\u4EE5\u53D6\u6D88\u201C\u53EA\u770B\u53EF\u4E0B\u8F7D\u201D\uFF0C\u67E5\u770B\u4E66\u76EE\u4E0E\u5728\u7EBF\u9605\u8BFB\u7EBF\u7D22\uFF0C\u6216\u7EE7\u7EED\u52A0\u8F7D\u3002" : "\u8BD5\u8BD5\u4F5C\u8005\u3001\u82F1\u6587\u4E66\u540D\u6216\u66F4\u7B80\u77ED\u7684\u4E3B\u9898\u8BCD\uFF0C\u4E5F\u53EF\u4EE5\u8C03\u6574\u7C7B\u578B\u4E0E\u8BED\u8A00\u3002"}</p>${error ? '<button type="button" class="secondary-button" data-book-retry>\u91CD\u65B0\u68C0\u7D22</button>' : ""}</div>` : ""}${hasMore ? `<button type="button" class="book-load-more secondary-button" data-book-more ${busy ? "disabled" : ""}>${busy ? "\u6B63\u5728\u8BFB\u53D6\u2026\u2026" : "\u7EE7\u7EED\u627E\u66F4\u591A\u7ED3\u679C"}</button>` : ""}`;
  }
  async function search(append = false) {
    if (busy && append) return;
    const next = append ? { ...lastOptions, page: String(page + 1) } : { q: form.elements.q.value.trim(), kind: form.elements.kind.value, source: form.elements.source.value, language: form.elements.language.value, page: "1" };
    if (next.q.length < 2) {
      form.elements.q.focus();
      return;
    }
    const id = ++version;
    active?.abort();
    active = new AbortController();
    if (!append) {
      items = [];
      page = 1;
      hasMore = false;
      failures = [];
      notices = [];
      checkedAt = "";
      effectiveQuery = "";
    }
    lastOptions = { ...next };
    searched = true;
    busy = true;
    error = "";
    draw();
    try {
      const response = await fetch("/api/books/search?" + new URLSearchParams(next), { signal: active.signal, cache: "no-store" });
      const data = await response.json();
      if (disposed || id !== version) return;
      failures = (data.sources || []).filter((source) => source.status !== "ok");
      notices = (data.sources || []).filter((source) => source.warning).map((source) => `${source.name}\uFF1A${source.warning}`);
      if (!response.ok) throw Error(data.error || "\u6765\u6E90\u6682\u65F6\u6CA1\u6709\u54CD\u5E94");
      const incoming = data.items || [];
      items = append ? mergeBookPages(items, incoming) : incoming;
      page = data.page;
      hasMore = data.hasMore;
      checkedAt = data.checkedAt;
      effectiveQuery = data.effectiveQuery;
    } catch (failure) {
      if (disposed || id !== version || failure.name === "AbortError") return;
      error = failure.message || "\u8FD9\u6B21\u6682\u65F6\u672A\u80FD\u8BFB\u53D6\u7ED3\u679C";
    } finally {
      if (!disposed && id === version) {
        busy = false;
        draw();
      }
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    search();
  }, { signal: lifecycle.signal });
  form.elements.files.addEventListener("change", draw, { signal: lifecycle.signal });
  host.addEventListener("click", async (event) => {
    const link = event.target.closest("[data-book-download]");
    if (!link) return;
    event.preventDefault();
    if (link.getAttribute("aria-busy") === "true") return;
    link.setAttribute("aria-busy", "true");
    const label = link.innerHTML;
    link.textContent = "\u6B63\u5728\u51C6\u5907\u6587\u4EF6\u2026\u2026";
    status.textContent = "\u6B63\u5728\u4ECE\u6765\u6E90\u83B7\u53D6PDF\uFF0C\u8BF7\u7A0D\u7B49\u7247\u523B\u2026\u2026";
    try {
      const response = await fetch(link.href, { signal: lifecycle.signal, cache: "no-store" });
      if (!response.ok) {
        const data = await response.json();
        throw Error(data.error || "\u6682\u65F6\u672A\u80FD\u53D6\u5F97\u6587\u4EF6");
      }
      if (!response.headers.get("content-type")?.includes("application/pdf")) throw Error("\u6765\u6E90\u6682\u672A\u8FD4\u56DEPDF");
      const blob = await response.blob();
      if (disposed) return;
      const disposition = response.headers.get("content-disposition") || "";
      let filename = "hal-" + link.dataset.bookDownload + ".pdf";
      try {
        const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
        if (encoded) filename = decodeURIComponent(encoded);
      } catch {
      }
      const objectUrl = URL.createObjectURL(blob), save = document.createElement("a");
      save.href = objectUrl;
      save.download = filename;
      document.body.append(save);
      save.click();
      save.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 6e4);
      status.textContent = "\u6587\u4EF6\u5DF2\u4EA4\u7ED9\u6D4F\u89C8\u5668\u4FDD\u5B58\uFF0C\u8BF7\u67E5\u770B\u4E0B\u8F7D\u5217\u8868\u3002";
    } catch (failure) {
      if (!disposed && failure.name !== "AbortError") status.textContent = (failure.message || "\u4E0B\u8F7D\u4F20\u8F93\u4E2D\u65AD") + "\u3002\u4E5F\u53EF\u4EE5\u4F7F\u7528\u8BE5\u6761\u8D44\u6599\u7684\u201C\u5728\u7EBF\u9605\u8BFB\u201D\u6216\u201C\u67E5\u770B\u6765\u6E90\u201D\u524D\u5F80\u539F\u7AD9\u83B7\u53D6\u3002";
    } finally {
      if (!disposed) {
        link.innerHTML = label;
        link.removeAttribute("aria-busy");
      }
    }
  }, { signal: lifecycle.signal });
  host.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.bookTopic) {
      form.elements.q.value = target.dataset.bookTopic;
      search();
    }
    if (target.hasAttribute("data-book-more")) search(true);
    if (target.hasAttribute("data-book-retry")) search();
    if (target.hasAttribute("data-book-copy")) {
      try {
        await navigator.clipboard.writeText(target.dataset.bookCopy);
        status.textContent = "\u4E66\u76EE\u4FE1\u606F\u5DF2\u590D\u5236";
      } catch {
        status.textContent = "\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u590D\u5236\uFF0C\u53EF\u4EE5\u9009\u4E2D\u4E66\u540D\u4E0E\u4F5C\u8005\u624B\u52A8\u590D\u5236\u3002";
      }
    }
  }, { signal: lifecycle.signal });
  fetch("/api/books/sources", { signal: lifecycle.signal, cache: "no-store" }).then((response) => {
    if (!response.ok) throw Error();
    return response.json();
  }).then((data) => {
    if (disposed) return;
    sources = data.sources;
    host.querySelector("[data-book-sources]").innerHTML = sources.map((source) => `<p><strong>${esc(source.name)}</strong><span>${esc(source.description)}</span><small>${source.available ? "\u5DF2\u63A5\u5165" : "\u5F85\u63A5\u5165"}</small></p>`).join("");
  }).catch(() => {
    if (!disposed) host.querySelector("[data-book-sources]").textContent = "\u6765\u6E90\u914D\u7F6E\u6682\u65F6\u672A\u80FD\u8BFB\u53D6\uFF0C\u4ECD\u53EF\u5C1D\u8BD5\u641C\u7D22\u3002";
  });
  draw();
  return () => {
    disposed = true;
    version++;
    lifecycle.abort();
    active?.abort();
  };
}

export {
  bookShell,
  bookCard,
  mergeBookPages,
  mountBooks
};
