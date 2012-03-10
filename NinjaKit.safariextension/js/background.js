const NONE = 0;
const ALL = 1;
const PART = 2;
var g = this;
g.Scripts = [
  {
    "name":"demo",
    "namespace":"http://ss-o.net/",
    "include":["http://ss-o.net/"],
    "source":"// ==UserScript==\n// @name          demo\n// @namespace     http://ss-o.net/\n// @include       http://ss-o.net/\n// ==/UserScript==\ndocument.title ='Hello!'+document.title;\n"
  }
];
g.Config = {
  version:'0',
  status_icon:PART,
  options:{
    font:'monospace'
  }
};
g.cache ={};
if (localStorage.Scripts) {
  Scripts = JSON.parse(localStorage.Scripts);
} else {
  localStorage.Scripts = JSON.stringify(Scripts);
}

if (localStorage.Config) {
  Config = JSON.parse(localStorage.Config);
} else {
  localStorage.Config = JSON.stringify(Config);
}

var gm_source = '';
var gm_source_safe = '';
var gm_value_code = '(' + gm_value.toString();
(function get_gm() {
  var url = 'includes/gm-wrapper.js';
  var url2 = 'js/gm-wrapper-safe.js';
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    gm_source = xhr.responseText;
  };
  xhr.open('GET', url, true);
  xhr.send(null);
  var xhr2 = new XMLHttpRequest();
  xhr2.onload = function(){
    gm_source_safe = xhr2.responseText;
  };
  xhr2.open('GET', url2, true);
  xhr2.send(null);
})();
if (g.chrome) {
  chrome.extension.onRequest.addListener(handleMessage);
  chrome.extension.onConnect.addListener(function(port) {
    var sender = port.sender;
    var sendResponse = port.postMessage.bind(port);
    port.onMessage.addListener(function(request) {
      request && handleMessage(request, sender, sendResponse);
    });
  });
} else if(g.safari) {
  safari.application.addEventListener("message",function(evt) {
    var page = evt.target.page;
    var name = evt.name;
    if (name === 'options') {
      if(evt.message.action === 'save') {
        Scripts = JSON.parse(localStorage.Scripts);
      } else if(evt.message.action === 'get_script') {
        evt.target.page.dispatchMessage(evt.message.action + '_callback', Scripts);
      } else if(evt.message.action === 'install') {
        userjs_installer.apply(null, evt.message.args);
      } else if(evt.message.action === 'install.meta') {
        userjs_install(evt.message.meta);
      }
    } else {
      handleMessage(evt.message, {}, function(data) {
        page.dispatchMessage(name, data);
      });
    }
  }, false);
  safari.application.addEventListener("command", function(e) {
    var tab = safari.application.activeBrowserWindow.openTab();
    tab.url = location.href.replace('index.html', 'options.html');
  }, false);
} else if (g.opera) {
  var ToolbarUIItemProperties = {
    disabled: false,
    title: "NinjaKit",
    icon: "img/sk16.png"
  };
  var theButton = opera.contexts.toolbar.createItem(ToolbarUIItemProperties);
  theButton.onclick = function() {
    openOrFocusTab('options.html');
  };
  opera.contexts.toolbar.addItem(theButton);
  g.opera.extension.onmessage = function(evt){
    var name = evt.data.name;
    var message = evt.data.data;
    if (name === 'options') {
      if(message.action === 'save') {
        Scripts = JSON.parse(localStorage.Scripts);
      } else if(message.action === 'get_script') {
        evt.source.postMessage({name: message.action + '_callback', data:Scripts});
      } else if(message.action === 'install') {
        userjs_installer.apply(null, message.args);
      } else if(message.action === 'install.meta') {
        userjs_install(message.meta);
      }
    } else {
      handleMessage(message, {}, function(data) {
        evt.source.postMessage({name: name, data:data});
      });
    }
    if (name.indexOf('NinjaKit.init') === 0) {
      evt.source.postMessage({name: 'extension_path', data:location.href.replace(location.pathname,'/')});
    }
  };
}

function handleMessage(request, sender, sendResponse) {
  if (request.href) {
    var tab = sender.tab;
    var top = request.top && /^(http|ftp|file)/.test(request.href);
    if (top && Config.status_icon === ALL) {
      g.chrome && chrome.pageAction.show(tab.id);
    }
    var js = getScript(request.href);
    if (js.length === 0) {
      return;
    }
    //sendResponse({code:gm_source_safe, bookmarklet:true});
    var bookmarklet = false;
    js.forEach(function(script) {
      if (script.filesystem) {
        read_file(script, function(source) {
          exec(source, script);
        });
      } else {
        exec(script.source ,script);
      }
    });
    function exec(source, script) {
      var ns = script.namespace + '/' + script.name;
      if (script['required-source']) {
        source = script['required-source'] + source;
      }
      var code = {id: script.id, name: script.name, ns: ns};
      if ('bookmarklet' in script) {
        code.code = (!bookmarklet ? gm_source_safe : '') + source;
        code.bookmarklet = true;
        bookmarklet = true;
      } else {
        var src = '(function(SCRIPT_NAME_SPACE){/*'+script.name+'*/\n'+
        'var __gm_value_store = ' + localStorage[ns] + ' || {};\n' +
        'var gm = ' + gm_value_code + ')("' + ns + '");\n' +
        '(function(__gm){\n' +
        'var GM_getValue = __gm.GM_getValue,\n' +
        '    GM_setValue = __gm.GM_setValue,\n' +
        '    GM_listValues = __gm.GM_listValues,\n' +
        '    GM_deleteValue = __gm.GM_deleteValue,\n' +
        '    GM_registerMenuCommand = __gm.GM_registerMenuCommand;\n' +
        '    isChromeExtension = function(){return false};' + source + '\n})(gm);\n'+
        '})("'+ns+'");';
        code.code = src;
      }
      sendResponse(code);
    }
    if (top && Config.status_icon === PART) {
      g.chrome && chrome.pageAction.show(sender.tab.id);
    }
  } else if (request.src) {
    get_script_info(request, function(result) {
      sendResponse(result);
    });
  } else if (request.type === 'install') {
    userjs_install(request.meta);
    sendResponse({});
  } else if (request.type === 'view_source') {
    var meta = request.meta;
    var key = '#' + Date.now();
    if (!meta) {
      get_script_info({src: request.script_src}, function(meta) {
        if (!meta.error) {
          window.metaInfo  || (window.metaInfo = {});
          window.metaInfo[key] = meta;
          openOrFocusTab('view_source.html' + key);
        }
      });
      return;
    }
    g.chrome && chrome.tabs.create({url: 'view_source.html' + key}, function(tab) {
      chrome.extension.getViews({type:'tab'}).some(function(win) {
        if (win.location.href === tab.url) {
          win.meta = meta;
          return true;
        }
      });
    });
    if (g.safari) {
      var tab = safari.application.activeBrowserWindow.openTab();
      tab.url = location.href.replace('index.html','view_source.html' + key);
      setTimeout(function() {
        tab.page.dispatchMessage(key, meta);
      }, 1000);
    }
  }
  if (request.type === 'GM_xmlhttpRequest') {
    var xhr = new XMLHttpRequest();
    var res = {
      status:0,
      statusText:'',
      readyState:0,
      responseText:'',
      responseHeaders:''
    };
    xhr.open(request.method || 'get', request.url, true);
    Object.keys(request.headers).forEach(function(name, i, headers) {
      xhr.setRequestHeader(name, request.headers[name]);
    });
    if (request.hasOnload) {
      xhr.onload = function(){
        Object.keys(res).forEach(function(k) {
          res[k] = xhr[k];
        });
        res.finalUrl = request.url; // FIXME
        res.responseHeaders = xhr.getAllResponseHeaders();
        sendResponse({response:res, state:'load'});
      };
    }
    if (request.hasOnerror) {
      xhr.onerror = function() {
        Object.keys(res).forEach(function(k) {
          res[k] = xhr[k];
        });
        res.responseHeaders = xhr.getAllResponseHeaders();
        sendResponse({response:res, state:'error'});
      };
    }
    if (request.hasOnreadystatechange) {
      xhr.onreadystatechange = function() {
        Object.keys(res).forEach(function(k) {
          res[k] = xhr[k];
        });
        sendResponse({response:res, state:'readystatechange'});
      };
    }
    xhr.send(request.data);
  }
  if (request.type === 'GM_setValue') {
    localStorage[request.namespace] = JSON.stringify(request.value);
  }
}
var meta_def = {
  "name":String,
  "namespace":String,
  "bookmarklet":String,
  "include":Array,
  "exclude":Array,
  "require":Array
};
function get_script_info(request, callback) {
  var xhr = new XMLHttpRequest();
  var src = request.src;
  xhr.open('GET', src, true);
  xhr.onload = function() {
    var js = xhr.responseText;
    var meta = userjs_parser(js, src, request.original);
    var last = xhr.getResponseHeader('Last-Modified');
    meta['Last-Modified'] = last;
    callback(meta);
  };
  xhr.onerror = function() {
    console.error(xhr);
  };
  xhr.send(null);
}
function userjs_parser(jscode, src, original) {
  var rows = jscode.split(/[\n\r]+/g);
  var metainf = {}, _begin = false;
  rows.some(function(txt) {
    if (/==UserScript==/.test(txt)) {
      _begin = true;
    } else if (_begin) {
      if (/==\/UserScript==/.test(txt)) {
        return true;
      } else {
        var meta = txt.match(/^\/\/\s*@([-\w]+)\s*(.*)/);
        if (meta && meta_def[meta[1]] === Array) {
          if (metainf[meta[1]]) {
            metainf[meta[1]].push(meta[2]);
          } else {
            metainf[meta[1]] = [meta[2]];
          }
        } else if (meta && meta_def[meta[1]] === String) {
          metainf[meta[1]] = meta[2] || '';
        } else if (meta) {
          metainf[meta[1]] = meta[2];
        }
      }
    }
  });
  metainf.filename = metainf.name.replace(/[\s\?\/\\]/g, '_').slice(0,80);
  metainf.source = jscode;
  metainf.src = src;
  metainf.original = original;
  return metainf;
}
function userjs_installer(jscode, src, original) {
  return userjs_install(userjs_parser(jscode, src, original));
}
function userjs_install(metainf) {
  if (metainf.name) {
    var check, index = -1;
    check = Scripts.some(function(sty,i) {
      index = i;
      return sty.name === metainf.name;
    });
    if (check) {
      Scripts[index] = metainf;
    } else {
      Scripts.push(metainf);
    }
    //setTimeout(function() {
      if (metainf.require) {
        metainf['required-source'] = '';
        metainf.require.forEach(function(src, i, rs) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', src, false);
          xhr.send(null);
          metainf['required-source'] += ';\n' + xhr.responseText;
        });
      }
      metainf.id = metainf.name.replace(/\W/g,'_');
      localStorage.Scripts = JSON.stringify(Scripts);

      if (window.webkitRequestFileSystem) {
        write_file(metainf);
      }
    //}, 0);
    return {message: 'installed', data: metainf};
  }
}
function write_file(metainf) {
  webkitRequestFileSystem(PERSISTENT, 50 * 1024 * 1024, function(fs) {
    fs.root.getDirectory(metainf.namespace.replace(/\W/g,'_'), {create: true}, function(dir) {
      dir.getFile(metainf.filename + '.user.js', {}, delete_file, create_file);
      function delete_file(file) {
        file.remove(create_file, create_file);
      }
      function create_file() {
        dir.getFile(metainf.filename + '.user.js', {create: true}, function (file) {
          file.createWriter(function(writer) {
            writer.onwrite = function(e) {
              console.log('writer completed.');
              metainf.filesystem = true;
              localStorage.Scripts = JSON.stringify(Scripts);
            };
            writer.onerror = function(e) {
              console.log('write failed: ', e);
            };
            var bb = new WebKitBlobBuilder();
            bb.append(metainf.source);
            writer.write(bb.getBlob('text/plain'));
          });
        });
      }
    });
  }, function(e){
    console.log(arguments, this);
  });
}
function read_file(metainf, callback) {
  webkitRequestFileSystem(PERSISTENT, 50 * 1024 * 1024, function(fs) {
    fs.root.getDirectory(metainf.namespace.replace(/\W/g,'_'), null ,function(dir) {
      dir.getFile(metainf.filename + '.user.js', null, function (file_entry) {
        file_entry.file(function(file) {
          var reader = new FileReader();
          reader.onload = function(data) {
            callback(this.result);
          };
          reader.readAsText(file);
        });
      });
    });
  });
}
function delete_file(metainf) {
  webkitRequestFileSystem(PERSISTENT, 50 * 1024 * 1024, function(fs){
    fs.root.getDirectory(metainf.namespace.replace(/\W/g,'_'), {create: true}, function(dir) {
      dir.getFile(metainf.filename + '.user.js', {}, delete_file);
      function delete_file(file) {
        file.remove();
      }
    });
  });
}
function getScript(url) {
  var js = [];
  Scripts.forEach(function(script) {
    if (script.disabled || (script.exclude && script.exclude.some(function(m) {
      return convert2RegExp(m).test(url);
    }))) {
      return;
    } else if (script.include && script.include.some(function(m) {
      return convert2RegExp(m).test(url);
    })) {
      js.push(script);
    }
  });
  return js;
}
function e4xToString(text) {
}
function gm_value(SCRIPT_NAME_SPACE) {
  function GM_registerMenuCommand(caption, commandFunc/*, accelKey, accelModifiers, accessKey*/) {
    var key = Date.now() + Math.random().toString(36);
    document.addEventListener(caption + '.' + key, function(e) {
      commandFunc();
    }, false);
    greasedChrome.commands.push({ns: SCRIPT_NAME_SPACE, caption: caption, key: key});
  }
  function GM_getValue(key, default_value) {
    if (key in __gm_value_store) {
      return __gm_value_store[key];
    } else {
      return default_value;
    }
  }
  function GM_setValue(key, value) {
    __gm_value_store[key] = value;
    var opt = {
      type:'GM_setValue',
      value:__gm_value_store,
      namespace:SCRIPT_NAME_SPACE
    };
    sendRequest(opt);
  }
  function GM_deleteValue(key){
    delete __gm_value_store[key];
    var opt = {
      type:'GM_setValue',
      value:__gm_value_store,
      namespace:SCRIPT_NAME_SPACE
    };
    sendRequest(opt);
  }
  function GM_listValues(){
    return Object.keys(__gm_value_store);
  }
  return {
    GM_getValue:GM_getValue,
    GM_setValue:GM_setValue,
    GM_registerMenuCommand:GM_registerMenuCommand,
    GM_deleteValue:GM_deleteValue,
    GM_listValues:GM_listValues
  };
}
get_manifest(function(manifest) {
  window.Manifest = manifest;
  Config.version = manifest.version;
  localStorage.Config = JSON.stringify(Config);
});
function get_manifest(callback) {
  var url = './manifest.json';
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    callback(JSON.parse(xhr.responseText));
  };
  xhr.open('GET',url,true);
  xhr.send(null);
}
function openOrFocusTab(uri){
  if(g.chrome) {
    chrome.windows.getAll({populate:true},function(windows){
      if (!windows.some(function(w){
        if(w.type === 'normal'){
          return w.tabs.some(function(t){
            if(t.url === H + uri){
              chrome.tabs.update(t.id, {'selected':true});
              return true;
            }
          });
        }
      })) {
        chrome.tabs.getSelected(null, function(t){
          chrome.tabs.create({'url':uri, 'selected':true, index:t.index+1});
        });
      }
    });
  } else if (g.safari) {
    if(!safari.application.browserWindows.some(function(w){
      return w.tabs.some(function(t){
        if(t.url.indexOf(H + uri) === 0){
          t.activate();
          return true;
        }
      });
    })) {
      safari.application.activeBrowserWindow.openTab().url = H + uri;
    }
  } else if(g.opera) {
    opera.extension.tabs.create({url:uri, focused:true});
  }
}
