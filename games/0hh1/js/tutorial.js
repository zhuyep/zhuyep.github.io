/* 
 * Tutorial
 * The 0h h1 tutorial with its messages and required tile(s) to tap.
 * (c) 2014 Q42
 * http://q42.com | @q42
 * Written by Martin Kool
 * martin@q42.nl | @mrtnkl
 */
var TutorialMessages = {
  1: { msg: "我们来填满棋盘。<br>点击标记的格子，将它变红。", tiles: [ [0,0,1] ] },
  2: { msg: "再点一次，<br>格子就会变成蓝色。", tiles: [ [0,1,2] ] },
  3: { msg: "一行里，不能出现<br>三个连续的红色格子。", tiles: [ [2,0,2] ] },
  4: { msg: "同样，也不能出现<br>三个连续的蓝色格子。", tiles: [ [1,1,1] ] },
  5: { msg: "一列里，也不能出现<br>三个连续的同色格子。", tiles: [ [1,2,2], [2,2,1] ] },
  6: { msg: "每一行填满后，<br>红色和蓝色的数量要相等。", tiles: [ [3,1,1] ], rows: [1] },
  7: { msg: "每一列填满后，<br>两种颜色的数量也要相等。", tiles: [ [1,3,2] ], cols: [1] },
  8: { msg: "根据这些规则，<br>推理这两格该是什么颜色。", tiles: [ [2,3,1], [0,3,1] ] },
  9: { msg: "还有一条规则：<br>不能有完全相同的两行。", tiles: [ [0,2,2],[3,2,1] ], rows:[2,3] },
 10: { msg: "两列也不能完全相同。<br>卡住时，可以点眼睛看提示。", tiles: [ [3,0,2] ], wiggle: true }
}

var Tutorial = new (function() {
  var self = this,
      step = 0,
      active = false,
      visible = false,
      tilesToTapThisStep = [];

  function start() {
    step = 0;
    active = true;
    $('#bar [data-action="next"]').hide();

    Game.startGame({
      size: 4,
      empty: [0,1,0,0,0,0,2,0,0,0,0,0,0,0,0,2],
      full: [1,1,2,2,2,1,2,1,2,2,1,1,1,2,1,2],
      isTutorial: true
    });
    next();
  }

  function end() {
    $('#bar [data-action="help"]').removeClass('hidden wiggle');
    active = false;
  }

  function next() {
    if (step >= Utils.count(TutorialMessages)) {
      hide();
      active = false;
      setTimeout(function() {
        Game.checkForLevelComplete();  
      }, 1000)
      return;
    }

    step++;
    var t = TutorialMessages[step];
        msg = t.msg;
    show(msg);
    tilesToTapThisStep = [];
    Game.grid.unmark();
    $(t.tiles).each(function() {
      tilesToTapThisStep.push(Game.grid.tile(this[0], this[1]));
    });
    setTimeout(function() {
      markTilesForThisStep();
    }, 0)
    if (t.wiggle) {
      $('#bar [data-action="help"]').addClass('wiggle');
    }
  }

  function markTilesForThisStep() {
    var t = TutorialMessages[step];
      if (t.rows) 
        $(t.rows).each(function() { Game.grid.markRow(this);});
      else if (t.cols) 
        $(t.cols).each(function() { Game.grid.markCol(this);});
      else
        $(t.tiles).each(function() { Game.grid.mark(this[0], this[1]);});
  }

  function show(msg) {
    $('#hintMsg').html('<span>' + msg + '</span>');
    $('html').addClass('showHint');
    visible = true;
  }

  function hide() {
    $('html').removeClass('showHint');
    visible = false;
  }

  function tapTile(tile) {
    var tapAllowed = false;

    $(tilesToTapThisStep).each(function() {
      if (tile.x == this.x && tile.y == this.y)
        tapAllowed = true;
    })  

    if (!tapAllowed)
      return;

    if (tile.isEmpty)
      tile.value = 1;
    else if (tile.value == 1)
      tile.value = 2;
    else
      tile.clear();

    setTimeout(markTilesForThisStep, 0);
    checkStepCompleted();
  }

  function checkStepCompleted() {
    var completed = true;
    $(TutorialMessages[step].tiles).each(function() {
      var x = this[0],
          y = this[1],
          tile = Game.grid.tile(x, y),
          value = this[2];
      if (tile.value != value)
        completed = false;
    })
    if (!completed)
      return;

    $(tilesToTapThisStep).each(function() {
      this.system = true;
    });
    next();
  }

  function hintAllowed() {
    return step >= 9;
  }

  this.start = start;
  this.end = end;
  this.next = next;
  this.show = show;
  this.hide = hide;
  this.tapTile = tapTile;
  this.hintAllowed = hintAllowed;
  
  this.__defineGetter__('active', function() { return active; })
  this.__defineSetter__('active', function(v) { active = v; })
  this.__defineGetter__('visible', function() { return visible; })
  this.__defineGetter__('step', function() { return step; })
})();