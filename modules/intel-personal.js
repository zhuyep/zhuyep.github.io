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

// demo/modules/intel-personal.js
var esc2 = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var DRAFT_KEY = "daji-intel-personal-drafts-v1";
var readonlyMirror = typeof location !== "undefined" && location.hostname === "zhuyep.github.io";
var suggested = ["\u5F85\u6DF1\u7814", "\u822A\u53D1\u5E94\u7528", "\u5DE5\u4E1A\u8F6F\u4EF6", "\u77E5\u8BC6\u5DE5\u7A0B", "\u89C4\u5212\u6CBB\u7406", "\u6301\u7EED\u8DDF\u8FDB"];
function createIntelPersonal({ getRecord, refresh, toast, getLegacy = () => "", isSaved = () => false, inSavedView = () => false }) {
  let verified = false, annotations = /* @__PURE__ */ new Map(), jobs = [], lastSeen = null, editor = "", tagFilter = "", busy = false, lastLoad = 0, conflict = "", requestIds = /* @__PURE__ */ new Map(), authGeneration = 0, authBlocked = false;
  let drafts = {};
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    if (d && typeof d === "object" && !Array.isArray(d)) drafts = d;
  } catch {
  }
  const persist = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
      return true;
    } catch {
      toast("\u6D4F\u89C8\u5668\u672A\u80FD\u4FDD\u5B58\u8349\u7A3F\uFF0C\u8BF7\u5148\u590D\u5236\u8BC4\u8BBA");
      return false;
    }
  };
  const note = (id) => annotations.get(id);
  const latestJob = (id) => jobs.filter((x) => x.articleId === id).sort((a, b) => b.revision - a.revision)[0];
  function draft(id) {
    if (!drafts[id]) {
      const n = note(id);
      drafts[id] = { tags: n?.tags || [], comment: n?.comment || getLegacy(id) || "", baseRevision: n?.revision || 0 };
      persist();
    }
    return drafts[id];
  }
  const myTags = () => [...new Set([...annotations.values()].flatMap((x) => x.tags))];
  const invalidate = (id) => {
    for (const key of requestIds.keys()) if (key.startsWith(id + ":")) requestIds.delete(key);
  };
  function jobText(j) {
    if (j.status === "done") return j.resultStatus === "partial" ? "\u62A5\u544A\u5DF2\u5F62\u6210 \xB7 \u4ECD\u6709\u5F85\u6838\u5B9E" : "\u62A5\u544A\u5DF2\u5B8C\u6210";
    if (j.status === "running") return j.stage === "needs_attention" ? "\u5206\u6790\u9700\u8981\u672C\u4EBA\u5904\u7406" : "\u5206\u6790\u4E2D";
    if (j.status === "failed") return "\u5206\u6790\u672A\u5B8C\u6210 \xB7 \u53EF\u91CD\u8BD5";
    if (j.status === "reconcile") return "\u5F85\u6838\u5BF9\u6267\u884C\u8BB0\u5F55";
    return "\u5DF2\u6392\u961F \xB7 \u7B49\u5F85\u672C\u673A\u63A5\u5355";
  }
  async function api(route, opts = {}) {
    const r = await fetch("/api/intel-private/" + route, { cache: "no-store", credentials: "same-origin", ...opts });
    let b;
    try {
      b = await r.json();
    } catch {
      throw Error("\u4E2A\u4EBA\u8BB0\u5F55\u670D\u52A1\u6682\u4E0D\u53EF\u7528");
    }
    ;
    if (!r.ok) {
      const e = Error(b.error || "\u4E2A\u4EBA\u8BB0\u5F55\u670D\u52A1\u6682\u4E0D\u53EF\u7528");
      e.status = r.status;
      throw e;
    }
    return b;
  }
  async function load({ force = false } = {}) {
    if (readonlyMirror || authBlocked || !force && Date.now() - lastLoad < 15e3) return;
    lastLoad = Date.now();
    const generation = authGeneration;
    try {
      let after = "", all = [], loadedJobs = [], seen;
      do {
        const b = await api("records" + (after ? "?after=" + encodeURIComponent(after) : ""));
        all.push(...b.annotations);
        loadedJobs = b.jobs;
        seen = b.runnerLastSeen;
        after = b.nextCursor;
        if (all.length > 1e4) throw Error("\u4E2A\u4EBA\u8BB0\u5F55\u8FC7\u591A\uFF0C\u8BF7\u5148\u5BFC\u51FA\u6574\u7406");
      } while (after);
      if (generation !== authGeneration) return;
      for (const n of all) if (!note(n.articleId) || note(n.articleId).revision <= n.revision) annotations.set(n.articleId, n);
      const merged = new Map(jobs.map((j) => [j.id, j]));
      for (const j of loadedJobs) if (!merged.has(j.id) || merged.get(j.id).updatedAt <= j.updatedAt) merged.set(j.id, j);
      jobs = [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      lastSeen = seen;
      verified = true;
      if (!editor) refresh();
    } catch (e) {
      if (generation !== authGeneration) return;
      if (e.status === 401) {
        verified = false;
        annotations.clear();
        jobs = [];
        tagFilter = "";
        if (!editor) refresh();
      } else if (force) toast(e.message);
    }
  }
  function toolbar() {
    if (readonlyMirror) return '<div class="intel-personal-toolbar"><a href="https://zhushi-daji-preview.pages.dev/#intel">\u5230\u4E3B\u7AD9\u4FDD\u5B58\u6536\u85CF\u7406\u7531\u4E0E\u67E5\u770B\u7814\u7A76 \u2197</a></div>';
    return `<div class="intel-personal-toolbar"><button class="text-button" data-ip="queue">\u6211\u7684\u7814\u7A76${verified ? " " + jobs.length : ""}</button><button class="text-button" data-ip="${verified ? "logout" : "login"}">${verified ? "\u9000\u51FA\u4E2A\u4EBA\u8BB0\u5F55" : "\u4E2A\u4EBA\u8BB0\u5F55\u767B\u5F55"}</button></div>`;
  }
  function markup(r) {
    if (readonlyMirror) return "";
    const id = r.id, n = verified ? note(id) : null, d = drafts[id], j = latestJob(id), saved = isSaved(id), hasDraft = d && d.comment !== (n?.comment || "");
    const reason2 = n?.comment ? `<button class="personal-comment personal-reason-preview" data-ip="reason" data-id="${esc2(id)}" aria-label="\u7F16\u8F91${saved ? "\u6536\u85CF\u7406\u7531" : "\u5907\u6CE8"}\uFF1A${esc2(r.title)}"><span>${saved ? "\u6536\u85CF\u7406\u7531" : "\u6211\u7684\u5907\u6CE8"}</span>${esc2(n.comment)}</button>` : hasDraft || saved && inSavedView() ? `<button class="text-button personal-reason-link" data-ip="reason" data-id="${esc2(id)}">${hasDraft ? "\u7EE7\u7EED\u586B\u5199\u7406\u7531 \xB7 \u6709\u8349\u7A3F" : "\u8865\u5145\u6536\u85CF\u7406\u7531"}</button>` : "";
    const status = j ? `<div class="personal-job" role="status"><span class="personal-job-state">\u25CF ${jobText(j)}</span>${j.status === "done" ? `<button class="text-button" data-ip="report" data-job="${esc2(j.id)}">\u67E5\u770B\u62A5\u544A \u2197</button>` : ""}${j.status === "failed" ? `<button class="text-button" data-ip="retry" data-job="${esc2(j.id)}">\u91CD\u8BD5\u5206\u6790</button>` : ""}${j.status === "reconcile" ? "<small>\u5DF2\u4FDD\u7559\u4EFB\u52A1\uFF0C\u8BF7\u5148\u6838\u5BF9\u672C\u673A\u56DE\u6267\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u91CD\u590D\u5EFA\u5BF9\u8BDD\u3002</small>" : ""}</div>` : "";
    return reason2 || status ? `<div class="intel-personal" data-personal="${esc2(id)}">${reason2}${status}</div>` : "";
  }
  function editorMarkup(r) {
    const d = draft(r.id), j = latestJob(r.id);
    return `<section class="personal-editor" aria-label="\u6536\u85CF\u7406\u7531"><p class="personal-reason-title">${esc2(r.title)}</p><p class="personal-reason-hint">${isSaved(r.id) ? "\u5DF2\u6536\u85CF\uFF0C\u7406\u7531\u53EF\u4EE5\u7A0D\u540E\u8865\u5145\u3002" : "\u8BB0\u4E0B\u4F60\u7684\u5173\u6CE8\u70B9\uFF0C\u65B9\u4FBF\u4EE5\u540E\u56DE\u770B\u3002"}</p><label class="sr-only" for="comment-${esc2(r.id)}">\u6536\u85CF\u7406\u7531</label><textarea id="comment-${esc2(r.id)}" data-ip-draft="${esc2(r.id)}" maxlength="1000" placeholder="\u4E3A\u4EC0\u4E48\u503C\u5F97\u6536\u85CF\uFF1F\u5BF9\u5F53\u524D\u5DE5\u4F5C\u6709\u4EC0\u4E48\u542F\u53D1\uFF0C\u6216\u5E0C\u671B\u8FDB\u4E00\u6B65\u6838\u5B9E\u4EC0\u4E48\uFF1F">${esc2(d.comment)}</textarea><div class="personal-draft-status"><span>${verified ? "\u8349\u7A3F\u7559\u5728\u672C\u673A\uFF0C\u4FDD\u5B58\u540E\u4EC5\u672C\u4EBA\u53EF\u89C1" : "\u8349\u7A3F\u7559\u5728\u672C\u673A\uFF0C\u4FDD\u5B58\u65F6\u767B\u5F55\u5373\u53EF\u540C\u6B65"}</span><span data-ip-length>${d.comment.length}/1000</span></div>${conflict === r.id ? `<div class="personal-conflict" role="alert">\u5176\u4ED6\u8BBE\u5907\u5DF2\u6709\u66F4\u65B0\uFF0C\u672C\u6B21\u8349\u7A3F\u672A\u88AB\u8986\u76D6\u3002<details><summary>\u67E5\u770B\u5DF2\u540C\u6B65\u7406\u7531</summary><p>${esc2(note(r.id)?.comment || "\uFF08\u7A7A\uFF09")}</p></details><button class="secondary-button" data-ip="merge" data-id="${esc2(r.id)}">\u5408\u5E76\u4E24\u4E2A\u7248\u672C\u540E\u518D\u4FDD\u5B58</button></div>` : ""}<p class="personal-research-hint">${j?.threadId ? "\u6DF1\u7814\u4F1A\u7EE7\u7EED\u539F\u6765\u7684 Horizon \u5BF9\u8BDD\u3002" : "\u9700\u8981\u6DF1\u5165\u5206\u6790\u65F6\uFF0C\u518D\u9009\u62E9\u201C\u4FDD\u5B58\u5E76\u6DF1\u7814\u201D\u3002"}</p><div class="personal-editor-actions"><button class="text-button" data-ip="close">\u7A0D\u540E\u518D\u5199</button><div><button class="secondary-button" data-ip="save" data-id="${esc2(r.id)}" ${busy || conflict === r.id ? "disabled" : ""}>\u4FDD\u5B58\u7406\u7531</button><button class="primary-button" data-ip="research" data-id="${esc2(r.id)}" ${busy || !d.comment.trim() || conflict === r.id ? "disabled" : ""}>${busy ? "\u6B63\u5728\u4FDD\u5B58\u2026" : "\u4FDD\u5B58\u5E76\u6DF1\u7814"}</button></div></div></section>`;
  }
  let dialog;
  function close() {
    const old = dialog;
    dialog = null;
    editor = "";
    const notice = old?.querySelector("#toast");
    if (notice?.id === "toast") document.body.append(notice);
    old?.close();
    old?.remove();
  }
  function show(title, body) {
    close();
    dialog = document.createElement("dialog");
    dialog.className = "personal-dialog";
    dialog.innerHTML = `<header class="dialog-top"><h2>${esc2(title)}</h2><button class="text-button" data-ip="close" aria-label="\u5173\u95ED\u5F39\u7A97">\u5173\u95ED</button></header><div class="personal-dialog-body">${body}</div>`;
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
      refresh();
    });
    document.body.append(dialog);
    dialog.showModal();
    return dialog;
  }
  function reason(id) {
    const r = getRecord(id);
    if (readonlyMirror || !r) return;
    draft(id);
    show("\u6536\u85CF\u7406\u7531", editorMarkup(r));
    editor = id;
  }
  function updateReason() {
    if (!editor || !dialog) return;
    const r = getRecord(editor);
    if (!r) return;
    const input = dialog.querySelector("textarea"), focused = input === document.activeElement, start = input?.selectionStart, end = input?.selectionEnd;
    dialog.querySelector(".personal-dialog-body").innerHTML = editorMarkup(r);
    if (focused) {
      const next = dialog.querySelector("textarea");
      next?.focus();
      next?.setSelectionRange?.(start, end);
    }
  }
  function onBookmark(key, added) {
    if (!key.startsWith("intel:") || readonlyMirror) return;
    refresh();
    if (added) reason(key.slice(6));
  }
  async function login(next) {
    const loginDialog = show("\u4E2A\u4EBA\u8BB0\u5F55\u767B\u5F55", `<form id="personal-login"><p>\u4F7F\u7528\u73B0\u6709\u7F51\u7AD9\u7BA1\u7406\u5BC6\u7801\u3002\u6536\u85CF\u7406\u7531\u548C\u7814\u7A76\u62A5\u544A\u4EC5\u672C\u4EBA\u767B\u5F55\u540E\u53EF\u89C1\u3002</p><label>\u5BC6\u7801<input type="password" name="password" autocomplete="current-password" required maxlength="256"></label><p class="personal-error" role="alert"></p><button class="primary-button">\u767B\u5F55</button></form>`);
    loginDialog.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      const form = e.currentTarget, b = form.querySelector("button"), generation = authGeneration, route = typeof location === "undefined" ? null : location.href;
      b.disabled = true;
      try {
        const r = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.elements.password.value }) });
        form.elements.password.value = "";
        const d = await r.json();
        if (!r.ok) throw Error(d.error || "\u767B\u5F55\u5931\u8D25");
        if (generation !== authGeneration) return;
        authGeneration++;
        authBlocked = false;
        const current = dialog === loginDialog, authenticated = authGeneration;
        if (current) close();
        await load({ force: true });
        if (verified && current && dialog === null && authenticated === authGeneration && (route === null || location.href === route)) {
          refresh();
          await next?.();
        }
      } catch (err) {
        form.querySelector("[role=alert]").textContent = err.message;
      } finally {
        b.disabled = false;
      }
    };
  }
  function tags(id) {
    const d = draft(id), selected = new Set(d.tags), all = [.../* @__PURE__ */ new Set([...suggested, ...myTags(), ...d.tags])];
    show("\u7ED9\u8FD9\u6761\u60C5\u62A5\u52A0\u6807\u7B7E", `<p class="subtle-note">\u4E2A\u4EBA\u6574\u7406\uFF0C\u4E0D\u6539\u53D8\u65B0\u95FB\u539F\u6709\u5206\u7C7B</p><div class="personal-tag-options">${all.map((t) => `<button class="secondary-button" data-ip="tag-option" data-value="${esc2(t)}" aria-pressed="${selected.has(t)}">${esc2(t)}</button>`).join("")}</div><form id="personal-new-tag"><label class="sr-only" for="personal-tag-input">\u81EA\u5B9A\u4E49\u6807\u7B7E</label><input id="personal-tag-input" maxlength="24" placeholder="\u81EA\u5B9A\u4E49\u6807\u7B7E"><button class="secondary-button">\u6DFB\u52A0</button></form><p class="personal-error" role="alert"></p><button class="primary-button" data-ip="tag-save" data-id="${esc2(id)}">\u4FDD\u5B58\u6807\u7B7E</button>`);
    dialog.querySelector(".personal-tag-options").onclick = (e) => {
      const b = e.target.closest('[data-ip="tag-option"]');
      if (!b) return;
      const t = b.dataset.value;
      if (selected.has(t)) selected.delete(t);
      else if (selected.size < 12) selected.add(t);
      else return;
      b.setAttribute("aria-pressed", String(selected.has(t)));
    };
    dialog.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      const input = dialog.querySelector("input"), value = input.value.trim();
      if (!value || /[\u0000-\u001f]/.test(value)) return;
      if (selected.size >= 12) return;
      selected.add(value);
      let b = [...dialog.querySelectorAll('[data-ip="tag-option"]')].find((x) => x.dataset.value === value);
      if (!b) {
        b = document.createElement("button");
        b.className = "secondary-button";
        b.dataset.ip = "tag-option";
        b.dataset.value = value;
        b.textContent = value;
        dialog.querySelector(".personal-tag-options").append(b);
      }
      b.setAttribute("aria-pressed", "true");
      input.value = "";
    };
    dialog.querySelector('[data-ip="tag-save"]').onclick = async () => {
      d.tags = [...selected];
      invalidate(id);
      persist();
      close();
      if (verified) await submit(id, "save", { tagsOnly: true });
      else {
        refresh();
        toast("\u6807\u7B7E\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u767B\u5F55\u540E\u53EF\u540C\u6B65");
      }
    };
  }
  async function submit(id, action, { tagsOnly = false } = {}) {
    if (busy) return;
    if (!verified) return login(async () => {
      reason(id);
      await submit(id, action, { tagsOnly });
    });
    const d = draft(id), r = getRecord(id);
    if (!r) return;
    const comment = tagsOnly ? note(id)?.comment || "" : d.comment;
    const requestKey = id + ":" + action + ":" + (tagsOnly ? "tags" : "note");
    if (!requestIds.has(requestKey)) requestIds.set(requestKey, crypto.randomUUID());
    const submitted = { tags: [...d.tags], comment }, generation = authGeneration;
    if (action === "research" && !comment.trim()) return;
    busy = true;
    updateReason();
    refresh();
    try {
      const b = await api("records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: requestIds.get(requestKey), revision: d.baseRevision, article: { id: r.id, title: r.title, url: r.url, reportDate: r.reportDate, sourceName: r.sourceName, summary: r.summary }, tags: submitted.tags, comment: submitted.comment, action }) });
      if (generation !== authGeneration) return;
      annotations.set(id, b.annotation);
      if (b.job) {
        jobs = jobs.filter((x) => x.id !== b.job.id);
        jobs.unshift(b.job);
      }
      const changed = JSON.stringify(d.tags) !== JSON.stringify(submitted.tags) || d.comment !== submitted.comment;
      if (tagsOnly || changed) {
        d.baseRevision = b.annotation.revision;
        persist();
      } else {
        delete drafts[id];
        persist();
        if (editor === id) close();
      }
      requestIds.delete(requestKey);
      toast(changed && !tagsOnly ? "\u63D0\u4EA4\u65F6\u7684\u7406\u7531\u5DF2\u540C\u6B65\uFF0C\u65B0\u8865\u5145\u4ECD\u662F\u8349\u7A3F" : action === "research" ? "\u7406\u7531\u5DF2\u4FDD\u5B58\uFF0C\u6DF1\u7814\u5DF2\u6392\u961F" : "\u6536\u85CF\u7406\u7531\u5DF2\u4FDD\u5B58");
    } catch (e) {
      if (e.status === 401) {
        verified = false;
        toast("\u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u8349\u7A3F\u4ECD\u4FDD\u7559\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
      } else if (e.status === 409) {
        await load({ force: true });
        conflict = id;
        toast("\u5176\u4ED6\u8BBE\u5907\u5DF2\u6709\u66F4\u65B0\uFF0C\u8BF7\u5408\u5E76\u540E\u518D\u4FDD\u5B58");
      } else toast(e.message);
    } finally {
      busy = false;
      updateReason();
      refresh();
    }
  }
  async function queue() {
    if (!verified) return login(queue);
    const generation = authGeneration;
    await load({ force: true });
    if (generation !== authGeneration || !verified) return;
    show("\u6211\u7684\u7814\u7A76", jobs.length ? jobs.map((j) => {
      const a = note(j.articleId)?.article;
      return `<section class="personal-queue-item"><strong>${esc2(a?.title || "\u5DF2\u63D0\u4EA4\u60C5\u62A5")}</strong><p>${jobText(j)}</p>${j.status === "done" ? `<button class="text-button" data-ip="report" data-job="${esc2(j.id)}">\u67E5\u770B\u62A5\u544A \u2197</button>` : ""}${j.status === "failed" ? `<button class="text-button" data-ip="retry" data-job="${esc2(j.id)}">\u91CD\u8BD5\u5206\u6790</button>` : ""}</section>`;
    }).join("") : "<p>\u8FD8\u6CA1\u6709\u63D0\u4EA4\u6DF1\u7814\u3002\u6536\u85CF\u60C5\u62A5\u540E\u586B\u5199\u7406\u7531\uFF0C\u518D\u9009\u62E9\u201C\u4FDD\u5B58\u5E76\u6DF1\u7814\u201D\u3002</p>");
  }
  async function report(id) {
    const generation = authGeneration;
    try {
      const r = await api("result?id=" + encodeURIComponent(id));
      if (generation !== authGeneration || !verified) return;
      const d = show(r.job.resultStatus === "partial" ? "\u7814\u7A76\u62A5\u544A \xB7 \u90E8\u5206\u5F85\u6838\u5B9E" : "\u7814\u7A76\u62A5\u544A", '<div class="personal-report"></div>');
      d.querySelector(".personal-report").innerHTML = renderWikiMarkdown((r.text || "\u62A5\u544A\u5C1A\u672A\u5F62\u6210").replace(/^---\n[\s\S]*?\n---\n/, "")).html;
      if (r.job.threadId) {
        const p = document.createElement("p");
        p.className = "subtle-note";
        const a = note(r.job.articleId)?.article;
        p.textContent = "\u5BF9\u8BDD\u4F4D\u7F6E\uFF1AHorizon \u60C5\u62A5\u96F7\u8FBE \xB7 " + (a ? (a.reportDate || "").slice(0, 10) + " " + a.title : "\u6309\u65B0\u95FB\u65E5\u671F\u548C\u6807\u9898\u7EE7\u7EED\u8FFD\u95EE");
        d.querySelector(".personal-dialog-body").prepend(p);
      }
    } catch (e) {
      toast(e.message);
    }
  }
  document.addEventListener("input", (e) => {
    const id = e.target.dataset.ipDraft;
    if (!id) return;
    draft(id).comment = e.target.value;
    invalidate(id);
    persist();
    const box = e.target.closest(".personal-editor");
    box.querySelector("[data-ip-length]").textContent = e.target.value.length + "/1000";
    box.querySelector('[data-ip="research"]').disabled = !e.target.value.trim() || busy || conflict === id;
  });
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-ip]");
    if (!b || ["tag-option", "tag-save"].includes(b.dataset.ip)) return;
    const id = b.dataset.id;
    switch (b.dataset.ip) {
      case "close":
        close();
        refresh();
        break;
      case "login":
        login();
        break;
      case "logout":
        authGeneration++;
        authBlocked = true;
        verified = false;
        annotations.clear();
        jobs = [];
        tagFilter = "";
        close();
        refresh();
        await fetch("/api/admin/session", { method: "DELETE" });
        break;
      case "reason":
      case "comment":
        reason(id);
        break;
      case "collapse":
        close();
        refresh();
        break;
      case "tags":
        tags(id);
        break;
      case "filter":
        tagFilter = b.dataset.value;
        refresh();
        break;
      case "save":
        await submit(id, "save");
        break;
      case "research":
        await submit(id, "research");
        break;
      case "queue":
        await queue();
        break;
      case "report":
        await report(b.dataset.job);
        break;
      case "retry":
        try {
          await api("retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.dataset.job }) });
          close();
          await load({ force: true });
          refresh();
          toast("\u5DF2\u91CD\u65B0\u6392\u961F");
        } catch (err) {
          toast(err.message);
        }
        break;
      case "merge": {
        const d = draft(id), n = note(id);
        if (n?.comment && n.comment !== d.comment) d.comment = n.comment + "\n\n\u3010\u672C\u6B21\u8865\u5145\u3011\n" + d.comment;
        d.tags = [.../* @__PURE__ */ new Set([...n?.tags || [], ...d.tags])].slice(0, 12);
        d.baseRevision = n?.revision || 0;
        conflict = "";
        requestIds.clear();
        persist();
        updateReason();
        refresh();
        break;
      }
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") load();
  });
  const timer = setInterval(() => {
    if (document.visibilityState === "visible" && verified) load();
  }, 3e4);
  window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
  return { markup, toolbar, matches: () => true, load, onBookmark };
}
export {
  createIntelPersonal
};
