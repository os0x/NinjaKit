var Inlinemode = false;
GM_xmlhttpRequest = function GM_xmlhttpRequest(opt) {
  if (Inlinemode) {
    var xhr = new XMLHttpRequest();
    var res = {
      status:0,
      statusText:'',
      readyState:0,
      responseText:'',
      responseHeaders:''
    };
    xhr.open(opt.method, opt.url, true);
    Object.keys(opt.headers).forEach(function(name, i, headers) {
      xhr.setRequestHeader(name, headers[name]);
    });
    if (opt.onload) {
      xhr.onload = function(){
        Object.keys(res).forEach(function(k){
          res[k] = xhr[k];
        });
        opt.onload(res);
      };
    }
    if (opt.onerror) {
      xhr.onerror = function() {
        Object.keys(res).forEach(function(k) {
          res[k] = xhr[k];
        });
        opt.onerror(res);
      };
    }
    if (opt.onreadystatechange) {
      xhr.onreadystatechange = function() {
        Object.keys(res).forEach(function(k) {
          res[k] = xhr[k];
        });
        opt.onreadystatechange(res);
      };
    }
    xhr.send(opt.data);
  } else {
    var _opt = {
      type: 'GM_xmlhttpRequest',
      url: opt.url,
      method: opt.method,
      headers: opt.headers || {},
      overrideMimeType: opt.overrideMimeType,
      data: opt.data,
      hasOnload: !!opt.onload,
      hasOnerror: !!opt.onerror,
      hasOnreadystatechange: !!opt.onreadystatechange
    };
    sendRequest(_opt, function(res) {
      if (res.state === 'load') {
        opt.onload(res.response);
      } else if (res.state === 'error') {
        opt.onerror(res.response);
      } else if (res.state === 'readystatechange') {
        opt.onreadystatechange(res.response);
      }
    });
  }
};
GM_getResourceURL = void 0;

/*
if (!Object.prototype.toSource) {
  Object.prototype.toSource = function __toSource(){
    return uneval(this);
  };
}
*/
function replacer(key, value) {
  if (this[key] instanceof Date) {
    return this[key].getTime();
  } else if (this[key] instanceof Function) {
    return this[key].toString();
  } else {
    return value;
  }
}
uneval = $uneval;
function _$uneval(obj,indent) {
  var history = [], r = [];
  if (indent) {
    indent = '\n\t'
  } else {
    indent = '';
  }
  function _uneval(obj) {
    var type = typeof obj;
    if (type === 'object' && obj) {
      var i;
      if (0 <= (i = history.indexOf(obj))) {
        r.push({index:i,object:obj});
        return '#' + i + '#';
      } else {
        history.push(obj);
        if (Array.isArray(obj)) {
          return '[' + indent + obj.map(function(v) {
            return _uneval(v);
          }).join(','+indent) + indent + ']';
        } else {
          var res = '{' + indent + Object.keys(obj).map(function(k) {
            return '"' + k + '":' + _uneval(obj[k]);
          }).join(','+indent) + indent +'}';
          var i;
          if (r.length && r.some(function(v){i=v.index;return v.object == obj;})) {
            return '#' + i + '=' + res;
          }
          return res;
        }
      }
    } else if (type === 'function') {
      return obj.toString();
    } else if (type  === 'undefined') {
      return void 0;
    } else {
      return JSON.stringify(obj,null,indent);
    }
  }
  return '(' + _uneval(obj) + ')';
}
function $uneval(obj,indent) {
  var r = [];
  function _uneval(obj, _indent, __indent) {
    var $indent = '';
    if (typeof _indent === 'string') {
      $indent = '\n' + _indent;
    } else if (isFinite(_indent)) {
      $indent = '\n' + new Array(_indent+1).join(' ');
    }
    if (typeof __indent === 'string') {
      __indent = '\n' + __indent;
    } else if (isFinite(__indent)) {
      __indent = '\n' + new Array(__indent+1).join(' ');
    }
    __indent || (__indent = '');
    var type = typeof obj;
    if (type === 'object' && obj) {
      if (Array.isArray(obj)) {
        return '[' + $indent + obj.map(function(v) {
          return _uneval(v, _indent + indent);
        }).join(','+$indent) + __indent + ']';
      } else {
        return '{' + $indent + Object.keys(obj).map(function(k) {
          return '"' + k + '":' + _uneval(obj[k], _indent+indent, _indent);
        }).join(',' + $indent) + __indent +'}';
      }
    } else if (type === 'function') {
      return obj.toString();
    } else if (type  === 'undefined') {
      return void 0;
    } else {
      return JSON.stringify(obj,null,indent);
    }
  }
  return '(' + _uneval(obj,indent) + ')';
}
if (Object.defineProperty && !Object.prototype.toSource) {
  Object.defineProperty(Object.prototype, 'toSource', {
    value : function(indent) {
      return uneval(this,indent);
    },
    writable : false,
    enumerable : false,
    configurable : false
  });
}
GM_addStyle = function GM_addStyle(css) {
  var style = document.createElement('style');
  style.className = 'greasestyle';
  style.textContent = css;
  document.head.appendChild(style);
};
GM_log = function GM_log(obj) {
  console.debug(obj);
};
'forEach map filter some every reduce reduceRight indexOf lastIndexOf'.split(' ').forEach(function(m) {
  Array[m] = function(a,f,t) {
    return Array.prototype[m].call(a,f,t);
  };
});
unsafeWindow=window;
globalStorage = {wrappedJSObject: {}};
globalStorage.wrappedJSObject[document.domain] = window.localStorage;
document.implementation.$createDocument = document.implementation.createDocument;
document.implementation.createDocument = function(namespaceURI, qualifiedName, doctype) {
  if (!namespaceURI && !doctype) {
    return document.implementation.createHTMLDocument('dummy title');
  } else {
    return document.implementation.$createDocument(namespaceURI, qualifiedName, doctype);
  }
};

var $createContextualFragment = window.Range.prototype.createContextualFragment;
window.Range.prototype.createContextualFragment = function(str){
  str = String(str).replace(/<script(?:[ \t\r\n][^>]*)?>[\S\s]*?<\/script[ \t\r\n]*>|<\/?(?:i?frame|html|script|object)(?:[ \t\r\n][^<>]*)?>/gi, ' ');
  return $createContextualFragment.call(this, str);
};
