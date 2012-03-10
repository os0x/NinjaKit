var getScripts = '(' + function getScripts(){
  if (window.greasedChrome) {
    chrome.extension.sendRequest({
      type:'getScripts',
      gc:greasedChrome,
      url:location.href,
      host:location.host,
      title:document.title,
      frame:top!==self
    } , function(r){
      greasedChrome.commands.some(function(c){
        if(c.ns === r.ns){
          var evt = document.createEvent('Event');
          evt.initEvent(c.caption+'.'+c.key,false,false);
          document.dispatchEvent(evt);
          return true;
        }
      })
    });
  }
} + ')();';
chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
  var gc = request.gc;
  if (request.type === 'getScripts') {
    var scripts = document.getElementById('scripts');
    if (!request.gc.codes.length) return;
    var li = document.createElement('li');
    li.className = 'title' + (request.frame?' frame':'');
    li.textContent = (request.frame?'frame:':'') + request.host;
    scripts.appendChild(li);
    if (request.frame){
      var visible = false;
      li.onclick = function(){
        visible = !visible;
        list.style.display = visible ? 'block' : 'none';
      }
    }
    var list = document.createElement('ul');
    li.appendChild(list);
    request.gc.codes.forEach(function(code){
      if (code.name) {
        var li = document.createElement('li');
        li.className = 'script';
        var button = document.createElement('button');
        button.textContent = code.name;
        button.onmousedown = function(evt){
          if (evt.button === 2) {
            var id = 'button_' + code.name.replace(/\W/g,'-');
            chrome.tabs.create({url:'options_page.html?script=' + id + '#scripts',selected:false});
          }
        };
        li.appendChild(button);
        gc.commands.forEach(function(c){
          if (c.ns === code.ns){
            li.appendChild(document.createTextNode('Action: '));
            var button = document.createElement('button');
            button.textContent = code.name + ' - ' + c.caption;
            button.className = 'command';
            button.onclick = function(){
              sendResponse(c);
            };
            li.appendChild(button);
          }
        });
        list.appendChild(li);
      }
    });
  }
});
chrome.tabs.executeScript(null,{code:getScripts,allFrames:true});
