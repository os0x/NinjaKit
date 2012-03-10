function GM_xmlhttpRequest(opt){
  var xhr = new XMLHttpRequest();
  var res = {
    status: 0,
    statusText: '',
    readyState: 0,
    responseText: '',
    responseHeaders: ''
  };
  xhr.open(opt.method, opt.url, true);
  if (opt.onload) {
    xhr.onload = function(){
      Object.keys(res).forEach(function(k){
        res[k] = xhr[k];
      });
      opt.onload(res);
    };
  }
  if (opt.onerror) {
    xhr.onerror = function(){
      Object.keys(res).forEach(function(k){
        res[k] = xhr[k];
      });
      opt.onerror(res);
    };
  }
  if (opt.onreadystatechange) {
    xhr.onreadystatechange = function(){
      Object.keys(res).forEach(function(k){
        res[k] = xhr[k];
      });
      opt.onreadystatechange(res);
    };
  }
  xhr.send(opt.data);
}
function GM_registerMenuCommand(){
}
GM_getResourceURL = void 0;

/*
if (!Object.prototype.toSource) {
  Object.prototype.toSource = function __toSource(){
    return uneval(this);
  };
}
*/
if (!this.uneval) {
  function uneval(obj){
    function _uneval(obj){
      var type = typeof obj;
      if (type === 'object' && Array.isArray(obj)) {
        return '[' + obj.map(function(v){
          return _uneval(v);
        }).join(',') + ']';
      } else if (type === 'object') {
        return '{' + Object.keys(obj).map(function(k){
          return k + ':' + _uneval(obj[k]);
        }).join(',') + '}';
      } else if (type === 'function') {
        return obj.toString();
      } else {
        return JSON.stringify(obj);
      }
    }
    return '(' + _uneval(obj) + ')';
  }
}
function GM_addStyle(css){
  var style = document.createElement('style');
  style.className = 'greasestyle';
  style.textContent = css;
  document.head.appendChild(style);
}
function GM_log(obj){
  console.log(obj);
}
'forEach map filter some every reduce reduceRight indexOf lastIndexOf'.split(' ').forEach(function(m){
  Array[m] = function(a,f,t){
    return Array.prototype[m].call(a,f,t);
  }
});
if(!this.GM_openInTab) {
  (function() {
    var __native_open = window.open;
    GM_openInTab = function() {
      __native_open.apply(window, arguments);
    };
  }());
}
unsafeWindow=window;
