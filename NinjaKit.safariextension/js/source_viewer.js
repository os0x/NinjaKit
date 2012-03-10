var g = this;
var userjs_install;
if (g.chrome){
  BG = chrome.extension.getBackgroundPage();
  userjs_install = BG.userjs_install;
  onload();
} else if(g.safari){
  safari.self.addEventListener('message',function(evt){
    if(evt.name === location.hash){
      meta = evt.message;
      onload();
      userjs_install = function(meta){
        safari.self.tab.dispatchMessage('options',{action:'install.meta', meta:meta});
      }
    }
  },false);
} else if(g.opera){
  setTimeout(function() {
    var metaInfo = opera.extension.bgProcess.metaInfo;
    var key = location.hash;
    if (metaInfo && metaInfo[key]) {
      meta = metaInfo[key];
      onload();
      userjs_install = function(meta) {
        opera.extension.postMessage({name:'options',data:{action:'install.meta', meta:meta}});
      }
    }
  },0);
}
window.onload = onload;
function onload(){
  var meta = window.meta;
  if (!meta) return setTimeout(onload,300);
  var name = document.getElementById('script-name');
  var includes = document.getElementById('includes');
  var excludes = document.getElementById('excludes');
  var scriptsource = document.getElementById('script-source');
  var install = document.getElementById('install');
  var view_source = document.getElementById('view_source');
  var cancel = document.getElementById('cancel');
  var section = document.querySelector('#content > section');
  name.textContent = meta.name;
  meta.include && meta.include.forEach(function(rule){
    var dd = document.createElement('dd');
    dd.textContent = rule;
    includes.appendChild(dd);
  });
  meta.exclude && meta.exclude.forEach(function(rule){
    var dd = document.createElement('dd');
    dd.textContent = rule;
    excludes.appendChild(dd);
  });
  JSHighlighter.exec(meta.source, scriptsource);
  install.disabled = false;
  install.onclick = function(){
    userjs_install(meta);
    setTimeout(function(){
      window.close();
    },500);
  };
  cancel.onclick = function(){
    window.close();
  };
}
