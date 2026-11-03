export const SNAPSHOT_SCHEMA='maixiang.snapshot.v1';
export const TASK_STATES={queued:'待处理',processing:'处理中',recorded:'已入档',answered:'已答复',failed:'待重试',cancelled:'已取消'};
const fail=()=>{throw Object.assign(Error('健康摘要格式不符合约定'),{status:400,code:'invalid-snapshot'});};
const object=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||keys.some(k=>!Object.hasOwn(x,k))||Object.keys(x).some(k=>!keys.includes(k)))fail();};
const text=(v,n=800,nullable=false)=>{if(nullable&&v==null)return;if(typeof v!=='string'||v.length>n||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]|(?:https?:|file:)\/\/|\/Users\//i.test(v))fail();};
const num=v=>{if(v!=null&&(typeof v!=='number'||!Number.isFinite(v)||v<0))fail();};
const date=v=>{if(v!=null&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v))fail();};
const rows=(v,max)=>{if(!Array.isArray(v)||v.length>max)fail();};
export function validateSnapshot(s){
 object(s,['schema_version','snapshot_id','generated_at','timezone','coverage','focus','plans','daily','activities','clinical','lifestyle','report_status','source_coverage']);
 if(s.schema_version!==SNAPSHOT_SCHEMA||!/^[a-f0-9]{24,64}$/.test(s.snapshot_id)||s.timezone!=='Asia/Shanghai'||!Number.isFinite(Date.parse(s.generated_at)))fail();
 object(s.coverage,['daily_start','daily_end','daily_dates','sleep_duration_dates','unique_timed_activities','full_history']);date(s.coverage.daily_start);date(s.coverage.daily_end);for(const k of ['daily_dates','sleep_duration_dates','unique_timed_activities'])num(s.coverage[k]);if(typeof s.coverage.full_history!=='boolean')fail();
 rows(s.focus,8);for(const r of s.focus){object(r,['title','summary']);text(r.title,120);text(r.summary);}
 rows(s.plans,12);for(const r of s.plans){object(r,['id','title','detail','status']);text(r.id,100);text(r.title,180);text(r.detail);text(r.status,30);}
 rows(s.daily,400);const dates=new Set();for(const r of s.daily){object(r,['date','steps','sleep_minutes','resting_hr','hrv','partial','quality','source']);date(r.date);if(!r.date||dates.has(r.date))fail();dates.add(r.date);for(const k of ['steps','sleep_minutes','resting_hr','hrv'])num(r[k]);if(typeof r.partial!=='boolean')fail();object(r.quality,['steps','sleep_minutes','resting_hr','hrv']);for(const q of Object.values(r.quality))if(!['estimated','present','partial','missing','invalid','conflict'].includes(q))fail();text(r.source,100);}
 rows(s.activities,1500);const ids=new Set();for(const r of s.activities){object(r,['id','date','time','type','duration_minutes','distance_km','source']);text(r.id,100);if(ids.has(r.id))fail();ids.add(r.id);date(r.date);text(r.time,10,true);text(r.type,80,true);num(r.duration_minutes);num(r.distance_km);text(r.source,100);}
 rows(s.clinical,200);for(const r of s.clinical){object(r,['id','metric','label','date','value','unit','reference','evidence','pages']);for(const k of ['id','metric','label','unit','evidence'])text(r[k],200);date(r.date);num(r.value);text(r.reference,300,true);rows(r.pages,30);if(r.pages.some(n=>!Number.isSafeInteger(n)||n<1))fail();}
 rows(s.lifestyle,1000);for(const r of s.lifestyle){object(r,['id','date','kind','status','evidence','description','duration_minutes','uncertainties','possible_duplicate']);text(r.id,100);date(r.date);if(!['meal','activity'].includes(r.kind)||!['observed','consumed','planned','not_eaten','uncertain','completed','negated'].includes(r.status))fail();text(r.evidence,60);text(r.description);num(r.duration_minutes);rows(r.uncertainties,20);r.uncertainties.forEach(x=>text(x,300));if(typeof r.possible_duplicate!=='boolean')fail();}
 text(s.report_status,500,true);rows(s.source_coverage,8);for(const r of s.source_coverage){object(r,['kind','status']);text(r.kind,80);text(r.status,150);}
 return s;
}
