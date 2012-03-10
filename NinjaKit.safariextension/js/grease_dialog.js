var g = this;
var sendRequest = g.chrome ? function(data,callback){
  chrome.extension.sendRequest(data,callback);
} : (function(){
  var eventData = {};
  safari.self.addEventListener('message',function(evt){
    (evt.name in eventData) && eventData[evt.name](evt.message);
  },false);
  return function(data, callback, name){
    name = name || (Date.now() + Math.random().toString(36));
    callback && (eventData[name] = callback);
    safari.self.tab.dispatchMessage(name,data);
  }
})();
g.chrome && (window.onmessage = function(evt){
  if (evt.data) {
    handler(evt.data);
  }
});
g.safari && safari.self.addEventListener('message',function(evt){
  if(evt.name.indexOf('NinjaKit.install') === 0 && evt.message && evt.message.source){
    handler(evt.message);
  }
},false);
function handler(meta){
  var name = document.getElementById('script-name');
  var includes = document.getElementById('includes');
  var excludes = document.getElementById('excludes');
  var install = document.getElementById('install');
  var view_source = document.getElementById('view_source');
  var cancel = document.getElementById('cancel');
  name.textContent = meta.name;
  if (meta.description) {
    var description = document.getElementById('description');
    description.textContent = meta.description;
  }
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
  install.disabled = false;
  install.onclick = function(){
    g.safari && sendRequest({type:'install',meta:meta},end);
    window.parent.postMessage({type:'install',meta:meta},'*');
  };
  view_source.onclick = function(){
    g.safari && sendRequest({type:'view_source',meta:meta},end);
    window.parent.postMessage({type:'view_source',meta:meta},'*');
  };
  cancel.onclick = function(){
    window.parent.postMessage({type:'cancel',meta:meta},'*');
  };
  function end(){
    window.parent.postMessage({type:'end',meta:meta},'*');
  }
}