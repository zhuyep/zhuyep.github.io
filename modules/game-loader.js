const GAMES={hextris:'Hextris · 六边形消除','0hh1':'0h h1 · 二色逻辑',wenchen:'天机簿 · 东方命书'};

// A frame's load event also fires on some error pages. Only the game's own
// ready message can dismiss the loading screen.
export function createGameLoader({dialog,container,title,events=window,slowMs=12000,timeoutMs=45000}){
 let cleanup=()=>{};
 function stop(){cleanup();cleanup=()=>{};container.replaceChildren();}
 function open(game){
  if(!Object.hasOwn(GAMES,game))return;
  stop();title.textContent=GAMES[game];const subject=game==='wenchen'?'天机簿':'游戏';
  container.innerHTML=`<section class="game-loading" aria-label="进入${subject}"><div class="game-loading-inner"><span class="eyebrow">片刻闲趣</span><h2>正在打开${subject}</h2><p class="game-load-status" role="status" aria-live="polite">正在连接${subject}……</p><progress class="game-load-progress" max="3" aria-label="${subject}加载进度"></progress><ol class="game-load-steps" aria-label="加载步骤"><li>连接${subject}</li><li>载入资源</li><li>准备画面</li></ol><p class="game-load-hint">首次进入稍等片刻，再次打开会复用已缓存的资源。</p><button class="secondary-button game-load-retry" hidden>重新加载</button></div></section>`;
  const overlay=container.firstElementChild,status=overlay.querySelector('.game-load-status'),progress=overlay.querySelector('progress'),retry=overlay.querySelector('button'),steps=[...overlay.querySelectorAll('li')];
  const frame=document.createElement('iframe');
  frame.title=GAMES[game];frame.allow='fullscreen';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.className='game-loading-frame';
  let done=false,stage=0;
  const slow=events.setTimeout(()=>{if(!done){status.textContent='网络较慢，仍在加载。也可以重试。';retry.hidden=false;}},slowMs);
  const timeout=events.setTimeout(()=>fail('加载暂未完成，请检查网络后重试。'),timeoutMs);
  function fail(message){if(done)return;done=true;events.clearTimeout(slow);events.clearTimeout(timeout);frame.remove();status.textContent=message;progress.hidden=true;retry.hidden=false;}
  function message(event){
   const msg=event.data;
   if(done||event.origin!==location.origin||event.source!==frame.contentWindow||msg?.type!=='daji-game-load'||msg.game!==game)return;
   if(msg.stage==='error'){fail('游戏启动遇到问题，请重新加载。');return;}
   const next={resources:1,preparing:2,ready:3}[msg.stage];
   if(!next||next<stage)return;
   stage=next;progress.value=stage;steps.forEach((el,i)=>el.classList.toggle('complete',i<stage));
   status.textContent={1:'正在载入游戏资源……',2:'正在准备画面……',3:'准备好了，开始吧。'}[stage];
   if(stage===3){done=true;events.clearTimeout(slow);events.clearTimeout(timeout);overlay.remove();frame.classList.remove('game-loading-frame');frame.removeAttribute('aria-hidden');frame.removeAttribute('tabindex');}
  }
  retry.addEventListener('click',()=>open(game));
  events.addEventListener('message',message);
  cleanup=()=>{done=true;events.clearTimeout(slow);events.clearTimeout(timeout);events.removeEventListener('message',message);};
  // The trailing slash avoids Pages' extra index.html redirect.
  frame.src=`games/${game}/`;container.append(frame);
  if(!dialog.open)dialog.showModal();
 }
 dialog.addEventListener('close',stop);
 return {open,stop};
}
