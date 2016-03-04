A JavaScript library for generating <a href='http://en.wikipedia.org/wiki/Syntax_diagram'>railroad diagrams</a> like those used to describe languages' grammars.

The JavaScript library lets you define grammars using declarative-style calls:
```
  each('[',
    any('value', ','),
    ']')
```
to specify any number of comma separated values surrounded by square brackets.

See the example <a href='http://html-railroad-diagram.googlecode.com/svn/trunk/examples/railroad.html'>JSON grammar</a>.

To use this library, simply download and include (via `<script src=...></script>`) the <a href='http://html-railroad-diagram.googlecode.com/svn/trunk/src/railroad.js'>JavaScript library</a>.

`railroad.js` will not work in browsers that do not support the CSS3 <a href='http://www.w3.org/TR/2005/WD-css3-background-20050216/#the-border-radius'><code>border-top-left-radius</code></a> property.  Luckily, all recent (as of Nov. 2010) major browsers do so.