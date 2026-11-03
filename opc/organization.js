// Directory verified in the user's Grok Bot UI on 2026-11-02.
// A directory entry is not an execution report. No financial or health records.
export const directory = Object.freeze([
  {id:'supervisor',name:'小朱总',role:'CEO&计划部',initial:'朱',color:'#5b8cff',center:'成本'},
  {id:'star_a',name:'马仔小A',role:'GitHub产品线',initial:'A',color:'#467f77',center:'利润',line:'star'},
  {id:'game_b',name:'马仔小B',role:'微信游戏产品线',initial:'B',color:'#a78bfa',center:'利润',line:'game'},
  {id:'quant_c',name:'马仔小C',role:'量化交易',initial:'C',color:'#caa55b',center:'利润',line:'quant',simulation:true,verified_schedule:'工作日 11:00 量化自学、18:00 模拟日记账；周五 09:00 量化复盘'},
  {id:'intel',name:'顺风耳',role:'战略部',initial:'耳',color:'#3dd68c',center:'成本'},
  {id:'secretary',name:'小秘书',role:'行政管家',initial:'秘',color:'#f5c542',center:'成本'},
  {id:'it_ops',name:'小IT',role:'运维中心',initial:'IT',color:'#8fa5bf',center:'成本'},
  {id:'nurse',name:'小护士',role:'私人小护士',initial:'护',color:'#e999b8',center:'成本',verified_schedule:'每日 08:00 晨间、12:00 午间、20:00 晚间关怀'}
]);
const shortName=name=>String(name||'').split(/[·|｜—-]/u)[0].trim();
const aliases=entry=>[entry.name,entry.name.replace(/^马仔/,'')];
const knownName=(worker,entry)=>worker.id===entry.id||aliases(entry).includes(shortName(worker.name));
export function isLegion(snapshot){return snapshot?.company?.id==='zhujiajun-opc'||snapshot?.company?.chinese_name==='朱家军'||snapshot?.company?.strategy?.brand==='朱家军';}
export function completeRoster(snapshot){
  if(!isLegion(snapshot))return [...(snapshot?.workers||[])];
  const workers=(snapshot?.workers||[]).map(worker=>({...directory.find(entry=>knownName(worker,entry)),...worker}));
  for(const entry of directory){
    if(workers.some(worker=>knownName(worker,entry)))continue;
    workers.push({...entry,dept:entry.role,mission:'岗位已核对；网页尚未接到该岗位的执行回报。',deliverables:[],status:'unconnected',last_seen:null,task:null,last_event:null,evidence:[],directory_only:true});
  }
  return workers;
}
export function businessLines(snapshot){
  const workers=snapshot?.workers||[],strategy=snapshot?.company?.strategy||{},charts=strategy.ops_hall?.charts||{};
  const all=[...(Array.isArray(charts.funnels)?charts.funnels:[]),charts.star_funnel,charts.game_funnel,charts.quant_funnel].filter(Boolean);
  if(!all.length&&charts.funnel)all.push(charts.funnel);
  const seen=new Set(),funnels=all.filter((f,i)=>{const id=f.id||f.title||`line-${i}`;if(seen.has(id))return false;seen.add(id);return true;});
  const profit=workers.filter(w=>w.center==='利润'||w.center==='profit'||directory.some(d=>d.line&&knownName(w,d)));
  const lines=profit.map(worker=>{
    const entry=directory.find(d=>knownName(worker,d));
    const line=entry?.line||worker.business_line||worker.id;
    const funnel=funnels.find(f=>f.id===line||f.worker_id===worker.id||f.owner_id===worker.id||String(f.owner||'').split(/[、,，/·\s]+/).some(owner=>owner&&(owner===worker.name||(entry&&aliases(entry).includes(owner)))));
    return {id:line,worker,title:funnel?.title||worker.role||worker.dept||worker.name,funnel:funnel||null,simulation:Boolean(worker.simulation||entry?.simulation)};
  });
  for(const funnel of funnels){if(lines.some(line=>line.funnel===funnel))continue;lines.push({id:funnel.id||`extra-${lines.length}`,title:funnel.title||funnel.track||'业务流',worker:null,funnel,simulation:Boolean(funnel.simulation)});}
  return lines;
}
export function sceneActors(workers){
  const screens=['charts','palette','terminal','bugs','docs','map'],hair=[0x473b34,0x4d3a33,0x292c37,0x6a493b,0x3c3332,0x624b39];
  return workers.filter(w=>w.id!=='michelle').map((w,i)=>{const hex=/^#[\da-f]{6}$/i.test(w.color||'')?w.color:'#8fa5bf';return{id:w.id,name:w.name,role:w.role,hex,color:parseInt(hex.slice(1),16),screen:screens[i%screens.length],hair:hair[i%hair.length],shirt:parseInt(hex.slice(1),16),pants:0x34465a};});
}
