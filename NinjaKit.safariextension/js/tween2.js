// Tweener Like snippet
// var tw = new Tween(div.style,{time:1, onComplete:function(){},left:{to:0,from:100,tmpl:"$#px"}});
function Tween(item, opt) {
  var self = this, TIME = 10, time = (opt.time||1) * 1000, TM_EXP = /(\+)?\$([\#\d])/g, sets = [], isFilter,
    easing = opt.transition || function(t, b, c, d){return c*t/d + b;}, _T = {time:1,onComplete:1,transition:1,delay:1};
  for (var k in opt) if (!_T[k]) {
    if (typeof item === 'function') {
      isFilter = true;
      sets.push({from:from, to:set.to});
    } else {
      var set = opt[k], from = set.from || parseFloat(item[k]) || 0, values = [], tmpl = set.tmpl || '-$#';
      sets.push({key:k, from:from, to:set.to, tmpl:tmpl});
    }
  }
  var L = sets.length, delay = opt.delay*1000 || 0, startTime = new Date()*1 + delay, run = function(){
    var now = new Date()*1, tim = self.prev = now - startTime;
    for (var k = 0; k < L; ++k) {
      var set = sets[k], val = easing(tim, set.from, set.to - set.from, time);
      if (isFilter) {
        item(val);
      } else {
        item[set.key] = set.tmpl.replace(TM_EXP,
          function(m, p, m1){return p && val < 0 ? 0 : (m1 == '#' ? val : val.toFixed(m1));});
      }
    }
    if (tim <= time) {self.T=setTimeout(function(){run.call(self);},TIME);}
    else {
      for (var k = 0; k < L; ++k) {
        if (isFilter) {
          item(sets[k].to);
        } else {
          item[sets[k].key] = sets[k].tmpl.replace(TM_EXP, sets[k].to);
        }
      }
      if (typeof opt.onComplete == 'function') opt.onComplete(item);
      self.end = true;
    }
  };
  self.prev = 0;
  this.restart = function(){
    startTime = new Date()*1 - self.prev;
    run();
  };
  this.pause = function(){
    if(self.T){
      clearTimeout(self.T);
      self.T = null;
    }
  };
  this.stop = function(){
    if(self.T){
      clearTimeout(self.T);
      self.T = null;
      self.prev = 0;
      for (var k = 0; k < L; ++k) {
        var set = sets[k], val = set.from;
        if (isFilter) {
          item(val);
        } else {
          item[set.key] = set.tmpl.replace(TM_EXP,
            function(m, p, m1){return p && val < 0 ? 0 : (m1 == '#' ? val : val.toFixed(m1));});
        }
      }
    }
  };
  delay ? this.T=setTimeout(function(){run();},delay) : run(0);
}
