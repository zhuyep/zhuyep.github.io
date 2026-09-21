import {
  NODE_LABELS,
  buildIntelTrends,
  buildKnowledgeGraph,
  filterByFacet,
  validReportDate
} from "./modules/chunks/chunk-Y36WSFEI.js";

// demo/modules/game-loader.js
var GAMES = { hextris: "Hextris \xB7 \u516D\u8FB9\u5F62\u6D88\u9664", "0hh1": "0h h1 \xB7 \u4E8C\u8272\u903B\u8F91", wenchen: "\u5929\u673A\u7C3F \xB7 \u4E1C\u65B9\u547D\u4E66" };
function createGameLoader({ dialog, container, title: title2, events = window, slowMs = 12e3, timeoutMs = 45e3 }) {
  let cleanup = () => {
  };
  function stop() {
    cleanup();
    cleanup = () => {
    };
    container.replaceChildren();
  }
  function open(game) {
    if (!Object.hasOwn(GAMES, game)) return;
    stop();
    title2.textContent = GAMES[game];
    const subject = game === "wenchen" ? "\u5929\u673A\u7C3F" : "\u6E38\u620F";
    container.innerHTML = `<section class="game-loading" aria-label="\u8FDB\u5165${subject}"><div class="game-loading-inner"><span class="eyebrow">\u7247\u523B\u95F2\u8DA3</span><h2>\u6B63\u5728\u6253\u5F00${subject}</h2><p class="game-load-status" role="status" aria-live="polite">\u6B63\u5728\u8FDE\u63A5${subject}\u2026\u2026</p><progress class="game-load-progress" max="3" aria-label="${subject}\u52A0\u8F7D\u8FDB\u5EA6"></progress><ol class="game-load-steps" aria-label="\u52A0\u8F7D\u6B65\u9AA4"><li>\u8FDE\u63A5${subject}</li><li>\u8F7D\u5165\u8D44\u6E90</li><li>\u51C6\u5907\u753B\u9762</li></ol><p class="game-load-hint">\u9996\u6B21\u8FDB\u5165\u7A0D\u7B49\u7247\u523B\uFF0C\u518D\u6B21\u6253\u5F00\u4F1A\u590D\u7528\u5DF2\u7F13\u5B58\u7684\u8D44\u6E90\u3002</p><button class="secondary-button game-load-retry" hidden>\u91CD\u65B0\u52A0\u8F7D</button></div></section>`;
    const overlay = container.firstElementChild, status = overlay.querySelector(".game-load-status"), progress = overlay.querySelector("progress"), retry = overlay.querySelector("button"), steps = [...overlay.querySelectorAll("li")];
    const frame = document.createElement("iframe");
    frame.title = GAMES[game];
    frame.allow = "fullscreen";
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.className = "game-loading-frame";
    let done = false, stage = 0;
    const slow = events.setTimeout(() => {
      if (!done) {
        status.textContent = "\u7F51\u7EDC\u8F83\u6162\uFF0C\u4ECD\u5728\u52A0\u8F7D\u3002\u4E5F\u53EF\u4EE5\u91CD\u8BD5\u3002";
        retry.hidden = false;
      }
    }, slowMs);
    const timeout = events.setTimeout(() => fail("\u52A0\u8F7D\u6682\u672A\u5B8C\u6210\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5\u3002"), timeoutMs);
    function fail(message2) {
      if (done) return;
      done = true;
      events.clearTimeout(slow);
      events.clearTimeout(timeout);
      frame.remove();
      status.textContent = message2;
      progress.hidden = true;
      retry.hidden = false;
    }
    function message(event) {
      const msg = event.data;
      if (done || event.origin !== location.origin || event.source !== frame.contentWindow || msg?.type !== "daji-game-load" || msg.game !== game) return;
      if (msg.stage === "error") {
        fail("\u6E38\u620F\u542F\u52A8\u9047\u5230\u95EE\u9898\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u3002");
        return;
      }
      const next = { resources: 1, preparing: 2, ready: 3 }[msg.stage];
      if (!next || next < stage) return;
      stage = next;
      progress.value = stage;
      steps.forEach((el, i) => el.classList.toggle("complete", i < stage));
      status.textContent = { 1: "\u6B63\u5728\u8F7D\u5165\u6E38\u620F\u8D44\u6E90\u2026\u2026", 2: "\u6B63\u5728\u51C6\u5907\u753B\u9762\u2026\u2026", 3: "\u51C6\u5907\u597D\u4E86\uFF0C\u5F00\u59CB\u5427\u3002" }[stage];
      if (stage === 3) {
        done = true;
        events.clearTimeout(slow);
        events.clearTimeout(timeout);
        overlay.remove();
        frame.classList.remove("game-loading-frame");
        frame.removeAttribute("aria-hidden");
        frame.removeAttribute("tabindex");
      }
    }
    retry.addEventListener("click", () => open(game));
    events.addEventListener("message", message);
    cleanup = () => {
      done = true;
      events.clearTimeout(slow);
      events.clearTimeout(timeout);
      events.removeEventListener("message", message);
    };
    frame.src = `games/${game}/`;
    container.append(frame);
    if (!dialog.open) dialog.showModal();
  }
  dialog.addEventListener("close", stop);
  return { open, stop };
}

// demo/modules/desk-toys.js
var mounted = /* @__PURE__ */ new WeakMap();
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function mountDeskToys(root = document) {
  const doc = root.ownerDocument || root;
  const view = doc.defaultView;
  if (!view?.requestAnimationFrame || !root.querySelectorAll) return () => {
  };
  const reduced = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  const controllers = /* @__PURE__ */ new Map();
  let destroyed = false;
  for (const button2 of root.querySelectorAll("button[data-desk-toy]")) {
    let paint = function() {
      if (kind === "zhu") {
        const roll = angle * 0.18;
        moving.style.transform = `translateX(${roll}%) rotate(${angle}deg)`;
        if (shadow) shadow.style.transform = `translateX(${roll * 0.8}%) scaleX(${1 - Math.abs(angle) / 160})`;
      } else moving.style.transform = `rotate(${angle}deg)`;
    }, stopFrame = function() {
      if (frame) view.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
    }, releasePointer = function() {
      const previous = pointer;
      pointer = null;
      if (previous && button2.hasPointerCapture?.(previous.id)) button2.releasePointerCapture(previous.id);
    }, rest = function() {
      if (disposed) return;
      stopFrame();
      velocity = 0;
      if (pointer) skipPointerClick = true;
      releasePointer();
      angle = kind === "zhu" ? 0 : angle % 360;
      paint();
    }, step = function(time) {
      frame = 0;
      if (!canMove()) {
        rest();
        return;
      }
      const dt = lastTime === null ? 1 / 60 : clamp((time - lastTime) / 1e3, 0, 0.032);
      lastTime = time;
      if (kind === "zhu") {
        velocity += (-75 * angle - 6.3 * velocity) * dt;
        angle += velocity * dt;
        if (Math.abs(angle) > 32) {
          angle = clamp(angle, -32, 32);
          velocity *= -0.35;
        }
        if (Math.abs(angle) < 0.04 && Math.abs(velocity) < 0.3) {
          rest();
          return;
        }
      } else {
        angle += velocity * dt;
        velocity *= Math.exp(-1.8 * dt);
        if (Math.abs(velocity) < 6) {
          rest();
          return;
        }
      }
      paint();
      frame = view.requestAnimationFrame(step);
    }, wake = function() {
      if (!canMove()) {
        rest();
        return;
      }
      if (!frame) frame = view.requestAnimationFrame(step);
    };
    const kind = button2.dataset.deskToy;
    const movingSelector = { zhu: ".desk-toy-rocker", windmill: ".desk-toy-wheel" }[kind];
    if (!movingSelector) continue;
    const moving = button2.querySelector(movingSelector);
    if (!moving) continue;
    mounted.get(button2)?.destroy();
    const shadow = button2.querySelector(".desk-toy-shadow");
    const original = {
      transform: moving.style.transform,
      shadow: shadow?.style.transform,
      touchAction: button2.style.touchAction,
      label: button2.getAttribute("aria-label")
    };
    if (!original.label) button2.setAttribute("aria-label", kind === "zhu" ? "\u62E8\u4E00\u62E8\u5C0F\u6731\u4E0D\u5012\u7FC1\uFF0C\u677E\u624B\u540E\u6162\u6162\u7AD9\u7A33" : "\u62E8\u4E00\u62E8\u7EB8\u98CE\u8F66\uFF0C\u8BA9\u5B83\u8F6C\u52A8\u540E\u6162\u6162\u505C\u4E0B");
    button2.style.touchAction = "pan-y pinch-zoom";
    let angle = kind === "zhu" ? 0 : -12;
    let velocity = 0, frame = 0, lastTime = null, pointer = null;
    let visible = true, disposed = false, skipPointerClick = false;
    const listeners = [];
    const canMove = () => !disposed && visible && !doc.hidden && !reduced?.matches;
    const on = (type, callback) => {
      button2.addEventListener(type, callback);
      listeners.push([type, callback]);
    };
    on("pointerdown", (event) => {
      if (!canMove() || event.button !== 0 || event.isPrimary === false || pointer) return;
      skipPointerClick = false;
      stopFrame();
      pointer = {
        id: event.pointerId,
        type: event.pointerType,
        x: event.clientX,
        y: event.clientY,
        angle,
        lastX: event.clientX,
        lastAt: event.timeStamp,
        speed: 0,
        dragging: false
      };
    });
    on("pointermove", (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (!pointer.dragging) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        if (Math.abs(dy) >= Math.abs(dx)) {
          rest();
          return;
        }
        pointer.dragging = true;
        button2.setPointerCapture?.(pointer.id);
      }
      if (event.cancelable) event.preventDefault();
      const scale = (kind === "zhu" ? 40 : 260) / Math.max(button2.getBoundingClientRect().width, 48);
      const elapsed = event.timeStamp - pointer.lastAt;
      if (elapsed > 0) pointer.speed = clamp(
        (event.clientX - pointer.lastX) / elapsed * scale * 1e3,
        kind === "zhu" ? -180 : -1300,
        kind === "zhu" ? 180 : 1300
      );
      pointer.lastX = event.clientX;
      pointer.lastAt = event.timeStamp;
      angle = kind === "zhu" ? clamp(pointer.angle + dx * scale, -28, 28) : pointer.angle + dx * scale;
      paint();
    });
    on("pointerup", (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const { dragging, lastAt, speed } = pointer;
      velocity = event.timeStamp - lastAt > 90 ? 0 : speed * (kind === "zhu" ? 0.35 : 1);
      skipPointerClick = dragging;
      releasePointer();
      if (dragging) wake();
    });
    const cancelGesture = (event) => {
      if (pointer && pointer.id === event.pointerId) rest();
    };
    on("pointercancel", cancelGesture);
    on("lostpointercapture", cancelGesture);
    on("pointerleave", (event) => {
      if (pointer?.type === "mouse" && !pointer.dragging) cancelGesture(event);
    });
    on("click", (event) => {
      if (skipPointerClick && event.detail !== 0) {
        skipPointerClick = false;
        return;
      }
      skipPointerClick = false;
      if (!canMove()) return;
      const box = button2.getBoundingClientRect();
      const side2 = event.detail === 0 || event.clientX < box.left + box.width / 2 ? 1 : -1;
      velocity = kind === "zhu" ? clamp(velocity + side2 * 175, -230, 230) : 1050;
      wake();
    });
    paint();
    const controller = {
      rest,
      setVisible(value) {
        visible = value;
        if (!value) rest();
      },
      destroy() {
        if (disposed) return;
        rest();
        disposed = true;
        for (const [type, callback] of listeners) button2.removeEventListener(type, callback);
        moving.style.transform = original.transform;
        if (shadow) shadow.style.transform = original.shadow;
        button2.style.touchAction = original.touchAction;
        if (!original.label) button2.removeAttribute("aria-label");
        if (mounted.get(button2) === controller) mounted.delete(button2);
      }
    };
    controllers.set(button2, controller);
    mounted.set(button2, controller);
  }
  if (!controllers.size) return () => {
  };
  const observer = view.IntersectionObserver ? new view.IntersectionObserver((entries) => {
    for (const entry of entries) controllers.get(entry.target)?.setVisible(entry.isIntersecting);
  }, { threshold: 0 }) : null;
  for (const button2 of controllers.keys()) observer?.observe(button2);
  const stopWhenHidden = () => {
    if (doc.hidden) controllers.forEach((control) => control.rest());
  };
  const stopWhenReduced = () => {
    if (reduced?.matches) controllers.forEach((control) => control.rest());
  };
  doc.addEventListener("visibilitychange", stopWhenHidden);
  if (reduced?.addEventListener) reduced.addEventListener("change", stopWhenReduced);
  else reduced?.addListener?.(stopWhenReduced);
  return () => {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    doc.removeEventListener("visibilitychange", stopWhenHidden);
    if (reduced?.removeEventListener) reduced.removeEventListener("change", stopWhenReduced);
    else reduced?.removeListener?.(stopWhenReduced);
    controllers.forEach((control) => control.destroy());
  };
}

// demo/modules/reading-route.js
function readingHash(key) {
  const [kind, ...id] = key.split(":");
  if (!["intel", "block"].includes(kind) || !id.join(":")) throw Error("\u9605\u8BFB\u6807\u8BC6\u65E0\u6548");
  return "#" + (kind === "intel" ? "intel" : "library") + "/" + encodeURIComponent(id.join(":"));
}
function parseRoute(hash) {
  const value = hash.replace(/^#/, ""), [section, ...tail] = value.split("/");
  const page2 = ["today", "intel", "library", "games"].includes(section) ? section : "today";
  if (tail.length && ["intel", "library"].includes(section)) {
    try {
      return { page: page2, key: (page2 === "intel" ? "intel:" : "block:") + decodeURIComponent(tail.join("/")) };
    } catch {
      return { page: page2, key: null, invalid: true };
    }
  }
  return { page: page2, key: null };
}

// demo/modules/personal-backup.js
var DESK_KEY = "zhushi-daji-desk-v3";
var BACKUP_KEYS = [DESK_KEY, "zhushi-daji-appearance-v1", "pocket.hextris.saveState", "pocket.hextris.highscores", "shunsui-0hh1-tutorialPlayed", "shunsui-0hh1-score"];
var object = (v) => v && typeof v === "object" && !Array.isArray(v);
function safeTree(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, v] of Object.entries(value)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) throw Error("\u5907\u4EFD\u542B\u4E0D\u652F\u6301\u7684\u5B57\u6BB5");
    safeTree(v);
  }
}
function validateEntry(key, value) {
  if (typeof value !== "string" || value.length > 2e6) throw Error("\u5907\u4EFD\u5185\u5BB9\u683C\u5F0F\u6216\u5927\u5C0F\u4E0D\u6B63\u786E");
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw Error("\u5907\u4EFD\u5185\u5BB9\u65E0\u6CD5\u89E3\u6790");
  }
  ;
  safeTree(parsed);
  if (key === DESK_KEY && (!object(parsed) || !Array.isArray(parsed.saved) || parsed.saved.some((x) => typeof x !== "string") || !object(parsed.notes) || Object.values(parsed.notes).some((x) => typeof x !== "string"))) throw Error("\u6536\u85CF\u6216\u968F\u8BB0\u683C\u5F0F\u4E0D\u6B63\u786E");
  if (key === "zhushi-daji-appearance-v1" && (!object(parsed) || !["auto", "light", "dark"].includes(parsed.mode))) throw Error("\u5916\u89C2\u8BBE\u7F6E\u65E0\u6548");
  if (key === "pocket.hextris.highscores" && (!Array.isArray(parsed) || parsed.some((n) => !Number.isFinite(n) || n < 0))) throw Error("\u6E38\u620F\u6210\u7EE9\u683C\u5F0F\u4E0D\u6B63\u786E");
  if (key === "shunsui-0hh1-score" && (!Number.isFinite(parsed) || parsed < 0)) throw Error("\u6E38\u620F\u6210\u7EE9\u683C\u5F0F\u4E0D\u6B63\u786E");
  if (key === "shunsui-0hh1-tutorialPlayed" && typeof parsed !== "boolean") throw Error("\u6E38\u620F\u8BB0\u5F55\u683C\u5F0F\u4E0D\u6B63\u786E");
  return parsed;
}
function exportPersonal(storage, now = /* @__PURE__ */ new Date()) {
  const entries = {};
  for (const key of BACKUP_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) {
      validateEntry(key, value);
      entries[key] = value;
    }
  }
  return { format: "zhushi-daji-personal-backup", version: 1, exportedAt: now.toISOString(), entries };
}
function parseBackup(text) {
  if (text.length > 5e6) throw Error("\u5907\u4EFD\u6587\u4EF6\u8FC7\u5927");
  let backup2;
  try {
    backup2 = JSON.parse(text);
  } catch {
    throw Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684 JSON \u5907\u4EFD\u6587\u4EF6");
  }
  if (backup2?.format !== "zhushi-daji-personal-backup" || backup2.version !== 1 || !object(backup2.entries)) throw Error("\u8FD9\u4E0D\u662F\u53D7\u652F\u6301\u7684\u8BF8\u4E8B\u5927\u5409\u5907\u4EFD");
  for (const [key, value] of Object.entries(backup2.entries)) {
    if (!BACKUP_KEYS.includes(key)) throw Error("\u5907\u4EFD\u542B\u4E0D\u652F\u6301\u7684\u8BB0\u5F55\u7C7B\u578B");
    validateEntry(key, value);
  }
  return backup2;
}
function planImport(storage, backup2) {
  const entries = {}, current = exportPersonal(storage).entries;
  let conflicts = 0;
  for (const [key, value] of Object.entries(backup2.entries)) {
    const incoming = validateEntry(key, value);
    if (key === "pocket.hextris.saveState") continue;
    if (key === DESK_KEY) {
      const old = current[key] ? JSON.parse(current[key]) : { saved: [], notes: {} };
      const notes = { ...incoming.notes, ...old.notes };
      for (const [id, note] of Object.entries(incoming.notes)) {
        if (old.notes[id] && old.notes[id] !== note && !old.notes[id].includes("\u2014\u2014 \u5907\u4EFD\u4E2D\u7684\u968F\u8BB0 \u2014\u2014\n" + note)) {
          conflicts++;
          notes[id] = old.notes[id] + "\n\n\u2014\u2014 \u5907\u4EFD\u4E2D\u7684\u968F\u8BB0 \u2014\u2014\n" + note;
        }
      }
      entries[key] = JSON.stringify({ ...incoming, ...old, saved: [.../* @__PURE__ */ new Set([...old.saved, ...incoming.saved])], notes });
    } else if (!current[key]) entries[key] = value;
  }
  const desk = entries[DESK_KEY] ? JSON.parse(entries[DESK_KEY]) : null;
  return { entries, conflicts, saved: desk?.saved.length || 0, notes: Object.keys(desk?.notes || {}).length };
}
function applyImport(storage, plan) {
  const original = Object.fromEntries(Object.keys(plan.entries).map((key) => [key, storage.getItem(key)]));
  const written = [];
  try {
    for (const [key, value] of Object.entries(plan.entries)) {
      storage.setItem(key, value);
      written.push(key);
    }
  } catch (e) {
    for (const key of written.reverse()) {
      if (original[key] === null) storage.removeItem(key);
      else storage.setItem(key, original[key]);
    }
    throw e;
  }
}

// demo/modules/portal-data.js
var safeUrl = (value) => {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
};
var textMatch = (values, query) => {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text = values.flat().join(" ").toLocaleLowerCase();
  return terms.every((t) => text.includes(t));
};
var dateOnly = (value) => /^\d{4}-\d{2}-\d{2}/.test(value || "") ? value.slice(0, 10) : "";
function searchIntelligence(records, query = "") {
  const normalize2 = (value) => String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  const terms = normalize2(query).trim().split(/\s+/).filter(Boolean);
  return records.map((record) => {
    const title2 = normalize2(record.title), tags = normalize2((record.tags || []).join(" ")), category = normalize2(record.category), source = normalize2(record.sourceName), summary = normalize2(record.summary);
    const text = [title2, tags, category, source, summary, record.background, record.discussion, (record.searchTerms || []).join(" "), (record.references || []).map((r) => [r.title, r.sourceName].join(" ")).join(" ")].map(normalize2).join(" ");
    const matches = terms.every((term) => text.includes(term));
    const rank = terms.reduce((n, term) => n + (title2.includes(term) ? 12 : 0) + (tags.includes(term) ? 8 : 0) + (category.includes(term) ? 5 : 0) + (source.includes(term) ? 4 : 0) + (summary.includes(term) ? 2 : 0), 0);
    return { record, matches, rank };
  }).filter((r) => r.matches).sort((a, b) => b.rank - a.rank || (b.record.reportDate || "").localeCompare(a.record.reportDate || "") || (b.record.score || 0) - (a.record.score || 0)).map((r) => r.record);
}
function normalizeContent(payload2) {
  const sources = new Map(payload2.yanku.materials.map((m) => [m.id, m]));
  const intel2 = payload2.horizon.records.map((r) => ({ ...r, key: "intel:" + r.id, kind: "intel" }));
  const blocks = payload2.yanku.blocks.map((b) => ({ ...b, key: "block:" + b.id, kind: "block", source: sources.get(b.sourceMaterialId) }));
  return { intel: intel2, blocks, byKey: new Map([...intel2, ...blocks].map((r) => [r.key, r])), sources };
}
function buildUpdates(data2, payload2) {
  const intel2 = [...data2.intel].sort((a, b) => b.reportDate.localeCompare(a.reportDate) || b.score - a.score).map((r) => ({ kind: "intel", date: r.reportDate, dateLabel: "\u6536\u5F55", title: r.title, summary: r.summary, item: r }));
  const library2 = payload2.yanku.updates.map((u) => ({ kind: "library", date: u.date, dateLabel: "\u66F4\u65B0", title: u.title, summary: u.detail, update: u }));
  return [...intel2, ...library2].sort((a, b) => b.date.localeCompare(a.date) || (a.kind === "library" ? -1 : 1));
}

// demo/modules/intel-views.js
var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var date = (value) => (value || "").replaceAll("-", ".");
function facetMarkup(facet) {
  return facet ? `<div class="intel-facet"><span>${NODE_LABELS[facet.kind] || "\u6536\u5F55\u65E5\u671F"}\uFF1A<strong>${esc(facet.value)}</strong>${facet.from ? ` <small>${date(facet.from)}\u2014${date(facet.to)}</small>` : ""}</span><button data-action="clear-intel-facet" aria-label="\u6E05\u9664\u5173\u8054\u6761\u4EF6">\u6E05\u9664 \xD7</button></div>` : "";
}
function graphMarkup(rows) {
  if (!rows.length) return '<div class="empty-state"><h2>\u6682\u65E0\u53EF\u5C55\u793A\u7684\u5173\u7CFB</h2><p>\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u6E05\u9664\u7B5B\u9009\u6761\u4EF6\u518D\u770B\u770B\u3002</p><button class="secondary-button" data-action="reset">\u67E5\u770B\u5168\u90E8\u60C5\u62A5</button></div>';
  return `<div class="explore-heading"><div><span class="eyebrow">KNOWLEDGE MAP</span><h2>\u628A\u7EBF\u7D22\u8FDE\u8D77\u6765</h2></div><span role="status">\u5F53\u524D ${rows.length} \u6761 \xB7 \u56FE\u793A\u6700\u8FD1 ${Math.min(rows.length, 80)} \u6761</span></div><div id="knowledge-graph"><p class="graph-loading" role="status">\u6B63\u5728\u6574\u7406\u5173\u7CFB\u2026\u2026</p></div><p class="explore-note">\u8FDE\u7EBF\u6765\u81EA\u60C5\u62A5\u5DF2\u6709\u7684\u9886\u57DF\u3001\u4E3B\u9898\u4E0E\u4FE1\u6E90\u6807\u6CE8\uFF0C\u4E0D\u4EE3\u8868\u56E0\u679C\u6216\u5408\u4F5C\u5173\u7CFB\u3002\u56FE\u4E2D\u4FDD\u7559\u9AD8\u9891 24 \u4E2A\u4E3B\u9898\u4E0E 16 \u4E2A\u4FE1\u6E90\uFF1B\u641C\u7D22\u540E\u53EF\u7EE7\u7EED\u63A2\u7D22\u76F8\u5173\u8BB0\u5F55\u3002</p>`;
}
function trendsMarkup(rows, allRecords) {
  const latestDate = allRecords.map((r) => validReportDate(r.reportDate)).filter(Boolean).sort().at(-1);
  const stats = buildIntelTrends(rows, { latestDate }), max = Math.max(1, ...stats.days.map((d) => d.count));
  if (!stats.days.length) return '<div class="empty-state"><h2>\u6682\u65E0\u65F6\u95F4\u7EBF</h2><p>\u8D44\u6599\u4E2D\u5C1A\u65E0\u53EF\u7528\u7684\u6536\u5F55\u65E5\u671F\u3002</p></div>';
  return `<div class="explore-heading"><div><span class="eyebrow">COLLECTION TRENDS</span><h2>\u7EBF\u7D22\u5982\u4F55\u79EF\u7D2F</h2></div><span>\u8FD1 30 \u5929 \xB7 ${date(stats.from)}\u2014${date(stats.to)}</span></div>
    <div class="intel-trend-stats"><div><span>\u671F\u95F4\u6536\u5F55</span><strong>${stats.total}<small> \u6761</small></strong></div><div><span>\u4F18\u5148\u7EA7 \u2265 7</span><strong>${stats.priority}<small> \u6761</small></strong></div><div><span>\u5E73\u5747\u4F18\u5148\u7EA7</span><strong>${stats.average === null ? "\u2014" : stats.average.toFixed(1)}</strong></div></div>
    <section class="trend-panel"><div class="trend-section-heading"><h3>\u5165\u5E93\u65F6\u95F4\u7EBF</h3><span>\u70B9\u65E5\u671F\u67E5\u770B \xB7 \u5DE6\u53F3\u6ED1\u52A8</span></div><div class="intel-timeline" aria-label="\u8FD1 30 \u5929\u6536\u5F55\u6570\u91CF">${stats.days.map((d) => `<button data-action="trend-date" data-value="${d.date}" aria-label="${d.date} \u6536\u5F55 ${d.count} \u6761\u60C5\u62A5"><span class="timeline-count">${d.count}</span><span class="timeline-plot"><i class="timeline-bar ${d.date === stats.to ? "latest" : ""}" style="height:${d.count ? Math.max(3, d.count / max * 100) : 0}%"></i></span><span class="timeline-date">${d.date.slice(5).replace("-", "/")}</span></button>`).join("")}</div></section>
    <section class="trend-panel"><div class="trend-section-heading"><h3>\u9886\u57DF\u5206\u5E03</h3><span>\u70B9\u9886\u57DF\u67E5\u770B</span></div><div class="intel-domains">${stats.categories.length ? stats.categories.map((c) => `<button class="intel-domain" data-action="trend-category" data-value="${esc(c.name)}" data-from="${stats.from}" data-to="${stats.to}"><span class="domain-heading"><strong>${esc(c.name)}</strong><span>${c.count} \u6761 <span aria-hidden="true">\u2197</span></span></span><span class="domain-track"><i style="width:${c.count / stats.total * 100}%"></i></span><small>\u5360 ${c.count / stats.total < 0.01 ? "&lt;1" : Math.round(c.count / stats.total * 100)}% \xB7 \u5E73\u5747\u4F18\u5148\u7EA7 ${c.average === null ? "\u2014" : c.average.toFixed(1)}</small></button>`).join("") : '<p class="explore-note">\u8FD9\u6BB5\u65F6\u95F4\u6CA1\u6709\u7B26\u5408\u5F53\u524D\u6761\u4EF6\u7684\u60C5\u62A5\u3002</p>'}</div></section>
    <p class="explore-note">\u6309\u5F53\u524D\u68C0\u7D22\u8303\u56F4\u7684\u6536\u5F55\u65E5\u671F\u7EDF\u8BA1\uFF0C\u4EE5\u8D44\u6599\u4E2D\u6700\u65B0\u6536\u5F55\u65E5\u4E3A\u7EC8\u70B9\u3002\u7A7A\u767D\u65E5\u671F\u8868\u793A\u5F53\u524D\u8D44\u6599\u6CA1\u6709\u5BF9\u5E94\u8BB0\u5F55\uFF0C\u4E0D\u4EE3\u8868\u5F53\u5929\u6CA1\u6709\u6293\u53D6\uFF1B\u9886\u57DF\u5206\u5E03\u4E0D\u4EE3\u8868\u884C\u4E1A\u70ED\u5EA6\u3002${stats.undated ? `\u53E6\u6709 ${stats.undated} \u6761\u65E5\u671F\u7F3A\u5931\u6216\u65E0\u6548\uFF0C\u672A\u7EB3\u5165\u65F6\u95F4\u7EDF\u8BA1\u3002` : ""}</p>`;
}

// demo/modules/writing-intelligence.js
var intentSeed = { profiles: [] };
var intentProfiles = intentSeed.profiles;
function setIntentProfiles(profiles) {
  intentProfiles = profiles;
}
var INTENT_EXAMPLES = [
  "\u6210\u7EE9\u503C\u5F97\u80AF\u5B9A\uFF0C\u4F46\u4E0D\u80FD\u8EBA\u5728\u529F\u52B3\u7C3F\u4E0A",
  "\u4EFB\u52A1\u5DF2\u7ECF\u660E\u786E\uFF0C\u4E0B\u4E00\u6B65\u5173\u952E\u662F\u6293\u843D\u5B9E",
  "\u515A\u5EFA\u8981\u843D\u5B9E\u5230\u4E2D\u5FC3\u5DE5\u4F5C\u548C\u4E00\u7EBF\u4EFB\u52A1",
  "\u7ED3\u5C3E\u8981\u63D0\u632F\u58EB\u6C14\uFF0C\u4F46\u4E0D\u8981\u8FC7\u4E8E\u6D6E\u5938"
];
var SCENE_GROUPS = [
  "\u5168\u90E8\u573A\u666F",
  "\u7EFC\u5408\u5DE5\u4F5C\u4F1A\u8BAE",
  "\u515A\u5EFA\u4E0E\u5168\u9762\u4ECE\u4E25\u6CBB\u515A",
  "\u6539\u9769\u53D1\u5C55\u4E0E\u7ECF\u8425\u7BA1\u7406",
  "\u79D1\u6280\u521B\u65B0\u4E0E\u6570\u5B57\u5316",
  "\u5B89\u5168\u8D28\u91CF\u4E0E\u98CE\u9669\u5408\u89C4",
  "\u5E72\u90E8\u4EBA\u624D\u4E0E\u7EC4\u7EC7\u5EFA\u8BBE",
  "\u8C03\u7814\u5EA7\u8C08\u4E0E\u73B0\u573A\u8BB2\u8BDD",
  "\u8868\u6001\u53D1\u8A00\u4E0E\u4EFB\u804C\u8BB2\u8BDD",
  "\u603B\u7ED3\u8868\u5F70\u4E0E\u52A8\u5458\u90E8\u7F72",
  "\u5916\u90E8\u4EA4\u6D41\u4E0E\u6210\u679C\u53D1\u5E03"
];
function normalize(value) {
  return value.toLocaleLowerCase("zh-CN").replace(/[\s，。；：、！？,.!?;:'"“”‘’（）()《》【】\[\]—…·\-]/g, "");
}
function grams(value) {
  const normalized = normalize(value);
  const result = /* @__PURE__ */ new Set();
  if (normalized.length < 2) {
    if (normalized) {
      result.add(normalized);
    }
    return result;
  }
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
}
function diceSimilarity(first, second) {
  const firstGrams = grams(first);
  const secondGrams = grams(second);
  if (firstGrams.size === 0 || secondGrams.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const item of firstGrams) {
    if (secondGrams.has(item)) {
      overlap += 1;
    }
  }
  return 2 * overlap / (firstGrams.size + secondGrams.size);
}
function profileQueryScore(query, profile) {
  const normalizedQuery = normalize(query);
  let score = diceSimilarity(query, profile.label) * 0.76;
  for (const alias of profile.aliases) {
    const normalizedAlias = normalize(alias);
    if (normalizedQuery.length >= 4 && (normalizedQuery.includes(normalizedAlias) || normalizedAlias.includes(normalizedQuery))) {
      score = Math.max(score, 1);
      continue;
    }
    score = Math.max(score, diceSimilarity(query, alias));
  }
  const keywordMatches = profile.keywords.filter(
    (keyword) => normalizedQuery.includes(normalize(keyword))
  ).length;
  return Math.min(1, score + Math.min(keywordMatches * 0.12, 0.36));
}
function defaultSuggestedSlot(block) {
  if (block.category === "\u5F00\u5934\u7834\u9898") {
    return "\u5F00\u5934\u5B9A\u8C03";
  }
  if (block.category === "\u5F62\u52BF\u5224\u65AD" || block.category === "\u8FC7\u6E21\u8854\u63A5") {
    return "\u5F62\u52BF\u5224\u65AD";
  }
  if (block.category === "\u95EE\u9898\u5256\u6790" || block.category === "\u7ECF\u9A8C\u63D0\u70BC" || block.category === "\u603B\u7ED3\u63D0\u5347") {
    return "\u6210\u7EE9\u4E0E\u95EE\u9898";
  }
  if (block.category === "\u62D4\u9AD8\u7ED3\u5C3E" || block.category === "\u8868\u6001\u53D1\u8A00") {
    return "\u6536\u675F\u63D0\u6C14";
  }
  if (block.topic.includes("\u515A\u5EFA") || block.topic.includes("\u4ECE\u4E25\u6CBB\u515A") || block.topic.includes("\u5EC9\u6D01")) {
    return "\u515A\u5EFA\u4FDD\u969C";
  }
  return "\u4EFB\u52A1\u90E8\u7F72";
}
function rankIntentBlocks(blocks, query) {
  const normalizedQuery = normalize(query);
  const profiles = intentProfiles.map((profile) => ({ profile, score: profileQueryScore(query, profile) })).filter((item) => item.score >= 0.18).sort((first, second) => second.score - first.score).slice(0, 3);
  return blocks.map((block) => {
    const haystack = [
      block.title,
      block.text,
      block.category,
      block.scene,
      block.topic,
      block.tone,
      ...block.highlights,
      ...block.tags
    ].join(" ");
    const normalizedHaystack = normalize(haystack);
    const direct = normalizedQuery.length >= 2 && normalizedHaystack.includes(normalizedQuery);
    let score = direct ? 54 : diceSimilarity(query, haystack) * 26;
    let leadingProfile = null;
    let leadingContribution = 0;
    for (const profileItem of profiles) {
      const { profile: profile2, score: queryScore } = profileItem;
      const categoryMatched = profile2.categories.includes(block.category);
      const topicMatched = profile2.topics.some(
        (topic) => block.topic.includes(topic)
      );
      const fieldSimilarity = Math.max(
        diceSimilarity(profile2.label, block.title),
        ...profile2.aliases.map((alias) => diceSimilarity(alias, block.title)),
        ...block.highlights.map(
          (highlight) => diceSimilarity(profile2.label, highlight)
        )
      );
      let contribution = fieldSimilarity * queryScore * 18;
      if (categoryMatched) {
        contribution += 9 * queryScore;
      }
      if (topicMatched) {
        contribution += 16 * queryScore;
      }
      const keywordMatches = profile2.keywords.filter(
        (keyword) => normalizedHaystack.includes(normalize(keyword))
      ).length;
      contribution += Math.min(keywordMatches * 4 * queryScore, 20);
      if (contribution > leadingContribution) {
        leadingContribution = contribution;
        leadingProfile = profileItem;
      }
    }
    score += leadingContribution;
    const profile = leadingProfile?.profile ?? null;
    return {
      block,
      match: {
        score,
        direct,
        profileLabel: profile?.label ?? null,
        suggestedSlot: profile?.suggestedSlot ?? defaultSuggestedSlot(block),
        reason: direct ? "\u4F60\u7684\u63CF\u8FF0\u4E0E\u8FD9\u6BB5\u7D20\u6750\u76F4\u63A5\u547C\u5E94\u3002" : profile?.reason ?? "\u6839\u636E\u4E3B\u9898\u3001\u5199\u4F5C\u4F4D\u7F6E\u548C\u8BED\u6C14\u7EFC\u5408\u5339\u914D\u3002"
      }
    };
  }).sort(
    (first, second) => second.match.score - first.match.score || first.block.id.localeCompare(second.block.id)
  );
}
function sceneGroupFor(scene) {
  if (/表态|任职|承诺/.test(scene)) {
    return "\u8868\u6001\u53D1\u8A00\u4E0E\u4EFB\u804C\u8BB2\u8BDD";
  }
  if (/调研|座谈|慰问|现场办公/.test(scene)) {
    return "\u8C03\u7814\u5EA7\u8C08\u4E0E\u73B0\u573A\u8BB2\u8BDD";
  }
  if (/党建|党风|廉政|警示|全面从严|党课|理论学习/.test(scene)) {
    return "\u515A\u5EFA\u4E0E\u5168\u9762\u4ECE\u4E25\u6CBB\u515A";
  }
  if (/干部|组织人事|人才|团队|班子|年轻/.test(scene)) {
    return "\u5E72\u90E8\u4EBA\u624D\u4E0E\u7EC4\u7EC7\u5EFA\u8BBE";
  }
  if (/科技|创新|人工智能|数字化|数据|成果转化|科技金融/.test(scene)) {
    return "\u79D1\u6280\u521B\u65B0\u4E0E\u6570\u5B57\u5316";
  }
  if (/安全|风险|合规|内控|质量/.test(scene)) {
    return "\u5B89\u5168\u8D28\u91CF\u4E0E\u98CE\u9669\u5408\u89C4";
  }
  if (/品牌|发布|签约|揭牌|外部交流|宣传/.test(scene)) {
    return "\u5916\u90E8\u4EA4\u6D41\u4E0E\u6210\u679C\u53D1\u5E03";
  }
  if (/改革|经营|董事会|治理|预算|降本|市场|项目|产业链/.test(scene)) {
    return "\u6539\u9769\u53D1\u5C55\u4E0E\u7ECF\u8425\u7BA1\u7406";
  }
  if (/总结|表彰|动员|攻坚|部署|推进|任务|复盘/.test(scene)) {
    return "\u603B\u7ED3\u8868\u5F70\u4E0E\u52A8\u5458\u90E8\u7F72";
  }
  return "\u7EFC\u5408\u5DE5\u4F5C\u4F1A\u8BAE";
}

// demo/app.js
var $ = (s) => document.querySelector(s);
var esc2 = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var paths = { today: "M5 4v4m14-4v4M4 10h16M5 6h14v15H5zM8 14h3m-3 3h6", intel: "M12 3a9 9 0 1 0 9 9M12 3v9l6-6M8 16l4-4", library: "M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zm0 0v15M6 9h3m-3 4h3m6-4h3m-3 4h3", games: "M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5ZM17 3v4m-2-2h4", search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0", bookmark: "M6 3h12v18l-6-4-6 4z" };
var icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n] || paths.library}"/></svg>`;
document.querySelectorAll("[data-icon]").forEach((e) => e.innerHTML = icon(e.dataset.icon));
var stopDeskToys = mountDeskToys(document);
window.addEventListener("pagehide", () => {
  stopDeskToys();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    stopDeskToys = mountDeskToys(document);
    refreshVisibleContent();
  }
});
var KEY = "zhushi-daji-desk-v3";
var state = { saved: [], notes: {} };
try {
  const x = JSON.parse(localStorage.getItem(KEY) || "null");
  if (x && typeof x === "object" && !Array.isArray(x)) state = { ...x, saved: Array.isArray(x.saved) ? x.saved : [], notes: x.notes && typeof x.notes === "object" ? x.notes : {} };
} catch {
}
var contentPromise;
var contentError;
var lastContentCheck = 0;
var payload;
var data;
var updates;
var page = "today";
var readerKey = "";
var tab = "blocks";
var todayFilter = "all";
var limit = 12;
var collection = false;
var toastTimer;
var intelView = "list";
var intelFacet = null;
var graphCleanup = null;
var graphTimer;
var graphVersion = 0;
var filters = { q: "", category: "", horizon: "", days: "", score: "", sort: "latest", saved: false, scene: "", validity: "" };
var save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    toast("\u6D4F\u89C8\u5668\u672A\u80FD\u4FDD\u5B58\uFF0C\u8BF7\u590D\u5236\u9700\u8981\u4FDD\u7559\u7684\u5185\u5BB9");
    return false;
  }
};
function toast(msg) {
  const el = $("#toast");
  (document.querySelector("dialog[open]") || document.body).append(el);
  el.textContent = msg;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2800);
}
var dateTime = (v) => Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "\u672A\u8BB0\u5F55";
var date2 = (v) => dateOnly(v).replaceAll("-", ".");
var label = (k) => k === "intel" ? "\u60C5\u62A5" : k === "games" ? "\u653E\u677E" : "\u8A00\u5E93";
var valid = { current: "\u5F53\u524D\u9002\u7528", watch: "\u4F7F\u7528\u524D\u590D\u6838", historical: "\u5386\u53F2\u53C2\u8003" };
var empty = (title2, desc, action = "") => `<div class="empty-state"><span class="empty-icon">${icon("search")}</span><h2>${esc2(title2)}</h2><p>${esc2(desc)}</p>${action}</div>`;
var button = (action, text, cls = "secondary-button", attrs = "") => `<button class="${cls}" data-action="${action}" ${attrs}>${text}</button>`;
var title = (head, sub, eyebrow) => `<section class="page-title"><div><span class="eyebrow">${esc2(eyebrow || "\u6731\u5370\u4E66\u658B \xB7 \u65E5\u5E38\u6240\u7528")}</span><h1>${head}</h1><p>${sub}</p></div><div class="title-aside">${page === "games" ? "<b>\u6B47\u4E00\u4F1A\u513F</b>\u547D\u7406 \xB7 \u6E38\u620F" : `<b><i class="dot"></i>\u8D44\u6599\u5DF2\u63A5\u5165</b>${page !== "library" ? date2(payload.horizon.generatedAt) + " \u60C5\u62A5" : ""}${page === "today" ? "<br>" : ""}${page !== "intel" ? date2(payload.yanku.generatedAt) + " \u8A00\u5E93" : ""}`}</div></section>${payload?.meta?.stale ? `<div class="status-warning">${esc2(payload.meta.message)}</div>` : ""}`;
var bookmark = (r) => `<button class="bookmark" aria-label="${state.saved.includes(r.key) ? "\u53D6\u6D88\u6536\u85CF" : "\u6536\u85CF"}\uFF1A${esc2(r.title)}" aria-pressed="${state.saved.includes(r.key)}" data-save="${esc2(r.key)}">${icon("bookmark")}</button>`;
var options = (list, value, all = "\u5168\u90E8") => `<option value="">${all}</option>` + list.map((v) => `<option value="${esc2(v)}" ${v === value ? "selected" : ""}>${esc2(v)}</option>`).join("");
var field = (name, text, list, all) => `<div class="field"><label for="filter-${name}">${text}</label><select id="filter-${name}" data-filter="${name}">${options(list, filters[name], all)}</select></div>`;
var unique = (arr) => [...new Set(arr.filter(Boolean))];
function navigate(next, sub) {
  if (sub) tab = sub;
  if (page !== next) {
    intelFacet = null;
    intelView = "list";
    Object.assign(filters, { q: "", category: "", horizon: "", days: "", score: "", sort: "latest", saved: false, scene: "", validity: "" });
    limit = 12;
  }
  page = next;
  if (location.hash !== "#" + next) history.pushState(null, "", "#" + next);
  render();
  if (page !== "games" && !data) load();
  window.scrollTo(0, 0);
}
function render() {
  stopGraph();
  document.querySelectorAll("[data-page]").forEach((b) => {
    if (b.dataset.page === page) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $("#page").innerHTML = page === "games" ? games() : !data ? empty(contentError ? "\u8D44\u6599\u6682\u65F6\u672A\u80FD\u6253\u5F00" : "\u6B63\u5728\u8BFB\u53D6\u8D44\u6599", contentError || "\u60C5\u62A5\u4E0E\u8A00\u5E93\u6B63\u5728\u52A0\u8F7D\uFF0C\u53EF\u4EE5\u5148\u53BB\u201C\u653E\u677E\u201D\u901B\u901B\u3002", contentError ? button("reload-page", "\u91CD\u65B0\u8BFB\u53D6") : "") : page === "today" ? today() : page === "intel" ? intel() : library();
  document.title = `${{ today: "\u4ECA\u65E5", intel: "\u60C5\u62A5", library: "\u8A00\u5E93", games: "\u653E\u677E" }[page]} \xB7 \u8BF8\u4E8B\u5927\u5409`;
  mountIntelExtras();
}
function side() {
  return `<aside class="side-column"><section class="side-panel library-info"><span class="side-label">\u8A00\u5E93 \xB7 \u6BCF\u6B21\u8BFB\u4E00\u6BB5</span><blockquote>\u884C\u4E4B\u6709\u65B9\uFF0C<br>\u8A00\u4E4B\u6709\u636E\u3002</blockquote><p>\u4ECE\u6743\u5A01\u516C\u5F00\u6750\u6599\u4E2D\u6574\u7406\u8868\u8FBE\u3002\u6BCF\u4E00\u6BB5\uFF0C\u90FD\u80FD\u56DE\u5230\u5B83\u7684\u51FA\u5904\u3002</p>${button("library", "\u7FFB\u4E00\u7FFB\u8A00\u5E93 \u2192", "inline-link")}</section><section class="side-panel ink-panel"><span class="side-label">\u7247\u523B\u95F2\u8DA3</span><h2>\u4E8B\u60C5\u6162\u6162\u505A\uFF0C<br>\u5076\u5C14\u6362\u6362\u8111\u3002</h2><p>\u770B\u4E00\u770B\u547D\u76D8\uFF0C\u6216\u968F\u624B\u73A9\u4E00\u5C40\u3002</p>${button("games", "\u53BB\u653E\u677E\u4E00\u4E0B \u2197", "inline-link")}</section></aside>`;
}
var visitStats = null;
var visitError = false;
var visitRecorded = false;
var visitPromise;
var visitBytes = crypto.getRandomValues(new Uint8Array(16));
var visitHex = Array.from(visitBytes, (b) => b.toString(16).padStart(2, "0")).join("");
var visitId = [visitHex.slice(0, 8), visitHex.slice(8, 12), visitHex.slice(12, 16), visitHex.slice(16, 20), visitHex.slice(20)].join("-");
var visitNumber = (n) => n === null || n === void 0 ? "\u2014" : n.toLocaleString("zh-CN");
function visitCard() {
  return `<span>\u4ECA\u65E5\u8BBF\u95EE<small>${visitError ? "\u6682\u4E0D\u53EF\u7528" : visitStats ? "\u8FD1 7 \u5929\u8D8B\u52BF \u2197" : "\u6B63\u5728\u8BFB\u53D6"}</small></span><strong>${visitError ? "\u2014" : visitNumber(visitStats?.today)}</strong>`;
}
function syncVisitCard() {
  const el = $('[data-action="visits"]');
  if (el) el.innerHTML = visitCard();
}
async function loadVisits() {
  if (visitPromise) return visitPromise;
  visitPromise = (async () => {
    try {
      const record = !visitRecorded, res = await fetch("/api/visits", record ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: visitId }) } : {});
      if (!res.ok) throw Error();
      visitStats = await res.json();
      visitRecorded = true;
      visitError = false;
    } catch {
      visitError = true;
    } finally {
      syncVisitCard();
      visitPromise = null;
    }
  })();
  return visitPromise;
}
async function showVisits() {
  showReader("\u8BBF\u95EE\u8DB3\u8FF9", `<p class="subtle-note">\u6B63\u5728\u8BFB\u53D6\u8BBF\u95EE\u7EDF\u8BA1\u2026\u2026</p>`, "", "\u5DE5\u4F5C\u53F0 \xB7 \u8BBF\u95EE");
  await loadVisits();
  if (!$("#reader").open || $("#reader-title").textContent !== "\u8BBF\u95EE\u8DB3\u8FF9") return;
  if (visitError) {
    showReader("\u8BBF\u95EE\u8DB3\u8FF9", empty("\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u7EDF\u8BA1", "\u7A0D\u540E\u91CD\u8BD5\u5373\u53EF\u3002\u5DF2\u6709\u8BB0\u5F55\u4E0D\u4F1A\u7528\u96F6\u66FF\u4EE3\u3002", button("visits", "\u91CD\u65B0\u8BFB\u53D6")), "", "\u5DE5\u4F5C\u53F0 \xB7 \u8BBF\u95EE");
    return;
  }
  const s = visitStats, max = Math.max(1, ...s.days.map((d) => d.views || 0));
  const bars = s.days.map((d, i) => {
    const y = d.views === null ? 164 : 164 - d.views / max * 126;
    const x = 18 + i * 46;
    return `<g><text x="${x + 12}" y="${d.views === null ? 148 : Math.max(22, y - 10)}" text-anchor="middle" class="visit-value">${d.views === null ? "\u2014" : d.views}</text>${d.views === null ? `<line x1="${x + 4}" x2="${x + 20}" y1="164" y2="164" class="visit-unrecorded"/>` : `<rect x="${x}" y="${y}" width="24" height="${Math.max(2, 164 - y)}" rx="2" class="${i === 6 ? "visit-bar-current" : "visit-bar"}"/>`}<text x="${x + 12}" y="188" text-anchor="middle" class="visit-date">${d.date.slice(5).replace("-", ".")}</text></g>`;
  }).join("");
  const sum = s.days.reduce((n, d) => n + (d.views || 0), 0);
  showReader("\u8BBF\u95EE\u8DB3\u8FF9", `<p class="subtle-note">\u770B\u770B\u8FD9\u5468\uFF0C\u6709\u591A\u5C11\u6B21\u6253\u5F00\u3002</p><div class="visit-totals"><div><span>\u4ECA\u65E5\u8BBF\u95EE</span><strong>${visitNumber(s.today)}</strong></div><div><span>\u8FD1 7 \u5929\u7D2F\u8BA1</span><strong>${s.startedAt ? visitNumber(sum) : "\u2014"}</strong></div><div><span>\u603B\u8BBF\u95EE</span><strong>${visitNumber(s.total)}</strong></div></div><section class="visit-chart"><h2>\u8FD1 7 \u5929</h2><svg viewBox="0 0 340 204" role="img" aria-label="\u8FD17\u5929\u8BBF\u95EE\u6B21\u6570\uFF0C${esc2(s.days.map((d) => d.date + "\uFF1A" + (d.views === null ? "\u672A\u8BB0\u5F55" : d.views + "\u6B21")).join("\uFF1B"))}">${bars}</svg><p class="subtle-note">${s.startedAt ? "\u81EA " + date2(s.startedOn) + " \u5F00\u59CB\u8BB0\u5F55\uFF0C\u4E4B\u524D\u7684\u65E5\u671F\u6807\u4E3A\u300C\u2014\u300D\u3002" : "\u5C1A\u672A\u5F00\u59CB\u8BB0\u5F55\u3002"}</p></section><div class="source-box"><h2>\u600E\u4E48\u7B97\u4E00\u6B21\u8BBF\u95EE</h2><p>\u6253\u5F00\u6216\u5237\u65B0\u9875\u9762\u8BA1\u4E00\u6B21\uFF1B\u5207\u6362\u680F\u76EE\u3001\u5C55\u5F00\u6587\u7AE0\u548C\u73A9\u6E38\u620F\u4E0D\u91CD\u590D\u8BA1\u6570\u3002\u6B21\u6570\u4E0D\u7B49\u4E8E\u72EC\u7ACB\u8BBF\u5BA2\u4EBA\u6570\u3002</p><p>\u6309\u5317\u4EAC\u65F6\u95F4\u6C47\u603B\u5F53\u524D\u5DE5\u4F5C\u53F0\u7684\u8BBF\u95EE\u3002\u7535\u8111\u548C\u624B\u673A\u8BBF\u95EE\u540C\u4E00\u4E2A\u670D\u52A1\uFF0C\u4F1A\u4E00\u8D77\u7D2F\u8BA1\u3002</p></div>`, "", "\u5DE5\u4F5C\u53F0 \xB7 \u8BBF\u95EE");
}
function today() {
  let rows = updates.filter((u) => todayFilter === "all" || u.kind === todayFilter).slice(0, 12);
  const now = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(/* @__PURE__ */ new Date());
  return title("\u4ECA\u65E5\u4E00\u89C8", "\u628A\u89C1\u95FB\u6536\u597D\uFF0C\u628A\u65E5\u5B50\u8FC7\u597D\u3002", now) + `<section class="overview" aria-label="\u5DE5\u4F5C\u53F0\u603B\u89C8"><button data-page="intel"><span>\u60C5\u62A5<small>\u5DF2\u6536\u5F55</small></span><strong>${data.intel.length}</strong></button><button data-page="library"><span>\u8A00\u5E93<small>\u539F\u521B\u6BB5\u843D</small></span><strong>${data.blocks.length}</strong></button><button data-action="visits" class="visit-overview" aria-label="\u4ECA\u65E5\u8BBF\u95EE\uFF0C\u67E5\u770B\u8FD17\u5929\u8D8B\u52BF">${visitCard()}</button></section><div class="page-columns"><section class="content-pane"><div class="section-heading"><h2>\u8FD1\u65E5\u66F4\u65B0</h2><small>\u5404\u680F\u52A8\u6001\uFF0C\u6C47\u4E8E\u6B64\u5904</small></div><div class="tabs" aria-label="\u66F4\u65B0\u5206\u7C7B">${[["all", "\u5168\u90E8"], ["intel", "\u60C5\u62A5"], ["library", "\u8A00\u5E93"], ["games", "\u653E\u677E"]].map(([k, t]) => `<button data-today="${k}" class="${todayFilter === k ? "active" : ""}" aria-pressed="${todayFilter === k}">${t}</button>`).join("")}</div>${rows.map((u) => `<article class="update-row"><span class="update-stamp ${u.kind}">${u.kind === "intel" ? "\u60C5" : u.kind === "games" ? "\u95F2" : "\u8A00"}</span><button class="update-open" ${u.item ? `data-read="${esc2(u.item.key)}"` : u.kind === "games" ? 'data-page="games"' : `data-update="${esc2(u.update.id)}"`}><span class="meta"><span class="brand-tag ${u.kind}">${label(u.kind)}</span><span>${date2(u.date)} ${u.dateLabel}</span></span><h3>${esc2(u.title)}</h3><p>${esc2(u.summary)}</p></button><span class="update-arrow" aria-hidden="true">\u2197</span></article>`).join("")}${button(todayFilter === "library" ? "library" : todayFilter === "games" ? "games" : "intel", "\u8FDB\u5165\u680F\u76EE\uFF0C\u7EE7\u7EED\u6D4F\u89C8 \u2192", "load-more")}</section>${side()}</div>`;
}
function searchBar(placeholder) {
  return `<div class="toolbar"><label class="search-field">${icon("search")}<input data-query type="search" value="${esc2(filters.q)}" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off"></label><button class="secondary-button" data-action="saved-filter" aria-pressed="${filters.saved}">${filters.saved ? "\u67E5\u770B\u5168\u90E8" : "\u53EA\u770B\u6536\u85CF"}</button></div>`;
}
var INTEL_KEYWORDS = ["\u822A\u7A7A\u53D1\u52A8\u673A", "\u667A\u80FD\u4F53", "\u5927\u6A21\u578B", "\u5177\u8EAB\u667A\u80FD", "\u673A\u5668\u4EBA", "\u82AF\u7247", "\u7B97\u529B", "\u5DE5\u4E1A\u8F6F\u4EF6", "\u6570\u5B57\u5B6A\u751F", "\u4EFF\u771F", "\u5148\u8FDB\u5236\u9020", "\u592E\u56FD\u4F01", "\u653F\u7B56", "\u6295\u878D\u8D44", "DeepSeek", "\u7F51\u7EDC\u5B89\u5168"];
function intel() {
  return title("\u60C5\u62A5", "\u5728\u53D8\u5316\u4E2D\uFF0C\u627E\u5230\u503C\u5F97\u5173\u6CE8\u7684\u4E8B\u3002", "HORIZON \xB7 \u60C5\u62A5\u96F7\u8FBE") + `<div class="tabs intel-view-tabs" role="group" aria-label="\u60C5\u62A5\u89C6\u56FE">${[["list", "\u5217\u8868"], ["graph", "\u56FE\u8C31"], ["trends", "\u8D8B\u52BF"]].map(([key, name]) => `<button data-intel-view="${key}" class="${intelView === key ? "active" : ""}" aria-pressed="${intelView === key}">${name}</button>`).join("")}</div>` + searchBar("\u8F93\u5165\u5173\u952E\u8BCD\uFF0C\u5982 \u822A\u7A7A\u53D1\u52A8\u673A\u3001\u667A\u80FD\u4F53") + `<div class="keyword-shortcuts" aria-label="\u5FEB\u6377\u5173\u952E\u8BCD"><span>\u5E38\u7528</span>${INTEL_KEYWORDS.map((q) => `<button data-keyword="${q}" aria-pressed="${filters.q === q}">${q}</button>`).join("")}</div><p class="search-hint">\u591A\u4E2A\u5173\u952E\u8BCD\u7528\u7A7A\u683C\u5206\u5F00\uFF0C\u4F8B\u5982\u300C\u673A\u5668\u4EBA \u5236\u9020\u300D\u3002</p><div class="page-columns ${intelView !== "list" ? "intel-explore-layout" : ""}"><section class="content-pane" id="results" tabindex="-1">${intelResults()}</section><aside class="side-column"><section class="side-panel"><span class="side-label">\u9605\u8BFB\u6709\u636E</span><h2 style="margin:12px 0">\u4E0D\u6B62\u770B\u6807\u9898</h2><p>\u641C\u7D22\u6807\u9898\u3001\u6B63\u6587\u3001\u6765\u6E90\u548C\u6807\u7B7E\u3002\u5C55\u5F00\u60C5\u62A5\uFF0C\u8FD8\u80FD\u6CBF\u6765\u6E90\u94FE\u56DE\u5230\u539F\u6587\u3002</p></section></aside></div>`;
}
function matchingIntel() {
  return filterByFacet(searchIntelligence(data.intel, filters.q).filter((r) => !filters.saved || state.saved.includes(r.key)), intelFacet);
}
function intelResults() {
  const rows = matchingIntel();
  return facetMarkup(intelFacet) + (intelView === "graph" ? graphMarkup(rows) : intelView === "trends" ? trendsMarkup(rows, data.intel) : intelListResults(rows));
}
function intelListResults(rows) {
  return `<div class="result-heading"><span role="status" aria-live="polite">\u627E\u5230 <b>${rows.length}</b> \u6761\u60C5\u62A5</span><span>${filters.q.trim() ? "\u76F8\u5173\u5185\u5BB9\u4F18\u5148" : "\u6700\u8FD1\u6536\u5F55"}</span></div>${rows.length ? rows.slice(0, limit).map((r, i) => `<article class="intel-card ${i === 0 ? "featured" : ""}"><button class="card-open" data-read="${esc2(r.key)}"><span class="meta"><span class="brand-tag intel">${esc2(r.category)}</span><span>${date2(r.reportDate)} \u6536\u5F55</span></span><h2>${esc2(r.title)}</h2><p>${esc2(r.summary)}</p><span class="meta"><span class="meta-pill">\u4F18\u5148\u7EA7 ${esc2(r.score)}</span><span>${esc2(r.sourceName)}</span></span></button>${bookmark(r)}</article>`).join("") : empty("\u6682\u672A\u627E\u5230", "\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u51CF\u5C11\u5173\u952E\u8BCD\u6570\u91CF\u518D\u8BD5\u8BD5\u3002", button("reset", "\u67E5\u770B\u5168\u90E8\u60C5\u62A5"))}${rows.length > limit ? button("more", "\u518D\u770B 12 \u6761", "load-more") : ""}`;
}
function library() {
  return title("\u8A00\u5E93", "\u8A00\u4E4B\u6709\u636E\uFF0C\u843D\u7B14\u6709\u7AE0\u3002", "\u5199\u4F5C\u8D44\u6E90 \xB7 \u516C\u5F00\u6750\u6599\u539F\u521B\u6574\u7406") + `<div class="tabs library-tabs" aria-label="\u8A00\u5E93\u529F\u80FD">${[["blocks", "\u6BB5\u843D\u5E93"], ["intent", "\u6211\u60F3\u8868\u8FBE"]].map(([k, t]) => `<button data-tab="${k}" class="${tab === k ? "active" : ""}" aria-pressed="${tab === k}">${t}</button>`).join("")}</div>${tab === "intent" ? `<section class="intent-intro"><h2>\u5148\u8BF4\u60F3\u6CD5\uFF0C\u518D\u627E\u8868\u8FBE\u3002</h2><p>\u5199\u4E0B\u4E00\u53E5\u6734\u7D20\u7684\u8BDD\uFF0C\u4ECE\u5DF2\u6709\u7D20\u6750\u4E2D\u5339\u914D\u5408\u9002\u6BB5\u843D\u3002</p><div class="suggestions">${INTENT_EXAMPLES.map((q) => `<button data-example="${esc2(q)}">${esc2(q)}</button>`).join("")}</div></section>` : ""}${searchBar(tab === "intent" ? "\u4F8B\u5982\uFF1A\u4EFB\u52A1\u5DF2\u7ECF\u660E\u786E\uFF0C\u5173\u952E\u662F\u6293\u843D\u5B9E" : "\u641C\u7D22\u6BB5\u843D\u3001\u4E3B\u9898\u3001\u573A\u666F\u6216\u6765\u6E90")}<details class="filter-panel"><summary>\u6309\u7528\u9014\u7B5B\u9009</summary><div class="filter-fields">${field("category", "\u6BB5\u843D\u7528\u9014", unique(data.blocks.map((r) => r.category)))}${field("scene", "\u8BB2\u8BDD\u573A\u666F", SCENE_GROUPS.filter((s) => s !== "\u5168\u90E8\u573A\u666F"))}<div class="field"><label for="filter-validity">\u9002\u7528\u72B6\u6001</label><select id="filter-validity" data-filter="validity">${options(Object.keys(valid), filters.validity).replace(/>current</g, ">\u5F53\u524D\u9002\u7528<").replace(/>watch</g, ">\u4F7F\u7528\u524D\u590D\u6838<").replace(/>historical</g, ">\u5386\u53F2\u53C2\u8003<")}</select></div></div></details><div class="page-columns"><section class="content-pane" id="results">${blockResults()}</section><aside class="side-column"><section class="side-panel library-info"><div class="section-heading"><h2>\u539F\u6587\u4E0E\u8868\u8FBE</h2></div><p>${esc2(payload.yanku.notice)}</p><div class="subtle-note">${payload.yanku.materials.length} \u4EFD\u6838\u6E90\u6750\u6599 \xB7 ${data.blocks.length} \u6BB5\u539F\u521B\u6574\u7406<br>\u8D44\u6599\u66F4\u65B0 ${date2(payload.yanku.generatedAt)}</div></section></aside></div>`;
}
function blockResults() {
  let base = data.blocks.filter((r) => (!filters.category || r.category === filters.category) && (!filters.scene || sceneGroupFor(r.scene) === filters.scene) && (!filters.validity || r.source.validity === filters.validity) && (!filters.saved || state.saved.includes(r.key)));
  let ranked;
  if (tab === "intent" && filters.q.trim()) {
    ranked = rankIntentBlocks(base, filters.q).filter((x) => x.match.score >= 10);
  } else ranked = base.filter((r) => textMatch([r.title, r.text, r.topic, r.tags, r.scene, r.source.title, r.source.sourceName], filters.q)).sort((a, b) => (b.source.lastCheckedAt || "").localeCompare(a.source.lastCheckedAt || "") || b.id.localeCompare(a.id)).map((block) => ({ block }));
  return `<div class="result-heading"><span>${tab === "intent" && filters.q ? "\u5339\u914D\u5230" : "\u5171"} <b>${ranked.length}</b> \u6BB5\u7D20\u6750</span><span>\u53EF\u8BFB \xB7 \u53EF\u590D\u5236 \xB7 \u53EF\u8FFD\u6EAF</span></div>${ranked.length ? ranked.slice(0, limit).map(({ block: r, match }) => `<article class="block-card"><div class="block-title"><div><span class="meta"><span class="brand-tag">${esc2(r.category)}</span><span>${esc2(r.scene)}</span></span><button class="card-open" data-read="${r.key}"><h2>${esc2(r.title)}</h2></button></div>${bookmark(r)}</div>${match ? `<div class="match-reason">${esc2(match.reason)}${match.suggestedSlot ? " \xB7 \u5EFA\u8BAE\u7528\u4E8E" + esc2(match.suggestedSlot) : ""}</div>` : ""}<p class="block-text">${esc2(r.text)}</p><p class="source-line">\u539F\u521B\u6574\u7406 \xB7 \u4F9D\u636E ${esc2(r.source.sourceName)}<br>${esc2(valid[r.source.validity] || "\u4F7F\u7528\u524D\u590D\u6838")} \xB7 \u6838\u6E90 ${date2(r.source.lastCheckedAt)}</p><div class="card-actions">${button("read", "\u5C55\u5F00", "text-button", `data-key="${r.key}"`)}${button("copy", "\u590D\u5236\u7D20\u6750", "secondary-button", `data-key="${r.key}"`)}</div></article>`).join("") : empty("\u6682\u65E0\u5408\u9002\u6BB5\u843D", "\u53EF\u4EE5\u7B80\u5316\u8868\u8FBE\u3001\u6362\u4E00\u4E2A\u573A\u666F\uFF0C\u6216\u51CF\u5C11\u7B5B\u9009\u6761\u4EF6\u3002", button("reset", "\u91CD\u7F6E\u7B5B\u9009"))}${ranked.length > limit ? button("more", "\u518D\u770B 12 \u6BB5", "load-more") : ""}`;
}
function games() {
  return title("\u653E\u677E\u4E00\u4E0B", "\u6682\u653E\u624B\u8FB9\u4E8B\uFF0C\u7559\u4E00\u70B9\u65F6\u95F4\u7ED9\u81EA\u5DF1\u3002", "\u5929\u673A\u7C3F \xB7 \u5C0F\u6E38\u620F \xB7 \u7247\u523B\u95F2\u8DA3") + `<div class="game-grid"><article class="game-card wenchen-card"><div class="wenchen-art" aria-hidden="true"><div class="wenchen-symbol"><strong>\u5929\u673A\u7C3F</strong><small>T I A N J I  B U</small></div></div><div class="game-info"><div class="game-title-row"><h2>\u5929\u673A\u7C3F</h2><span>\u4E1C\u65B9\u547D\u7406</span></div><h3>\u4F60\u7684\u6545\u4E8B\uFF0C<br/>\u4E0D\u6B62\u516B\u4E2A\u5B57\u3002</h3><p>\u5148\u770B\u505A\u4E8B\u3001\u5BF9\u5F85\u94B1\u548C\u76F8\u5904\u7684\u98CE\u683C\uFF0C\u518D\u770B\u72EC\u7ACB\u5217\u51FA\u7684\u8C03\u6574\u5EFA\u8BAE\u3002\u5B9E\u9645\u9047\u5230\u4EC0\u4E48\uFF0C\u7531\u4F60\u8865\u5145\u3002</p>${button("game", "\u770B\u770B\u6211\u7684\u89E3\u8BFB <span>\u2197</span>", "primary-button", `data-game="wenchen"`)}<p class="wenchen-note">\u65E0\u9700\u6CE8\u518C \xB7 \u751F\u8FB0\u5728\u6D4F\u89C8\u5668\u672C\u5730\u8BA1\u7B97</p><details class="game-rules"><summary>\u5173\u4E8E\u5929\u673A\u7C3F</summary><p>\u4F20\u7EDF\u6587\u5316\u4F53\u9A8C\uFF0C\u4EC5\u4F9B\u5A31\u4E50\u4E0E\u81EA\u6211\u601D\u8003\u3002\u8BA1\u7B97\u6309\u4E1C\u516B\u533A\u6807\u51C6\u65F6\uFF1B\u547D\u76D8\u4E0D\u7528\u4E8E\u5224\u65AD\u75BE\u75C5\u3001\u6295\u8D44\u6216\u5A5A\u59FB\u7ED3\u679C\u3002</p><a href="https://github.com/zhuyep/mingli-lab" target="_blank" rel="noopener noreferrer">\u5929\u673A\u7C3F Tianji Bu \xB7 MIT \u5F00\u6E90 \u2197</a></details></div></article><article class="game-card"><div class="game-art"><small>\u8282\u594F\u4E0E\u53CD\u5E94</small><svg class="hex-art" viewBox="0 0 160 170" aria-hidden="true"><path d="M80 13 145 50v73l-65 37-65-37V50z" stroke="#b7624c"/><path d="m80 37 45 26v50l-45 26-45-26V63z" stroke="#e5c889"/><path d="m80 61 24 14v27l-24 14-24-14V75z" stroke="#8ca6a0"/></svg></div><div class="game-info"><div class="game-title-row"><h2>Hextris</h2><span>\u53CD\u5E94\u6D88\u9664</span></div><h3>\u8BA9\u989C\u8272\uFF0C\u6070\u597D\u76F8\u9022\u3002</h3><p>\u8F6C\u52A8\u516D\u8FB9\u5F62\uFF0C\u8BA9\u540C\u8272\u65B9\u5757\u8FDE\u6210\u4E00\u7EBF\u3002\u89C4\u5219\u7B80\u5355\uFF0C\u8282\u594F\u6E10\u7D27\u3002</p>${button("game", "\u5F00\u59CB\u4E00\u5C40 <span>\u2197</span>", "primary-button", `data-game="hextris"`)}<details class="game-rules"><summary>\u73A9\u6CD5\u4E0E\u5F00\u6E90\u51FA\u5904</summary><p>\u70B9\u5DE6\u53F3\u6309\u94AE\u65CB\u8F6C\uFF0C\u8FDE\u63A5\u81F3\u5C11\u4E09\u4E2A\u540C\u8272\u5757\u6D88\u9664\u3002\u7559\u610F\u8FB9\u754C\uFF0C\u53CA\u65F6\u6E05\u7A7A\u5806\u79EF\u3002</p><a href="https://github.com/Hextris/hextris" target="_blank" rel="noopener noreferrer">Hextris \xB7 GPL-3.0 \u2197</a></details></div></article><article class="game-card"><div class="game-art puzzle"><small>\u5B89\u9759\u5730\u63A8\u7406</small><div class="mini-board" aria-hidden="true">${"<i></i>".repeat(16)}</div></div><div class="game-info"><div class="game-title-row"><h2>0h h1</h2><span>\u4E8C\u8272\u903B\u8F91</span></div><h3>\u4E24\u79CD\u989C\u8272\uFF0C\u4E00\u70B9\u63A8\u7406\u3002</h3><p>\u6CA1\u6709\u8BA1\u65F6\u50AC\u4FC3\uFF0C\u7528\u4E09\u6761\u89C4\u5219\u586B\u6EE1\u65B9\u683C\u3002\u4ECE\u5C0F\u68CB\u76D8\u5F00\u59CB\uFF0C\u6162\u6162\u627E\u5230\u79E9\u5E8F\u3002</p>${button("game", "\u9759\u4E0B\u6765\uFF0C\u89E3\u4E00\u5C40 <span>\u2197</span>", "primary-button", `data-game="0hh1"`)}<details class="game-rules"><summary>\u73A9\u6CD5\u4E0E\u5F00\u6E90\u51FA\u5904</summary><p>\u6BCF\u884C\u6BCF\u5217\u4E24\u8272\u6570\u91CF\u76F8\u540C\uFF1B\u4E0D\u8FDE\u7EED\u51FA\u73B0\u4E09\u4E2A\u540C\u8272\uFF1B\u4EFB\u610F\u4E24\u884C\u3001\u4E24\u5217\u90FD\u4E0D\u80FD\u5B8C\u5168\u4E00\u6837\u3002\u6E38\u620F\u5185\u6709\u4E2D\u6587\u6559\u7A0B\u4E0E\u63D0\u793A\u3002</p><a href="https://github.com/florisluiten/0hh1" target="_blank" rel="noopener noreferrer">Q42 / Martin Kool \xB7 MIT \u2197</a></details></div></article></div><p class="subtle-note">\u8FD9\u91CC\u7684\u5E94\u7528\u90FD\u5728\u7AD9\u5185\u6253\u5F00\u3002\u5929\u673A\u7C3F\u4E0D\u4FDD\u5B58\u751F\u8FB0\uFF1B\u6E38\u620F\u6210\u7EE9\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u3002</p>`;
}
function showReader(head, html, actions2 = "", section = "\u5DE5\u4F5C\u53F0", keepRoute = false) {
  if (!keepRoute && parseRoute(location.hash).key) history.replaceState(null, "", "#" + page);
  readerKey = "";
  $("#reader-section").textContent = section;
  $("#reader-content").innerHTML = `<article class="reader-body"><h1 id="reader-title">${head}</h1>${html}</article>`;
  $("#reader-actions").innerHTML = actions2;
  $("#reader-actions").hidden = !actions2;
  const d = $("#reader");
  if (!d.open) d.showModal();
  d.scrollTop = 0;
}
var external = (url, text, cls = "") => safeUrl(url) ? `<a class="${cls}" href="${esc2(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc2(text)} \u2197</a>` : "";
function read(key) {
  const r = data.byKey.get(key);
  if (!r) {
    showReader("\u8FD9\u6761\u5185\u5BB9\u6682\u4E0D\u53EF\u7528", empty("\u5185\u5BB9\u672A\u6536\u5F55\u6216\u5DF2\u64A4\u56DE", "\u6536\u85CF\u548C\u968F\u8BB0\u4ECD\u4FDD\u7559\u5728\u672C\u673A\uFF0C\u53EF\u901A\u8FC7\u4E2A\u4EBA\u5907\u4EFD\u5BFC\u51FA\u3002"));
    return;
  }
  let html = "";
  if (r.kind === "intel") {
    html = `<div class="meta">${esc2(r.category)} \xB7 ${date2(r.reportDate)} \u6536\u5F55 \xB7 ${esc2(r.sourceName)}</div><p class="reader-lead">${esc2(r.summary)}</p><div class="reader-stats"><div><span>\u4F18\u5148\u7EA7</span><strong>${esc2(r.score)} / 10</strong></div><div><span>\u89C2\u5BDF\u5468\u671F</span><strong>${esc2(r.horizon || "\u672A\u6807\u6CE8")}</strong></div><div><span>\u539F\u6587\u53D1\u5E03</span><strong>${esc2(date2(r.publishedDate) || r.publishedLabel || "\u672A\u6807\u6CE8")}</strong></div></div>${r.background ? `<h2>\u80CC\u666F\u4E0E\u8109\u7EDC</h2><p>${esc2(r.background)}</p>` : ""}${r.discussion ? `<h2>\u503C\u5F97\u601D\u8003</h2><p>${esc2(r.discussion)}</p>` : ""}<div class="reader-tags">${(r.tags || []).map((t) => `<span>${esc2(t)}</span>`).join("")}</div><section class="source-box"><h2>\u56DE\u5230\u6765\u6E90</h2>${external(r.url, r.sourceName || "\u539F\u59CB\u6765\u6E90")}${(r.references || []).filter((s, i, a) => safeUrl(s.url) !== safeUrl(r.url) && a.findIndex((x) => safeUrl(x.url) === safeUrl(s.url)) === i).map((s) => external(s.url, s.title || s.sourceName || "\u53C2\u8003\u8D44\u6599", "source-link")).join("")}</section>`;
  } else {
    const s = r.source;
    html = `<div class="meta">${esc2(r.category)} \xB7 ${esc2(r.scene)} \xB7 ${esc2(r.origin || "\u539F\u521B\u6574\u7406")}</div><p class="writing-text">${esc2(r.text)}</p><div class="reader-tags">${(r.tags || []).map((t) => `<span>${esc2(t)}</span>`).join("")}</div><section class="source-box"><h2>\u51FA\u5904\u4E0E\u9002\u7528\u8303\u56F4</h2><p>${esc2(s.title)}</p><p>${esc2(s.sourceName)} \xB7 \u539F\u6587 ${date2(s.publishedOn)}</p><p>${esc2(valid[s.validity] || "\u4F7F\u7528\u524D\u590D\u6838")} \xB7 \u6838\u6E90 ${date2(s.lastCheckedAt)}</p>${s.reviewNote ? `<p>${esc2(s.reviewNote)}</p>` : ""}${external(s.sourceUrl, "\u67E5\u770B\u6743\u5A01\u539F\u6587")}</section>${s.evidenceSummary ? `<h2>\u4F9D\u636E\u6458\u8981</h2><p>${esc2(s.evidenceSummary)}</p>` : ""}${s.material ? `<h2>\u7D20\u6750\u80CC\u666F</h2><p>${esc2(s.material)}</p>` : ""}${s.groupLanding ? `<h2>\u7ED3\u5408\u5B9E\u9645</h2><p>${esc2(s.groupLanding)}</p>` : ""}<p class="subtle-note">${esc2(payload.yanku.notice)}</p>`;
  }
  html += `<label class="note-label" for="reader-note">\u6211\u7684\u968F\u8BB0 <span>\u81EA\u52A8\u4FDD\u5B58\u5230\u6B64\u6D4F\u89C8\u5668</span></label><textarea class="reader-note" id="reader-note" maxlength="5000" placeholder="\u8BB0\u4E0B\u5173\u8054\u3001\u5224\u65AD\u6216\u5F85\u529E\u2026\u2026" data-note="${esc2(key)}">${esc2(state.notes[key] || "")}</textarea>`;
  showReader(esc2(r.title), html, `${button("save-reader", state.saved.includes(key) ? "\u5DF2\u6536\u85CF \u2713" : "\u6536\u85CF")}${button("copy", r.kind === "block" ? "\u590D\u5236\u6BB5\u843D" : "\u590D\u5236\u6458\u8981", "secondary-button", `data-key="${key}"`)}${button("share-reader", "\u5206\u4EAB\u5730\u5740")}`, label(r.kind), true);
  readerKey = key;
  const hash = readingHash(key);
  if (location.hash !== hash) history.pushState(null, "", hash);
  document.title = r.title + " \xB7 \u8BF8\u4E8B\u5927\u5409";
}
function about() {
  const snapshot = payload.meta.mode === "published-snapshot";
  const status = Object.entries(payload.meta.sources || {}).map(([key, value]) => `<p>${key === "horizon" ? "Horizon \u60C5\u62A5" : "\u8A00\u5E93\u7D20\u6750"} \xB7 ${value.state === "ok" ? "\u6821\u9A8C\u901A\u8FC7" : "\u4FDD\u7559\u4E0A\u6B21\u6709\u6548\u5185\u5BB9"}<br>\u8D44\u6599\u66F4\u65B0 ${esc2(dateTime(value.contentUpdatedAt))}<br>\u672C\u7248\u8BFB\u53D6 ${esc2(dateTime(value.lastSuccessfulReadAt))}</p>`).join("");
  showReader("\u8BF8\u4E8B\u5927\u5409", `<div class="about-logo brand-seal"><img src="assets/zhu-shi-da-ji.png" alt="\u6731\u7EA2\u5370\u7AE0"></div><p class="brand-story">\u8D44\u8BAF \xB7 \u5199\u4F5C \xB7 \u95F2\u8DA3</p><p>\u4ECA\u65E5\u6536\u62E2\u66F4\u65B0\uFF0C\u60C5\u62A5\u8FFD\u8E2A\u53D8\u5316\uFF0C\u8A00\u5E93\u8F85\u52A9\u8868\u8FBE\uFF0C\u653E\u677E\u7559\u4E00\u70B9\u95F2\u8DA3\u3002</p><h2>\u8D44\u6599\u4E0E\u66F4\u65B0</h2><p>${snapshot ? "\u60C5\u62A5\u4E0E\u8A00\u5E93\u5DF2\u5728\u8FD9\u91CC\u7EDF\u4E00\u5448\u73B0\u3002\u539F\u6709\u91C7\u96C6\u3001\u6269\u6E90\u548C\u77E5\u8BC6\u5F52\u6863\u7EE7\u7EED\u8FD0\u884C\uFF0C\u65E7\u7AD9\u754C\u9762\u5DF2\u5C01\u5B58\u5E76\u4FDD\u7559\u6062\u590D\u80FD\u529B\u3002" : "\u5F53\u524D\u4E3A\u672C\u5730\u53EA\u8BFB\u9884\u89C8\uFF0C\u5C55\u793A\u5DF2\u6709\u9879\u76EE\u7684\u516C\u5F00\u8D44\u6599\u3002"}</p><section class="source-box"><p>${data.intel.length} \u6761\u60C5\u62A5 \xB7 ${payload.yanku.materials.length} \u4EFD\u6838\u6E90\u6750\u6599 \xB7 ${data.blocks.length} \u6BB5\u7D20\u6750</p>${status || `<p>\u60C5\u62A5 ${esc2(payload.horizon.generatedAt)}<br>\u8A00\u5E93 ${esc2(payload.yanku.generatedAt)}</p>`}${snapshot ? `<p class="subtle-note">\u5185\u5BB9\u7248\u672C ${esc2(payload.meta.version)}<br>\u672C\u7248\u6821\u9A8C ${esc2(dateTime(payload.meta.validatedAt))}</p>` : ""}${button("refresh", "\u91CD\u65B0\u8BFB\u53D6\u8D44\u6599", "inline-link")}</section><h2>\u4E2A\u4EBA\u8BB0\u5F55</h2><p>\u6536\u85CF\u3001\u968F\u8BB0\u548C\u6E38\u620F\u8BB0\u5F55\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u3002\u6362\u8BBE\u5907\u6216\u6362\u7F51\u5740\u524D\uFF0C\u53EF\u4EE5\u5BFC\u51FA\u5907\u4EFD\uFF0C\u518D\u5728\u65B0\u7F51\u5740\u5BFC\u5165\u3002\u539F\u7AD9\u4E91\u7AEF\u8D26\u53F7\u548C\u5386\u53F2\u8BB0\u5F55\u5DF2\u4FDD\u7559\uFF0C\u4E92\u901A\u540E\u7EED\u5904\u7406\u3002</p>${button("backup", "\u5907\u4EFD\u4E0E\u6062\u590D")}<h2>\u65E7\u7AD9\u5B58\u6863</h2><p>\u539F\u6765\u624B\u673A\u4E2D\u7684\u8A00\u5E93\u8349\u7A3F\u6216\u9009\u6750\u8BB0\u5F55\uFF0C\u53EF\u4ECE\u65E7\u7AD9\u5B58\u6863\u9875\u5BFC\u51FA\u4FDD\u5B58\u3002</p>${external("https://party-speech-materials-cn.pages.dev/__archive", "\u4FDD\u5B58\u65E7\u8A00\u5E93\u8BB0\u5F55")}${external("https://ai4e-intel-radar-cn.pages.dev/__archive", "Horizon \u5B58\u6863\u8BF4\u660E")}<h2>\u8BBE\u8BA1\u4E0E\u539F\u4F5C</h2><p>\u6731\u7EA2\u3001\u7EB8\u767D\u3001\u58A8\u8272\u4E0E\u5B8B\u4F53\u6807\u9898\uFF0C\u8D2F\u7A7F\u56DB\u4E2A\u680F\u76EE\u548C\u9605\u8BFB\u754C\u9762\u3002</p>${external("https://github.com/Hextris/hextris", "Hextris \u5F00\u6E90\u539F\u4F5C")}${external("https://github.com/florisluiten/0hh1", "0h h1 \u5F00\u6E90\u539F\u4F5C")}`);
}
var pendingImport = null;
function downloadPersonal() {
  const blob = new Blob([JSON.stringify(exportPersonal(localStorage), null, 2)], { type: "application/json" }), url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url;
  a.download = "\u8BF8\u4E8B\u5927\u5409-\u4E2A\u4EBA\u5907\u4EFD-" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function backup() {
  pendingImport = null;
  showReader("\u5907\u4EFD\u4E0E\u6062\u590D", `<p>\u628A\u6536\u85CF\u3001\u968F\u8BB0\u3001\u5916\u89C2\u548C\u6E38\u620F\u6210\u7EE9\uFF0C\u5E26\u5230\u53E6\u4E00\u4E2A\u6D4F\u89C8\u5668\u3002</p><section class="source-box"><h2>\u5BFC\u51FA\u4E2A\u4EBA\u5907\u4EFD</h2><p>\u6587\u4EF6\u4EC5\u4E0B\u8F7D\u5230\u4F60\u7684\u8BBE\u5907\uFF0C\u8BF7\u81EA\u884C\u59A5\u5584\u4FDD\u5B58\u3002</p>${button("export-personal", "\u5BFC\u51FA\u5907\u4EFD")}</section><section class="source-box"><h2>\u4ECE\u5907\u4EFD\u6062\u590D</h2><p>\u6536\u85CF\u5408\u5E76\u53BB\u91CD\uFF1B\u540C\u4E00\u6761\u968F\u8BB0\u7684\u4E0D\u540C\u5185\u5BB9\u4F1A\u4E00\u5E76\u4FDD\u7559\u3002\u5DF2\u6709\u5916\u89C2\u548C\u6E38\u620F\u8BB0\u5F55\u4F18\u5148\u4FDD\u7559\u3002\u6E38\u620F\u4EC5\u8FC1\u79FB\u6210\u7EE9\uFF0C\u8FDB\u884C\u4E2D\u7684\u5173\u5361\u7559\u5728\u539F\u6D4F\u89C8\u5668\u3002</p><label class="backup-file">\u9009\u62E9\u5907\u4EFD\u6587\u4EF6<input id="personal-backup-file" type="file" accept=".json,application/json"></label><div id="backup-preview" role="status" aria-live="polite"></div></section>`, "", "\u4E2A\u4EBA\u8BB0\u5F55");
}
function search(showCollection = false) {
  collection = showCollection;
  $("#search-title").textContent = collection ? "\u6211\u7684\u6536\u85CF" : "\u641C\u4E00\u641C";
  $("#global-query").value = "";
  searchResults();
  $("#search-dialog").showModal();
  $("#global-query").focus();
}
function searchResults() {
  const q = $("#global-query").value;
  const rows = [...data.intel, ...data.blocks].filter((r) => (!collection || state.saved.includes(r.key)) && textMatch([r.title, r.summary || r.text, r.tags, r.category, r.topic], q));
  $("#global-results").innerHTML = `<div class="result-heading"><span>${collection ? "\u5DF2\u6536\u85CF" : "\u5339\u914D"} ${rows.length} \u6761${rows.length > 40 ? " \xB7 \u5148\u663E\u793A 40 \u6761" : ""}</span></div>` + (rows.length ? rows.slice(0, 40).map((r) => `<button class="search-result" data-read="${r.key}"><span class="meta">${label(r.kind)} \xB7 ${esc2(r.category)}</span><h3>${esc2(r.title)}</h3><p>${esc2(r.summary || r.text)}</p></button>`).join("") : empty(collection ? "\u8FD8\u6CA1\u6709\u6536\u85CF" : "\u6682\u672A\u627E\u5230", collection ? "\u5728\u9605\u8BFB\u65F6\u70B9\u4E00\u4E0B\u6536\u85CF\uFF0C\u559C\u6B22\u7684\u5185\u5BB9\u4F1A\u7559\u5728\u8FD9\u91CC\u3002" : "\u6362\u4E00\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002"));
}
function toggleSave(key) {
  if (state.saved.includes(key)) state.saved = state.saved.filter((k) => k !== key);
  else state.saved.push(key);
  save();
  document.querySelectorAll("[data-save]").forEach((b) => {
    if (b.dataset.save === key) {
      const yes = state.saved.includes(key);
      b.setAttribute("aria-pressed", yes);
      b.setAttribute("aria-label", (yes ? "\u53D6\u6D88\u6536\u85CF" : "\u6536\u85CF") + "\uFF1A" + data.byKey.get(key).title);
    }
  });
  if (readerKey === key) {
    const b = $("#reader-actions [data-action=save-reader]");
    if (b) b.textContent = state.saved.includes(key) ? "\u5DF2\u6536\u85CF \u2713" : "\u6536\u85CF";
  }
  if ($("#search-dialog").open) searchResults();
  if (filters.saved) refreshResults();
  toast(state.saved.includes(key) ? "\u5DF2\u6536\u85CF" : "\u5DF2\u53D6\u6D88\u6536\u85CF");
}
async function copy(text) {
  try {
    if (!navigator.clipboard) throw Error();
    await navigator.clipboard.writeText(text);
    toast("\u5DF2\u590D\u5236");
  } catch {
    showReader("\u590D\u5236\u5185\u5BB9", `<div class="copy-fallback"><label for="copy-content">\u5F53\u524D\u6D4F\u89C8\u5668\u9650\u5236\u76F4\u63A5\u590D\u5236\uFF0C\u8BF7\u957F\u6309\u6216\u5168\u9009\u4E0B\u65B9\u6587\u5B57\u590D\u5236\u3002</label><textarea id="copy-content" readonly>${esc2(text)}</textarea></div>`);
    $("#copy-content").select();
  }
}
function refreshResults() {
  stopGraph();
  const r = $("#results");
  if (r) r.innerHTML = page === "intel" ? intelResults() : blockResults();
  mountIntelExtras();
  document.querySelectorAll("[data-keyword]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.keyword === filters.q));
}
function stopGraph() {
  graphVersion++;
  clearTimeout(graphTimer);
  graphCleanup?.();
  graphCleanup = null;
}
function drillIntel(facet) {
  intelFacet = facet;
  intelView = "list";
  limit = 12;
  render();
  $("#results")?.focus({ preventScroll: true });
  $("#results")?.scrollIntoView({ block: "start", behavior: "instant" });
}
function mountIntelExtras() {
  if (page !== "intel") return;
  const timeline = $(".intel-timeline");
  if (timeline) timeline.scrollLeft = timeline.scrollWidth;
  const host = $("#knowledge-graph");
  if (!host) return;
  const version = graphVersion;
  graphTimer = setTimeout(async () => {
    try {
      const { mountKnowledgeGraph } = await import("./modules/chunks/knowledge-graph-OCSN46ZX.js");
      if (version !== graphVersion || !host.isConnected) return;
      graphCleanup = mountKnowledgeGraph(host, buildKnowledgeGraph(matchingIntel()), { onRead: read, onFacet: drillIntel });
    } catch {
      if (version === graphVersion && host.isConnected) host.innerHTML = '<p class="explore-note">\u56FE\u8C31\u6682\u65F6\u672A\u80FD\u6253\u5F00\u3002</p><button class="secondary-button" data-action="retry-graph">\u91CD\u8BD5</button>';
    }
  }, 120);
}
var actions = {
  "clear-intel-facet": () => {
    intelFacet = null;
    limit = 12;
    refreshResults();
  },
  "retry-graph": () => {
    stopGraph();
    mountIntelExtras();
  },
  "trend-date": (b) => drillIntel({ kind: "date", value: b.dataset.value }),
  "trend-category": (b) => drillIntel({ kind: "category", value: b.dataset.value, from: b.dataset.from, to: b.dataset.to }),
  "share-reader": () => readerKey && copy(new URL(readingHash(readerKey), location.href).href),
  backup,
  "export-personal": () => {
    try {
      downloadPersonal();
      toast("\u5907\u4EFD\u6587\u4EF6\u5DF2\u51C6\u5907\u4E0B\u8F7D");
    } catch {
      toast("\u65E0\u6CD5\u5BFC\u51FA\uFF0C\u8BF7\u68C0\u67E5\u6D4F\u89C8\u5668\u4E2D\u7684\u4E2A\u4EBA\u8BB0\u5F55");
    }
  },
  "import-personal": () => {
    if (!pendingImport) return;
    try {
      downloadPersonal();
      applyImport(localStorage, pendingImport);
      state = JSON.parse(localStorage.getItem(DESK_KEY) || '{"saved":[],"notes":{}}');
      pendingImport = null;
      showReader("\u6062\u590D\u5B8C\u6210", "<p>\u4E2A\u4EBA\u8BB0\u5F55\u5DF2\u5408\u5E76\u3002\u6062\u590D\u524D\u7684\u8BB0\u5F55\u4E5F\u5DF2\u51C6\u5907\u4E0B\u8F7D\u5907\u4EFD\u3002</p>");
      render();
      toast("\u4E2A\u4EBA\u8BB0\u5F55\u5DF2\u6062\u590D");
    } catch {
      toast("\u6062\u590D\u672A\u5B8C\u6210\uFF0C\u539F\u6709\u8BB0\u5F55\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u68C0\u67E5\u6D4F\u89C8\u5668\u5B58\u50A8\u7A7A\u95F4");
    }
  },
  visits: showVisits,
  about,
  refresh: async () => {
    await load();
    if ($("#reader").open) about();
  },
  library: () => navigate("library", "blocks"),
  intel: () => navigate("intel"),
  games: () => navigate("games"),
  reset: () => {
    intelFacet = null;
    Object.assign(filters, { q: "", category: "", horizon: "", days: "", score: "", scene: "", validity: "", saved: false });
    limit = 12;
    render();
  },
  "saved-filter": () => {
    filters.saved = !filters.saved;
    limit = 12;
    render();
  },
  more: () => {
    limit += 12;
    refreshResults();
  },
  read: (b) => read(b.dataset.key),
  copy: (b) => {
    const r = data.byKey.get(b.dataset.key);
    if (r) copy(r.text || `${r.title}

${r.summary}

${safeUrl(r.url)}`);
  },
  "save-reader": () => toggleSave(readerKey),
  game: (b) => gameLoader.open(b.dataset.game)
};
var gameLoader = createGameLoader({ dialog: $("#game-dialog"), container: $("#game-frame"), title: $("#game-title") });
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.close) {
    if (b.dataset.close === "game-dialog") $("#game-frame").replaceChildren();
    $("#" + b.dataset.close).close();
    return;
  }
  if (b.dataset.page) return navigate(b.dataset.page);
  if (b.dataset.action === "game") return actions.game(b);
  if (b.dataset.action === "about") return withContent(about);
  if (!data) {
    if (b.dataset.action === "reload-page") load();
    return;
  }
  if (b.dataset.intelView) {
    intelView = b.dataset.intelView;
    render();
    return;
  }
  if (b.dataset.action) return actions[b.dataset.action]?.(b);
  if (b.dataset.read) return read(b.dataset.read);
  if (b.dataset.save) return toggleSave(b.dataset.save);
  if (b.dataset.tab) {
    tab = b.dataset.tab;
    filters.q = "";
    limit = 12;
    render();
    return;
  }
  if (b.dataset.today) {
    todayFilter = b.dataset.today;
    render();
    return;
  }
  if (b.dataset.keyword) {
    filters.q = b.dataset.keyword;
    limit = 12;
    const input = $("[data-query]");
    if (input) input.value = filters.q;
    refreshResults();
    return;
  }
  if (b.dataset.example) {
    filters.q = b.dataset.example;
    limit = 12;
    render();
    return;
  }
  if (b.dataset.update) {
    const u = payload.yanku.updates.find((u2) => u2.id === b.dataset.update);
    showReader(esc2(u.title), `<div class="meta">\u8A00\u5E93\u66F4\u65B0\u65E5\u5FD7 \xB7 ${date2(u.date)}</div><p>${esc2(u.detail)}</p>`, button("library-from-reader", "\u67E5\u770B\u8A00\u5E93", "primary-button"), "\u8A00\u5E93 \xB7 \u66F4\u65B0");
    return;
  }
});
actions["library-from-reader"] = () => {
  $("#reader").close();
  navigate("library", "blocks");
};
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.matches("[data-query]") && !e.isComposing) {
    filters.q = t.value;
    limit = 12;
    refreshResults();
  }
  if (t.id === "global-query") searchResults();
  if (t.dataset.note) {
    state.notes[t.dataset.note] = t.value;
    save();
  }
});
document.addEventListener("compositionend", (e) => {
  if (e.target.matches("[data-query]")) {
    filters.q = e.target.value;
    limit = 12;
    refreshResults();
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.filter) {
    filters[t.dataset.filter] = t.value;
    limit = 12;
    refreshResults();
  }
});
$("#game-dialog").addEventListener("cancel", () => gameLoader.stop());
function withContent(action) {
  if (data) return action();
  toast("\u6B63\u5728\u8BFB\u53D6\u60C5\u62A5\u4E0E\u8A00\u5E93\u8D44\u6599\u2026\u2026");
  load().then(() => {
    if (data) action();
    else toast(contentError || "\u8D44\u6599\u6682\u65F6\u672A\u80FD\u6253\u5F00\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
  });
}
$("#global-search").onclick = () => withContent(() => search());
$("#open-collection").onclick = () => withContent(() => search(true));
$("#about").onclick = () => withContent(about);
document.querySelectorAll("dialog").forEach((d) => d.addEventListener("close", () => {
  document.body.append($("#toast"));
  if (d.id === "game-dialog") $("#game-frame").innerHTML = "";
  if (d.id === "reader") {
    if (parseRoute(location.hash).key) history.replaceState(null, "", "#" + page);
    readerKey = "";
    if (data) document.title = { today: "\u4ECA\u65E5", intel: "\u60C5\u62A5", library: "\u8A00\u5E93", games: "\u653E\u677E" }[page] + " \xB7 \u8BF8\u4E8B\u5927\u5409";
  }
}));
function applyRoute() {
  const route = parseRoute(location.hash);
  page = route.page;
  if (!data) {
    render();
    if (page !== "games") load();
    return;
  }
  if (!route.key && $("#reader").open) $("#reader").close();
  render();
  if (route.key) read(route.key);
  else if (route.invalid) showReader("\u5730\u5740\u6682\u4E0D\u53EF\u7528", "<p>\u8FD9\u4E2A\u9605\u8BFB\u5730\u5740\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u8BF7\u8FD4\u56DE\u60C5\u62A5\u6216\u8A00\u5E93\u68C0\u7D22\u3002</p>");
}
window.addEventListener("popstate", applyRoute);
async function readContent() {
  let lastError;
  for (const url of ["/content/current.json", "/api/content"]) {
    try {
      const res = await fetch(url, { cache: "no-cache" }), p = await res.json();
      if (!res.ok) throw Error(p.error || "\u8BFB\u53D6\u5931\u8D25");
      return p;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || Error("\u8BFB\u53D6\u5931\u8D25");
}
function load() {
  if (contentPromise) return contentPromise;
  contentError = null;
  lastContentCheck = Date.now();
  contentPromise = (async () => {
    try {
      const p = await readContent();
      payload = p;
      data = normalizeContent(p);
      updates = buildUpdates(data, p);
      updates.push({ kind: "games", date: "2026-09-21", dateLabel: "\u5185\u5BB9\u66F4\u65B0", title: "\u5929\u673A\u7C3F\uFF1A\u5148\u770B\u98CE\u683C\uFF0C\u518D\u8C08\u8C03\u6574", summary: "\u503E\u5411\u5206\u6790\u3001\u8C03\u6574\u5EFA\u8BAE\u3001\u4F60\u586B\u5199\u7684\u73B0\u72B6\uFF0C\u5206\u5F00\u9605\u8BFB\u3002\u4E13\u4E1A\u8BF4\u6CD5\u914D\u767D\u8BDD\uFF0C\u5EFA\u8BAE\u914D\u5177\u4F53\u4F8B\u5B50\u3002" });
      updates.push({ kind: "games", date: "2026-09-05", dateLabel: "\u52A0\u5165\u5DE5\u4F5C\u53F0", title: "Hextris \u4E0E 0h h1\uFF0C\u968F\u624B\u5F00\u4E00\u5C40", summary: "\u516D\u8FB9\u5F62\u6D88\u9664\u4E0E\u4E8C\u8272\u903B\u8F91\u3002\u652F\u6301\u624B\u673A\u89E6\u63A7\uFF0C\u7AD9\u5185\u76F4\u63A5\u73A9\u3002" });
      updates.sort((a, b) => b.date.localeCompare(a.date) || { library: 0, games: 1, intel: 2 }[a.kind] - { library: 0, games: 1, intel: 2 }[b.kind]);
      setIntentProfiles(p.yanku.intents);
      applyRoute();
    } catch (e) {
      contentError = e.message;
      if (page !== "games") render();
    } finally {
      contentPromise = null;
    }
  })();
  return contentPromise;
}
function refreshVisibleContent() {
  if (document.visibilityState === "visible" && Date.now() - lastContentCheck >= 6e4) load();
}
document.addEventListener("visibilitychange", refreshVisibleContent);
actions["reload-page"] = load;
page = parseRoute(location.hash).page;
render();
if (page !== "games") load();
loadVisits();
document.addEventListener("change", async (e) => {
  if (e.target.id !== "personal-backup-file") return;
  const file = e.target.files?.[0];
  const preview = $("#backup-preview");
  pendingImport = null;
  if (!file) return;
  try {
    if (file.size > 5e6) throw Error("\u5907\u4EFD\u6587\u4EF6\u8FC7\u5927");
    const plan = planImport(localStorage, parseBackup(await file.text()));
    pendingImport = plan;
    preview.innerHTML = `<p>\u5408\u5E76\u540E\u5171 ${plan.saved} \u6761\u6536\u85CF\u3001${plan.notes} \u6761\u968F\u8BB0\u3002${plan.conflicts ? "\u5176\u4E2D " + plan.conflicts + " \u6761\u968F\u8BB0\u5C06\u4FDD\u7559\u4E24\u4E2A\u7248\u672C\u3002" : ""}</p><p>\u786E\u8BA4\u6062\u590D\u65F6\uFF0C\u4F1A\u5148\u5BFC\u51FA\u5F53\u524D\u8BB0\u5F55\u4F5C\u4E3A\u5907\u4EFD\u3002</p>${button("import-personal", "\u786E\u8BA4\u5408\u5E76\u6062\u590D")}`;
  } catch (error) {
    preview.textContent = error.message;
  }
});
