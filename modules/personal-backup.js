export const DESK_KEY='zhushi-daji-desk-v3';
export const BACKUP_KEYS=[DESK_KEY,'zhushi-daji-appearance-v1','pocket.hextris.saveState','pocket.hextris.highscores','shunsui-0hh1-tutorialPlayed','shunsui-0hh1-score'];
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
function safeTree(value){if(!value||typeof value!=='object')return;for(const [key,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw Error('备份含不支持的字段');safeTree(v)}}
function validateEntry(key,value){
 if(typeof value!=='string'||value.length>2_000_000)throw Error('备份内容格式或大小不正确');
 let parsed;try{parsed=JSON.parse(value)}catch{throw Error('备份内容无法解析')};safeTree(parsed);
 if(key===DESK_KEY&&(!object(parsed)||!Array.isArray(parsed.saved)||parsed.saved.some(x=>typeof x!=='string')||!object(parsed.notes)||Object.values(parsed.notes).some(x=>typeof x!=='string')))throw Error('收藏或随记格式不正确');
 if(key==='zhushi-daji-appearance-v1'&&(!object(parsed)||!['auto','light','dark'].includes(parsed.mode)))throw Error('外观设置无效');
 if(key==='pocket.hextris.highscores'&&(!Array.isArray(parsed)||parsed.some(n=>!Number.isFinite(n)||n<0)))throw Error('游戏成绩格式不正确');
 if(key==='shunsui-0hh1-score'&&(!Number.isFinite(parsed)||parsed<0))throw Error('游戏成绩格式不正确');
 if(key==='shunsui-0hh1-tutorialPlayed'&&typeof parsed!=='boolean')throw Error('游戏记录格式不正确');
 return parsed;
}
export function exportPersonal(storage,now=new Date()){
 const entries={};for(const key of BACKUP_KEYS){const value=storage.getItem(key);if(value!==null){validateEntry(key,value);entries[key]=value}}
 return {format:'zhushi-daji-personal-backup',version:1,exportedAt:now.toISOString(),entries};
}
export function parseBackup(text){
 if(text.length>5_000_000)throw Error('备份文件过大');let backup;try{backup=JSON.parse(text)}catch{throw Error('请选择有效的 JSON 备份文件')}
 if(backup?.format!=='zhushi-daji-personal-backup'||backup.version!==1||!object(backup.entries))throw Error('这不是受支持的诸事大吉备份');
 for(const [key,value]of Object.entries(backup.entries)){if(!BACKUP_KEYS.includes(key))throw Error('备份含不支持的记录类型');validateEntry(key,value)}
 return backup;
}
export function planImport(storage,backup){
 const entries={},current=exportPersonal(storage).entries;let conflicts=0;
 for(const [key,value]of Object.entries(backup.entries)){
  const incoming=validateEntry(key,value);
  // The upstream Hextris resume format contains executable function strings. Preserve in export, never restore it from an imported file.
  if(key==='pocket.hextris.saveState')continue;
  if(key===DESK_KEY){const old=current[key]?JSON.parse(current[key]):{saved:[],notes:{}};const notes={...incoming.notes,...old.notes};for(const [id,note]of Object.entries(incoming.notes)){if(old.notes[id]&&old.notes[id]!==note&&!old.notes[id].includes('—— 备份中的随记 ——\n'+note)){conflicts++;notes[id]=old.notes[id]+'\n\n—— 备份中的随记 ——\n'+note}}
   // Existing legacy fields win; missing ones are restored without bringing back the draft UI.
   entries[key]=JSON.stringify({...incoming,...old,saved:[...new Set([...old.saved,...incoming.saved])],notes});
  }else if(!current[key])entries[key]=value;
 }
 const desk=entries[DESK_KEY]?JSON.parse(entries[DESK_KEY]):null;
 return {entries,conflicts,saved:desk?.saved.length||0,notes:Object.keys(desk?.notes||{}).length};
}
export function applyImport(storage,plan){
 const original=Object.fromEntries(Object.keys(plan.entries).map(key=>[key,storage.getItem(key)]));const written=[];
 try{for(const [key,value]of Object.entries(plan.entries)){storage.setItem(key,value);written.push(key)}}
 catch(e){for(const key of written.reverse()){if(original[key]===null)storage.removeItem(key);else storage.setItem(key,original[key])}throw e}
}
