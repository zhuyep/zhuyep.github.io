/* Local adaptation, 2026-09-05. GPL-3.0-or-later; see LOCAL-CHANGES.md. */
(function () {
  'use strict';
  var left = document.getElementById('rotate-left');
  var right = document.getElementById('rotate-right');
  var action = document.getElementById('local-action');
  var dialog = document.getElementById('local-dialog');
  var lastState;
  function syncControls() {
    if (lastState === window.gameState) return;
    lastState = window.gameState;
    left.disabled = right.disabled = window.gameState !== 1;
    action.textContent = ({0:'开始',1:'暂停','-1':'继续',2:'再来'})[window.gameState] || '开始';
  }
  var originalRender = window.render;
  window.render = function () { originalRender(); syncControls(); };
  left.addEventListener('click', function () { if (gameState === 1) MainHex.rotate(1); });
  right.addEventListener('click', function () { if (gameState === 1) MainHex.rotate(-1); });
  action.addEventListener('click', function () {
    if (gameState === 0) startBtnHandler();
    else if (gameState === 2) { clearSaveState(); init(); $('#gameoverscreen').hide(); }
    else pause();
    syncControls();
  });
  // The original center is a transparent hit area over the drawn play symbol.
  document.getElementById('startBtn').addEventListener('keydown', function (event) {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); startBtnHandler(); }
  });
  function showDialog(title, body) {
    if (gameState === 1) pause();
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-body').innerHTML = body;
    dialog.showModal();
    syncControls();
  }
  document.getElementById('local-help').addEventListener('click', function () {
    showDialog('怎么玩', '<p>点左右按钮，或轻点画面左右两侧，旋转中央六边形。</p><p>让 <strong>3 块或以上同色方块相邻</strong>，就能消除得分。连续消除可累积连击。</p><p>别让方块堆出灰色边界。节奏会慢慢变快。</p><p>键盘：← / → 旋转，↓ 加速，空格暂停。</p>');
  });
  document.getElementById('local-about').addEventListener('click', function () {
    showDialog('来源与许可', '<p>原作：Logan Engstrom、Garrett Finucane、Noah Moroze、Michael Yang。</p><p><a href="https://github.com/Hextris/hextris/tree/3f4847dc8fd7dab3d1c87e6324b9159d92fbd396" target="_blank" rel="noopener noreferrer">Hextris 官方源码</a> · <a href="LICENSE.md" target="_blank" rel="noopener">GNU GPL v3</a></p><p>本地版本保留原有玩法与画面，补充手机按钮和中文提示。遵循 GPL v3 或更新版，可依法复制、修改和再发布，不提供担保。</p><small>修改日期：2026-09-05<br>固定提交：3f4847dc8fd7dab3d1c87e6324b9159d92fbd396<br><a href="LOCAL-CHANGES.md" target="_blank" rel="noopener">本地修改说明</a></small>');
  });
  document.getElementById('dialog-close').addEventListener('click', function () { dialog.close(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && gameState === 1) pause(); });
  syncControls();
}());
