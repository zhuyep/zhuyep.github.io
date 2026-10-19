export function buildWikiGraph(catalog,pages=[]){
  const nodes=[],links=[],byId=new Map(),pairs=new Map(),urlMap=new Map();
  const add=n=>{if(!byId.has(n.id)){nodes.push(n);byId.set(n.id,n)}return n.id};
  const edge=(source,target,kind)=>{if(source===target||!byId.has(source)||!byId.has(target))return;const key=source+'>'+target;let e=pairs.get(key);if(!e){e={source,target,kinds:[]};pairs.set(key,e);links.push(e)}if(!e.kinds.includes(kind))e.kinds.push(kind)};
  const key=url=>{try{return new URL(url,'https://wiki.invalid').href}catch{return ''}};
  const mapUrl=(url,id)=>{if(url)urlMap.set(key(url),id)};
  const pageInfo=[catalog.home,...catalog.topics].filter(Boolean);
  for(const p of pageInfo){const body=pages.find(v=>v.id===p.id),englishLabel=p.englishTitle||body?.englishTitle||body?.markdown.match(/^_([A-Za-z][^_\n]+)_$/m)?.[1]||'';const id=add({id:'page:'+p.id,kind:'page',label:p.id===catalog.home?.id?catalog.name:p.title,englishLabel,pageId:p.id,href:'#books/wiki'+(p.id===catalog.home?.id?'':'?page='+p.id)});mapUrl(p.url,id);mapUrl('#books/wiki?page='+p.id,id)}
  const root='page:'+catalog.home?.id;mapUrl('#books/wiki',root);
  for(const p of catalog.topics)edge('page:'+p.parentId,'page:'+p.id,'层级');
  for(const f of catalog.folders||[])add({id:'folder:'+f.path,kind:'folder',label:f.name||f.path,path:f.path});
  for(const f of catalog.folders||[]){const parent=f.path.split('/').slice(0,-1).join('/');edge(parent?'folder:'+parent:root,'folder:'+f.path,'目录')}
  for(const f of catalog.files){const id=add({id:'file:'+f.id,kind:'file',label:f.name,href:f.previewUrl,downloadUrl:f.downloadUrl,path:f.path});mapUrl(f.previewUrl,id);mapUrl(f.downloadUrl,id);const parent=f.path.split('/').slice(0,-1).join('/');edge(parent?'folder:'+parent:root,id,'目录')}
  for(const p of pages)for(const m of p.markdown.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)\)/g)){const target=urlMap.get(key(m[1]));if(target)edge('page:'+p.id,target,'引用')}
  return {nodes,links};
}
