import {forceSimulation,forceLink,forceManyBody,forceCollide,forceCenter,forceX,forceY} from '../vendor/d3-force.js';

export function createGraphPhysics(graph,{reducedMotion=false}={}){
 const nodes=graph.nodes.map(n=>({...n})),links=graph.links.map(l=>({...l}));
 const simulation=forceSimulation(nodes).stop()
  .force('link',forceLink(links).id(n=>n.id).distance(l=>l.kind==='category'?65:85).strength(.32))
  .force('charge',forceManyBody().strength(n=>n.kind==='category'?-175:-55).distanceMax(400))
  .force('collision',forceCollide(n=>n.radius+7).iterations(2))
  .force('center',forceCenter(0,0).strength(.08))
  .force('x',forceX(0).strength(.025)).force('y',forceY(0).strength(.025))
  .alphaDecay(.023).velocityDecay(.34);
 // Start with a legible cluster, then let the user see it unfold. The reduced
 // motion version goes straight to a settled view without animated frames.
 simulation.tick(reducedMotion?240:24);
 return {nodes,links,simulation};
}

// One bounded animation loop. No timer remains once the layout settles, is
// paused, leaves the viewport, or is removed from the page.
export function createGraphAnimator(simulation,{draw,requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,paused=false,visible=true}={}){
 let frame=null,last=null,disposed=false;
 simulation.stop();
 const active=()=>!disposed&&!paused&&visible&&(simulation.alpha()>=simulation.alphaMin()||simulation.alphaTarget()>simulation.alphaMin());
 function schedule(){if(frame===null&&active())frame=requestFrame(step);}
 function step(time){
  frame=null;if(!active())return;
  if(last===null||time-last>=1000/30-1){simulation.tick();last=time;draw();}
  schedule();
 }
 function cancel(){if(frame!==null)cancelFrame(frame);frame=null;last=null;}
 return {
  wake(alpha=.3){if(disposed)return;simulation.alpha(Math.max(simulation.alpha(),alpha));schedule();},
  setPaused(value){paused=value;cancel();schedule();},
  setVisible(value){visible=value;cancel();schedule();},
  destroy(){disposed=true;cancel();simulation.stop();}
 };
}
