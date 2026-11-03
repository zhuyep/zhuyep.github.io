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

// demo/modules/wiki-data.js
var local = () => ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) && location.port === "4189";
async function json(url, signal) {
  const r = await fetch(url, { signal, cache: "no-store" });
  if (!r.ok) throw Error("\u8D44\u6599\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6");
  return r.json();
}
async function loadWikiCatalog(signal) {
  const catalog = await json(local() ? "/api/aero-library/catalog?refresh=1" : "/assets/wiki/catalog.json", signal);
  if (local()) {
    try {
      const snapshot = await json("/assets/wiki/catalog.json", signal), titles = new Map([snapshot.home, ...snapshot.topics].filter(Boolean).map((p) => [p.id, p.englishTitle]));
      for (const p of [catalog.home, ...catalog.topics].filter(Boolean)) p.englishTitle = titles.get(p.id) || "";
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  return catalog;
}
async function loadWikiPage(id, catalog, signal) {
  if (!/^[1-9]\d{0,11}$/.test(String(id))) throw Error("\u6761\u76EE\u6807\u8BC6\u65E0\u6548");
  return json(catalog.mode === "published" ? "/assets/wiki/pages/" + id + ".json" : "/api/aero-library/page?id=" + id, signal);
}
async function loadWikiGraph(catalog, signal) {
  const ids = [catalog.home, ...catalog.topics].filter(Boolean).map((p) => p.id), pages = [];
  for (let i = 0; i < ids.length; i += 3) pages.push(...await Promise.all(ids.slice(i, i + 3).map((id) => loadWikiPage(id, catalog, signal))));
  return pages;
}

// demo/modules/wiki-graph-model.js
function buildWikiGraph(catalog, pages = []) {
  const nodes = [], links = [], byId = /* @__PURE__ */ new Map(), pairs = /* @__PURE__ */ new Map(), urlMap = /* @__PURE__ */ new Map();
  const add = (n) => {
    if (!byId.has(n.id)) {
      nodes.push(n);
      byId.set(n.id, n);
    }
    return n.id;
  };
  const edge = (source, target, kind) => {
    if (source === target || !byId.has(source) || !byId.has(target)) return;
    const key2 = source + ">" + target;
    let e = pairs.get(key2);
    if (!e) {
      e = { source, target, kinds: [] };
      pairs.set(key2, e);
      links.push(e);
    }
    if (!e.kinds.includes(kind)) e.kinds.push(kind);
  };
  const key = (url) => {
    try {
      return new URL(url, "https://wiki.invalid").href;
    } catch {
      return "";
    }
  };
  const mapUrl = (url, id) => {
    if (url) urlMap.set(key(url), id);
  };
  const pageInfo = [catalog.home, ...catalog.topics].filter(Boolean);
  for (const p of pageInfo) {
    const body = pages.find((v) => v.id === p.id), englishLabel = p.englishTitle || body?.englishTitle || body?.markdown.match(/^_([A-Za-z][^_\n]+)_$/m)?.[1] || "";
    const id = add({ id: "page:" + p.id, kind: "page", label: p.id === catalog.home?.id ? catalog.name : p.title, englishLabel, pageId: p.id, href: "#books/wiki" + (p.id === catalog.home?.id ? "" : "?page=" + p.id) });
    mapUrl(p.url, id);
    mapUrl("#books/wiki?page=" + p.id, id);
  }
  const root = "page:" + catalog.home?.id;
  mapUrl("#books/wiki", root);
  for (const p of catalog.topics) edge("page:" + p.parentId, "page:" + p.id, "\u5C42\u7EA7");
  for (const f of catalog.folders || []) add({ id: "folder:" + f.path, kind: "folder", label: f.name || f.path, path: f.path });
  for (const f of catalog.folders || []) {
    const parent = f.path.split("/").slice(0, -1).join("/");
    edge(parent ? "folder:" + parent : root, "folder:" + f.path, "\u76EE\u5F55");
  }
  for (const f of catalog.files) {
    const id = add({ id: "file:" + f.id, kind: "file", label: f.name, href: f.previewUrl, downloadUrl: f.downloadUrl, path: f.path });
    mapUrl(f.previewUrl, id);
    mapUrl(f.downloadUrl, id);
    const parent = f.path.split("/").slice(0, -1).join("/");
    edge(parent ? "folder:" + parent : root, id, "\u76EE\u5F55");
  }
  for (const p of pages) for (const m of p.markdown.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)\)/g)) {
    const target = urlMap.get(key(m[1]));
    if (target) edge("page:" + p.id, target, "\u5F15\u7528");
  }
  return { nodes, links };
}

// demo/modules/wiki-markdown.js
var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var loopback = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
var bilingual = (value) => {
  const m = String(value).match(/^(.+?) \/ ([A-Za-z].*)$/);
  return m && /[\u3400-\u9fff]/.test(m[1]) ? m : null;
};
var paired = (value, cls = "wiki-label-en") => {
  const m = bilingual(value);
  return m ? `${esc(m[1])}<span class="${cls}" lang="en">${esc(m[2])}</span>` : esc(value);
};
function wikiHref(value, { wikiUrl, topics = [], home } = {}) {
  try {
    if (/^#books\/(?:wiki|search)(?:\?[^\s<>]*)?$/.test(value)) return value;
    if (value.startsWith("/assets/wiki/")) {
      const decoded = decodeURIComponent(value);
      if (decoded.split("/").some((p) => p === "." || p === "..") || /[\u0000-\u001f\\]/.test(decoded)) return "";
      return value;
    }
    const url = new URL(value);
    if (url.username || url.password) return "";
    if (url.href === wikiUrl || url.href === home?.url) return "#books/wiki";
    const topic = topics.find((t) => t.url === url.href);
    if (topic) return "#books/wiki?page=" + encodeURIComponent(topic.id);
    if (url.protocol === "https:" || url.protocol === "http:" && loopback(url.hostname) && loopback(new URL(wikiUrl).hostname)) return url.href;
  } catch {
  }
  return "";
}
function renderWikiMarkdown(markdown, context = {}) {
  function inline(value, depth = 0) {
    if (depth > 3) return esc(value);
    const pattern = /!?\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`|_([^_\n]+)_/g;
    let html2 = "", end = 0;
    for (const m of value.matchAll(pattern)) {
      html2 += esc(value.slice(end, m.index));
      end = m.index + m[0].length;
      if (m[1]) {
        const href = wikiHref(m[2], context);
        html2 += href ? `<a href="${esc(href)}" ${href.startsWith("#books/") ? "" : 'target="_blank" rel="noopener noreferrer"'}>${paired(m[1])}</a>` : esc(m[1]);
      } else if (m[3]) html2 += "<strong>" + paired(m[3]) + "</strong>";
      else if (m[4]) html2 += "<code>" + esc(m[4]) + "</code>";
      else html2 += "<em>" + esc(m[5]) + "</em>";
    }
    return html2 + esc(value.slice(end));
  }
  const lines = String(markdown).replace(/\r/g, "").split("\n"), headings = [];
  let html = "", i = 0;
  const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^```/.test(line)) {
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      i++;
      html += "<pre><code>" + esc(code.join("\n")) + "</code></pre>";
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      i++;
      if (heading[1].length === 1) continue;
      const id = "wiki-section-" + headings.length;
      const title = heading[2].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      headings.push({ id, title, level: heading[1].length });
      html += `<h${heading[1].length} id="${id}">${bilingual(heading[2]) ? paired(heading[2], "wiki-heading-en") : inline(heading[2])}</h${heading[1].length}>`;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const header = cells(line);
      i += 2;
      html += '<div class="wiki-table-scroll"><table><thead><tr>' + header.map((c) => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>";
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        html += "<tr>" + cells(lines[i++]).map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>";
      }
      html += "</tbody></table></div>";
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line), tag = ordered ? "ol" : "ul", pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      html += "<" + tag + ">";
      while (i < lines.length && pattern.test(lines[i])) html += "<li>" + inline(lines[i++].replace(pattern, "")) + "</li>";
      html += "</" + tag + ">";
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""));
      html += "<blockquote>" + inline(quote.join(" ")) + "</blockquote>";
      continue;
    }
    const paragraph = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*([-*]|\d+\.)\s|>|```)/.test(lines[i])) paragraph.push(lines[i++]);
    const text = paragraph.join(" "), english = text.match(/^_([A-Za-z0-9][^_\n]*)_$/);
    html += english ? '<p class="wiki-en" lang="en">' + inline(english[1]) + "</p>" : "<p>" + inline(text) + "</p>";
  }
  return { html, headings };
}

// demo/modules/aero-library.js
var esc2 = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var loopback2 = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
function safeLink(value) {
  try {
    if (!value) return "";
    const url = new URL(value, location.origin);
    if (url.username || url.password) return "";
    if (url.protocol === "https:" || url.protocol === "http:" && loopback2(url.hostname) && loopback2(location.hostname)) return url.href;
  } catch {
  }
  return "";
}
var link = (url, label, cls = "") => {
  const href = safeLink(url);
  return href ? `<a class="${cls}" href="${esc2(href)}" target="_blank" rel="noopener noreferrer">${esc2(label)}</a>` : "";
};
var family = (format) => ({ pdf: "PDF", doc: "Word", docx: "Word", ppt: "PPT", pptx: "PPT", xls: "Excel", xlsx: "Excel" })[format] || format.toUpperCase();
var pageLink = (topic) => `<a href="#books/wiki?page=${encodeURIComponent(topic.id)}">${esc2(topic.title)}${topic.englishTitle ? `<span class="wiki-label-en" lang="en">${esc2(topic.englishTitle)}</span>` : ""}</a>`;
var documentRow = (file) => `<li><div>${link(file.previewUrl, file.name)} <small>${esc2(family(file.format))}</small></div><span>${link(file.previewUrl, file.requiresLogin ? "\u767B\u5F55\u9884\u89C8" : "\u9884\u89C8")}${link(file.downloadUrl, "\u4E0B\u8F7D\u539F\u4EF6")}</span></li>`;
function mountWiki(host) {
  const lifecycle = new AbortController();
  let active, disposed = false, version = 0, data = null, article = null, error = "", searchQuery = "", searchActive = false, graphCleanup = null;
  const params = new URLSearchParams(location.hash.split("?")[1] || ""), requested = params.get("page"), graphView = params.get("view") === "graph";
  const route = "#books/wiki" + (requested ? "?page=" + encodeURIComponent(requested) : ""), graphRoute = route + (requested ? "&" : "?") + "view=graph";
  host.classList.add("wiki-reader");
  host.removeAttribute("role");
  document.body.classList.add("wiki-page-mode");
  host.innerHTML = '<p class="wiki-loading" role="status">\u6B63\u5728\u6253\u5F00 Wiki\u2026\u2026</p>';
  function drawSearch() {
    const q = searchActive ? searchQuery.trim() : "", results = host.querySelector(".wiki-search-results");
    host.querySelector(".wiki-reading").hidden = graphView || Boolean(q);
    const graph = host.querySelector(".wiki-graph-host");
    if (graph) graph.hidden = Boolean(q);
    results.hidden = !q;
    if (!q) return;
    const terms = q.toLocaleLowerCase(), topics = data.topics.filter((p) => (p.title + " " + (p.englishTitle || "")).toLocaleLowerCase().includes(terms)), files = data.files.filter((f) => (f.name + " " + (f.source?.englishTitle || "")).toLocaleLowerCase().includes(terms));
    results.innerHTML = `<h2>\u641C\u7D22\u7ED3\u679C</h2><p role="status">\u201C${esc2(q)}\u201D\uFF1A${topics.length} \u4E2A\u6761\u76EE\uFF0C${files.length} \u4EFD\u6587\u6863</p>${topics.length ? `<ul class="wiki-entry-results">${topics.map((t) => "<li>" + pageLink(t) + "</li>").join("")}</ul>` : ""}${files.length ? `<ul class="wiki-references">${files.map(documentRow).join("")}</ul>` : ""}${!topics.length && !files.length ? "<p>\u6682\u672A\u627E\u5230\uFF0C\u8BD5\u8BD5\u66F4\u77ED\u7684\u4E3B\u9898\u8BCD\u6216\u6587\u4EF6\u540D\u3002</p>" : ""}<button type="button" class="wiki-text-button" data-wiki-clear>\u8FD4\u56DE\u9605\u8BFB</button>`;
  }
  function render() {
    if (disposed) return;
    graphCleanup?.();
    graphCleanup = null;
    if (!data) {
      host.innerHTML = `<div class="wiki-empty"><h1>Wiki \u8D44\u6599\u5E93</h1><p role="status">${esc2(error || "Wiki \u8D44\u6599\u5E93\u5C1A\u672A\u8FDE\u63A5\u3002")}</p><button type="button" class="secondary-button" data-wiki-refresh>\u91CD\u65B0\u8BFB\u53D6</button></div>`;
      return;
    }
    const toolsOpen = host.querySelector(".wiki-simple-tools")?.open;
    const keepSearchFocus = document.activeElement === host.querySelector("[name=wiki-search]");
    const context = { wikiUrl: data.wikiUrl, topics: data.topics, home: data.home };
    const rendered = article ? renderWikiMarkdown(article.markdown, context) : { html: '<p class="wiki-loading">\u6B63\u5728\u8BFB\u53D6\u6761\u76EE\u6B63\u6587\u2026\u2026</p>', headings: [] };
    const editUrl = data.mode === "published" ? "" : article?.editUrl || data.editUrl;
    const current = article?.title || data.name;
    document.title = current + " \xB7 \u51EF\u5377\u6709\u76CA";
    let body = rendered.html;
    if (article?.id === data.home?.id) {
      const template = document.createElement("template");
      template.innerHTML = body;
      const rest = [...template.content.querySelectorAll("h2")].find((h) => ["\u4F7F\u7528\u8BF4\u660E", "\u4F7F\u7528\u4E0E\u7EF4\u62A4"].some((title) => h.textContent.trim().startsWith(title)));
      if (rest) {
        const details = document.createElement("details"), summary = document.createElement("summary");
        summary.textContent = "\u4F7F\u7528\u8BF4\u660E";
        details.append(summary);
        let node = rest;
        while (node) {
          const next = node.nextSibling;
          details.append(node);
          node = next;
        }
        template.content.append(details);
        body = template.innerHTML;
      }
    }
    host.innerHTML = `<nav class="wiki-simple-path" aria-label="Wiki \u5BFC\u822A"><a href="#books/search">\u2190 \u51EF\u5377\u6709\u76CA</a>${requested ? '<a href="#books/wiki">\u8D44\u6599\u5E93\u9996\u9875</a>' : ""}<details class="wiki-simple-tools"><summary aria-label="\u9875\u9762\u64CD\u4F5C">\u22EF</summary><div><form role="search" aria-label="\u641C\u7D22 Wiki"><label class="sr-only" for="wiki-reader-search">\u641C\u7D22\u6761\u76EE\u4E0E\u6587\u6863</label><input id="wiki-reader-search" type="search" name="wiki-search" value="${esc2(searchQuery)}" placeholder="\u641C\u7D22\u6761\u76EE\u4E0E\u6587\u6863" autocomplete="off"><button type="submit">\u641C\u7D22</button></form>${link(editUrl, "\u7F16\u8F91\u672C\u9875")}${link(data.filesUrl, "\u4E0A\u4F20\u8D44\u6599")}${data.mode === "published" ? '<a href="#books/wiki?notice=local">\u5173\u4E8E\u4E0A\u4F20\u4E0E\u7F16\u8F91</a>' : link(article?.url || data.wikiUrl, "\u540E\u53F0\u8D44\u6599\u5E93")}${link(data.publicFilesUrl, "\u5168\u90E8\u6587\u4EF6")}<button type="button" data-wiki-refresh>\u5237\u65B0\u5185\u5BB9</button></div></details></nav><h1 class="wiki-simple-title">${esc2(current)}</h1><div class="wiki-vector-tabs"><a href="${route}" ${!graphView ? 'aria-current="page"' : ""}>\u6761\u76EE</a><a href="${graphRoute}" ${graphView ? 'aria-current="page"' : ""}>\u77E5\u8BC6\u56FE\u8C31</a></div><p class="wiki-status" role="status">${esc2(error)}${params.get("notice") === "local" ? "\u6B64\u7248\u672C\u4F9B\u5728\u7EBF\u6D4F\u89C8\u3002\u4E0A\u4F20\u548C\u7F16\u8F91\u8BF7\u5728\u672C\u5730\u8D44\u6599\u5E93\u8FDB\u884C\u3002" : ""}${data.truncated ? "\u66F4\u591A\u6587\u4EF6\u8BF7\u4ECE\u9875\u9762\u64CD\u4F5C\u83DC\u5355\u8FDB\u5165\u3002" : ""}</p><section class="wiki-search-results" aria-label="Wiki \u641C\u7D22\u7ED3\u679C" hidden></section>${graphView ? '<section class="wiki-graph-host" aria-label="\u77E5\u8BC6\u56FE\u8C31"><p class="wiki-loading">\u6B63\u5728\u6574\u7406\u77E5\u8BC6\u5E93\u5173\u7CFB\u2026\u2026</p></section>' : ""}<div class="wiki-reading" ${graphView ? "hidden" : ""}><article class="wiki-prose">${body}</article><section class="wiki-attached-files"><details><summary>\u8D44\u6599\u6587\u4EF6 <small>${data.files.length}</small></summary><ul class="wiki-references">${data.files.map(documentRow).join("") || "<li>\u5C1A\u672A\u4E0A\u4F20\u8D44\u6599\u3002</li>"}</ul>${data.mode === "published" ? '<p class="wiki-file-note">Office \u9884\u89C8\u4F7F\u7528 PDF \u7248\uFF0C\u4E0B\u8F7D\u4FDD\u7559\u539F\u4EF6\u3002</p>' : ""}</details></section>${data.mode === "published" ? '<p class="wiki-published-note">\u516C\u5F00\u9605\u8BFB\u4F53\u9A8C\u7248 \xB7 \u6761\u76EE\u4E0E\u6587\u4EF6\u6765\u81EA\u8D44\u6599\u5E93\u53D1\u5E03\u5FEB\u7167</p>' : ""}</div>`;
    host.querySelector(".wiki-simple-tools").open = Boolean(toolsOpen);
    if (searchActive) drawSearch();
    if (keepSearchFocus) host.querySelector("[name=wiki-search]").focus();
  }
  async function showGraph(current) {
    try {
      const pages = await loadWikiGraph(data, active.signal);
      const { mountWikiGraph } = await import("./wiki-graph-A6OMGCYT.js");
      if (disposed || current !== version) return;
      graphCleanup = mountWikiGraph(host.querySelector(".wiki-graph-host"), buildWikiGraph(data, pages));
    } catch (failure) {
      if (disposed || current !== version || failure.name === "AbortError") return;
      const stage = host.querySelector(".wiki-graph-host");
      if (stage) stage.textContent = "\u56FE\u8C31\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002";
    }
  }
  async function refresh() {
    const current = ++version;
    active?.abort();
    active = new AbortController();
    const status = host.querySelector(".wiki-status");
    if (status) status.textContent = "\u6B63\u5728\u5237\u65B0\u2026\u2026";
    try {
      const value = await loadWikiCatalog(active.signal);
      if (disposed || current !== version) return;
      if (!value.available) {
        data = null;
        error = "Wiki \u8D44\u6599\u5E93\u5C1A\u672A\u8FDE\u63A5\u3002";
        render();
        return;
      }
      data = value;
      error = "";
      render();
      const id = requested || data.home?.id;
      const page = await loadWikiPage(id, data, active.signal);
      if (disposed || current !== version) return;
      article = page;
      error = "";
      render();
      if (graphView) showGraph(current);
    } catch (failure) {
      if (disposed || current !== version || failure.name === "AbortError") return;
      error = failure.message || "\u6682\u65F6\u65E0\u6CD5\u6253\u5F00 Wiki\uFF0C\u8BF7\u786E\u8BA4\u8D44\u6599\u5E93\u5DF2\u542F\u52A8\u3002";
      if (data && !article) article = { title: "\u6761\u76EE\u6682\u65F6\u65E0\u6CD5\u6253\u5F00", markdown: "\u8BF7\u5237\u65B0\u91CD\u8BD5\uFF0C\u6216\u4ECE\u53F3\u4E0A\u89D2\u83DC\u5355\u67E5\u770B\u539F\u59CB Wiki\u3002" };
      render();
    }
  }
  host.addEventListener("submit", (event) => {
    event.preventDefault();
    searchActive = Boolean(searchQuery.trim());
    if (searchActive) host.querySelector(".wiki-simple-tools").open = false;
    drawSearch();
  }, { signal: lifecycle.signal });
  host.addEventListener("input", (event) => {
    if (event.target.name === "wiki-search") {
      searchQuery = event.target.value;
      if (!searchQuery) {
        searchActive = false;
        drawSearch();
      }
    }
  }, { signal: lifecycle.signal });
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-wiki-refresh]")) refresh();
    if (event.target.closest("[data-wiki-clear]")) {
      searchQuery = "";
      searchActive = false;
      host.querySelector("[name=wiki-search]").value = "";
      drawSearch();
    }
  }, { signal: lifecycle.signal });
  refresh();
  return () => {
    disposed = true;
    version++;
    active?.abort();
    lifecycle.abort();
    graphCleanup?.();
    document.body.classList.remove("wiki-page-mode");
  };
}

// demo/modules/book-preview.js
function legacyBookPreviewUrl(value, origin) {
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || url.pathname !== "/api/books/preview") return "";
    url.pathname = "/api/books/download";
    return url.href;
  } catch {
    return "";
  }
}
function createBookPreview(signal) {
  const dialog = document.createElement("dialog");
  dialog.className = "book-preview-dialog";
  dialog.setAttribute("aria-label", "\u8D44\u6599\u5728\u7EBF\u9884\u89C8");
  dialog.innerHTML = '<header><h2></h2><a class="secondary-button" hidden>\u4E0B\u8F7D PDF</a><button type="button" aria-label="\u5173\u95ED\u9884\u89C8">\xD7</button></header><p class="book-preview-status" role="status">\u6B63\u5728\u6253\u5F00\u5168\u6587\u2026\u2026</p><iframe title="PDF \u5728\u7EBF\u9884\u89C8" hidden></iframe><footer><span>PDF \u5728\u7EBF\u9605\u8BFB</span><a target="_blank" rel="noopener noreferrer">\u6253\u5F00\u6765\u6E90\u9875\u9762 \u2197</a></footer>';
  document.body.append(dialog);
  let active, objectUrl = "", version = 0;
  const frame = dialog.querySelector("iframe"), status = dialog.querySelector("[role=status]"), download = dialog.querySelector("header a");
  function reset() {
    version++;
    active?.abort();
    frame.removeAttribute("src");
    frame.hidden = true;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
    download.hidden = true;
  }
  dialog.addEventListener("close", reset);
  dialog.querySelector("button").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  signal.addEventListener("abort", () => {
    reset();
    dialog.close();
    dialog.remove();
  }, { once: true });
  return async ({ url, title, sourceUrl }) => {
    reset();
    if (signal.aborted) return;
    const current = version;
    active = new AbortController();
    dialog.querySelector("h2").textContent = title || "PDF \u5728\u7EBF\u9884\u89C8";
    const source = dialog.querySelector("footer a");
    source.hidden = true;
    try {
      const value = new URL(sourceUrl);
      if (value.protocol === "https:" && !value.username && !value.password) {
        source.href = value.href;
        source.hidden = false;
      }
    } catch {
    }
    status.hidden = false;
    status.textContent = "\u6B63\u5728\u8BFB\u53D6\u516C\u5F00\u5168\u6587\u2026\u2026";
    if (!dialog.open) dialog.showModal();
    try {
      let response = await fetch(url, { signal: active.signal, cache: "no-store" });
      if (response.status === 404) {
        const fallback = legacyBookPreviewUrl(url, location.origin);
        if (fallback) response = await fetch(fallback, { signal: active.signal, cache: "no-store" });
      }
      if (!response.ok) {
        const error = await response.json();
        throw Error(error.error || "\u6682\u65F6\u65E0\u6CD5\u6253\u5F00\u5168\u6587");
      }
      if (!response.headers.get("content-type")?.includes("application/pdf")) throw Error("\u6765\u6E90\u6CA1\u6709\u8FD4\u56DE\u53EF\u9884\u89C8\u7684 PDF");
      const blob = await response.blob();
      if (signal.aborted || current !== version) return;
      objectUrl = URL.createObjectURL(blob);
      frame.src = objectUrl;
      frame.title = title + " \xB7 PDF \u5728\u7EBF\u9884\u89C8";
      frame.hidden = false;
      download.href = objectUrl;
      download.download = (title || "\u8D44\u6599").replace(/[\\/]/g, "-") + ".pdf";
      download.hidden = false;
      status.hidden = true;
    } catch (error) {
      if (error.name !== "AbortError" && current === version && !signal.aborted) status.textContent = error.message + "\u3002\u53EF\u4EE5\u6253\u5F00\u6765\u6E90\u9875\u9762\u7EE7\u7EED\u9605\u8BFB\u3002";
    }
  };
}

// demo/modules/book-search-layout.js
function searchWorkspace() {
  return `<div class="book-workspace"><div class="book-search-stage"><div class="book-search-brand"><h1>\u8D44\u6599\u641C\u7D22<span class="book-seal" aria-hidden="true">\u9605</span></h1><p>\u4E66\u7C4D\u3001\u8BBA\u6587\u548C\u516C\u5F00\u8D44\u6599\uFF0C\u4ECE\u8FD9\u91CC\u627E\u3002</p></div><form class="book-search-form" aria-label="\u641C\u7D22\u4E66\u7C4D\u4E0E\u8D44\u6599"><div class="book-search-bar"><label class="book-search-input"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m16 16 5 5"/></svg><span class="sr-only">\u4E66\u540D\u3001\u4F5C\u8005\u3001ISBN\u6216\u4E3B\u9898</span><input name="q" type="search" placeholder="\u4E66\u540D\u3001\u4F5C\u8005\u3001ISBN \u6216\u4E3B\u9898" autocomplete="off" required minlength="2" maxlength="160"></label><button type="submit" class="book-search-submit">\u641C\u7D22</button></div><details class="book-filter-disclosure"><summary>\u7B5B\u9009\u6761\u4EF6</summary><div class="book-filters"><label>\u8D44\u6599\u7C7B\u578B<select name="kind"><option value="all">\u5168\u90E8\u8D44\u6599</option><option value="book">\u4E66\u7C4D\u4E0E\u7AE0\u8282</option><option value="paper">\u8BBA\u6587</option><option value="report">\u62A5\u544A\u4E0E\u5B66\u4F4D\u8BBA\u6587</option></select></label><label>\u6765\u6E90<select name="source"><option value="all">\u5168\u90E8\u516C\u5F00\u6765\u6E90</option><option value="openalex">OpenAlex</option><option value="hal">HAL</option><option value="crossref">Crossref</option><option disabled>Z-Library \xB7 \u5F85\u63A5\u5165</option><option disabled>Anna\u2019s Archive \xB7 \u5F85\u63A5\u5165</option></select></label><label>\u8BED\u8A00<select name="language"><option value="all">\u5168\u90E8\u8BED\u8A00</option><option value="zh">\u4E2D\u6587</option><option value="en">\u82F1\u6587</option><option value="fr">\u6CD5\u6587</option></select></label><label class="book-download-filter"><input type="checkbox" name="files">\u53EA\u770B\u53EF\u83B7\u53D6\u5168\u6587</label></div></details></form><div class="book-topics" aria-label="\u8BD5\u641C\u4E00\u4E2A\u4E3B\u9898">${["\u822A\u7A7A\u53D1\u52A8\u673A", "\u71C3\u6C14\u6DA1\u8F6E", "\u53F6\u8F6E\u673A\u68B0", "\u7BA1\u7406\u5B66", "\u9879\u76EE\u7BA1\u7406"].map((topic) => `<button type="button" data-book-topic="${topic}">${topic}</button>`).join("")}</div></div><p class="book-live-status" role="status" aria-live="polite"></p><div class="book-results" aria-live="polite" aria-busy="false"></div><details class="book-source-settings"><summary>\u516C\u5F00\u68C0\u7D22\u5165\u53E3\u4E0E\u6765\u6E90</summary><div class="book-source-sites"><a href="https://ntrs.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA \u6280\u672F\u62A5\u544A \u2197</a><a href="https://openstax.org/subjects" target="_blank" rel="noopener noreferrer">OpenStax \u5F00\u653E\u6559\u6750 \u2197</a><a href="https://arxiv.org/search/" target="_blank" rel="noopener noreferrer">arXiv \u9884\u5370\u672C \u2197</a><a href="https://www.gutenberg.org/ebooks/" target="_blank" rel="noopener noreferrer">\u53E4\u817E\u5821\u7535\u5B50\u4E66 \u2197</a></div><div data-book-sources>\u6B63\u5728\u68C0\u67E5\u6765\u6E90\u914D\u7F6E\u2026\u2026</div><p class="book-file-note">\u6709\u516C\u5F00\u5168\u6587\u7684\u7ED3\u679C\u63D0\u4F9B\u5728\u7EBF\u9884\u89C8\u548C\u4E0B\u8F7D\u5165\u53E3\uFF1B\u4EC5\u6709\u4E66\u76EE\u4FE1\u606F\u7684\u8BB0\u5F55\u4F1A\u5355\u72EC\u6807\u660E\u3002\u90E8\u5206\u6587\u4EF6\u7531\u539F\u7AD9\u9605\u8BFB\u5668\u6253\u5F00\u5E76\u4FDD\u5B58\u3002</p></details></div>`;
}

// demo/modules/book-search.js
var esc3 = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
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
  return `<a class="${cls}" href="${esc3(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">\u2197</span></a>`;
};
function fileLink(file, item) {
  const label = file.format === "file" ? "\u4E0B\u8F7D\u5168\u6587" : `\u4E0B\u8F7D ${esc3(file.format.toUpperCase())}`;
  if (file.source === "hal" && /^\d{1,12}$/.test(file.sourceId))
    return `<a class="book-preview-link" href="/api/books/preview?source=hal&amp;id=${file.sourceId}" data-book-preview="${file.sourceId}" data-book-title="${esc3(item.title)}" data-book-origin="${esc3(item.sourceUrl)}">\u5728\u7EBF\u9884\u89C8</a><a class="primary-button" href="/api/books/download?source=hal&amp;id=${file.sourceId}" data-book-download="${file.sourceId}">${label}<span aria-hidden="true">\u2193</span></a>`;
  return (file.format === "pdf" ? external(file.url, "\u5728\u7EBF\u9884\u89C8", "book-preview-link") : "") + external(file.url, label, "primary-button");
}
function bookView(hash = "") {
  return hash.split("?")[0] === "#books/wiki" ? "wiki" : "search";
}
function bookShell() {
  const view = bookView(typeof location === "undefined" ? "" : location.hash);
  return `<section class="book-room" id="daji-books" data-book-view="${view}" aria-label="\u51EF\u5377\u6709\u76CA"><header class="book-heading"><span class="book-room-name">\u51EF\u5377\u6709\u76CA</span><nav class="book-modules" aria-label="\u4E66\u623F\u6A21\u5757"><a href="#books/search" ${view === "search" ? 'aria-current="page"' : ""}>\u8D44\u6599\u641C\u7D22</a><a href="#books/wiki" ${view === "wiki" ? 'aria-current="page"' : ""}>Wiki \u8D44\u6599\u5E93</a></nav></header><div class="book-workspace" role="status">\u6B63\u5728\u6253\u5F00\u4E66\u623F\u2026\u2026</div></section>`;
}
function bookCard(item) {
  const citation = [item.authors.join("\u3001"), item.title, item.year].filter(Boolean).join(" \xB7 ");
  return `<article class="book-result"><div class="book-result-mark" aria-hidden="true">${esc3(kinds[item.kind] || "\u8D44\u6599")}</div><div class="book-result-main"><div class="book-meta"><span>${esc3(kinds[item.kind] || "\u8D44\u6599")}</span><span>${esc3(item.year || "\u5E74\u4EFD\u672A\u6807\u6CE8")}</span>${item.language ? `<span>${esc3(languages[item.language] || item.language)}</span>` : ""}<span>${esc3(item.sources.map((source) => sourceNames[source] || source).join(" / "))}</span><span class="book-access ${item.access === "download" ? "has-file" : ""}">${item.downloads.length ? "\u516C\u5F00\u5168\u6587" : item.access === "open" ? "\u5F00\u653E\u9605\u8BFB" : "\u4EC5\u4E66\u76EE\u4FE1\u606F"}</span></div><h2>${external(item.readUrl || item.sourceUrl, esc3(item.title), "book-title-link")}</h2><p class="book-authors">${esc3(item.authors.join("\u3001") || "\u4F5C\u8005\u672A\u6807\u6CE8")}</p>${item.publisher ? `<p class="book-publisher">${esc3(item.publisher)}</p>` : ""}<div class="book-result-actions">${item.downloads.map((file) => fileLink(file, item) + `<span class="book-version">${esc3(fileVersions[file.version] || fileVersions.unknown)}</span>`).join("")}${item.readUrl ? external(item.readUrl, "\u5728\u7EBF\u9605\u8BFB") : ""}${external(item.sourceUrl, "\u67E5\u770B\u6765\u6E90", "book-source-link")}<button class="book-source-link" type="button" data-book-copy="${esc3(citation)}">\u590D\u5236\u4E66\u76EE</button></div>${item.description || item.doi || item.isbn || item.license ? `<details class="book-details"><summary>\u6458\u8981\u4E0E\u51FA\u7248\u4FE1\u606F</summary>${item.description ? `<p>${esc3(item.description)}</p>` : ""}${item.isbn ? `<p>ISBN\uFF1A${esc3(item.isbn)}</p>` : ""}${item.doi ? `<p>DOI\uFF1A${esc3(item.doi)}</p>` : ""}${item.license ? `<p>\u6765\u6E90\u6807\u6CE8\u8BB8\u53EF\uFF1A${esc3(item.license)}</p>` : ""}</details>` : ""}</div></article>`;
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
  if (host.dataset.bookView === "wiki") return mountWiki(host.querySelector(".book-workspace"));
  if (location.hostname === "zhuyep.github.io") {
    host.querySelector(".book-workspace").outerHTML = `<div class="book-empty"><h2>\u53BB\u51EF\u5377\u6709\u76CA\u627E\u4E00\u627E</h2><p>\u641C\u7D22\u4E0E\u4E0B\u8F7D\u5165\u53E3\u5728\u8BF8\u4E8B\u5927\u5409\u4E3B\u7AD9\u63D0\u4F9B\u3002</p>${external("https://zhushi-daji-preview.pages.dev/#books", "\u6253\u5F00\u51EF\u5377\u6709\u76CA", "primary-button")}</div>`;
    return () => {
    };
  }
  const lifecycle = new AbortController();
  let active;
  const preview = createBookPreview(lifecycle.signal);
  let disposed = false, version = 0, items = [], page = 1, hasMore = false, busy = false, searched = false, lastOptions;
  let sources = [], failures = [], notices = [], error = "", checkedAt = "", effectiveQuery = "";
  host.querySelector(".book-workspace").outerHTML = searchWorkspace();
  const form = host.querySelector("form"), results = host.querySelector(".book-results"), status = host.querySelector(".book-live-status");
  function draw() {
    if (disposed) return;
    const visible = form.elements.files.checked ? items.filter((item) => item.downloads.length) : items;
    host.classList.toggle("has-search", searched);
    results.setAttribute("aria-busy", String(busy));
    form.querySelector("[type=submit]").disabled = busy;
    if (!searched) {
      results.innerHTML = "";
      return;
    }
    const time = checkedAt ? new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" }).format(new Date(checkedAt)) : "";
    const note = effectiveQuery && effectiveQuery !== lastOptions?.q ? `\u540C\u65F6\u4F7F\u7528\u82F1\u6587\u4E3B\u9898\u8BCD\u201C${effectiveQuery}\u201D\u68C0\u7D22\u3002` : "";
    status.textContent = busy ? "\u6B63\u5728\u68C0\u7D22\u516C\u5F00\u6765\u6E90\uFF0C\u901A\u5E38\u9700\u8981\u51E0\u79D2\u949F\u2026\u2026" : error || note + (time ? `${time} \u8BFB\u53D6\u6765\u6E90\u7ED3\u679C\u3002` : "");
    results.innerHTML = `${failures.length ? `<p class="book-warning" role="status">${esc3(failures.map((source) => `${source.name}\uFF1A${source.error}`).join("\uFF1B"))}\u3002${items.length ? "\u5176\u4F59\u6765\u6E90\u7684\u7ED3\u679C\u5982\u4E0B\u3002" : "\u53EF\u4EE5\u7A0D\u540E\u91CD\u8BD5\uFF0C\u6216\u4F7F\u7528\u4E0B\u65B9\u516C\u5F00\u5165\u53E3\u3002"}</p>` : ""}${searched && !error ? `<div class="book-result-count"><h2>\u201C${esc3(lastOptions?.q || "")}\u201D</h2><span>\u5DF2\u627E\u5230 ${items.length} \u6761${form.elements.files.checked ? ` \xB7 \u53EF\u4E0B\u8F7D ${visible.length} \u6761` : ""}${busy ? " \xB7 \u7EE7\u7EED\u8BFB\u53D6\u4E2D" : ""}</span></div>` : ""}${notices.length ? `<p class="book-warning">${esc3(notices.join("\uFF1B"))}\u3002</p>` : ""}${visible.map(bookCard).join("")}${!visible.length ? busy ? '<div class="book-empty"><span class="book-loading" aria-hidden="true"></span><h2>\u6B63\u5728\u627E\u4E66\u4E0E\u8D44\u6599</h2><p>\u9010\u4E2A\u8BFB\u53D6\u6240\u9009\u6765\u6E90\uFF0C\u8BF7\u7A0D\u7B49\u7247\u523B\u3002</p></div>' : `<div class="book-empty"><h2>${error ? "\u8FD9\u6B21\u6682\u65F6\u6CA1\u6709\u8FDE\u4E0A\u6765\u6E90" : items.length ? "\u672C\u9875\u6682\u672A\u627E\u5230\u53EF\u76F4\u63A5\u4E0B\u8F7D\u7684\u6587\u4EF6" : "\u6682\u65F6\u6CA1\u6709\u627E\u5230\u5339\u914D\u8D44\u6599"}</h2><p>${error ? "\u53EF\u4EE5\u91CD\u8BD5\uFF0C\u6216\u5230\u4E0B\u65B9\u6765\u6E90\u7F51\u7AD9\u68C0\u7D22\u3002" : items.length ? "\u53EF\u4EE5\u53D6\u6D88\u201C\u53EA\u770B\u53EF\u4E0B\u8F7D\u201D\uFF0C\u67E5\u770B\u4E66\u76EE\u4E0E\u5728\u7EBF\u9605\u8BFB\u7EBF\u7D22\uFF0C\u6216\u7EE7\u7EED\u52A0\u8F7D\u3002" : "\u8BD5\u8BD5\u4F5C\u8005\u3001\u82F1\u6587\u4E66\u540D\u6216\u66F4\u7B80\u77ED\u7684\u4E3B\u9898\u8BCD\uFF0C\u4E5F\u53EF\u4EE5\u8C03\u6574\u7C7B\u578B\u4E0E\u8BED\u8A00\u3002"}</p>${error ? '<button type="button" class="secondary-button" data-book-retry>\u91CD\u65B0\u68C0\u7D22</button>' : ""}</div>` : ""}${hasMore ? `<button type="button" class="book-load-more secondary-button" data-book-more ${busy ? "disabled" : ""}>${busy ? "\u6B63\u5728\u8BFB\u53D6\u2026\u2026" : "\u7EE7\u7EED\u627E\u66F4\u591A\u7ED3\u679C"}</button>` : ""}`;
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
  host.addEventListener("click", (event) => {
    const link2 = event.target.closest("[data-book-preview]");
    if (!link2 || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    preview({ url: link2.href, title: link2.dataset.bookTitle, sourceUrl: link2.dataset.bookOrigin });
  }, { signal: lifecycle.signal });
  host.addEventListener("click", async (event) => {
    const link2 = event.target.closest("[data-book-download]");
    if (!link2) return;
    event.preventDefault();
    if (link2.getAttribute("aria-busy") === "true") return;
    link2.setAttribute("aria-busy", "true");
    const label = link2.innerHTML;
    link2.textContent = "\u6B63\u5728\u51C6\u5907\u6587\u4EF6\u2026\u2026";
    status.textContent = "\u6B63\u5728\u4ECE\u6765\u6E90\u83B7\u53D6PDF\uFF0C\u8BF7\u7A0D\u7B49\u7247\u523B\u2026\u2026";
    try {
      const response = await fetch(link2.href, { signal: lifecycle.signal, cache: "no-store" });
      if (!response.ok) {
        const data = await response.json();
        throw Error(data.error || "\u6682\u65F6\u672A\u80FD\u53D6\u5F97\u6587\u4EF6");
      }
      if (!response.headers.get("content-type")?.includes("application/pdf")) throw Error("\u6765\u6E90\u6682\u672A\u8FD4\u56DEPDF");
      const blob = await response.blob();
      if (disposed) return;
      const disposition = response.headers.get("content-disposition") || "";
      let filename = "hal-" + link2.dataset.bookDownload + ".pdf";
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
        link2.innerHTML = label;
        link2.removeAttribute("aria-busy");
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
    host.querySelector("[data-book-sources]").innerHTML = sources.map((source) => `<p><strong>${esc3(source.name)}</strong><span>${esc3(source.description)}</span><small>${source.available ? "\u5DF2\u63A5\u5165" : "\u5F85\u63A5\u5165"}</small></p>`).join("");
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
  bookView,
  bookShell,
  bookCard,
  mergeBookPages,
  mountBooks
};
