// demo/modules/intel-explore.js
var NODE_LABELS = { intelligence: "\u60C5\u62A5", category: "\u9886\u57DF", tag: "\u4E3B\u9898", source: "\u4FE1\u6E90" };
var clean = (value) => typeof value === "string" ? value.trim() : "";
var tagsOf = (record) => [...new Set((record.tags || []).map(clean).filter(Boolean))];
var latestFirst = (a, b) => (b.reportDate || "").localeCompare(a.reportDate || "") || (b.score || 0) - (a.score || 0) || a.id.localeCompare(b.id);
function validReportDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  const parsed = /* @__PURE__ */ new Date(value + "T00:00:00Z");
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value ? value : "";
}
function filterByFacet(records, facet) {
  if (!facet) return records;
  return records.filter((r) => {
    if (facet.from && (!validReportDate(r.reportDate) || r.reportDate < facet.from || r.reportDate > facet.to)) return false;
    if (facet.kind === "category") return (clean(r.category) || "\u672A\u6807\u6CE8\u9886\u57DF") === facet.value;
    if (facet.kind === "source") return clean(r.sourceName) === facet.value;
    if (facet.kind === "tag") return tagsOf(r).includes(facet.value);
    if (facet.kind === "date") return r.reportDate === facet.value;
    return false;
  });
}
function buildKnowledgeGraph(records, { limit = 80, tagLimit = 24, sourceLimit = 16 } = {}) {
  const all = [...new Map(records.filter((r) => r.id).map((r) => [r.id, r])).values()];
  const items = [...all].sort(latestFirst).slice(0, limit);
  const groups = { category: /* @__PURE__ */ new Map(), tag: /* @__PURE__ */ new Map(), source: /* @__PURE__ */ new Map() };
  function count(group, value) {
    if (value) groups[group].set(value, (groups[group].get(value) || 0) + 1);
  }
  for (const r of items) {
    count("category", clean(r.category));
    count("source", clean(r.sourceName));
    tagsOf(r).forEach((tag) => count("tag", tag));
  }
  const top = (map, cap) => [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, cap);
  const nodes = [], links = [];
  for (const kind of ["category", "tag", "source"]) {
    for (const [label, count2] of top(groups[kind], kind === "tag" ? tagLimit : kind === "source" ? sourceLimit : Infinity)) {
      nodes.push({ id: kind + ":" + label, label, kind, count: count2, radius: kind === "category" ? 14 + Math.min(9, Math.sqrt(count2)) : 6 + Math.min(7, Math.sqrt(count2)) });
    }
  }
  const facetIds = new Set(nodes.map((n) => n.id));
  for (const item of items) {
    const id = "item:" + item.id;
    nodes.push({ id, kind: "intelligence", label: item.title, count: 1, key: item.key || "intel:" + item.id, record: item, radius: 5 + Math.max(0, (item.score || 5) - 5) });
    for (const [kind, value] of [["category", clean(item.category)], ["source", clean(item.sourceName)], ...tagsOf(item).map((tag) => ["tag", tag])]) {
      const target = kind + ":" + value;
      if (facetIds.has(target)) links.push({ source: id, target, kind });
    }
  }
  return { nodes, links, items, total: all.length, shown: items.length };
}
function buildIntelTrends(records, { latestDate, days = 30 } = {}) {
  const dates = records.map((r) => validReportDate(r.reportDate)).filter(Boolean).sort();
  const to = validReportDate(latestDate) || dates.at(-1);
  if (!to) return { days: [], categories: [], records: [], undated: records.length, total: 0, priority: 0, average: null };
  const end = /* @__PURE__ */ new Date(to + "T00:00:00Z"), start = new Date(+end - (days - 1) * 864e5), from = start.toISOString().slice(0, 10);
  const rows = records.filter((r) => validReportDate(r.reportDate) && r.reportDate >= from && r.reportDate <= to);
  const counts = /* @__PURE__ */ new Map(), groups = /* @__PURE__ */ new Map();
  for (const r of rows) {
    counts.set(r.reportDate, (counts.get(r.reportDate) || 0) + 1);
    const name = clean(r.category) || "\u672A\u6807\u6CE8\u9886\u57DF";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(r);
  }
  const scores = rows.map((r) => r.score).filter((n) => typeof n === "number" && Number.isFinite(n));
  return {
    from,
    to,
    records: rows,
    total: rows.length,
    undated: records.filter((r) => !validReportDate(r.reportDate)).length,
    priority: scores.filter((n) => n >= 7).length,
    average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    days: Array.from({ length: days }, (_, i) => {
      const date = new Date(+start + i * 864e5).toISOString().slice(0, 10);
      return { date, count: counts.get(date) || 0 };
    }),
    categories: [...groups].map(([name, items]) => {
      const scored = items.map((r) => r.score).filter((n) => typeof n === "number" && Number.isFinite(n));
      return { name, count: items.length, average: scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null };
    }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  };
}

export {
  NODE_LABELS,
  validReportDate,
  filterByFacet,
  buildKnowledgeGraph,
  buildIntelTrends
};
