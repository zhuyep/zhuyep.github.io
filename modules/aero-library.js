import {loadWikiCatalog,loadWikiPage,loadWikiGraph} from './wiki-data.js';
import {buildWikiGraph} from './wiki-graph-model.js';
import {renderWikiMarkdown} from './wiki-markdown.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const loopback=host=>['localhost','127.0.0.1','[::1]'].includes(host);
function safeLink(value){try{if(!value)return '';const url=new URL(value,location.origin);if(url.username||url.password)return '';if(url.protocol==='https:'||(url.protocol==='http:'&&loopback(url.hostname)&&loopback(location.hostname)))return url.href}catch{}return ''}
const link=(url,label,cls='')=>{const href=safeLink(url);return href?`<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:''};
const family=format=>({pdf:'PDF',doc:'Word',docx:'Word',ppt:'PPT',pptx:'PPT',xls:'Excel',xlsx:'Excel'}[format]||format.toUpperCase());
const pageLink=topic=>`<a href="#books/wiki?page=${encodeURIComponent(topic.id)}">${esc(topic.title)}${topic.englishTitle?`<span class="wiki-label-en" lang="en">${esc(topic.englishTitle)}</span>`:''}</a>`;
const documentRow=file=>`<li><div>${link(file.previewUrl,file.name)} <small>${esc(family(file.format))}</small></div><span>${link(file.previewUrl,file.requiresLogin?'登录预览':'预览')}${link(file.downloadUrl,'下载原件')}</span></li>`;

export function mountWiki(host){
  const lifecycle=new AbortController();let active,disposed=false,version=0,data=null,article=null,error='',searchQuery='',searchActive=false,graphCleanup=null;
  const params=new URLSearchParams(location.hash.split('?')[1]||''),requested=params.get('page'),graphView=params.get('view')==='graph';
  const route='#books/wiki'+(requested?'?page='+encodeURIComponent(requested):''),graphRoute=route+(requested?'&':'?')+'view=graph';
  host.classList.add('wiki-reader');host.removeAttribute('role');document.body.classList.add('wiki-page-mode');
  host.innerHTML='<p class="wiki-loading" role="status">正在打开 Wiki……</p>';
  function drawSearch(){
    const q=searchActive?searchQuery.trim():'',results=host.querySelector('.wiki-search-results');
    host.querySelector('.wiki-reading').hidden=graphView||Boolean(q);
    const graph=host.querySelector('.wiki-graph-host');if(graph)graph.hidden=Boolean(q);
    results.hidden=!q;if(!q)return;
    const terms=q.toLocaleLowerCase(),topics=data.topics.filter(p=>(p.title+' '+(p.englishTitle||'')).toLocaleLowerCase().includes(terms)),files=data.files.filter(f=>(f.name+' '+(f.source?.englishTitle||'')).toLocaleLowerCase().includes(terms));
    results.innerHTML=`<h2>搜索结果</h2><p role="status">“${esc(q)}”：${topics.length} 个条目，${files.length} 份文档</p>${topics.length?`<ul class="wiki-entry-results">${topics.map(t=>'<li>'+pageLink(t)+'</li>').join('')}</ul>`:''}${files.length?`<ul class="wiki-references">${files.map(documentRow).join('')}</ul>`:''}${!topics.length&&!files.length?'<p>暂未找到，试试更短的主题词或文件名。</p>':''}<button type="button" class="wiki-text-button" data-wiki-clear>返回阅读</button>`;
  }
  function render(){
    if(disposed)return;
    graphCleanup?.();graphCleanup=null;
    if(!data){host.innerHTML=`<div class="wiki-empty"><h1>Wiki 资料库</h1><p role="status">${esc(error||'Wiki 资料库尚未连接。')}</p><button type="button" class="secondary-button" data-wiki-refresh>重新读取</button></div>`;return}
    const toolsOpen=host.querySelector('.wiki-simple-tools')?.open;
    const keepSearchFocus=document.activeElement===host.querySelector('[name=wiki-search]');
    const context={wikiUrl:data.wikiUrl,topics:data.topics,home:data.home};
    const rendered=article?renderWikiMarkdown(article.markdown,context):{html:'<p class="wiki-loading">正在读取条目正文……</p>',headings:[]};
    const editUrl=data.mode==='published'?'':article?.editUrl||data.editUrl;
    const current=article?.title||data.name;
    document.title=current+' · 凯卷有益';
    let body=rendered.html;
    if(article?.id===data.home?.id){
      const template=document.createElement('template');template.innerHTML=body;
      const rest=[...template.content.querySelectorAll('h2')].find(h=>['使用说明','使用与维护'].some(title=>h.textContent.trim().startsWith(title)));
      if(rest){
        const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='使用说明';details.append(summary);
        let node=rest;while(node){const next=node.nextSibling;details.append(node);node=next}template.content.append(details);
        body=template.innerHTML;
      }
    }
    host.innerHTML=`<nav class="wiki-simple-path" aria-label="Wiki 导航"><a href="#books/search">← 凯卷有益</a>${requested?'<a href="#books/wiki">资料库首页</a>':''}<details class="wiki-simple-tools"><summary aria-label="页面操作">⋯</summary><div><form role="search" aria-label="搜索 Wiki"><label class="sr-only" for="wiki-reader-search">搜索条目与文档</label><input id="wiki-reader-search" type="search" name="wiki-search" value="${esc(searchQuery)}" placeholder="搜索条目与文档" autocomplete="off"><button type="submit">搜索</button></form>${link(editUrl,'编辑本页')}${link(data.filesUrl,'上传资料')}${data.mode==='published'?'<a href="#books/wiki?notice=local">关于上传与编辑</a>':link(article?.url||data.wikiUrl,'后台资料库')}${link(data.publicFilesUrl,'全部文件')}<button type="button" data-wiki-refresh>刷新内容</button></div></details></nav><h1 class="wiki-simple-title">${esc(current)}</h1><div class="wiki-vector-tabs"><a href="${route}" ${!graphView?'aria-current="page"':''}>条目</a><a href="${graphRoute}" ${graphView?'aria-current="page"':''}>知识图谱</a></div><p class="wiki-status" role="status">${esc(error)}${params.get('notice')==='local'?'此版本供在线浏览。上传和编辑请在本地资料库进行。':''}${data.truncated?'更多文件请从页面操作菜单进入。':''}</p><section class="wiki-search-results" aria-label="Wiki 搜索结果" hidden></section>${graphView?'<section class="wiki-graph-host" aria-label="知识图谱"><p class="wiki-loading">正在整理知识库关系……</p></section>':''}<div class="wiki-reading" ${graphView?'hidden':''}><article class="wiki-prose">${body}</article><section class="wiki-attached-files"><details><summary>资料文件 <small>${data.files.length}</small></summary><ul class="wiki-references">${data.files.map(documentRow).join('')||'<li>尚未上传资料。</li>'}</ul>${data.mode==='published'?'<p class="wiki-file-note">Office 预览使用 PDF 版，下载保留原件。</p>':''}</details></section>${data.mode==='published'?'<p class="wiki-published-note">公开阅读体验版 · 条目与文件来自资料库发布快照</p>':''}</div>`;
    host.querySelector('.wiki-simple-tools').open=Boolean(toolsOpen);
    if(searchActive)drawSearch();
    if(keepSearchFocus)host.querySelector('[name=wiki-search]').focus();
  }
  async function showGraph(current){
    try{
      const pages=await loadWikiGraph(data,active.signal);
      const {mountWikiGraph}=await import('./wiki-graph.js');
      if(disposed||current!==version)return;
      graphCleanup=mountWikiGraph(host.querySelector('.wiki-graph-host'),buildWikiGraph(data,pages));
    }catch(failure){if(disposed||current!==version||failure.name==='AbortError')return;const stage=host.querySelector('.wiki-graph-host');if(stage)stage.textContent='图谱暂时无法读取，请刷新重试。'}
  }
  async function refresh(){
    const current=++version;active?.abort();active=new AbortController();
    const status=host.querySelector('.wiki-status');if(status)status.textContent='正在刷新……';
    try{
      const value=await loadWikiCatalog(active.signal);
      if(disposed||current!==version)return;
      if(!value.available){data=null;error='Wiki 资料库尚未连接。';render();return}
      data=value;error='';render();
      const id=requested||data.home?.id;
      const page=await loadWikiPage(id,data,active.signal);
      if(disposed||current!==version)return;
      article=page;error='';render();if(graphView)showGraph(current);
    }catch(failure){if(disposed||current!==version||failure.name==='AbortError')return;error=failure.message||'暂时无法打开 Wiki，请确认资料库已启动。';if(data&&!article)article={title:'条目暂时无法打开',markdown:'请刷新重试，或从右上角菜单查看原始 Wiki。'};render()}
  }
  host.addEventListener('submit',event=>{event.preventDefault();searchActive=Boolean(searchQuery.trim());if(searchActive)host.querySelector('.wiki-simple-tools').open=false;drawSearch()},{signal:lifecycle.signal});
  host.addEventListener('input',event=>{if(event.target.name==='wiki-search'){searchQuery=event.target.value;if(!searchQuery){searchActive=false;drawSearch()}}},{signal:lifecycle.signal});
  host.addEventListener('click',event=>{
    if(event.target.closest('[data-wiki-refresh]'))refresh();
    if(event.target.closest('[data-wiki-clear]')){searchQuery='';searchActive=false;host.querySelector('[name=wiki-search]').value='';drawSearch();}

  },{signal:lifecycle.signal});
  refresh();
  return ()=>{disposed=true;version++;active?.abort();lifecycle.abort();graphCleanup?.();document.body.classList.remove('wiki-page-mode')};
}
