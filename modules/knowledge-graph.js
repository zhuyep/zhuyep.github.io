import {createGraphPhysics,createGraphAnimator} from './graph-motion.js';
import {NODE_LABELS} from './intel-explore.js';

const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NS='http://www.w3.org/2000/svg';
const svgElement=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);return el;};

// Same metadata relationships, animated as draggable bubbles within a bounded graph.
export function mountKnowledgeGraph(host,graph,{onRead,onFacet}) {
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const {nodes,links,simulation}=createGraphPhysics(graph,{reducedMotion:reduced.matches});
  const byId=new Map(nodes.map(n=>[n.id,n]));
  host.innerHTML=`<div class="knowledge-card">
    <div class="graph-toolbar"><div class="graph-legend">${Object.entries(NODE_LABELS).map(([kind,label])=>`<span><i class="node-dot node-${kind}"></i>${label}</span>`).join('')}</div>
    <button class="text-button" data-graph-fullscreen>全屏 ↗</button></div>
    <div class="graph-stage"><svg class="knowledge-svg" role="img" aria-label="动态情报知识图谱：拖动气泡可牵动关联，点选查看情报；也可使用下方节点选择器。"></svg>
      <div class="graph-tools" role="group" aria-label="图谱操作"><button aria-label="放大图谱" data-graph-zoom="1.3">＋</button><button aria-label="缩小图谱" data-graph-zoom="0.77">−</button><button data-graph-fit>复位</button><button data-graph-labels aria-pressed="false">标签</button><button data-graph-motion aria-pressed="false">暂停</button></div>
    </div><p class="graph-gesture">拖动气泡牵动关联 · 空白处平移 · 双指缩放</p>
    <label class="graph-picker-label">查找图谱节点<select class="graph-picker"><option value="">选一个主题、领域、信源或情报</option>${Object.entries(NODE_LABELS).map(([kind,label])=>`<optgroup label="${label}">${nodes.filter(n=>n.kind===kind).map(n=>`<option value="${esc(n.id)}">${esc(n.label)}${kind!=='intelligence'?' · '+n.count+' 条':''}</option>`).join('')}</optgroup>`).join('')}</select></label>
    <div class="graph-selection" aria-live="polite"><span class="eyebrow">顺着线索，继续探索</span><p>点选节点，查看相关情报与完整来源。</p></div>
  </div>`;
  const root=host.firstElementChild,svg=root.querySelector('svg'),stage=root.querySelector('.graph-stage'),picker=root.querySelector('select'),panel=root.querySelector('.graph-selection');
  const layer=svgElement('g'),lineLayer=svgElement('g'),nodeLayer=svgElement('g');
  layer.append(lineLayer,nodeLayer);svg.append(layer);
  let hovered=null,paused=reduced.matches,inView=false;
  let selected=null,labels=false,camera={x:0,y:0,k:1},width=600,height=430,disposed=false,fullscreen=null;
  const lineEls=links.map(l=>{const el=svgElement('line',{x1:l.source.x,y1:l.source.y,x2:l.target.x,y2:l.target.y,class:'graph-edge'});lineLayer.append(el);return el;});
  const nodeEls=nodes.map(n=>{
    const group=svgElement('g',{transform:`translate(${n.x},${n.y})`,class:`graph-node node-${n.kind}`,'data-node-id':n.id});
    const hit=svgElement('circle',{r:Math.max(15,n.radius+4),class:'graph-hit'});
    const shape=svgElement('circle',{r:n.radius,class:'graph-shape'});
    const label=svgElement('text',{y:-n.radius-8,'text-anchor':'middle',class:'graph-node-label'});label.textContent=n.label.length>16?n.label.slice(0,15)+'…':n.label;
    const title=svgElement('title');title.textContent=NODE_LABELS[n.kind]+'：'+n.label;
    group.append(hit,shape,label,title);nodeLayer.append(group);return group;
  });
  function paint(){
    lineEls.forEach((el,i)=>{const l=links[i];el.setAttribute('x1',l.source.x);el.setAttribute('y1',l.source.y);el.setAttribute('x2',l.target.x);el.setAttribute('y2',l.target.y);});
    transform();
  }
  const animator=createGraphAnimator(simulation,{draw:paint,paused,visible:false});
  const motionButton=root.querySelector('[data-graph-motion]');
  function syncMotion(){motionButton.textContent=paused?'继续':'暂停';motionButton.setAttribute('aria-label',paused?'继续动态布局':'暂停动态布局');motionButton.setAttribute('aria-pressed',String(paused));animator.setPaused(paused);animator.setVisible(inView&&!document.hidden);}
  function transform(){
    layer.setAttribute('transform',`translate(${camera.x},${camera.y}) scale(${camera.k})`);
    // Keep dots and labels legible even when the atlas is fitted to a narrow phone.
    const scale=Math.max(1,.68/camera.k);
    nodeEls.forEach((el,i)=>el.setAttribute('transform',`translate(${nodes[i].x},${nodes[i].y}) scale(${scale})`));
  }
  function fit(){
    if(disposed)return;
    width=stage.clientWidth||600;height=stage.clientHeight||430;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),minX=Math.min(...xs)-40,maxX=Math.max(...xs)+40,minY=Math.min(...ys)-55,maxY=Math.max(...ys)+35;
    const k=Math.min((width-28)/(maxX-minX+70),(height-68)/(maxY-minY+70),1.4);
    camera={k,x:width/2-(minX+maxX)/2*k,y:(height-40)/2-(minY+maxY)/2*k};transform();
  }
  function highlight(){
    const focus=hovered||selected;
    const neighborIds=new Set(focus?[focus.id]:[]);
    for(const l of links)if(focus&&(l.source.id===focus.id||l.target.id===focus.id)){neighborIds.add(l.source.id);neighborIds.add(l.target.id);}
    nodeEls.forEach((el,i)=>{
      const n=nodes[i];el.classList.toggle('is-muted',!!focus&&!neighborIds.has(n.id));el.classList.toggle('is-selected',focus?.id===n.id);
      el.querySelector('text').style.display=(n.kind==='category'||(labels&&n.kind!=='intelligence')||focus?.id===n.id)?'':'none';
    });
    lineEls.forEach((el,i)=>{const l=links[i];el.classList.toggle('is-active',!!focus&&(l.source.id===focus.id||l.target.id===focus.id));el.classList.toggle('is-muted',!!focus&&l.source.id!==focus.id&&l.target.id!==focus.id);});
  }
  function selectNode(id){
    hovered=null;selected=byId.get(id)||null;picker.value=selected?.id||'';highlight();
    if(!selected){panel.innerHTML='<span class="eyebrow">顺着线索，继续探索</span><p>点选节点，查看相关情报与完整来源。</p>';return;}
    const n=selected;
    if(n.kind==='intelligence'){
      panel.innerHTML=`<span class="eyebrow">情报 · ${esc(n.record.reportDate)} 收录</span><h3>${esc(n.label)}</h3><p>${esc(n.record.summary?.slice(0,140)||'展开查看正文与来源。')}</p><button class="secondary-button" data-graph-read="${esc(n.key)}">阅读全文 →</button>`;
    }else{
      const related=links.filter(l=>l.target.id===n.id).map(l=>l.source);
      panel.innerHTML=`<span class="eyebrow">${NODE_LABELS[n.kind]} · 图中关联 ${n.count} 条</span><h3>${esc(n.label)}</h3><button class="secondary-button" data-graph-facet>查看全部相关情报 →</button><div class="graph-related">${related.slice(0,3).map(r=>`<button data-graph-read="${esc(r.key)}">${esc(r.label)} <span aria-hidden="true">↗</span></button>`).join('')}</div>`;
    }
  }
  function zoom(factor,x=width/2,y=height/2){const next=Math.max(.12,Math.min(4,camera.k*factor)),f=next/camera.k;camera={k:next,x:x-(x-camera.x)*f,y:y-(y-camera.y)*f};transform();}
  function point(e){const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height};}
  const pointers=new Map();let gesture=null;
  const distance=()=>{const [a,b]=[...pointers.values()];return b?Math.hypot(a.x-b.x,a.y-b.y):0;};
  const midpoint=()=>{const [a,b]=[...pointers.values()];return b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:a;};
  const world=p=>({x:(p.x-camera.x)/camera.k,y:(p.y-camera.y)/camera.k});
  function releaseNode(){if(gesture?.node){gesture.node.fx=null;gesture.node.fy=null;gesture.node=null;}simulation.alphaTarget(0);root.classList.remove('is-dragging');}
  function cancelGesture(){releaseNode();gesture=null;for(const id of [...pointers.keys()]){pointers.delete(id);if(svg.hasPointerCapture(id))svg.releasePointerCapture(id);}hovered=null;highlight();}
  function down(e){
    if(e.button!==0&&e.pointerType==='mouse')return;
    if(pointers.size>=2)return;
    const p=point(e);pointers.set(e.pointerId,p);svg.setPointerCapture(e.pointerId);
    if(pointers.size>1){releaseNode();gesture={mode:'pinch',moved:true,distance:distance(),mid:midpoint()};return;}
    const node=byId.get(e.target.closest('[data-node-id]')?.dataset.nodeId),pos=world(p);
    hovered=null;gesture={mode:node?'node':'pan',start:p,node,moved:false,offset:node?{x:node.x-pos.x,y:node.y-pos.y}:null};
    if(node){node.fx=node.x;node.fy=node.y;simulation.alphaTarget(.12);animator.wake(.22);}
  }
  function move(e){
    if(!pointers.has(e.pointerId)||!gesture){
      if(e.pointerType==='mouse'&&!pointers.size){const node=byId.get(e.target.closest('[data-node-id]')?.dataset.nodeId)||null;if(node!==hovered){hovered=node;highlight();}}
      return;
    }
    const p=point(e),previous=pointers.get(e.pointerId);pointers.set(e.pointerId,p);
    if(pointers.size>1){const d=distance(),mid=midpoint();zoom(gesture.distance?d/gesture.distance:1,gesture.mid.x,gesture.mid.y);camera.x+=mid.x-gesture.mid.x;camera.y+=mid.y-gesture.mid.y;transform();gesture.distance=d;gesture.mid=mid;return;}
    if(Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>5)gesture.moved=true;
    if(!gesture.moved)return;
    if(gesture.node){const pos=world(p),n=gesture.node;n.x=n.fx=pos.x+gesture.offset.x;n.y=n.fy=pos.y+gesture.offset.y;n.vx=n.vy=0;root.classList.add('is-dragging');paint();}
    else{camera.x+=p.x-previous.x;camera.y+=p.y-previous.y;transform();}
  }
  function up(e){
    if(!pointers.has(e.pointerId))return;
    const tap=gesture&&!gesture.moved&&pointers.size===1&&e.type==='pointerup',node=gesture?.node;
    releaseNode();pointers.delete(e.pointerId);if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
    if(tap)selectNode(node?.id);
    if(!pointers.size){gesture=null;animator.wake(.2);}else gesture={mode:'pan',start:[...pointers.values()][0],moved:true,node:null};
  }
  function leave(){if(!pointers.size){hovered=null;highlight();}}
  function wheel(e){e.preventDefault();const p=point(e);zoom(Math.exp(-e.deltaY*.002),p.x,p.y);}
  function closeFullscreen(){if(!fullscreen)return;const dialog=fullscreen;fullscreen=null;host.append(root);dialog.close();dialog.remove();root.querySelector('[data-graph-fullscreen]').textContent='全屏 ↗';fit();}
  function toggleFullscreen(){
    if(fullscreen){closeFullscreen();return;}
    fullscreen=document.createElement('dialog');fullscreen.className='graph-fullscreen';fullscreen.setAttribute('aria-label','知识图谱全屏');
    fullscreen.addEventListener('cancel',e=>{e.preventDefault();closeFullscreen();});fullscreen.append(root);document.body.append(fullscreen);root.querySelector('[data-graph-fullscreen]').textContent='退出全屏';fullscreen.showModal();fit();
  }
  function click(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.graphZoom)zoom(Number(b.dataset.graphZoom));else if(b.hasAttribute('data-graph-fit')){cancelGesture();selectNode(null);fit();animator.wake(.4);}else if(b.hasAttribute('data-graph-labels')){labels=!labels;b.setAttribute('aria-pressed',labels);highlight();}else if(b.hasAttribute('data-graph-motion')){paused=!paused;syncMotion();if(!paused)animator.wake(.35);}else if(b.hasAttribute('data-graph-fullscreen'))toggleFullscreen();else if(b.dataset.graphRead)onRead(b.dataset.graphRead);else if(b.hasAttribute('data-graph-facet')&&selected)onFacet({kind:selected.kind,value:selected.label});}
  const change=()=>selectNode(picker.value);
  root.addEventListener('click',click);picker.addEventListener('change',change);
  svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);svg.addEventListener('lostpointercapture',up);svg.addEventListener('pointerleave',leave);svg.addEventListener('wheel',wheel,{passive:false});
  const observer=new ResizeObserver(fit);observer.observe(stage);fit();highlight();
  const viewport=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting);animator.setVisible(inView&&!document.hidden);});viewport.observe(stage);
  function visibility(){if(document.hidden)cancelGesture();animator.setVisible(inView&&!document.hidden);}
  function preference(){paused=reduced.matches;syncMotion();if(!paused)animator.wake(.3);}
  document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);syncMotion();animator.wake(simulation.alpha());
  return ()=>{disposed=true;animator.destroy();cancelGesture();observer.disconnect();viewport.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference);closeFullscreen();root.removeEventListener('click',click);picker.removeEventListener('change',change);svg.removeEventListener('pointerdown',down);svg.removeEventListener('pointermove',move);svg.removeEventListener('pointerup',up);svg.removeEventListener('pointercancel',up);svg.removeEventListener('lostpointercapture',up);svg.removeEventListener('pointerleave',leave);svg.removeEventListener('wheel',wheel);};
}
