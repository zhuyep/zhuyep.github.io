// Existing public text is parsed conservatively; community comments stay separate.
const FIELDS = ['关联', '关注', '借鉴', '边界'];
// Reading invitations, condensed from these records' existing, bounded analyses.
// They are presentation copy, not additions to the reported facts or source text.
const READING_INVITATIONS = {
  'intel-ef78b1ef9b0d89f1b56e': '跟踪外部模型供给的变化线索，供航发 AI 选型观察；融资说法仍待核实。',
  'intel-701c1733fb9fb7f7c4fe': '借鉴引用图谱，探索航发标准变更的影响初筛方法，仍须专业复核。',
  'intel-674a9b4429cf6698bcc5': '跟进智能体软件的标准与试点口径，供航发工业软件规划参考。',
  'intel-8b3ef63f5c4e566c2c64': '借此比较专业任务的智能体评测方法，自我改进主张仍待验证。',
  'intel-5089b61afea9a586ae0a': '为 AI 研究方向储备政策线索，配套资金与任务仍待核实。',
  'intel-a8282be94d69fdaa5b29': '借外部接入争议，检查航发智能体的权限、身份与人工确认边界。',
  'intel-2d3f60d5139ccdbe0fea': '为仿真与虚实交互储备方向线索，暂不能据此判断落地条件。',
  'intel-3358593b9b1411d6372a': '仅作外部 AI 供应商的资本风险线索，不能据此判断技术能力。',
  'intel-7b77594de365872e0495': '观察跨公司专项组如何验证制造 AI，供航发单工序试点比较。',
  'intel-c93b9ce6b3af6d14585c': '跟踪机器人仿真到现场调试的闭环，先看具体工位与对照数据。',
  'intel-0ebfe851ce4d7a530764': '对照航发 AI 试点转规模化的场景、数据与验证门槛，原文待核。',
  'intel-f4ef15a9b56c5a14baa2': '比较共享 AI 基座与自建方案的数据隔离边界，先核实平台能力。',
  'intel-342f6f6f025d33f9f52e': '为航发算力需求分档找外部参照，先看集采规格与中标结果。',
  'intel-9d577bc6cf520103f35c': '比较仿真、试验数据的标注与共享口径，先核对标准文本。',
  'intel-65f045324b9729b83caf': '为航发监测的端侧推理选型储备线索，先看功耗、时延与出货证据。',
  'intel-ae002f5b930a18ab9ed5': '对照真实数据的采集与治理流程，主体和数据能力仍待核实。',
  'intel-cdde3b018196abe84f69': '为航发 AI 试点复制找验收参照，先看具名客户与重复部署证据。',
  'intel-debb0c81a6d6ca3cd7a3': '先核对物理 AI 的任务与成功率，判断是否值得做航发场景复现。',
  'intel-92a22fec30bb8929bef4': '为边缘推理比较存储带宽与功耗，研发说法和指标仍待核实。',
  'intel-f9f897bfa311f670c855': '为智能体接入 PLM、MES 或仿真链找案例，重点看接口与复核点。'
};
export function parseWorkBrief(text = '') {
  if (typeof text !== 'string') return null;
  const header = text.match(/^【航发关联预判\s*·\s*([^】]+)】/);
  if (!header) return /^航发关联预判待补/.test(text) ? {pending:true} : null;
  if (header[1].includes('待补')) return {pending:true};
  const end = text.indexOf('\n社区讨论：');
  const body = end < 0 ? text : text.slice(0, end);
  const values = {};
  for (let i = 0; i < FIELDS.length; i++) {
    const label = FIELDS[i], start = body.indexOf(label + '：', header[0].length);
    if (start < 0) return null;
    const next = i < FIELDS.length - 1 ? body.indexOf(FIELDS[i+1] + '：', start + label.length + 1) : body.indexOf('（AI初判', start);
    if (next < 0) return null;
    values[label] = body.slice(start + label.length + 1, next).trim();
    if (!values[label]) return null;
  }
  const level = header[1].split('·')[0].trim();
  if (!['直接相关','方法可借鉴','持续观察','关联较弱'].includes(level)) return null;
  return {level, summaryOnly:header[1].includes('仅据摘要'), values};
}

export function readingReason(brief, record = {}) {
  if (!brief || brief.pending) return '';
  const invitation = READING_INVITATIONS[record.id || record.key?.replace(/^intel:/, '')];
  if (invitation) return invitation;
  // Keep one complete sentence, including conditions within it. Do not clip a
  // clause or turn a weak relation into a recommendation to use the technique.
  const field = ['持续观察','关联较弱'].includes(brief.level) ? '关注' : '借鉴';
  const text = brief.values[field];
  const sentence = text.match(/^[\s\S]*?[。！？][”’」』]?/)?.[0] || text;
  return /[。！？][”’」』]?$/.test(sentence) ? sentence : sentence + '。';
}

export function workBriefMarkup(record, {escape, inline = false}) {
  const brief = parseWorkBrief(record.discussion), reason = readingReason(brief, record);
  if (!reason) return inline && brief?.pending ? '<span class="work-brief work-brief-pending"><span class="work-brief-label">看点待补</span><span class="work-brief-reason">依据不足，暂不作判断。</span></span>' : '';
  const basis = brief.summaryOnly ? '仅据摘要，原文待核' : '依据采集正文，未经专项核验';
  const body = `<span class="work-brief-label">荐读</span><span class="work-brief-reason">${escape(reason)}</span>`;
  return inline ? `<span class="work-brief" title="AI阅读提示 · ${basis}">${body}</span>` : `<button type="button" class="work-brief" data-read="${escape(record.key || 'intel:' + record.id)}" title="AI阅读提示 · ${basis}">${body}<span class="work-brief-arrow" aria-hidden="true">↗</span></button>`;
}

export function intelCardMarkup(record, {escape, bookmark, date}) {
  const key = record.key || 'intel:' + record.id;
  return `<article class="intel-card intel-card-compact intel-card-dense"><button type="button" class="card-open intel-card-open" data-read="${escape(key)}"><span class="meta intel-card-meta"><span class="brand-tag intel">${escape(record.category)}</span><span class="intel-card-source">${escape(record.sourceName)}</span><span>${escape(date(record.reportDate))} 收录</span></span><h2>${escape(record.title)}</h2>${workBriefMarkup(record,{escape,inline:true})}</button>${bookmark(record)}</article>`;
}
