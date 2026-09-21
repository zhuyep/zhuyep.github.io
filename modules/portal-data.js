export const safeUrl=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
export const textMatch=(values,query)=>{const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);const text=values.flat().join(' ').toLocaleLowerCase();return terms.every(t=>text.includes(t))};
export const dateOnly=value=>/^\d{4}-\d{2}-\d{2}/.test(value||'')?value.slice(0,10):'';
export function searchIntelligence(records,query=''){
 const normalize=value=>String(value??'').normalize('NFKC').toLocaleLowerCase();
 const terms=normalize(query).trim().split(/\s+/).filter(Boolean);
 return records.map(record=>{
  const title=normalize(record.title),tags=normalize((record.tags||[]).join(' ')),category=normalize(record.category),source=normalize(record.sourceName),summary=normalize(record.summary);
  const text=[title,tags,category,source,summary,record.background,record.discussion,(record.searchTerms||[]).join(' '),(record.references||[]).map(r=>[r.title,r.sourceName].join(' ')).join(' ')].map(normalize).join(' ');
  const matches=terms.every(term=>text.includes(term));
  const rank=terms.reduce((n,term)=>n+(title.includes(term)?12:0)+(tags.includes(term)?8:0)+(category.includes(term)?5:0)+(source.includes(term)?4:0)+(summary.includes(term)?2:0),0);
  return {record,matches,rank};
 }).filter(r=>r.matches).sort((a,b)=>b.rank-a.rank||(b.record.reportDate||'').localeCompare(a.record.reportDate||'')||(b.record.score||0)-(a.record.score||0)).map(r=>r.record);
}
export function normalizeContent(payload){
 const sources=new Map(payload.yanku.materials.map(m=>[m.id,m]));
 const intel=payload.horizon.records.map(r=>({...r,key:'intel:'+r.id,kind:'intel'}));
 const blocks=payload.yanku.blocks.map(b=>({...b,key:'block:'+b.id,kind:'block',source:sources.get(b.sourceMaterialId)}));
 return {intel,blocks,byKey:new Map([...intel,...blocks].map(r=>[r.key,r])),sources};
}
export function buildUpdates(data,payload){
 const intel=[...data.intel].sort((a,b)=>b.reportDate.localeCompare(a.reportDate)||(b.score-a.score)).map(r=>({kind:'intel',date:r.reportDate,dateLabel:'收录',title:r.title,summary:r.summary,item:r}));
 const library=payload.yanku.updates.map(u=>({kind:'library',date:u.date,dateLabel:'更新',title:u.title,summary:u.detail,update:u}));
 return [...intel,...library].sort((a,b)=>b.date.localeCompare(a.date)||(a.kind==='library'?-1:1));
}
export function exportDraft({draft,basket,byKey,template,markdown=true}){
 const lines=[markdown?'# '+draft.title:draft.title,`结构：${template.name}`,`对象：${draft.audience||'未填写'}`,`语气：${draft.tone||'未填写'}`,''];const sources=[];
 for(const slot of template.slots){const items=basket.map(k=>byKey.get(k)).filter(b=>b&&draft.assignments[b.id]===slot.id);const fact=draft.facts[slot.id];if(!items.length&&!fact)continue;lines.push((markdown?'## ':'')+slot.label,'');if(fact)lines.push('【本单位事实 / 待核】'+fact,'');for(const item of items){let number=sources.findIndex(s=>s.id===item.source?.id)+1;if(!number){sources.push(item.source||{id:item.sourceMaterialId,title:'来源待补充'});number=sources.length}lines.push(item.text+` [${number}]`,'')}}
 const currentSlots=new Set(template.slots.map(s=>s.id));const retained=Object.entries(draft.facts).filter(([k,v])=>v&&!currentSlots.has(k));if(retained.length){lines.push(markdown?'## 其他结构保留的事实（待归位）':'其他结构保留的事实（待归位）','');retained.forEach(([,v])=>lines.push('【本单位事实 / 待核】'+v,''))}
 lines.push(markdown?'## 来源与复核':'来源与复核','');sources.forEach((s,i)=>lines.push(`[${i+1}] ${s.title}｜${s.sourceName||''}｜${s.publishedOn||'日期未提供'}\n${safeUrl(s.sourceUrl)||'来源链接待补充'}`));lines.push('','素材为言库原创整理，不是领导人原话。正式成稿前需复核本单位事实、数字、名称、原文与适用范围。');if(draft.pendingItems.length)lines.push('','待核事项',...draft.pendingItems.map(x=>'- '+x));return lines.join('\n');
}
