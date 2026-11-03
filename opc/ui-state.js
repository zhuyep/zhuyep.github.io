// Presentation only: no dispatching, synthetic heartbeats or persisted changes.
import {completeRoster} from './organization.js';
export const statusNames = Object.freeze({working:'进行中',blocked:'待处理',failed:'执行失败',stale:'待确认',completed:'已交付',idle:'待命',unconnected:'未接入'});
const active = new Set(['working','blocked']);
const attention = new Set(['blocked','failed','stale']);
export function describeWorker(worker, {now=Date.now(),staleAfterSeconds=3600}={}) {
  const w=worker||{}, stamp=w.task?.last_activity_at||w.task?.updated_at||w.last_seen;
  const timestamp=Date.parse(stamp), valid=Number.isFinite(timestamp)&&timestamp<=now+300000;
  const ageSeconds=valid?Math.max(0,Math.floor((now-timestamp)/1000)):null;
  let status=statusNames[w.status]?w.status:'unconnected';
  if(active.has(status)&&(!valid||ageSeconds>staleAfterSeconds))status='stale';
  return {status,label:statusNames[status],needsAttention:attention.has(status),ageSeconds,
    reportedAt:valid?new Date(timestamp).toISOString():null,
    taskTitle:w.task?.title|| (w.directory_only?'岗位已确认，网页回报待接入':valid?'等待下一项任务':'尚未收到任务回报'),
    source:w.last_event?.source?.label||w.task?.source?.label||(w.directory_only?'Grok 岗位目录 · 2026-11-02核对':'尚未标明来源')};
}
export function summarizeWorkers(workers,options) {
  const items=(Array.isArray(workers)?workers:[]).map(worker=>({worker,...describeWorker(worker,options)}));
  return {items,total:items.length,working:items.filter(x=>x.status==='working').length,
    attention:items.filter(x=>x.needsAttention).length,completed:items.filter(x=>x.status==='completed').length,
    waiting:items.filter(x=>['idle','unconnected'].includes(x.status)).length};
}
export function matchesWorkerFilter(item,filter) {
  return filter==='all'||(filter==='attention'?item.needsAttention:filter==='waiting'?['idle','unconnected'].includes(item.status):item.status===filter);
}
export function presentOffice(snapshot,options={}) {
  if(!snapshot)return snapshot;
  const settings={staleAfterSeconds:snapshot.company?.stale_after_seconds||3600,...options};
  const tasks=(snapshot.tasks||[]).map(task=>({...task,status:describeWorker({status:task.status,task},settings).status}));
  const workers=completeRoster(snapshot).map(worker=>{
    const info=describeWorker(worker,settings);
    return {...worker,status:info.status,task:worker.task?{...worker.task,status:info.status}:null};
  });
  return {...snapshot,workers,tasks};
}
export function relativeReport(value,now=Date.now()) {
  const at=Date.parse(value);if(!Number.isFinite(at))return '尚无回报';
  if(at>now+300000)return '回报时间待核对';
  const seconds=Math.max(0,Math.floor((now-at)/1000));
  if(seconds<60)return `${seconds}秒前`;
  if(seconds<3600)return `${Math.floor(seconds/60)}分钟前`;
  if(seconds<86400)return `${Math.floor(seconds/3600)}小时前`;
  return `${Math.floor(seconds/86400)}天前`;
}
