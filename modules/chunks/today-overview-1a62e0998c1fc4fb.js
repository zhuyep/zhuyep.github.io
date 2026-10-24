// demo/modules/intel-work-brief.js
var FIELDS = ["\u5173\u8054", "\u5173\u6CE8", "\u501F\u9274", "\u8FB9\u754C"];
var READING_INVITATIONS = {
  "intel-ef78b1ef9b0d89f1b56e": "\u8DDF\u8E2A\u5916\u90E8\u6A21\u578B\u4F9B\u7ED9\u7684\u53D8\u5316\u7EBF\u7D22\uFF0C\u4F9B\u822A\u53D1 AI \u9009\u578B\u89C2\u5BDF\uFF1B\u878D\u8D44\u8BF4\u6CD5\u4ECD\u5F85\u6838\u5B9E\u3002",
  "intel-701c1733fb9fb7f7c4fe": "\u501F\u9274\u5F15\u7528\u56FE\u8C31\uFF0C\u63A2\u7D22\u822A\u53D1\u6807\u51C6\u53D8\u66F4\u7684\u5F71\u54CD\u521D\u7B5B\u65B9\u6CD5\uFF0C\u4ECD\u987B\u4E13\u4E1A\u590D\u6838\u3002",
  "intel-674a9b4429cf6698bcc5": "\u8DDF\u8FDB\u667A\u80FD\u4F53\u8F6F\u4EF6\u7684\u6807\u51C6\u4E0E\u8BD5\u70B9\u53E3\u5F84\uFF0C\u4F9B\u822A\u53D1\u5DE5\u4E1A\u8F6F\u4EF6\u89C4\u5212\u53C2\u8003\u3002",
  "intel-8b3ef63f5c4e566c2c64": "\u501F\u6B64\u6BD4\u8F83\u4E13\u4E1A\u4EFB\u52A1\u7684\u667A\u80FD\u4F53\u8BC4\u6D4B\u65B9\u6CD5\uFF0C\u81EA\u6211\u6539\u8FDB\u4E3B\u5F20\u4ECD\u5F85\u9A8C\u8BC1\u3002",
  "intel-5089b61afea9a586ae0a": "\u4E3A AI \u7814\u7A76\u65B9\u5411\u50A8\u5907\u653F\u7B56\u7EBF\u7D22\uFF0C\u914D\u5957\u8D44\u91D1\u4E0E\u4EFB\u52A1\u4ECD\u5F85\u6838\u5B9E\u3002",
  "intel-a8282be94d69fdaa5b29": "\u501F\u5916\u90E8\u63A5\u5165\u4E89\u8BAE\uFF0C\u68C0\u67E5\u822A\u53D1\u667A\u80FD\u4F53\u7684\u6743\u9650\u3001\u8EAB\u4EFD\u4E0E\u4EBA\u5DE5\u786E\u8BA4\u8FB9\u754C\u3002",
  "intel-2d3f60d5139ccdbe0fea": "\u4E3A\u4EFF\u771F\u4E0E\u865A\u5B9E\u4EA4\u4E92\u50A8\u5907\u65B9\u5411\u7EBF\u7D22\uFF0C\u6682\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u843D\u5730\u6761\u4EF6\u3002",
  "intel-3358593b9b1411d6372a": "\u4EC5\u4F5C\u5916\u90E8 AI \u4F9B\u5E94\u5546\u7684\u8D44\u672C\u98CE\u9669\u7EBF\u7D22\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u6280\u672F\u80FD\u529B\u3002",
  "intel-7b77594de365872e0495": "\u89C2\u5BDF\u8DE8\u516C\u53F8\u4E13\u9879\u7EC4\u5982\u4F55\u9A8C\u8BC1\u5236\u9020 AI\uFF0C\u4F9B\u822A\u53D1\u5355\u5DE5\u5E8F\u8BD5\u70B9\u6BD4\u8F83\u3002",
  "intel-c93b9ce6b3af6d14585c": "\u8DDF\u8E2A\u673A\u5668\u4EBA\u4EFF\u771F\u5230\u73B0\u573A\u8C03\u8BD5\u7684\u95ED\u73AF\uFF0C\u5148\u770B\u5177\u4F53\u5DE5\u4F4D\u4E0E\u5BF9\u7167\u6570\u636E\u3002",
  "intel-0ebfe851ce4d7a530764": "\u5BF9\u7167\u822A\u53D1 AI \u8BD5\u70B9\u8F6C\u89C4\u6A21\u5316\u7684\u573A\u666F\u3001\u6570\u636E\u4E0E\u9A8C\u8BC1\u95E8\u69DB\uFF0C\u539F\u6587\u5F85\u6838\u3002",
  "intel-f4ef15a9b56c5a14baa2": "\u6BD4\u8F83\u5171\u4EAB AI \u57FA\u5EA7\u4E0E\u81EA\u5EFA\u65B9\u6848\u7684\u6570\u636E\u9694\u79BB\u8FB9\u754C\uFF0C\u5148\u6838\u5B9E\u5E73\u53F0\u80FD\u529B\u3002",
  "intel-342f6f6f025d33f9f52e": "\u4E3A\u822A\u53D1\u7B97\u529B\u9700\u6C42\u5206\u6863\u627E\u5916\u90E8\u53C2\u7167\uFF0C\u5148\u770B\u96C6\u91C7\u89C4\u683C\u4E0E\u4E2D\u6807\u7ED3\u679C\u3002",
  "intel-9d577bc6cf520103f35c": "\u6BD4\u8F83\u4EFF\u771F\u3001\u8BD5\u9A8C\u6570\u636E\u7684\u6807\u6CE8\u4E0E\u5171\u4EAB\u53E3\u5F84\uFF0C\u5148\u6838\u5BF9\u6807\u51C6\u6587\u672C\u3002",
  "intel-65f045324b9729b83caf": "\u4E3A\u822A\u53D1\u76D1\u6D4B\u7684\u7AEF\u4FA7\u63A8\u7406\u9009\u578B\u50A8\u5907\u7EBF\u7D22\uFF0C\u5148\u770B\u529F\u8017\u3001\u65F6\u5EF6\u4E0E\u51FA\u8D27\u8BC1\u636E\u3002",
  "intel-ae002f5b930a18ab9ed5": "\u5BF9\u7167\u771F\u5B9E\u6570\u636E\u7684\u91C7\u96C6\u4E0E\u6CBB\u7406\u6D41\u7A0B\uFF0C\u4E3B\u4F53\u548C\u6570\u636E\u80FD\u529B\u4ECD\u5F85\u6838\u5B9E\u3002",
  "intel-cdde3b018196abe84f69": "\u4E3A\u822A\u53D1 AI \u8BD5\u70B9\u590D\u5236\u627E\u9A8C\u6536\u53C2\u7167\uFF0C\u5148\u770B\u5177\u540D\u5BA2\u6237\u4E0E\u91CD\u590D\u90E8\u7F72\u8BC1\u636E\u3002",
  "intel-debb0c81a6d6ca3cd7a3": "\u5148\u6838\u5BF9\u7269\u7406 AI \u7684\u4EFB\u52A1\u4E0E\u6210\u529F\u7387\uFF0C\u5224\u65AD\u662F\u5426\u503C\u5F97\u505A\u822A\u53D1\u573A\u666F\u590D\u73B0\u3002",
  "intel-92a22fec30bb8929bef4": "\u4E3A\u8FB9\u7F18\u63A8\u7406\u6BD4\u8F83\u5B58\u50A8\u5E26\u5BBD\u4E0E\u529F\u8017\uFF0C\u7814\u53D1\u8BF4\u6CD5\u548C\u6307\u6807\u4ECD\u5F85\u6838\u5B9E\u3002",
  "intel-f9f897bfa311f670c855": "\u4E3A\u667A\u80FD\u4F53\u63A5\u5165 PLM\u3001MES \u6216\u4EFF\u771F\u94FE\u627E\u6848\u4F8B\uFF0C\u91CD\u70B9\u770B\u63A5\u53E3\u4E0E\u590D\u6838\u70B9\u3002"
};
function parseWorkBrief(text = "") {
  if (typeof text !== "string") return null;
  const header = text.match(/^【航发关联预判\s*·\s*([^】]+)】/);
  if (!header) return /^航发关联预判待补/.test(text) ? { pending: true } : null;
  if (header[1].includes("\u5F85\u8865")) return { pending: true };
  const end = text.indexOf("\n\u793E\u533A\u8BA8\u8BBA\uFF1A");
  const body = end < 0 ? text : text.slice(0, end);
  const values = {};
  for (let i = 0; i < FIELDS.length; i++) {
    const label = FIELDS[i], start = body.indexOf(label + "\uFF1A", header[0].length);
    if (start < 0) return null;
    const next = i < FIELDS.length - 1 ? body.indexOf(FIELDS[i + 1] + "\uFF1A", start + label.length + 1) : body.indexOf("\uFF08AI\u521D\u5224", start);
    if (next < 0) return null;
    values[label] = body.slice(start + label.length + 1, next).trim();
    if (!values[label]) return null;
  }
  const level = header[1].split("\xB7")[0].trim();
  if (!["\u76F4\u63A5\u76F8\u5173", "\u65B9\u6CD5\u53EF\u501F\u9274", "\u6301\u7EED\u89C2\u5BDF", "\u5173\u8054\u8F83\u5F31"].includes(level)) return null;
  return { level, summaryOnly: header[1].includes("\u4EC5\u636E\u6458\u8981"), values };
}
function readingReason(brief, record = {}) {
  if (!brief || brief.pending) return "";
  const invitation = READING_INVITATIONS[record.id || record.key?.replace(/^intel:/, "")];
  if (invitation) return invitation;
  const field = ["\u6301\u7EED\u89C2\u5BDF", "\u5173\u8054\u8F83\u5F31"].includes(brief.level) ? "\u5173\u6CE8" : "\u501F\u9274";
  const text = brief.values[field];
  const sentence2 = text.match(/^[\s\S]*?[。！？][”’」』]?/)?.[0] || text;
  return /[。！？][”’」』]?$/.test(sentence2) ? sentence2 : sentence2 + "\u3002";
}

// demo/modules/game-loader.js
var GAME_TITLES = { hextris: "Hextris \xB7 \u516D\u8FB9\u5F62\u6D88\u9664", "0hh1": "0h h1 \xB7 \u4E8C\u8272\u903B\u8F91", wenchen: "\u5929\u673A\u7C3F \xB7 \u4E1C\u65B9\u547D\u4E66" };

// demo/modules/today-updates.js
var SECTIONS = [["intel", "\u60C5\u62A5", "#intel"], ["books", "\u4E66\u623F", "#books"], ["video", "\u5F71\u9662", "#video"], ["games", "\u653E\u677E", "#games"], ["opc", "OPC", "/opc/"]];
var SECTION_RELEASES = [
  { id: "study-library-20261024", kind: "books", date: "2026-10-24", dateLabel: "\u529F\u80FD\u8C03\u6574", title: "\u8A00\u5E93\u5E76\u5165\u4E66\u623F\uFF0C\u8D44\u6599\u4E0E\u5199\u4F5C\u7D20\u6750\u4E00\u8D77\u67E5", note: "\u6BB5\u843D\u68C0\u7D22\u3001\u6536\u85CF\u4E0E\u590D\u5236\u4FDD\u7559\uFF0C\u539F\u6765\u7684\u7D20\u6750\u94FE\u63A5\u4ECD\u53EF\u4F7F\u7528\u3002", href: "#books/library" },
  { id: "cinema-public-20261024", kind: "video", date: "2026-10-24", dateLabel: "\u529F\u80FD\u8C03\u6574", title: "\u5F71\u9662\u514D\u5BC6\u7801\u8FDB\u5165\uFF0C\u641C\u7247\u540E\u76F4\u63A5\u64AD\u653E", note: "\u201C\u770B\u7247\u4E0D\u8FF7\u8DEF\uFF0C\u89C2\u5F71\u627E\u8001\u732A\u201D\u4FDD\u7559\u5728\u5F71\u9662\u9876\u90E8\u3002", href: "#video" },
  { id: "tianji-20260921", kind: "games", date: "2026-09-21", dateLabel: "\u5185\u5BB9\u66F4\u65B0", title: "\u5929\u673A\u7C3F\uFF1A\u672F\u8BED\u3001\u53E4\u7C4D\u77ED\u5F15\u4E0E\u672C\u76D8\u4F9D\u636E", note: "\u516D\u7AE0\u9010\u6BB5\u89E3\u91CA\u5224\u65AD\u4F9D\u636E\uFF0C\u4EE5\u53CA\u54EA\u4E9B\u6761\u4EF6\u4F1A\u6539\u53D8\u89E3\u8BFB\u3002", href: "#games" },
  { id: "games-20260905", kind: "games", date: "2026-09-05", dateLabel: "\u680F\u76EE\u4E0A\u7EBF", title: "Hextris \u4E0E 0h h1\uFF0C\u968F\u624B\u5F00\u4E00\u5C40", note: "\u516D\u8FB9\u5F62\u6D88\u9664\u4E0E\u4E8C\u8272\u903B\u8F91\uFF0C\u652F\u6301\u624B\u673A\u89E6\u63A7\u3002", href: "#games" }
];
var escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "") && Number.isFinite(Date.parse(value)) ? value : "";
var day = (value) => {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value)).map((p) => [p.type, p.value]));
  return [parts.year, parts.month, parts.day].join("-");
};
var opcHome = () => globalThis.location?.hostname === "zhuyep.github.io" ? "https://zhushi-daji-preview.pages.dev/opc/" : "/opc/";
var sectionHome = (key, href) => key === "opc" ? opcHome() : href;
var shortDate = (value) => value?.slice(5).replace("-", ".") || "";
var sentence = (value) => {
  const s = String(value ?? "").replace(/\s+/g, " ").trim();
  return s.match(/^.*?[。！？][”’」』]?/)?.[0] || s;
};
function opcSnapshot(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.events) || raw.mode === "demo" || raw.mode === "simulation") return { status: "unavailable", entries: [] };
  const seen = /* @__PURE__ */ new Set(), entries = [];
  for (const event of raw.events.slice(0, 100)) {
    if (!event || event.demo || String(event.id || "").startsWith("demo-")) continue;
    const date = day(event.received_at || event.at);
    if (!date) continue;
    const message = String(event.message ?? "").trim();
    if (!message) continue;
    const id = String(event.id || [event.received_at, event.at, event.worker_id, message].join("|"));
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push({ id: "opc:" + id, kind: "opc", date, sortAt: Date.parse(event.received_at || event.at), dateLabel: event.received_at ? "\u6536\u5230\u56DE\u62A5" : "\u4E8B\u4EF6\u8BB0\u5F55", title: String(event.task_title || event.title || [event.worker_name || "OPC", "\u5DE5\u4F5C\u56DE\u62A5"].join(" \xB7 ")), note: sentence(message), href: "/opc/" });
  }
  return { status: "ready", entries: entries.sort((a, b) => b.sortAt - a.sortAt).slice(0, 5) };
}
async function fetchOpcSnapshot(fetchImpl = globalThis.fetch) {
  if (globalThis.location?.hostname === "zhuyep.github.io") return { status: "primary", entries: [] };
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 6e3);
  try {
    const res = await fetchImpl("/api/opc/state", { method: "GET", credentials: "same-origin", cache: "no-store", redirect: "error", signal: controller.signal });
    if (res.status === 401 || res.status === 403) return { status: "locked", entries: [] };
    if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return { status: "unavailable", entries: [] };
    const reader = res.body?.getReader();
    if (!reader) return { status: "unavailable", entries: [] };
    let size = 0;
    const chunks = [];
    try {
      for (; ; ) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 262144) throw Error("Snapshot too large");
        chunks.push(part.value);
      }
    } catch (e) {
      await reader.cancel().catch(() => {
      });
      throw e;
    } finally {
      reader.releaseLock();
    }
    const all = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      all.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return opcSnapshot(JSON.parse(new TextDecoder().decode(all)));
  } catch {
    return { status: "unavailable", entries: [] };
  } finally {
    clearTimeout(timer);
  }
}
function unifiedUpdates({ data, payload, opc = { status: "pending", entries: [] }, releases = SECTION_RELEASES }) {
  const intel = (data?.intel || []).map((r) => ({ id: "intel:" + r.id, kind: "intel", date: validDate(r.reportDate), dateLabel: "\u6536\u5F55", title: r.title, note: readingReason(parseWorkBrief(r.discussion), r), noteLabel: "\u8350\u8BFB", category: r.sourceName || r.category, priority: Number(r.score) || 0, key: r.key || "intel:" + r.id }));
  const books = (payload?.yanku?.updates || []).map((u) => ({ id: "library:" + u.id, kind: "books", date: validDate(u.date), dateLabel: "\u7D20\u6750\u66F4\u65B0", title: u.title, note: sentence(u.detail), category: "\u8A00\u5E93", updateId: u.id }));
  const order = { books: 0, intel: 1, video: 2, games: 3, opc: 4 }, seen = /* @__PURE__ */ new Set();
  return [...intel, ...books, ...releases, ...opc.status === "ready" ? opc.entries : []].filter((r) => r.date && SECTIONS.some(([key]) => key === r.kind) && !seen.has(r.id) && seen.add(r.id)).sort((a, b) => b.date.localeCompare(a.date) || (b.sortAt || 0) - (a.sortAt || 0) || order[a.kind] - order[b.kind] || (b.priority || 0) - (a.priority || 0));
}
function action(row) {
  if (row.kind === "opc") return `href="${opcHome()}"`;
  if (row.key) return `data-read="${escape(row.key)}"`;
  if (row.updateId) return `data-update="${escape(row.updateId)}"`;
  return `href="${escape(SECTIONS.some(([, , href]) => href === row.href) || row.href === "#books/library" ? row.href : SECTIONS.find(([key]) => key === row.kind)?.[2] || "#today")}"`;
}
async function publicOverviewJson(url, fetchImpl) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 5e3);
  try {
    const res = await fetchImpl(url, { method: "GET", credentials: "omit", cache: "no-cache", redirect: "error", signal: controller.signal });
    if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) throw Error("Unavailable");
    const reader = res.body?.getReader();
    if (!reader) throw Error("Unavailable");
    let size = 0;
    const chunks = [];
    try {
      for (; ; ) {
        const p = await reader.read();
        if (p.done) break;
        size += p.value.byteLength;
        if (size > 65536) throw Error("Too large");
        chunks.push(p.value);
      }
    } catch (e) {
      await reader.cancel().catch(() => {
      });
      throw e;
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } finally {
    clearTimeout(timer);
  }
}
async function fetchSectionOverview(fetchImpl = globalThis.fetch) {
  const mirror = globalThis.location?.hostname === "zhuyep.github.io", results = await Promise.allSettled([publicOverviewJson("/assets/wiki/manifest.json", fetchImpl), mirror ? Promise.resolve(null) : publicOverviewJson("/api/video/status", fetchImpl)]), out = { wikiState: "unavailable", videoState: mirror ? "primary" : "unavailable" };
  const wiki = results[0].status === "fulfilled" ? results[0].value : null;
  if (Number.isInteger(wiki?.pages) && wiki.pages >= 0 && wiki.pages <= 1e5) {
    out.wikiState = "ready";
    out.wikiPages = wiki.pages;
  }
  const cinema = results[1].status === "fulfilled" ? results[1].value : null;
  if (Array.isArray(cinema?.sources) && cinema.sources.length && cinema.sources.length <= 100 && cinema.sources.every((s) => typeof s.key === "string" && /^[a-z0-9_-]+$/i.test(s.key))) {
    out.videoState = "ready";
    out.videoSources = new Set(cinema.sources.map((s) => s.key)).size;
  }
  return out;
}
function overviewCards({ updates, total, opc, overview = {} }) {
  const loading = { pending: "\u8BFB\u53D6\u4E2D", locked: "\u9700\u767B\u5F55", ready: opc.entries.length ? "\u5DF2\u8FDE\u63A5" : "\u5F85\u56DE\u62A5", unavailable: "\u6682\u4E0D\u53EF\u8BFB", primary: "\u4E3B\u7AD9\u67E5\u770B" }, hasWiki = overview.wikiState === "ready", hasVideo = overview.videoState === "ready";
  const cards = [{ key: "intel", value: total.intel, unit: "\u6761", detail: "\u5FEB\u901F\u68C0\u7D22" }, { key: "books", value: hasWiki ? overview.wikiPages : "\u2014", unit: hasWiki ? "\u9875Wiki" : "", detail: `${total.blocks} \u6BB5\u7D20\u6750` }, { key: "video", value: hasVideo ? overview.videoSources : overview.videoState === "primary" ? "\u4E3B\u7AD9" : "\u2014", unit: hasVideo ? "\u6E90" : "", detail: hasVideo ? "\u514D\u5BC6\u7801\u641C\u7247" : overview.videoState === "unavailable" ? "\u7247\u6E90\u6682\u4E0D\u53EF\u8BFB" : "\u8BFB\u53D6\u7247\u6E90" }, { key: "games", value: Object.keys(GAME_TITLES).length, unit: "\u9879", detail: "\u6E38\u620F \xB7 \u95F2\u8DA3" }, { key: "opc", value: loading[opc.status] || "\u6682\u4E0D\u53EF\u8BFB", unit: "", detail: opc.status === "ready" ? `${opc.entries.length} \u6761\u8FD1\u671F\u56DE\u62A5` : "\u79C1\u4EBA\u529E\u516C\u5BA4", status: true }];
  return `<section class="today-module-overview" aria-label="\u5DE5\u4F5C\u53F0\u603B\u89C8"><nav class="today-module-grid" aria-label="\u4E94\u4E2A\u680F\u76EE\u603B\u89C8">${cards.map((card) => {
    const [, label, href] = SECTIONS.find(([key]) => key === card.key), latest = updates.find((r) => r.kind === card.key), dateText = latest ? "\u66F4\u65B0 " + shortDate(latest.date) : card.key === "opc" && opc.status === "ready" ? "\u5C1A\u65E0\u56DE\u62A5" : "\u8FDB\u5165\u67E5\u770B", accessible = [label, card.value + card.unit, card.detail, latest ? latest.date + " " + latest.dateLabel : ""].filter(Boolean).join("\uFF0C");
    return `<a class="today-module-card${card.status ? " is-status" : ""}" data-overview="${card.key}" href="${sectionHome(card.key, href)}" aria-label="${escape(accessible)}"><span class="today-module-label">${label}</span><strong>${escape(card.value)}<small>${card.unit}</small></strong><span class="today-module-detail">${escape(card.detail)}</span><span class="today-module-date">${escape(dateText)}</span></a>`;
  }).join("")}</nav></section>`;
}
function renderToday({ data, payload, filter = "all", limit = 18, opc = { status: "pending", entries: [] }, visits = "", overview = {}, now = /* @__PURE__ */ new Date() }) {
  if (filter === "library") filter = "books";
  const updates = unifiedUpdates({ data, payload, opc }), rows = updates.filter((r) => filter === "all" || r.kind === filter), visible = rows.slice(0, limit), total = payload?.meta?.counts || { intel: data?.intel?.length || 0, blocks: data?.blocks?.length || 0 };
  const currentDate = day(now), dateLabel = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric", weekday: "short" }).format(now);
  let empty = "";
  if (!visible.length) {
    const text = filter === "opc" ? { locked: "\u767B\u5F55\u529E\u516C\u5BA4\u540E\uFF0C\u8FD9\u91CC\u4F1A\u6C47\u603B\u6700\u8FD1\u7684\u771F\u5B9E\u5DE5\u4F5C\u56DE\u62A5\u3002", unavailable: "\u6682\u65F6\u8BFB\u4E0D\u5230\u529E\u516C\u5BA4\u52A8\u6001\uFF0C\u53EF\u4EE5\u7A0D\u540E\u91CD\u8BD5\u3002", pending: "\u6B63\u5728\u8BFB\u53D6\u529E\u516C\u5BA4\u52A8\u6001\u2026\u2026", ready: "\u5C1A\u672A\u6536\u5230\u5DE5\u4F5C\u56DE\u62A5\uFF0C\u53EF\u8FDB\u5165\u529E\u516C\u5BA4\u67E5\u770B\u4EFB\u52A1\u3002", primary: "OPC \u5DE5\u4F5C\u56DE\u62A5\u5728\u4E3B\u7AD9\u6309\u767B\u5F55\u6743\u9650\u5C55\u793A\u3002" }[opc.status] : "\u8FD9\u4E2A\u680F\u76EE\u8FD8\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u66F4\u65B0\u3002";
    empty = `<div class="today-feed-empty"><p>${escape(text)}</p>${filter === "opc" ? `<a href="${opcHome()}">\u8FDB\u5165 OPC \u529E\u516C\u5BA4 \u2197</a>${["locked", "unavailable"].includes(opc.status) ? '<button class="text-button" data-action="today-opc-refresh">\u5237\u65B0\u52A8\u6001</button>' : ""}` : ""}</div>`;
  }
  const markup = visible.map((r) => {
    const tag = r.key || r.updateId ? "button" : "a", label = SECTIONS.find(([key]) => key === r.kind)[1];
    return `<article class="today-entry"><${tag} class="today-entry-open" ${tag === "button" ? 'type="button" ' : ""}${action(r)}><span class="today-entry-meta"><span class="today-entry-kind">${label}${r.category ? " \xB7 " + escape(r.category) : ""}</span><time datetime="${r.date}">${shortDate(r.date)} ${escape(r.dateLabel)}</time></span><h3>${escape(r.title)}</h3>${r.note ? `<p class="today-entry-note">${r.noteLabel ? "<span>" + escape(r.noteLabel) + "</span>" : ""}${escape(r.note)}</p>` : ""}</${tag}></article>`;
  }).join("");
  const countText = filter === "opc" && opc.status !== "ready" ? { pending: "\u8BFB\u53D6\u4E2D", locked: "\u9700\u767B\u5F55", unavailable: "\u6682\u4E0D\u53EF\u8BFB", primary: "\u4E3B\u7AD9\u67E5\u770B" }[opc.status] || "\u6682\u4E0D\u53EF\u8BFB" : `\u6700\u8FD1 ${visible.length} \u6761`;
  const more = rows.length > limit || payload?.meta?.summary && ["all", "intel"].includes(filter) ? '<button class="today-feed-more" data-action="today-more">\u518D\u770B\u4E00\u4E9B \u2193</button>' : "";
  return `<div class="today-dashboard"><section class="today-heading"><div><h1>\u4ECA\u65E5\u4E00\u89C8</h1><time class="today-date" datetime="${currentDate}">${escape(dateLabel)}</time></div><button data-action="visits" class="today-visits visit-overview" aria-label="\u4ECA\u65E5\u8BBF\u95EE\uFF0C\u67E5\u770B\u8FD17\u5929\u8D8B\u52BF">${visits}</button></section>${payload?.meta?.stale ? `<p class="status-warning" role="status">${escape(payload.meta.message || "\u6B63\u5728\u5C55\u793A\u4E0A\u4E00\u6B21\u53EF\u7528\u8D44\u6599\u3002")}</p>` : ""}${overviewCards({ updates, total, opc, overview })}<section class="today-feed" aria-labelledby="today-feed-title"><div class="section-heading"><h2 id="today-feed-title">\u66F4\u65B0\u52A8\u6001</h2><small>${countText}</small></div><div class="tabs today-feed-tabs" aria-label="\u66F4\u65B0\u5206\u7C7B">${[["all", "\u5168\u90E8"], ...SECTIONS.map(([key, label]) => [key, label])].map(([key, label]) => `<button data-today="${key}" class="${filter === key ? "active" : ""}" aria-pressed="${filter === key}">${label}</button>`).join("")}</div><div class="today-feed-entries">${markup}${empty}</div>${more}</section></div>`;
}
export {
  SECTIONS,
  SECTION_RELEASES,
  fetchOpcSnapshot,
  fetchSectionOverview,
  opcSnapshot,
  overviewCards,
  renderToday,
  unifiedUpdates
};
