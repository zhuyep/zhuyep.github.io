import {forceSimulation,forceLink,forceManyBody,forceCollide,forceCenter} from '../vendor/d3-force.js';
import {createGraphAnimator} from './graph-motion.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={page:'Wiki 条目',folder:'资料目录',file:'资料文件'},NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n};
export function safeWikiGraphHref(value,origin){
  try{if(!value)return '';if(/^#books\/wiki(?:\?|$)/.test(value))return value;const u=new URL(value,origin),here=new URL(origin),local=h=>['localhost','127.0.0.1','[::1]'].includes(h);if(u.username||u.password)return '';if(u.protocol==='https:'||u.origin===origin||(u.protocol==='http:'&&local(u.hostname)&&local(here.hostname)))return u.href}catch{}return '';
}
const safeHref=value=>safeWikiGraphHref(value,location.origin);
export function mountWikiGraph(host,graph){
  const life=new AbortController(),{signal}=life,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes=graph.nodes.map(n=>({...n})),links=graph.links.map(l=>({...l}));
  host.innerHTML=`<div class="wiki-graph-toolbar"><div class="wiki-graph-legend">${Object.entries(labels).map(([k,v])=>`<span><i class="wiki-dot-${k}"></i>${v}</span>`).join('')}</div><div><button data-zoom="1.25" aria-label="放大图谱">＋</button><button data-zoom="0.8" aria-label="缩小图谱">−</button><button data-fit>复位</button><button data-motion>${reduced?'继续':'暂停'}</button></div></div><div class="wiki-graph-stage"><svg role="img" aria-label="知识库结构与引用关系图谱，可拖动节点和平移缩放"></svg></div><div class="wiki-graph-below"><label>查找节点<select aria-label="查找知识图谱节点"><option value="">选择条目、目录或文件</option>${nodes.map(n=>`<option value="${esc(n.id)}">${esc(n.label+(n.englishLabel?' / '+n.englishLabel:''))}</option>`).join('')}</select></label><p>${nodes.length} 个节点 · ${links.length} 组关系。实线表示层级与归档，虚线表示页面引用。</p></div><div class="wiki-graph-selection" aria-live="polite">点选节点查看关联，拖动节点调整布局。</div>`;
  const svg=host.querySelector('svg'),stage=host.querySelector('.wiki-graph-stage'),picker=host.querySelector('select'),panel=host.querySelector('.wiki-graph-selection');
  const layer=el('g'),lines=el('g'),dots=el('g');layer.append(lines,dots);svg.append(layer);
  const sim=forceSimulation(nodes).stop().force('link',forceLink(links).id(n=>n.id).distance(l=>l.kinds.includes('引用')?140:100).strength(.35)).force('charge',forceManyBody().strength(-370)).force('collide',forceCollide(38)).force('center',forceCenter(0,0)).alphaDecay(.025);
  sim.tick(200);
  let camera={x:0,y:0,k:1},width=800,height=500,selected='',gesture=null,paused=reduced,disposed=false;
  const lineEls=links.map(l=>{const n=el('line',{class:l.kinds.includes('引用')?'wiki-graph-edge has-reference':'wiki-graph-edge'});const title=el('title');title.textContent=l.kinds.join('、');n.append(title);lines.append(n);return n});
  const nodeEls=nodes.map(n=>{const g=el('g',{'data-wiki-node':n.id,class:'wiki-graph-node wiki-graph-'+n.kind,tabindex:'0',role:'button','aria-label':labels[n.kind]+'：'+n.label});const circle=el('circle',{r:n.id===nodes[0]?.id?13:n.kind==='page'?9:7}),text=el('text',{x:14,y:4});const short=n.label.replace(/^\d+-/,'').replace(/\.(pdf|docx|pptx|xlsx)$/i,'');text.textContent=short.length>13?short.slice(0,12)+'…':short;const title=el('title');title.textContent=n.label+(n.englishLabel?' / '+n.englishLabel:'');g.append(circle,text,title);dots.append(g);return g});
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const transform=()=>layer.setAttribute('transform',`translate(${camera.x},${camera.y}) scale(${camera.k})`);
  function draw(){lineEls.forEach((e,i)=>{const l=links[i];for(const [k,v]of Object.entries({x1:l.source.x,y1:l.source.y,x2:l.target.x,y2:l.target.y}))e.setAttribute(k,v)});nodeEls.forEach((e,i)=>e.setAttribute('transform',`translate(${nodes[i].x},${nodes[i].y})`));transform()}
  function fit(){if(disposed)return;width=stage.clientWidth||800;height=stage.clientHeight||500;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);const minX=Math.min(...nodes.map(n=>n.x))-30,maxX=Math.max(...nodes.map(n=>n.x))+155,minY=Math.min(...nodes.map(n=>n.y))-25,maxY=Math.max(...nodes.map(n=>n.y))+25;const k=Math.min((width-40)/(maxX-minX),(height-40)/(maxY-minY),1.3);camera={k,x:width/2-(minX+maxX)/2*k,y:height/2-(minY+maxY)/2*k};draw()}
  function select(id){selected=id||'';picker.value=selected;const n=byId.get(selected),neighbors=new Set(n?[n.id]:[]),related=[];for(const l of links){if(l.source.id===selected){neighbors.add(l.target.id);related.push([l.target,l.kinds])}else if(l.target.id===selected){neighbors.add(l.source.id);related.push([l.source,l.kinds])}}
    nodeEls.forEach((e,i)=>{e.classList.toggle('is-muted',Boolean(n)&&!neighbors.has(nodes[i].id));e.classList.toggle('is-selected',nodes[i].id===selected)});lineEls.forEach((e,i)=>e.classList.toggle('is-muted',Boolean(n)&&links[i].source.id!==selected&&links[i].target.id!==selected));
    if(!n){panel.textContent='点选节点查看关联，拖动节点调整布局。';return}
    const href=safeHref(n.href||''),download=safeHref(n.downloadUrl||'');panel.innerHTML=`<strong>${esc(n.label)}${n.englishLabel?`<span class="wiki-label-en" lang="en">${esc(n.englishLabel)}</span>`:''}</strong><span>${esc(labels[n.kind])} · ${related.length} 组直接关系</span>${href?`<a href="${esc(href)}" ${href.startsWith('#')?'':'target="_blank" rel="noopener noreferrer"'}>${n.kind==='page'?'阅读条目':'在线预览'}</a>`:''}${download?`<a href="${esc(download)}" target="_blank" rel="noopener noreferrer">下载原件</a>`:''}<ul>${related.map(([r,k])=>`<li><button data-select-node="${esc(r.id)}">${esc(r.label)}</button><small>${esc(k.join('、'))}</small></li>`).join('')}</ul>`;
  }
  const animator=createGraphAnimator(sim,{draw,paused,visible:true});
  const point=e=>{const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height}};
  function zoom(f,p={x:width/2,y:height/2}){const k=Math.max(.15,Math.min(3,camera.k*f)),ratio=k/camera.k;camera={k,x:p.x-(p.x-camera.x)*ratio,y:p.y-(p.y-camera.y)*ratio};transform()}
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=point(e),n=byId.get(e.target.closest('[data-wiki-node]')?.dataset.wikiNode);gesture={id:e.pointerId,start:p,last:p,node:n,moved:false};svg.setPointerCapture(e.pointerId);if(n){n.fx=n.x;n.fy=n.y}},{signal});
  svg.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const p=point(e);if(Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>4)gesture.moved=true;if(gesture.moved){if(gesture.node){const n=gesture.node;n.x=n.fx+=(p.x-gesture.last.x)/camera.k;n.y=n.fy+=(p.y-gesture.last.y)/camera.k;animator.wake(.15);draw()}else{camera.x+=p.x-gesture.last.x;camera.y+=p.y-gesture.last.y;transform()}}gesture.last=p},{signal});
  function release(e){if(!gesture||gesture.id!==e.pointerId)return;if(!gesture.moved&&e.type==='pointerup')select(gesture.node?.id);if(gesture.node){gesture.node.fx=null;gesture.node.fy=null}if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);gesture=null;animator.wake(.12)}
  svg.addEventListener('pointerup',release,{signal});svg.addEventListener('pointercancel',release,{signal});
  svg.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.002),point(e))},{signal,passive:false});
  svg.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select(e.target.closest('[data-wiki-node]')?.dataset.wikiNode)}},{signal});
  picker.addEventListener('change',()=>select(picker.value),{signal});
  host.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.zoom)zoom(Number(button.dataset.zoom));if(button.hasAttribute('data-fit'))fit();if(button.dataset.selectNode)select(button.dataset.selectNode);if(button.hasAttribute('data-motion')){paused=!paused;button.textContent=paused?'继续':'暂停';animator.setPaused(paused)}},{signal});
  document.addEventListener('visibilitychange',()=>animator.setVisible(!document.hidden),{signal});
  const observer=new ResizeObserver(fit);observer.observe(stage);fit();animator.wake(.2);
  return()=>{disposed=true;life.abort();observer.disconnect();animator.destroy();sim.stop();host.replaceChildren()};
}
