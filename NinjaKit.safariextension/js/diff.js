// http://ido.nu/kuma/2007/10/01/diff-onp-javascript-implementation/
/*
Copyright (c) 2007, KUMAGAI Kentaro

   Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of this project nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function Diff(B, A) {
  this.path = {};
  if ( A.length <= B.length ) {
    this.a = A;
    this.b = B;
  } else {
    this.a = B;
    this.b = A;
    this.reverse = true;
  }
  // push dummy.
  this.a.unshift(null);
  this.b.unshift(null);
  this.a.unshift(null);
  this.b.unshift(null);
  this.fp = {};
  this.lcs = this.onp();
}
Diff.prototype.getM = function () { return this.a.length - 1; };
Diff.prototype.getN = function () { return this.b.length - 1; };
Diff.prototype.onp = function () {
  var M = this.getM();
  var N = this.getN();

  var delta = N - M;
  var p = 0;
  do {
    for (var k = -p ; k <= delta - 1 ; k++) {
      var y = this.snake(k);
      this.fp[k] = y;
    }
    for (var k = delta + p ; k >= delta + 1 ; k--) {
      var y = this.snake(k);
      this.fp[k] = y;
    }
    /////// k = delta
    var k = delta;
    var y = this.snake(k);
    this.fp[k] = y;
    p++;
  } while ( this.fp[delta] != N );
  return this.path[delta];
};
Diff.prototype.snake = function(k) {
  var i = ( this.fp[k - 1] || -1 ) + 1;
  var j = this.fp[k + 1] || -1;

  var v;
  if ( i > j ) {
    if ( this.path[k - 1] )
      this.path[k] = this.path[k - 1].slice(0);
    v = 1;
  } else {
    if ( this.path[k + 1] )
      this.path[k] = this.path[k + 1].slice(0);
    v = -1;
  }
  if ( ! this.path[k] )
    this.path[k] = [];
  this.path[k].push(v);
  var y = Math.max(i, j);
  var x = y - k;
  while (
    ( x < this.getM()  &&  y < this.getN() ) &&
    this.compare( this.a[x+1], this.b[y+1] )
  ) {
    x++;
    y++;
    this.path[k].push(0);
  }
  return y;
};
Diff.prototype.compare = function (a, b) {
  return a == b;
};


// UnifiedDiff class; added by ucnv
// http://gist.github.com/105908
function UnifiedDiff(B, A, l) {
  this.diff = new Diff(B.split(/\r?\n/), A.split(/\r?\n/));
  this.lines = new Array();
  
  var a = (this.diff.reverse) ? this.diff.b : this.diff.a;
  var b = (this.diff.reverse) ? this.diff.a : this.diff.b;
  var r = (this.diff.reverse) ? function(e) { return e * -1 } : function(e) { return e };
  var lcs = this.diff.lcs;
  a.shift();
  b.shift();
  lcs.shift();
  var marks = new Array(lcs.length);
  for(var i = 1, p = false, n; i < marks.length; i++) {
    n = lcs[i];
    if(n != 0) {
      if(!p) {
        for(var j = 0; j <= l; j++) {
          if(i - j >= 0 && !marks[i - j]) marks[i - j] = ' ';
        }
      }
      marks[i] = (r(n) > 0) ? '-' : '+';
    } else {
      if(p) { 
        for(var j = 0; j < l; j++) {
          if(i + j < marks.length) marks[i + j] = ' ';
        }
      }
    }
    p = (n != 0);
  }
  
  marks.push('');
  for(var i = 1, printing = false, ap = 1, bp = 1, ac = 0, bc = 0, sp, m; i < marks.length; i++) {
    m = marks[i];
    if(!m) {
      if(printing && sp >= 0) {
        this.lines[sp] = this.lines[sp].replace(/\$ac/, ac).replace(/\$bc/, bc).replace(/\,1 /, '');
      }
      printing = false;
      ac = bc = 0;
      ap++;
      bp++;
      continue;
    }
    if(!printing) {
      sp = this.lines.length;
      this.lines.push('@@ -' + bp + ',$bc +' + ap + ',$ac @@');
      printing = true;
    }
    if(m == ' ') {
      this.lines.push(m + a[ap++]);
      bp++;
      ac++;
      bc++;
    } else if(m == '-') {
      this.lines.push(m + b[bp++]);
      bc++;
    } else if(m == '+') {
      this.lines.push(m + a[ap++]);
      ac++;
    }
  }
}

UnifiedDiff.prototype.toString = function() {
  return this.lines.join('\n') + '\n';
};
