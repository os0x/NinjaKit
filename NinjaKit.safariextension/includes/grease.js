if (this.opera) {
  Object.getOwnPropertyNames(window).forEach(function(name){
    this[name] = window[name];
  });
}
var g = this;
var extension_path = function(){
  if (g.chrome) {
    return chrome.extension.getURL('grease.html');
  } else if (g.safari) {
    return g.safari.extension.baseURI + 'grease.html';
  } else if (g.opera) {
    return extension_path_opera + 'grease.html';
  }
}, extension_path_opera;

var sendRequest = this.chrome ? function(data,callback) {
  if (callback) {
    chrome.extension.sendRequest(data,callback);
  } else {
    chrome.extension.sendRequest(data);
  }
} : this.safari? (function() {
  var eventData = {};
  safari.self.addEventListener('message',function(evt) {
    (evt.name in eventData) && eventData[evt.name](evt.message);
  },false);
  return function(data, callback, name) {
    name = (name || '') + (Date.now() + Math.random().toString(36));
    callback && (eventData[name] = callback);
    safari.self.tab.dispatchMessage(name,data);
  }
})() : this.opera ? (function(data, callback) {
  var eventData = {};
  opera.extension.onmessage = function(evt) {
    (evt.data.name in eventData) && eventData[evt.data.name](evt.data.data);
    if (evt.data.name === 'extension_path') {
      extension_path_opera = evt.data.data;
    }
  };
  return function(data, callback, name) {
    name = (name || '') + (Date.now() + Math.random().toString(36));
    callback && (eventData[name] = callback);
    opera.extension.postMessage({name:name,data:data});
  };
})() : null;

(function greased(g){
  if (this.greasedChrome) return;
  var gc = this.greasedChrome = {codes:[],commands:[]};
  var domload = false;
  document.addEventListener('DOMContentLoaded',function(e){
    gc.codes.forEach(execScript);
    domload = true;
    scriptHandler();
  },false)
  function init(code){
    gc.codes.push(code);
    if (domload){
      execScript(code);
    }
  }
  function execScript(code){
    if(!code.code){
      return;
    }
    if (!code.bookmarklet) {
      try{
        //console.log(code.code);
        eval(code.code);
      } catch(e){
        console.error(e.message);
        console.log(e.stack);
        console.log(code.code);
      }
    } else {
      try {
        location.href = 'javascript:'+encodeURIComponent(code.code);
      } catch (e) {
        console.error(e);
      }
    }
  }
  if (this.chrome) {
    var port = chrome.extension.connect({name: "ninjakit"});
    port.postMessage({href:location.href,top:window.top===window});
    port.onMessage.addListener(init);
  } else {
    sendRequest({href:location.href,top:window.top===window},init, 'NinjaKit.init');
  }

function scriptHandler(){
  var jss = document.querySelectorAll('a[href$=".user.js"]');
  var iframe;
  for (var i = 0, len = jss.length;i < len;i++){
    var js = jss[i];
    js.addEventListener('click',function(evt){
      evt.preventDefault();
      var href = this.href;
      if (g.opera) {
        var data = {
          type: 'view_source',
          original:location.href,
          script_src: href
        };
        sendRequest(data);
        return;
      }
      if (!iframe) {
        iframe = document.createElement('iframe')
        iframe.name = 'grease-installer';
        iframe.id = 'grease-installer';
        iframe.src = extension_path();
        document.body.appendChild(iframe);
      }
      iframe.onload = function(){
        var data = {
          type: '.user.js',
          original:location.href,
          src: href
        };
        sendRequest(data, install_response, "NinjaKit.install");
      };
      var top  = (window.innerHeight - 350)/2;
      var left = (window.innerWidth  - 500)/2;
      iframe.setAttribute('style','-webkit-box-shadow: 4px 4px 4px rgba(0,0,0,0.5);border-radius:10px;background:-webkit-gradient(linear, left top, left bottom, from(rgba(246,246,246,0.7)), to(rgba(202,202,202,0.7)));position:fixed;z-index:9999;height:350px;width:500px;left:' + left + 'px;top:' + top + 'px;');
      function install_response(meta){
        if(g.safari){
          //safari.self.tab.dispatchMessage('ninjakit.install.meta', meta);
        } else {
          var meta_json = JSON.stringify(meta);
          var s = document.createElement('script');
          s.textContent = '('+function(meta, origin){
            var i = document.getElementById('grease-installer');
            i.contentWindow.postMessage(meta, origin);
          }+')(' + meta_json + ',"' + chrome.extension.getURL('grease.html').replace('/grease.html','') + '");';
          document.body.appendChild(s);
        }
        window.onmessage = function(evt){
          if (evt.data.type === 'install') {
            if (meta_json === JSON.stringify(evt.data.meta)) {
              !g.safari && sendRequest({
                type: 'install',
                meta:meta
              }, installed_response);
            }
          } else if (evt.data.type === 'view_source') {
            if (meta_json === JSON.stringify(evt.data.meta)) {
              !g.safari && sendRequest({
                type: 'view_source',
                meta:meta
              });
            }
            installed_response();
          } else if (evt.data.type === 'cancel') {
            installed_response();
          } else if (evt.data.type === 'end') {
            installed_response();
          }
        };
      }
      function installed_response(meta){
        document.body.removeChild(iframe);
        iframe = null;
      }
    },false);
  }
}
})(this);
