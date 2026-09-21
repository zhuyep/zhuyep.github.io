/* Local boot and accessible menu labels; adaptation 2026-09-05. */
Game.init();Game.start();
document.querySelectorAll('[data-action]').forEach(function(el){if(el.id==='title'||el.id==='about')return;el.setAttribute('role','button');el.tabIndex=0;var a=el.getAttribute('data-action');var names={undo:'撤销',back:'返回',help:'提示',startGame:'选择棋盘'};if(names[a])el.setAttribute('aria-label',names[a]+(el.dataset.size?' '+[4,6,8,10][Number(el.dataset.size)-1]+' × '+[4,6,8,10][Number(el.dataset.size)-1]:''));});
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')){e.preventDefault();e.stopImmediatePropagation();e.target.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));e.target.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));}},true);

window.dispatchEvent(new Event("daji-game-ready"));
