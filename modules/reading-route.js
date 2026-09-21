export function readingHash(key){const [kind,...id]=key.split(':');if(!['intel','block'].includes(kind)||!id.join(':'))throw Error('阅读标识无效');return '#'+(kind==='intel'?'intel':'library')+'/'+encodeURIComponent(id.join(':'))}
export function parseRoute(hash){
 const value=hash.replace(/^#/,''),[section,...tail]=value.split('/');const page=['today','intel','library','games'].includes(section)?section:'today';
 if(tail.length&&['intel','library'].includes(section)){try{return {page,key:(page==='intel'?'intel:':'block:')+decodeURIComponent(tail.join('/'))}}catch{return {page,key:null,invalid:true}}}
 return {page,key:null};
}
