var g = this;
var BG, userjs_installer, Scripts, Config;
if (g.chrome){
  BG = g.chrome && chrome.extension.getBackgroundPage();
  userjs_installer = BG.userjs_installer;
  Scripts = BG.Scripts;
  Config = BG.Config;
  init();
} else if (g.safari){
  BG = {
    Manifest:{/*version:0.1*/},
    set Scripts(scripts) {
      safari.self.tab.dispatchMessage('options', {action:'save', scripts:scripts});
    }
  };
  //Scripts = JSON.parse(localStorage.Scripts);
  Config = JSON.parse(localStorage.Config);
  userjs_installer = function(jscode, src, original){
    safari.self.tab.dispatchMessage('options',{action:'install', args:[jscode, src, original]});
  };
  var x = new XMLHttpRequest();
  x.open('GET','Info.plist',false);
  x.send();
  var xml = new DOMParser().parseFromString(x.responseText, 'application/xml');
  var strings = $X('//string[preceding-sibling::key[text()="CFBundleShortVersionString"]]',xml);
  if(strings && strings.length){
    BG.Manifest.version = strings[0].textContent;
  }
  safari.self.addEventListener('message',function(evt){
    if(evt.name === 'get_script_callback'){
      Scripts = evt.message;
      init();
    }
  },false);
  safari.self.tab.dispatchMessage('options', {action:'get_script'});
} else if (g.opera){
  BG = opera.extension.bgProcess;
  userjs_installer = BG.userjs_installer;
  Scripts = BG.Scripts;
  Config = BG.Config;
  init();
}

function init(){
  $X('//section/p/input[@type="radio"]').forEach(function(box){
    var name = box.name;
    var val = Config[name];
    if (val === Number(box.value)) {
      box.checked = true;
    }
    box.addEventListener('click',function(){
      Config[name] = Number(box.value);
      localStorage.Config = JSON.stringify(Config);
    },false);
  });
  var currentFontSize = +Config.options.fontSize || 12;
  var fontSize = document.getElementById('fontSize');
  var _currentFontSize = document.getElementById('currentFontSize');
  _currentFontSize.textContent = (fontSize.value = currentFontSize)+'px';
  fontSize.onchange = function(){
    _currentFontSize.textContent = (currentFontSize = fontSize.value)+'px';
    Config.options.fontSize = currentFontSize;
    addcss('#edit-area,#edit-bg{font-size:'+ currentFontSize +'px;}');
  };
  addcss('#edit-area,#edit-bg{font-size:'+ currentFontSize +'px;}');


  var currentFont = Config.options.font;
  addcss('#edit-area,#edit-bg{font-family:"'+ currentFont +'";}');
  var getFont = document.getElementById('getFont');
  getFont.onclick = function(){
    var iframe = document.createElement('iframe');
    iframe.setAttribute('style','height:1px;width:1px;');
    iframe.src = 'http://ss-o.net/test/as/font.html';
    window.addEventListener('message',function(evt){
      if (evt.origin === 'http://ss-o.net') {
        window.removeEventListener('message',arguments,false);
        document.body.removeChild(iframe);
        var fonts = [{name:'monospace'}].concat(evt.data).map(function(f){return f.name;});
        localStorage.fontslist = JSON.stringify(fonts);
        FontList();
      }
    },false);
    document.body.appendChild(iframe);
  };
  var FontSelect;
  function FontList(){
    var fonts = JSON.parse(localStorage.fontslist);
    if (FontSelect) {
      FontSelect.parentNode.removeChild(FontSelect);
    }
    FontSelect = document.createElement('select');
    fonts.forEach(function(font){
      var opt = document.createElement('option');
      opt.textContent = font;
      if (currentFont === font) {
        opt.selected = true;
      }
      FontSelect.appendChild(opt);
    });
    FontSelect.onchange = function(){
      Config.options.font = currentFont = FontSelect.value;
      addcss('#edit-area,#edit-bg{font-family:"'+ currentFont +'";}');
      setTimeout(fit, 0);
    };
    getFont.parentNode.appendChild(FontSelect);
  }
  if (localStorage.fontslist) {
    FontList();
  }

  var currentTabSize = +Config.options.tabSize || 1;
  var tabSize = document.getElementById('tabsize');
  tabSize.value = currentTabSize;
  tabSize.onclick = function() {
    Config.options.tabSize = tabSize.value;
    localStorage.Config = JSON.stringify(Config);
  };

  var currentBracesOnNewLine = Config.options.bracesOnNewLine === undefined ? true : Config.options.bracesOnNewLine;
  var bracesOnNewLine = document.getElementById('braces-on-own-line');
  bracesOnNewLine.checked = currentBracesOnNewLine ? true : false;
  bracesOnNewLine.onclick = function() {
    Config.options.bracesOnNewLine = bracesOnNewLine.checked;
    localStorage.Config = JSON.stringify(Config);
  }

  var add = document.getElementById('add_script');
  var add_script = function(){
    var styl = {
      name:'',
      includes:[],
      excludes:[],
      source:'// ==UserScript==\n'+
             '// @name           \n'+
             '// @namespace      \n'+
             '// @include        \n'+
             '// ==/UserScript==\n'
    };
    var button = create_script_list(styl);
    while(right_box.firstChild) right_box.removeChild(right_box.firstChild);
    create_script_form(styl, undefined, button);
  };
  add.addEventListener('click', add_script,false);
  var root = document.documentElement;
  var left_box = document.getElementById('left_box');
  var right_box = document.getElementById('right_box');
  right_box.style.width = (root.clientWidth - 240) + 'px';
  right_box = right_box.firstChild;
  var script_list = document.getElementById('script_list');
  var Dup = {};
  Scripts.forEach(create_script_list);
  function create_script_list(styl,index){
    var button;
    var li = document.createElement('li');
    button = document.createElement('button');
    button.textContent = styl.name;
    button.id = 'button_' + styl.name.replace(/\W/g,'-');
    button.addEventListener('click', create,false);
    function create(){
      while(right_box.firstChild) right_box.removeChild(right_box.firstChild);
      create_script_form(styl, index, button);
      window.name = button.id;
    }
    li.appendChild(button);
    script_list.appendChild(li);
    if (window.name == button.id || location.search === '?script=' + button.id){
      create();
    }
    return button;
  }
  function create_script_form(styl, index, button, notitle){
    var field = document.createElement('fieldset');
    var wrap = document.createElement('div');
    bg = document.createElement('div');
    area = document.createElement('textarea');
    wrap.id = 'edit-wrap';
    bg.id = 'edit-bg';
    area.id = 'edit-area';
    var lines = styl.source.match(/\n/g).length + 1;
    field.appendChild(wrap);
    wrap.appendChild(bg);
    wrap.appendChild(area);
    var out = document.createElement('ul');
    out.className = 'output';
    field.appendChild(out);
    var lint = document.createElement('button');
    lint.textContent = 'JSLint';
    lint.addEventListener('click',function(){
      var result = JSLINT(area.value);
      out.innerHTML = '';
      if (!result && JSLINT.errors.length){
        JSLINT.errors.forEach(function (e) {
          if (e) {
            var list = document.createElement('li');
            var a = document.createElement('a');
            a.onclick = function(){
              bg.children[e.line-1].scrollIntoView(true);
              area.onscroll();
            };
            a.textContent = e.line;
            list.appendChild(a);
            list.appendChild(document.createTextNode(':' + e.character + ': ' + e.reason));
            out.appendChild(list);
          }
        });
      }
    },false);
    field.appendChild(lint);
    var timer = null;
    area.addEventListener('input',function(){
      JSHighlighter.patch(area.value, bg);
      fit();
    },false);
    area.addEventListener('keydown',function(e){
      var key = get_key(e);
      if (key === 'Tab') {
        document.execCommand('inserthtml',false,'<span class="tabchar">  </span>');
        e.preventDefault();
      }
    },false);
    //field.appendChild(highlight);
    var beautifier = document.createElement('button');
    beautifier.textContent = 'beautifier';
    beautifier.addEventListener('click',function(){
      var source = do_js_beautify(area.value);
      JSHighlighter.exec(source, bg);
      area.value = source;
      fit();
    },false);
    field.appendChild(beautifier);
    var save = document.createElement('button');
    save.textContent = 'Save';
    save.addEventListener('click',function(){
      userjs_installer(area.value, styl.src, styl.original);
      styl.source = area.value;
      message.textContent = 'Saved!';
      setTimeout(function(){message.textContent='';},3000);

    },false);
    field.appendChild(save);
    var message = document.createElement('span');
    field.appendChild(message);
    right_box.appendChild(field);
    var deleteAll = document.createElement('button');
    deleteAll.textContent = 'delete this script';
    deleteAll.className = 'top';
    deleteAll.addEventListener('click',function(){
      if (confirm('Are sure you want to delete this script? There is NO undo!')) {
        var src = styl.src;
        var id = styl.id;
        Scripts = Scripts.filter(function(_sty,i){
          if (_sty.id === id) {
            _sty.src && BG.delete_file && BG.delete_file(_sty);
            styl.deleted = true;
            return false;
          } else {
            return true;
          }
        });
        localStorage.Scripts = JSON.stringify(Scripts);
        BG.Scripts = Scripts;
        var li = $X('parent::li[parent::ul]', button)[0];
        if (li && li.parentNode) {
          li.parentNode.removeChild(li);
        }
        while(right_box.firstChild) right_box.removeChild(right_box.firstChild);
      }
    },false);
    field.appendChild(document.createElement('br'));
    if (styl.original) {
      var _source = document.createElement('button');
      _source.className = 'top';
      _source.addEventListener('click',function(){
        g.chrome && chrome.tabs.create({url:styl.original});
        g.safari && window.open(styl.original, '_blank');// (safari.self.activeBrowserWindow.openTab().url = styl.original);
      },false);
      _source.textContent = 'installed site';
      field.appendChild(_source);
    }
    var disable = document.createElement('button');
    disable.className = 'top';
    disable.addEventListener('click',function(){
      Array.prototype.slice.call(right_box.querySelectorAll('input,select,textarea,button:not(.top)')).forEach(function(f){
        f.disabled = !styl.disabled;
      });
      styl.disabled = !styl.disabled;
      right_box.querySelector('fieldset').className = styl.disabled ? 'disabled': 'enable';
      localStorage.Scripts = JSON.stringify(Scripts);
      BG.Scripts = Scripts;
      disable.textContent = styl.disabled ? 'enable' : 'disable';
    },false);
    disable.textContent = styl.disabled ? 'enable' : 'disable';
    right_box.querySelector('fieldset').className = styl.disabled ? 'disabled': 'enable';
    field.appendChild(disable);
    field.appendChild(deleteAll);
    Array.prototype.slice.call(right_box.querySelectorAll('input,select,textarea,button:not(.top)')).forEach(function(f){
      f.disabled = styl.disabled;
    });
    area.value = styl.source;
    JSHighlighter.exec(styl.source, bg);
    wrap.style.height = root.clientHeight - 140 + 'px';
    wrap.style.width = root.clientWidth - 280 + 'px';
    setTimeout(fit, 0);
    window.onresize = function(){
      right_box.parentNode.style.width = (root.clientWidth - 240) + 'px';
      wrap.style.height = root.clientHeight - 140 + 'px';
      wrap.style.width = root.clientWidth - 280 + 'px';
      fit();
    };
  }
  function fit() {
    if (area) {
      area.style.width = (bg.scrollWidth - 40) + 'px';
      area.style.height = (bg.scrollHeight + 100) + 'px';
    }
  }

    function clone(o){
    return JSON.parse(JSON.stringify(o));
  }
  function addcss(css){
    var sheet = document.styleSheets[document.styleSheets.length-1];
    sheet.insertRule(css, sheet.cssRules.length);
  }
  function do_js_beautify(src) {
    var indent_size = document.getElementById('tabsize').value;
    var indent_char = ' ';
    var preserve_newlines = document.getElementById('preserve-newlines').checked;
    var keep_array_indentation = document.getElementById('keep-array-indentation').checked;
    var braces_on_own_line = !document.getElementById('braces-on-own-line').checked;
    if (indent_size == 1) {
      indent_char = '\t';
    }
    return js_beautify(unpacker_filter(src), {
      indent_size: indent_size,
      indent_char: indent_char,
      preserve_newlines: preserve_newlines,
      braces_on_own_line: braces_on_own_line,
      keep_array_indentation: keep_array_indentation,
      space_after_anon_function: true
    });
  }
  function unpacker_filter(source) {
    if (document.getElementById('detect-packers').checked) {
      var stripped_source = trim_leading_comments(source);
      var unpacked = '';
      if (P_A_C_K_E_R.detect(stripped_source)) {
        unpacked = P_A_C_K_E_R.unpack(stripped_source);
        if (unpacked !== stripped_source) {
          return unpacker_filter(unpacked);
        }
      }
      if (EscapedBookmarklet.detect(source)) {
        unpacked = EscapedBookmarklet.unpack(source);
        if (unpacked !== stripped_source) {
          return unpacker_filter(unpacked);
        }
      }
      if (JavascriptObfuscator.detect(stripped_source)) {
        unpacked = JavascriptObfuscator.unpack(stripped_source);
        if (unpacked !== stripped_source) {
          return unpacker_filter(unpacked);
        }
      }
    }
    return source;
  }
  function trim_leading_comments(str){
    // very basic. doesn't support /* ... */
    str = str.replace(/^(\s*\/\/[^\n]*\n)+/, '');
    str = str.replace(/^\s+/, '');
    return str;
  }

  document.getElementById('ExtensionVersion').textContent = BG.Manifest.version;

  var sections = $X('/html/body/div/div/section[contains(@class, "content")]');
  document.getElementById('container').style.marginTop = '-2px';
  var btns = $X('id("menu_tabs")/li/a');
  var default_title = document.title;
  btns.forEach(function(btn, next, btns){
    btn.addEventListener('click',function(evt){
      evt.preventDefault();
      var prev;
      btns.forEach(function(_btn, i){
        if (_btn.className === 'active') {
          _btn.className = '';
          prev = i;
        }
        if (_btn === btn) {
          _btn.className = 'active';
        }
      });
      if (prev > next){
        previn(prev, next);
      } else {
        nextin(prev, next);
      }
      document.title = default_title + btn.hash;
      location.hash = btn.hash;
      window.scrollBy(0, -1000);
    }, false);
  });
  function nextin(prev, next){
    sections[prev].className = 'left content';
    sections[next].className = 'active content';
  }
  function previn(prev, next){
    sections[prev].className = 'right content';
    sections[next].className = 'active content';
  }
  var hit = false;
  sections.forEach(function(section, i){
    if (('#' + section.id === location.hash) || (i === 0 && !location.hash)) {
      btns.forEach(function(btn){btn.className = '';})
      btns[i].className = 'active';
      section.className = 'active content';
      document.title = default_title + location.hash;
      hit = true;
    } else {
      section.className = hit ? 'right content' : 'left content';
    }
  });
}
