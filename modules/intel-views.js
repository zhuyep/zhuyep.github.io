import {NODE_LABELS,buildIntelTrends,validReportDate} from './intel-explore.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=value=>(value||'').replaceAll('-','.');
export function facetMarkup(facet){
  return facet?`<div class="intel-facet"><span>${NODE_LABELS[facet.kind]||'收录日期'}：<strong>${esc(facet.value)}</strong>${facet.from?` <small>${date(facet.from)}—${date(facet.to)}</small>`:''}</span><button data-action="clear-intel-facet" aria-label="清除关联条件">清除 ×</button></div>`:'';
}
export function graphMarkup(rows){
  if(!rows.length)return '<div class="empty-state"><h2>暂无可展示的关系</h2><p>换个关键词，或清除筛选条件再看看。</p><button class="secondary-button" data-action="reset">查看全部情报</button></div>';
  return `<div class="explore-heading"><div><span class="eyebrow">KNOWLEDGE MAP</span><h2>把线索连起来</h2></div><span role="status">当前 ${rows.length} 条 · 图示最近 ${Math.min(rows.length,80)} 条</span></div><div id="knowledge-graph"><p class="graph-loading" role="status">正在整理关系……</p></div><p class="explore-note">连线来自情报已有的领域、主题与信源标注，不代表因果或合作关系。图中保留高频 24 个主题与 16 个信源；搜索后可继续探索相关记录。</p>`;
}
export function trendsMarkup(rows,allRecords){
  const latestDate=allRecords.map(r=>validReportDate(r.reportDate)).filter(Boolean).sort().at(-1);
  const stats=buildIntelTrends(rows,{latestDate}),max=Math.max(1,...stats.days.map(d=>d.count));
  if(!stats.days.length)return '<div class="empty-state"><h2>暂无时间线</h2><p>资料中尚无可用的收录日期。</p></div>';
  return `<div class="explore-heading"><div><span class="eyebrow">COLLECTION TRENDS</span><h2>线索如何积累</h2></div><span>近 30 天 · ${date(stats.from)}—${date(stats.to)}</span></div>
    <div class="intel-trend-stats"><div><span>期间收录</span><strong>${stats.total}<small> 条</small></strong></div><div><span>优先级 ≥ 7</span><strong>${stats.priority}<small> 条</small></strong></div><div><span>平均优先级</span><strong>${stats.average===null?'—':stats.average.toFixed(1)}</strong></div></div>
    <section class="trend-panel"><div class="trend-section-heading"><h3>入库时间线</h3><span>点日期查看 · 左右滑动</span></div><div class="intel-timeline" aria-label="近 30 天收录数量">${stats.days.map(d=>`<button data-action="trend-date" data-value="${d.date}" aria-label="${d.date} 收录 ${d.count} 条情报"><span class="timeline-count">${d.count}</span><span class="timeline-plot"><i class="timeline-bar ${d.date===stats.to?'latest':''}" style="height:${d.count?Math.max(3,d.count/max*100):0}%"></i></span><span class="timeline-date">${d.date.slice(5).replace('-','/')}</span></button>`).join('')}</div></section>
    <section class="trend-panel"><div class="trend-section-heading"><h3>领域分布</h3><span>点领域查看</span></div><div class="intel-domains">${stats.categories.length?stats.categories.map(c=>`<button class="intel-domain" data-action="trend-category" data-value="${esc(c.name)}" data-from="${stats.from}" data-to="${stats.to}"><span class="domain-heading"><strong>${esc(c.name)}</strong><span>${c.count} 条 <span aria-hidden="true">↗</span></span></span><span class="domain-track"><i style="width:${c.count/stats.total*100}%"></i></span><small>占 ${c.count/stats.total<.01?'&lt;1':Math.round(c.count/stats.total*100)}% · 平均优先级 ${c.average===null?'—':c.average.toFixed(1)}</small></button>`).join(''):'<p class="explore-note">这段时间没有符合当前条件的情报。</p>'}</div></section>
    <p class="explore-note">按当前检索范围的收录日期统计，以资料中最新收录日为终点。空白日期表示当前资料没有对应记录，不代表当天没有抓取；领域分布不代表行业热度。${stats.undated?`另有 ${stats.undated} 条日期缺失或无效，未纳入时间统计。`:''}</p>`;
}
