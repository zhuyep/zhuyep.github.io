// Spatial presentation only. Never changes roles, reports or task state.
export function workerCenter(worker){
  const center=String(worker.center||'');
  if(/^(成本|cost)/i.test(center))return 'cost';
  return /^(利润|profit)/i.test(center)||Boolean(worker.line||worker.business_line)?'profit':'cost';
}
export function officeRosterKey(workers){return workers.map(w=>`${w.id}:${workerCenter(w)}`).join('|');}
export function planOffice(workers){
  const members=workers.filter(w=>w.id!=='michelle'),groups={profit:[],cost:[]};
  for(const worker of members)groups[workerCenter(worker)].push(worker);
  const zones=Object.entries(groups).map(([id,people])=>{
    const cols=people.length>6?3:2,rows=Math.ceil(people.length/cols);
    const front=Math.max(8.2,-1.1+Math.max(0,rows-1)*3.5+2);
    return{id,title:id==='profit'?'利润中心':'成本中心',x:id==='profit'?-7:7,z:(front-4.4)/2,width:10,depth:front+4.4,count:people.length,
      floor:id==='profit'?0xDCC5A4:0xBACDDC,accent:id==='profit'?0xA87335:0x3D6C90,
      seats:people.map((worker,i)=>({id:worker.id,center:id,x:(id==='profit'?-7:7)+(i%cols-(cols-1)/2)*(cols===3?3:4.3),z:-1.1+Math.floor(i/cols)*3.5}))};
  });
  const front=Math.max(...zones.map(zone=>zone.z+zone.depth/2))+1.3;
  const fixtures=[{id:'reception',x:-4.2,z:front-.7,width:2.6,depth:.9},...[-1.6,1.6].flatMap(x=>[.3,4.4].map(z=>({id:'planter',x,z,width:.4,depth:2.4})))];
  return{zones,seats:zones.flatMap(zone=>zone.seats),front,back:-9.5,corridorWidth:2.4,fixtures};
}
export function officeCamera(zone,aspect=1.6,depth=20){
  const all=!['profit','cost'].includes(zone),radius=(all?Math.max(34,depth*1.5):24)*Math.max(1,(all?1.55:1.1)/Math.max(.4,aspect));
  return{x:all?0:zone==='profit'?-7:7,z:all?0:zone==='cost'?2.4:1.4,radius};
}
