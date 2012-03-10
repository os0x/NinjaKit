// XPath 式中の接頭辞のない名前テストに接頭辞 prefix を追加する
// e.g. '//body[@class = "foo"]/p' -> '//prefix:body[@class = "foo"]/prefix:p'
// http://nanto.asablo.jp/blog/2008/12/11/4003371
function addDefaultPrefix(xpath, prefix) {
  var tokenPattern = /([A-Za-z_\u00c0-\ufffd][\w\-.\u00b7-\ufffd]*|\*)\s*(::?|\()?|(".*?"|'.*?'|\d+(?:\.\d*)?|\.(?:\.|\d+)?|[\)\]])|(\/\/?|!=|[<>]=?|[\(\[|,=+-])|([@$])/g;
  var TERM = 1, OPERATOR = 2, MODIFIER = 3;
  var tokenType = OPERATOR;
  prefix += ':';
  function replacer(token, identifier, suffix, term, operator, modifier) {
    if (suffix) {
      tokenType = 
        (suffix == ':' || (suffix == '::' && (identifier == 'attribute' || identifier == 'namespace')))
        ? MODIFIER : OPERATOR;
    } else if (identifier) {
      if (tokenType == OPERATOR && identifier != '*')
        token = prefix + token;
      tokenType = (tokenType == TERM) ? OPERATOR : TERM;
    } else {
      tokenType = term ? TERM : operator ? OPERATOR : MODIFIER;
    }
    return token;
  }
  return xpath.replace(tokenPattern, replacer);
}

// $X on XHTML
// $X(exp);
// $X(exp, context);
// @target Freifox3, Chrome3, Safari4, Opera10
// @source http://gist.github.com/184276.txt
function $X (exp, context) {
  context || (context = document);
  var _document  = context.ownerDocument || document,
  documentElement = _document.documentElement;
  var isXHTML = documentElement.tagName !== 'HTML' && _document.createElement('p').tagName === 'p';
  var defaultPrefix = null;
  if (isXHTML) {
    defaultPrefix = '__default__';
    exp = addDefaultPrefix(exp, defaultPrefix);
  }
  function resolver (prefix) {
    return context.lookupNamespaceURI(prefix === defaultPrefix ? null : prefix) ||
         documentElement.namespaceURI || '';
  }

  var result = _document.evaluate(exp, context, resolver, XPathResult.ANY_TYPE, null);
    switch (result.resultType) {
      case XPathResult.STRING_TYPE : return result.stringValue;
      case XPathResult.NUMBER_TYPE : return result.numberValue;
      case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
      case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
        // not ensure the order.
        var ret = [], i = null;
        while (i = result.iterateNext()) ret.push(i);
        return ret;
    }
  return null;
}
