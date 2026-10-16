// demo/modules/video-cinema.js
var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var HISTORY = "zhushi-daji-cinema-v1";
var remembered = { query: "", list: [], failures: [], selected: ["baofeng", "feifan", "liangzi"] };
var names = { baofeng: "\u66B4\u98CE\u8D44\u6E90", feifan: "\u975E\u51E1\u8D44\u6E90", liangzi: "\u91CF\u5B50\u8D44\u6E90" };
var plain = (value) => value.replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase();
function cinemaShell() {
  return `<section class="cinema" id="jiguang-cinema" aria-label="\u5409\u5149\u5F71\u9662"><header class="cinema-heading"><div><span class="eyebrow">\u5149\u5F71\u5C0F\u61A9 \xB7 \u7535\u5F71\u4E0E\u5267\u96C6</span><h1>\u5409\u5149\u5F71\u9662<span class="cinema-stub" aria-hidden="true">\u5149</span></h1><p>\u641C\u4E00\u90E8\u7247\uFF0C\u7559\u4E00\u70B9\u597D\u65F6\u5149\u3002</p></div><span class="cinema-heading-note">\u8BF8\u4E8B\u5927\u5409 \xB7 \u79C1\u4EBA\u653E\u6620\u5BA4</span></header><p class="cinema-message" role="status">\u6B63\u5728\u6253\u5F00\u5F71\u9662\u2026\u2026</p></section>`;
}
function mountCinema(host) {
  if (location.hostname === "zhuyep.github.io") {
    host.innerHTML += '<div class="cinema-door"><h2>\u53BB\u5F71\u9662\u5750\u5750</h2><p>\u5728\u7EBF\u641C\u7D22\u548C\u89C2\u770B\u5728\u8BF8\u4E8B\u5927\u5409\u4E3B\u7AD9\u63D0\u4F9B\u3002</p><a class="primary-button" href="https://zhushi-daji-preview.pages.dev/#video">\u6253\u5F00\u5409\u5149\u5F71\u9662 \u2197</a></div>';
    return () => {
    };
  }
  const lifecycle = new AbortController();
  let disposed = false, verified = false, configured = true, busy = false, message = "", requestId = 0;
  let detail = null, episodeIndex = 0, stopPlayer = () => {
  }, playVersion = 0, pending;
  const state = { ...remembered, selected: [...remembered.selected] };
  let history = [];
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY) || "[]");
    if (Array.isArray(value)) history = value.filter((v) => v && names[v.sourceKey] && /^[\w-]+$/.test(v.id)).slice(0, 30);
  } catch {
  }
  async function api(path, options = {}) {
    const response = await fetch("/api/video/" + path, { credentials: "same-origin", cache: "no-store", ...options });
    let data;
    try {
      data = await response.json();
    } catch {
      throw Error("\u5F71\u9662\u6682\u65F6\u6CA1\u6709\u54CD\u5E94\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5");
    }
    if (!response.ok) {
      if (response.status === 401) {
        verified = false;
        stopPlayer();
        detail = null;
      }
      throw Error(data.error || (data.failures?.length ? "\u7247\u6E90\u6682\u65F6\u6CA1\u6709\u54CD\u5E94\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u66F4\u6362\u6765\u6E90" : "\u6682\u65F6\u672A\u80FD\u6253\u5F00\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5"));
    }
    return data;
  }
  const historyMarkup = () => history.length ? `<section class="cinema-history"><h2>\u7EE7\u7EED\u89C2\u770B</h2><div>${history.slice(0, 3).map((v, i) => `<button data-cinema-history="${i}"><strong>${esc(v.name)}</strong><span>${esc(names[v.sourceKey])} \xB7 \u7B2C${Number(v.index || 0) + 1}\u96C6 \xB7 ${Math.floor(Number(v.position || 0) / 60)}\u5206\u5904</span></button>`).join("")}</div></section>` : "";
  function groups() {
    const grouped = /* @__PURE__ */ new Map();
    for (const item of state.list) {
      const key = plain(item.name) + ":" + item.year;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }
    return [...grouped.values()];
  }
  function resultMarkup() {
    if (busy) return '<div class="cinema-empty" role="status"><span class="cinema-reel" aria-hidden="true">\u25C9</span><h2>\u6B63\u5728\u641C\u7247</h2><p>\u9010\u4E2A\u67E5\u8BE2\u5DF2\u9009\u6765\u6E90\uFF0C\u8BF7\u7A0D\u7B49\u7247\u523B\u3002</p></div>';
    if (!state.query) return historyMarkup() + `<div class="cinema-empty"><span class="cinema-reel" aria-hidden="true">\u25B6</span><h2>\u4ECA\u665A\uFF0C\u60F3\u770B\u4EC0\u4E48\uFF1F</h2><p>\u8F93\u5165\u7247\u540D\uFF0C\u7535\u5F71\u548C\u7535\u89C6\u5267\u90FD\u53EF\u4EE5\u641C\u3002</p><div class="cinema-examples">${["\u6D41\u6D6A\u5730\u7403", "\u7405\u740A\u699C", "\u54EA\u5412\u4E4B\u9B54\u7AE5\u964D\u4E16"].map((q) => `<button data-cinema-example="${q}">${q}</button>`).join("")}</div></div>`;
    const grouped = groups();
    return `${state.failures.length ? `<p class="cinema-warning" role="status">${esc(state.failures.join("\u3001"))}\u6682\u65F6\u672A\u80FD\u54CD\u5E94\uFF0C\u5DF2\u5C55\u793A\u5176\u4F59\u6765\u6E90\u7684\u7ED3\u679C\u3002</p>` : ""}<div class="cinema-result-heading"><h2>\u201C${esc(state.query)}\u201D</h2><span>${grouped.length}\u90E8 \xB7 ${state.list.length}\u6761\u7ED3\u679C</span></div>${!grouped.length ? '<div class="cinema-empty"><h2>\u6682\u65F6\u6CA1\u6709\u627E\u5230</h2><p>\u8BD5\u8BD5\u7247\u540D\u7B80\u79F0\uFF0C\u6216\u52FE\u9009\u5176\u4ED6\u6765\u6E90\u540E\u91CD\u65B0\u641C\u7D22\u3002</p></div>' : `<div class="cinema-grid">${grouped.map((items, i) => {
      const item = items[0];
      return `<button class="cinema-card" data-cinema-open="${i}" aria-label="\u9009\u96C6\u89C2\u770B\uFF1A${esc(item.name)}\uFF0C${esc(item.year)}\uFF0C${items.length}\u4E2A\u6765\u6E90"><span class="cinema-poster"><span aria-hidden="true">\u5149\u5F71</span>${item.cover ? `<img src="${esc(item.cover)}" alt="${esc(item.name)}" loading="lazy" referrerpolicy="no-referrer">` : ""}<small>${items.length}\u4E2A\u6765\u6E90</small></span><strong>${esc(item.name)}</strong><span class="cinema-card-meta">${esc(item.year || "\u5E74\u4EFD\u672A\u6807\u6CE8")} \xB7 ${esc(item.type || "\u5F71\u89C6")}</span><span class="cinema-card-note">${esc(item.remarks)} <i aria-hidden="true">\u2197</i></span></button>`;
    }).join("")}</div>`}`;
  }
  function playerMarkup() {
    if (!detail) return "";
    if (detail.loading) return '<section class="cinema-player-panel"><p role="status">\u6B63\u5728\u6253\u5F00\u5267\u96C6\u4FE1\u606F\u2026\u2026</p><button class="text-button" data-cinema-back>\u2190 \u8FD4\u56DE\u641C\u7D22\u7ED3\u679C</button></section>';
    const alternatives = state.list.filter((v) => plain(v.name) === plain(detail.name) && v.year === detail.year);
    return `<section class="cinema-player-panel" aria-label="${esc(detail.name)}\u64AD\u653E\u5668"><header><button class="text-button" data-cinema-back>\u2190 \u8FD4\u56DE\u641C\u7D22\u7ED3\u679C</button><span>${esc(detail.sourceName)} \xB7 \u7B2C${episodeIndex + 1}/${detail.episodes.length}\u96C6</span></header><h2>${esc(detail.name)}</h2><div class="cinema-screen"><video controls playsinline preload="metadata" crossorigin="anonymous" aria-label="${esc(detail.name)}\u89C6\u9891"></video></div><p class="cinema-play-error" role="alert" hidden></p><div class="cinema-play-actions"><button class="secondary-button" data-cinema-previous ${episodeIndex <= 0 ? "disabled" : ""}>\u4E0A\u4E00\u96C6</button><button class="primary-button" data-cinema-next ${episodeIndex >= detail.episodes.length - 1 ? "disabled" : ""}>\u4E0B\u4E00\u96C6</button><span>\u652F\u6301\u5168\u5C4F\u3001\u62D6\u52A8\u4E0E\u500D\u901F</span></div><div class="cinema-alternatives"><span>\u6362\u4E2A\u6765\u6E90</span>${alternatives.map((v, i) => `<button data-cinema-source="${i}" aria-pressed="${v.sourceKey === detail.sourceKey}">${esc(v.sourceName)}</button>`).join("") || `<span>${esc(detail.sourceName)}</span>`}</div><details class="cinema-episodes" open><summary>\u5267\u96C6\u5217\u8868 \xB7 ${detail.episodes.length}\u96C6</summary><div>${detail.episodes.map((e, i) => `<button data-cinema-episode="${i}" aria-label="\u64AD\u653E\u7B2C${i + 1}\u96C6" aria-pressed="${i === episodeIndex}">${esc(e.name || String(i + 1))}</button>`).join("")}</div></details></section>`;
  }
  function draw() {
    if (disposed) return;
    host.innerHTML = `<header class="cinema-heading"><div><span class="eyebrow">\u5149\u5F71\u5C0F\u61A9 \xB7 \u7535\u5F71\u4E0E\u5267\u96C6</span><h1>\u5409\u5149\u5F71\u9662<span class="cinema-stub" aria-hidden="true">\u5149</span></h1><p>\u641C\u4E00\u90E8\u7247\uFF0C\u7559\u4E00\u70B9\u597D\u65F6\u5149\u3002</p></div>${verified ? '<button class="text-button" data-cinema-logout>\u9000\u51FA\u89C2\u5F71</button>' : '<span class="cinema-heading-note">\u8BF8\u4E8B\u5927\u5409 \xB7 \u79C1\u4EBA\u653E\u6620\u5BA4</span>'}</header>${!verified ? `<section class="cinema-door"><span class="cinema-door-mark" aria-hidden="true">\u6620</span><div><h2>${configured ? "\u8F93\u5165\u89C2\u5F71\u5BC6\u7801" : "\u5F71\u9662\u6682\u65F6\u672A\u80FD\u6253\u5F00"}</h2><p>${configured ? "\u7528\u6B64\u524D\u8BBE\u7F6E\u7684\u89C2\u5F71\u5BC6\u7801\uFF0C\u8FDB\u5165\u7535\u5F71\u4E0E\u5267\u96C6\u641C\u7D22\u3002" : "\u8BF7\u7A0D\u540E\u5237\u65B0\u91CD\u8BD5\u3002"}</p>${configured ? '<form data-cinema-login><label for="cinema-password">\u89C2\u5F71\u5BC6\u7801</label><div><input id="cinema-password" type="password" autocomplete="current-password" required maxlength="200"><button class="primary-button" type="submit">\u8FDB\u5165\u5F71\u9662</button></div></form>' : ""}<p class="cinema-message" role="alert">${esc(message)}</p></div></section>` : `<form class="cinema-search" data-cinema-search><label for="cinema-query">\u7247\u540D</label><div class="cinema-search-line"><input id="cinema-query" type="search" value="${esc(state.query)}" maxlength="80" placeholder="\u7535\u5F71\u3001\u7535\u89C6\u5267\uFF0C\u8F93\u5165\u7247\u540D\u641C\u4E00\u641C" required autocomplete="off"><button class="primary-button" type="submit" ${busy ? "disabled" : ""}>${busy ? "\u641C\u7D22\u4E2D\u2026" : "\u641C\u7247"}</button></div><fieldset><legend>\u641C\u7D22\u6765\u6E90</legend>${Object.entries(names).map(([key, name]) => `<label><input type="checkbox" data-cinema-filter="${key}" ${state.selected.includes(key) ? "checked" : ""}>${name}</label>`).join("")}</fieldset></form><p class="cinema-message" role="alert">${esc(message)}</p><div class="cinema-content">${detail ? playerMarkup() : resultMarkup()}</div><p class="cinema-footnote">\u5F71\u7247\u6765\u81EA\u6240\u9009\u7B2C\u4E09\u65B9\u6765\u6E90\uFF0C\u6E05\u6670\u5EA6\u548C\u53EF\u64AD\u60C5\u51B5\u4F1A\u6709\u53D8\u5316\u3002\u8FDB\u5EA6\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u3002<a href="https://github.com/LibreSpark/LibreTV" target="_blank" rel="noopener noreferrer">\u7075\u611F\u6765\u81EALibreTV \u2197</a></p>`}`;
  }
  async function search(query) {
    query = query.trim();
    if (!query || !state.selected.length) {
      message = "\u8BF7\u8F93\u5165\u7247\u540D\uFF0C\u5E76\u81F3\u5C11\u52FE\u9009\u4E00\u4E2A\u6765\u6E90";
      draw();
      return;
    }
    pending?.abort();
    pending = new AbortController();
    const id = ++requestId;
    stopPlayer();
    detail = null;
    state.query = query;
    busy = true;
    message = "";
    draw();
    try {
      const response = await api("search?" + new URLSearchParams({ q: query, sources: state.selected.join(",") }), { signal: pending.signal });
      if (disposed || id !== requestId) return;
      state.list = response.list;
      state.failures = response.failures;
    } catch (error) {
      if (id !== requestId || disposed || error.name === "AbortError") return;
      state.list = [];
      state.failures = [];
      message = error.message;
    }
    if (id === requestId && !disposed) {
      busy = false;
      remembered = { ...state };
      draw();
    }
  }
  async function open(item, index = 0) {
    stopPlayer();
    const id = ++requestId;
    message = "";
    detail = { loading: true };
    draw();
    try {
      const next = await api("detail?" + new URLSearchParams({ source: item.sourceKey, id: item.id }));
      if (disposed || id !== requestId) return;
      detail = next;
      episodeIndex = Math.min(Math.max(index, 0), detail.episodes.length - 1);
      draw();
      startPlayer();
    } catch (error) {
      if (!disposed && id === requestId) {
        detail = null;
        message = error.message;
        draw();
      }
    }
  }
  function startPlayer() {
    const video = host.querySelector("video"), current = detail, index = episodeIndex, version = ++playVersion;
    const episode = current.episodes[index];
    let hls, lastSaved = 0;
    const updateHistory = () => {
      if (!Number.isFinite(video.currentTime) || video.currentTime < 1) return;
      const entry = { sourceKey: current.sourceKey, id: current.id, name: current.name, year: current.year, index, position: video.currentTime, updatedAt: Date.now() };
      history = [entry, ...history.filter((v) => v.sourceKey !== current.sourceKey || v.id !== current.id)].slice(0, 30);
      try {
        localStorage.setItem(HISTORY, JSON.stringify(history));
      } catch {
      }
    };
    const error = () => {
      const el = host.querySelector(".cinema-play-error");
      if (el && version === playVersion) {
        el.hidden = false;
        el.textContent = "\u8FD9\u4E2A\u6765\u6E90\u6682\u65F6\u65E0\u6CD5\u64AD\u653E\uFF0C\u8BD5\u8BD5\u4E0B\u65B9\u7684\u5176\u4ED6\u6765\u6E90\u3002";
      }
    };
    const previous = history.find((v) => v.sourceKey === current.sourceKey && v.id === current.id && v.index === index);
    video.addEventListener("loadedmetadata", () => {
      if (previous && previous.position < video.duration - 15) video.currentTime = previous.position;
      video.play().catch(() => {
      });
    }, { once: true });
    video.addEventListener("timeupdate", () => {
      if (Date.now() - lastSaved > 5e3) {
        lastSaved = Date.now();
        updateHistory();
      }
    });
    video.addEventListener("pause", updateHistory);
    video.addEventListener("error", error);
    video.addEventListener("ended", () => {
      if (index < current.episodes.length - 1 && version === playVersion) changeEpisode(index + 1);
    });
    stopPlayer = () => {
      ++playVersion;
      updateHistory();
      video.pause();
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
      stopPlayer = () => {
      };
    };
    if (!/\.m3u8(?:[?#]|$)/i.test(episode.url) || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = episode.url;
      return;
    }
    const hlsPath = "/vendor/hls.light.mjs";
    import(hlsPath).then(({ default: Hls }) => {
      if (disposed || version !== playVersion || !video.isConnected) return;
      if (!Hls.isSupported()) {
        error();
        return;
      }
      hls = new Hls({ maxBufferLength: 30, backBufferLength: 30, maxMaxBufferLength: 60, enableWorker: true });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) error();
      });
      hls.loadSource(episode.url);
      hls.attachMedia(video);
    }).catch(error);
  }
  function changeEpisode(index) {
    stopPlayer();
    episodeIndex = index;
    draw();
    startPlayer();
  }
  host.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (event.target.matches("[data-cinema-search]")) {
      search(host.querySelector("#cinema-query").value);
      return;
    }
    if (event.target.matches("[data-cinema-login]")) {
      const submit = event.target.querySelector("button");
      submit.disabled = true;
      try {
        await api("auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: host.querySelector("#cinema-password").value }) });
        if (disposed) return;
        verified = true;
        message = "";
        draw();
      } catch (error) {
        if (!disposed) {
          message = error.message;
          draw();
        }
      }
    }
  }, { signal: lifecycle.signal });
  host.addEventListener("click", async (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-cinema-open")) {
      const item = groups()[Number(b.dataset.cinemaOpen)]?.[0];
      if (item) open(item);
    }
    if (b.hasAttribute("data-cinema-example")) search(b.dataset.cinemaExample);
    if (b.hasAttribute("data-cinema-history")) {
      const entry = history[Number(b.dataset.cinemaHistory)];
      if (entry) open(entry, entry.index);
    }
    if (b.hasAttribute("data-cinema-back")) {
      stopPlayer();
      ++requestId;
      detail = null;
      draw();
    }
    if (b.hasAttribute("data-cinema-episode")) changeEpisode(Number(b.dataset.cinemaEpisode));
    if (b.hasAttribute("data-cinema-next")) changeEpisode(episodeIndex + 1);
    if (b.hasAttribute("data-cinema-previous")) changeEpisode(episodeIndex - 1);
    if (b.hasAttribute("data-cinema-source")) {
      const alternatives = state.list.filter((v) => plain(v.name) === plain(detail.name) && v.year === detail.year);
      const item = alternatives[Number(b.dataset.cinemaSource)];
      if (item) open(item, episodeIndex);
    }
    if (b.hasAttribute("data-cinema-logout")) {
      try {
        await api("auth", { method: "DELETE" });
      } finally {
        if (!disposed) {
          stopPlayer();
          verified = false;
          detail = null;
          message = "";
          draw();
        }
      }
    }
  }, { signal: lifecycle.signal });
  host.addEventListener("change", (event) => {
    if (!event.target.hasAttribute("data-cinema-filter")) return;
    const key = event.target.dataset.cinemaFilter;
    state.query = host.querySelector("#cinema-query").value;
    state.selected = event.target.checked ? [.../* @__PURE__ */ new Set([...state.selected, key])] : state.selected.filter((v) => v !== key);
  }, { signal: lifecycle.signal });
  host.addEventListener("error", (event) => {
    if (event.target.tagName === "IMG") event.target.remove();
  }, { capture: true, signal: lifecycle.signal });
  api("status").then((status) => {
    if (!disposed) {
      configured = status.configured;
      verified = status.verified;
      draw();
    }
  }).catch(() => {
    if (!disposed) {
      configured = false;
      message = "\u8BF7\u7A0D\u540E\u5237\u65B0\u91CD\u8BD5";
      draw();
    }
  });
  return () => {
    disposed = true;
    ++requestId;
    pending?.abort();
    stopPlayer();
    lifecycle.abort();
    remembered = { ...state };
  };
}

export {
  cinemaShell,
  mountCinema
};
