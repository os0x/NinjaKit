// 

// ==UserScript==
// @name      JSfile Highlighter for Opera
// @namespace http://misttrap.s101.xrea.com/
// ==/UserScript==

(function() {
/*
  // checking loosely whether this page is a JS file or not
  if (!(/\.js(?:onp?)?$/i.test(location.pathname) ||
    /^data:(?:text\/|application\/(?:x-)?)javascript[,;]/.test(location.href))) return;

  var body = document.body;
  if(!body) return;
  var pre  = body.firstChild;
  if(!pre || pre.nodeName.toLowerCase() != 'pre') return;
*/

  var Configure = {
    rotation : [2, 4, 0/* raw display */],
    index    : 1,
    tabkey   : 116, // "t" key
    wrapped  : false,
    wrapkey  : 119  // "w" key
  };

  var Styles = {
    color_background : '#fafafa',
    color_base       : '#000000',
    fontsize_base    : '15px',
    lineheight_base  : '1',
    fontfamily_base  : 'monospace',
    width_underline  : '1px',
    color_underline  : '#808080',
    color_keyword    : '#0000ff',
    color_objects    : '#ffa500',
    color_literal    : '#008000',
    color_comment    : '#ff0000'
  };


  window.JSHighlighter = function() {
    this.str  = null;
    this.txt  = null;
    this.len  = 0;
    this.i    = 0;
    this.pos  = 0;
    this.code = null;
    this.callback = this.getCallback();
  };

  JSHighlighter.prototype = {
    getText : function(str) {
      this.str  = new String(str.replace(/\r\n?/g, '\n'));
      this.txt  = this.str.split('');
      this.len  = this.str.length;
      this.i    = 0;
      this.pos  = 0;
      this.code = [];
      for (var txt = this.txt, len = this.len; this.i < len;) {
        var now = txt[this.i];
        if (now == "'" || now == '"') {
          this.setBaseText();
          this.string(now);
        } else if (now == '/') {
          this.setBaseText();
          var next = txt[++this.i];
          if (next == '/') {
            this.singleComment();
          } else if (next == '*') {
            this.multiComment();
          } else if (this.isRegExpCase()) {
            this.regExp();
          } else if (next == "'" || next == '"') {
            this.setBaseText();
            this.string(next);
          } else {
            this.i++;
          }
        } else {
          this.i++;
        }
      }
      // 全ての文字を読み終えた時点で解析できていない分の処理
      this.pos < len && this.setBaseText();
      return this.code.join('');
    },
    string : function(quo) {
      this.i++; // 開始引用符
      var str = this.str, len = this.len;
      while ((this.i = str.indexOf(quo, this.i) + 1 || len) < len && this.isEscaped());
      this.setExtraText('literal');
    },
    regExp : function() {
      var txt = this.txt, len = this.len, str = this.str;
      while (this.i < len) {
        var now = txt[this.i++];
        if (now == '[' && !this.isEscaped()) {
          while ((this.i = str.indexOf(']', this.i) + 1 || len) < len && this.isEscaped());
        } else if (now == '/' && !this.isEscaped()) {
          break;
        }
      }
      while (this.i < len && ~'gimy'.indexOf(txt[this.i])) this.i++;
      this.setExtraText('literal');
    },
    singleComment : function() {
      this.i = this.str.indexOf('\n', this.i) + 1 || this.len;
      this.setExtraText('comment');
    },
    multiComment : function() {
      var i = this.str.indexOf('*/', this.i + 1);
      this.i = i < 0 ? this.len : i + 2;
      this.setExtraText('comment');
    },
    // 除算演算子、あきらかな構文エラーに対してfalseを返す
    isRegExpCase : function() {
      var code = this.code, i = code.length;
      do {
        // 末尾の文字 (空白類以外)
        var reg = /^(?!<span class="comment">)([\s\S]*)(\S)/.exec(code[--i]);
        if(!reg) continue;
        // 記号タイプの演算子 ("&", "<", ">"の実体参照の";"を含む)
        switch (')-+*/%!~^|=?:;,[({}'.indexOf(reg[2])) {
          case  0 : return this.isExpression(i, reg[1]);
          // Expression不要でStatementの"{}"が省略可能な宣言 (var, constを除く)
          // キーワードタイプの演算子
          case -1 : return />(?:case|delete|do|else|instanceof|in|new|return|throw|typeof|void)<\/span>$/.test(reg[0]);
          default : return true;
        }
      } while (i);
      return true; // スクリプト冒頭の"/"
    },
    isExpression : function(i, buf) {
      for (var code = this.code, level = 1, reg; ; buf = code[--i]) {
        if (/^<span class="(?:literal|comment)">/.test(buf)) continue;
        while (reg = /^([\s\S]*)([()])/.exec(buf)) {
          buf = reg[1];
          if (reg[2] == ')') {
            level++;
          } else if (!--level) {
            return this.isDeclaration(i, buf);
          }
        }
        if (!i) return false; // "()"の入れ子が不整合
      }
    },
    isDeclaration : function(i, buf) {
      for (var code = this.code; ; buf = code[--i]) {
        if (/^(?!<span class="comment">)\s*\S/.test(buf)) {
          // Expression必須でStatementの"{}"が省略可能な宣言
          return />(?:for|if|while|with)<\/span>\s*$/.test(buf);
        }
        if (!i) return false; // スクリプト冒頭の"("
      }
    },
    // 現在の文字の直前に奇数個の"\"が存在していることを判定
    isEscaped : function() {
      for (var txt = this.txt, i = this.i - 2; txt[i] == '\\'; i--);
      return (this.i ^ i) & 1;
    },
    setExtraText : function(className) {
      this.code.push(
        this.str.substring(this.pos, this.pos = this.i).replace(
          // 空行及び空白のみ行以外で、両端の空白を取り除いた文字列にマッチ
          /\S(?:.*\S)?/g, '<span class="' + className + '">$&</span>'
        )
      );
    },
    setBaseText : function() {
      this.code.push(
        this.str.substring(this.pos, this.pos = this.i).replace(/[\w$]+/g, this.callback)
      );
    },
    getCallback : function() {
      var list = this.extend('keyword', 'objects', 'spValue');
      var func = Object.prototype.hasOwnProperty;
      return function(r0) {
        return func.call(list, r0) ? list[r0] : r0;
      };
    },
    // "単語 : 単語の属するクラス名"の対応表を作成
    extend : function() {
      for (var i = arguments.length, res = {}, val; i;)
        for (var key = arguments[--i], arr = this[key], j = arr.length; j;)
          res[val = arr[--j]] = '<span class="' + key + '">' + val + '</span>';
      return res;
    },
    keyword : [
      'arguments', 'break', 'case', 'catch', 'const',
      'continue', 'default', 'delete', 'do', 'else',
      'finally', 'for', 'function', 'if', 'instanceof',
      'in', 'new', 'return', 'switch', 'this',
      'throw', 'try', 'typeof', 'var', 'void',
      'while', 'with'
    ],
    objects : [
      'ActiveXObject', 'Array', 'Boolean', 'Date', 'Element',
      'Event', 'Function', 'Image', 'Math', 'Node',
      'Number', 'Object', 'Option', 'RegExp', 'String',
      'WScript', 'XMLHttpRequest', 'XPathEvaluator', 'XPathResult', 'document',
      'history', 'location', 'navigator', 'screen', 'undefined',
      'window'
    ],
    spValue : [
      'false', 'null', 'true'
    ]
  };


  window.TabChanger = function(args) {
    this.order = args.rotation;
    this.i     = args.index;
    this.key   = args.tabkey;
    this.width = 0;
    this.count = 0;
    this.spaces = this.createSpaces();
    this.xpText = document.createExpression('//span[@class="tabchar"]/text()', null);
    var r = this.evaluate(document);
    this.lists = r[0];
    this.times = r[1];
  };

  TabChanger.prototype = {
    setChars : function() {
      var chars = this.order[this.i], i = 0, len;
      if (chars > 0) {
        var lists = this.lists, times = this.times;
        for (len = lists.length; i < len; i++) {
          this.count = times[i];
          this.inspect(lists[i], chars);
        }
      } else {
        var tabs = this.xpText.evaluate(document, 7, null);
        for (len = tabs.snapshotLength; i < len; tabs.snapshotItem(i++).nodeValue = '\t');
      }
    },
    inspect : function(parent, chars) {
      var node = parent.firstChild;
      if (node) do {
        if (node.nodeType == 3) {
          this.width += this.getWidth(node.nodeValue);
        } else if (node.className == 'tabchar') {
          node.firstChild.nodeValue = this.spaces[chars - this.width % chars];
          this.width = 0;
          this.count--;
        } else {
          this.inspect(node, chars);
        }
      } while (this.count && (node = node.nextSibling));
    },
    getWidth : function(str) {
      for (var i = str.length, res = i, c; i;)
        (c = str.charCodeAt(--i)) > 0x7F                         &&
        (c < 0xD800 || (c > 0xDFFF && c < 0xFF61) || c > 0xFF9F) && res++;
      return res;
    },
    createSpaces : function() {
      var i = 0, max = Math.max.apply(Math, this.order), res = [''];
      while (i < max) res.push(res[i++] + ' ');
      return res;
    },
    evaluate : function(doc) {
      var lists = [], times = [];
      var items = doc.evaluate('//li[.//span[@class="tabchar"]]', doc, null, 7, null);
      var xpTab = doc.createExpression('count(.//span[@class="tabchar"])', null);
      for (var i = 0, len = items.snapshotLength; i < len;)
        times[i] = xpTab.evaluate(
          lists[i] = items.snapshotItem(i++), 1, null
        ).numberValue;
      return [lists, times];
    },
    initEvent : function() {
      //KeyBind.add(this.key, this);
    },
    handleEvent : function() {
      this.i = (this.i + 1) % this.order.length;
      this.setChars();
    }
  };


  window.WrapChanger = function(args) {
    this.wrap  = args.wrapped ? 1 : 0;
    this.key   = args.wrapkey;
    this.style = this.getStyle();
  };

  WrapChanger.prototype = {
    getStyle : function() {
      var rules = document.styleSheets[0].cssRules, i = rules.length;
      while (i) {
        var rule = rules[--i];
        if (rule.selectorText.toLowerCase() == 'li') {
          return rule.style;
        }
      }
    },
    initEvent : function() {
      KeyBind.add(this.key, this);
    },
    handleEvent : function() {
      this.style.whiteSpace = this.propValues[this.wrap ^= 1];
    },
    propValues : ['pre', 'pre-wrap']
  };

/*
  var KeyBind = {
    initialize : function() {
      document.addEventListener('keypress', this, false);
    },
    handleEvent : function(evt) {
      if (/^(?:input|textarea)$/i.test(evt.target.localName)) return;
      var listeners = this['key_' + evt.which];
      if (listeners) {
        listeners.forEach(this.execute, evt);
        evt.preventDefault();
      }
    },
    execute : function(listener) {
      if (typeof listener == 'function')
        listener.call(this.currentTarget, this);
      else if (typeof listener.handleEvent == 'function')
        listener.handleEvent(this);
    },
    add : function(key, listener) {
      if (listener && /function|object/.test(typeof listener)) {
        var listeners = this[key = 'key_' + key] || (this[key] = []);
        listeners.indexOf(listener) == -1 && listeners.push(listener);
      }
    },
    remove : function(key, listener) {
      var listners = this['key_' + key];
      if (listners) {
        var i = listners.indexOf(listener);
        i >= 0 && listners.splice(i, 1);
      }
    }
  };

  KeyBind.initialize();
*/
  var escapeTags = {
    "<":"&lt;",
    ">":"&gt;",
    "&":"&amp;",
    //"\n":"<br>"
  };
  JSHighlighter.exec = function(source,node){
    var TAB_MARK = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 11" width="8px" height="11px">' +
        '<polyline points="0 0, 8 5.5, 0 11" stroke="#bbbbbb" stroke-width="0.5" fill="none"/>' +
      '</svg>'
    );
    var markerWidth = (source.split(/\r\n?|\n/g).length + '. ').length;
    var css = [
      'div.line{',
        'margin:0;',
        'padding:0;',
        'outline-bottom:' + Styles.width_underline + ' solid transparent;',
      '}',
      'div.line:hover{',
        'outline-bottom-color:' + Styles.color_underline + ';',
      '}',
      'div.line::empty{',
        'content:" ";',
        //'display:block;',
        'white-space:pre;',
      '}',
      '.keyword{',
        'color:' + Styles.color_keyword + ';',
      '}',
      '.objects{',
        'color:' + Styles.color_objects + ';',
      '}',
      '.literal,.spValue{',
        'color:' + Styles.color_literal + ';',
      '}',
      '.comment{',
        'color:' + Styles.color_comment + ';',
      '}',
      '.tabchar{',
        'background:rgba(255,255,255,0.5) url("' + TAB_MARK + '") no-repeat scroll 0 50%;',
        'display:inline-block;',
        //'width:2em;',
        'overflow:hidden;',
      '}',
    ].join('');
    var tc = new TabChanger(Configure);
    var jh = new JSHighlighter();
    var style = document.createElement('style');
    style.id = 'jshighlighter';
    style.textContent = css;
    document.head.appendChild(style);
    //new WrapChanger(Configure).initEvent();
    var htexts;
    JSHighlighter.exec = function(source,node){
      htexts = jh.getText(source.replace(/[<>&]/g,function($){return escapeTags[$];})).
        /*replace(/\t/g, '<span class="tabchar">\t</span>').*/ split('\n');
      node.innerHTML = '<div class="line">' + htexts.join('</div><div class="line">') + '</div>';
      tc.setChars();
    };
    JSHighlighter.patch = function(source,node){
      var _htexts = jh.getText(source.replace(/[<>&]/g,function($){return escapeTags[$];})).
        /*replace(/\t/g, '<span class="tabchar">\t</span>').*/ split('\n');
      var diff = new Diff(_htexts.slice(),htexts.slice());
      var ADD = 1, DEL = -1;
      if (diff.reverse) {
        var t = diff.a;
        diff.a = diff.b;
        diff.b = t;
        ADD = -1;
        DEL = 1
      }
      var deled = 0;
      var added = 0;
      var difs = 0;
      diff.lcs.forEach(function(flag,index){
        if (index === 0) return;
        if (flag === ADD) {
          var line = document.createElement('div');
          line.className = 'line';
          line.innerHTML = diff.b[index - added];
          node.insertBefore(line, node.children[index- added -2]);
          difs = 1;
        } else if (flag === DEL) {
          var _index = index - 2 + deled--;
          added++;
          node.removeChild(node.children[_index]);
          difs = -1;
        } else if (difs){
          if (difs === -1) {
            added += 1;
          } else {
            deled += 1;
          }
          difs = 0;
        }
      });
      htexts = _htexts;
      tc.setChars();
      //tc.initEvent();
    };
    return JSHighlighter.exec(source,node);
  };
})();