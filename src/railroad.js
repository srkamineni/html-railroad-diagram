/**
 * @fileoverview
 * Provides constructors and renderers for a railroad diagram.
 *
 * @author Mike Samuel <mikesamuel@gmail.com>
 */

var railroad = (function () {

/**
 * Converts its input to a railroad node.
 * Strings are interpreted as HTML, and railroad nodes are returned unchanged.
 */
function toNode(content) {
  if (typeof content === 'string') {
    return { op: 'html', content: content };
  } else if (typeof content === 'object' && typeof content.op === 'string') {
    return content;
  }
  throw new Error(content);
}

/**
 * Like <kbd>|</kbd> in EBNF, a railroad node representing a branch.
 */
function or(var_args) {
  var options = [];
  var alreadySeen = {};
  function addOption(child) {
    switch (child.op) {
      case '|':
        for (var i = 0, n = child.children.length; i < n; ++i) {
          addOption(child.children[i]);
        }
        break;
      case 'html':
        if (alreadySeen[child.content] !== alreadySeen) {
          alreadySeen[child.content] = alreadySeen;
          options.push(child);
        }
        break;
      default:
        options.push(toNode(child));
        break;
    }
  }
  for (var i = 0, n = arguments.length; i < n; ++i) {
    addOption(arguments[i]);
  }
  if (options.length == 1) {
    return options[0];
  }
  return { op: '|', children: options };
}

/**
 * Like <kbd>?</kbd> in EBNF, a railroad node that either follows its child or
 * an empty branch.
 */
function maybe(child) {
  return or(toNode('\u25b6'), toNode(child));
}

/**
 * Like <kbd>*</kbd> in EBNF, a railroad node that repeats its child any number
 * of times.
 */
function any(child) {
  return maybe(many(child));
}

/**
 * Like <kbd>+</kbd> in EBNF, a railroad node that passes through its child and
 * then repeats any number of times.
 */
function many(child) {
  return { op: '+', children: [child] };
}

/**
 * A railroad node that passes through each of its children once in order.
 */
function each(var_args) {
  var items = [];
  function addItem(item) {
    if (item.op === '.') {
      for (var i = 0, n = item.children.length; i < n; ++i) {
        addItem(item.children[i]);
      }
    } else {
      items.push(toNode(item));
    }
  }
  for (var i = 0, n = arguments.length; i < n; ++i) {
    addItem(arguments[i]);
  }
  if (items.length === 1) {
    return items[0];
  }
  return { op: '.', children: items };
}


/**
 * Attaches an HTML DOM node representing the given node to parent.
 *
 * @param node A railroad node as produced by {@link each}, {@link any}, ....
 * @param {HTMLElement} parent The DOM parent of the created node.
 *     This must be part of the visible DOM so that the browser computes width
 *     and height for the node as we build it.
 * @param {Object} opt_stats An output object that receives computed layout
 *     statistics such as width and height.
 */
function appendToDOM(node, parent, opt_stats) {
  var document = parent.ownerDocument;

  node = toNode(node);

  var div = document.createElement('DIV');
  div.style.display = 'inline-block';
  div.style.position = 'absolute';
  parent.appendChild(div);
  if (node.op === 'html') {
    div.innerHTML = node.content;
    if (node.content === '\u25b6') {
      div.style.fontSize = div.style.height = '8px';
    }
    if (opt_stats) {
      opt_stats.width = div.offesetWidth;
      opt_stats.height = div.offesetHeight;
    }
    return div;
  }

  var children = [];
  var n = node.children.length;
  for (var i = 0; i < n; ++i) {
    children[i] = appendToDOM(node.children[i], div);
  }

  function renderArrowhead(arrowheadText, parent) {
    var arrowhead = document.createElement('SPAN');
    parent.appendChild(arrowhead);
    arrowhead.appendChild(document.createTextNode(arrowheadText));
    arrowhead.style.position = 'absolute';
    arrowhead.style.display = 'inline-block';
    arrowhead.style.left = '0px';
    arrowhead.style.top = '-5px';
    arrowhead.style.width = '100%';
    arrowhead.style.height = '8px';
    arrowhead.style.fontSize = '8px';
    arrowhead.style.textAlign = 'center';
    arrowhead.style.verticalAlign = 'middle';
  }

  function rightArrow(x, width, y, height, junctionX) {
    if (!height) {
      var span = document.createElement('SPAN');
      span.style.position = 'absolute';
      span.style.left = x + 'px';
      span.style.width = width + 'px';
      span.style.top = y + 'px';
      span.style.height = '1px';
      span.style.background = '#000';
      div.appendChild(span);
    } else {
      if (junctionX === void 0) { junctionX = x + (width >> 1); }

      var halfHeight = (Math.abs(height) + 1) >> 1;

      var left = document.createElement('SPAN');
      left.style.position = 'absolute';
      left.style.left = x + 'px';
      left.style.width = (junctionX - x) + 'px';
      if (height > 0) {
        left.style.top = y + 'px';
        left.style.height = halfHeight + 'px';
        left.style.borderTop = '1px solid black';
        left.style.borderTopRightRadius = '6px';
      } else {
        left.style.top = (y - halfHeight) + 'px';
        left.style.height = halfHeight + 'px';
        left.style.borderBottom = '1px solid black';
        left.style.borderBottomRightRadius = '6px';
      }
      left.style.borderRight = '1px solid black';
      div.appendChild(left);

      var right = document.createElement('SPAN');
      right.style.position = 'absolute';
      right.style.left = (junctionX) + 'px';
      right.style.width = (x + width - junctionX) + 'px';
      if (height > 0) {
        right.style.top = (y + halfHeight) + 'px';
        right.style.height = (height - halfHeight) + 'px';
        right.style.borderBottom = '1px solid black';
        right.style.borderBottomLeftRadius = '6px';
      } else {
        right.style.top = (y + height) + 'px';
        right.style.height = halfHeight + 'px';
        right.style.borderTop = '1px solid black';
        right.style.borderTopLeftRadius = '6px';
      }
      right.style.borderLeft = '1px solid black';
      div.appendChild(right);
    }
  }

  var width = 0, height = 0;
  switch (node.op) {
    case '|':
      for (var i = 0; i < n; ++i) {
        var child = children[i];
        width = Math.max(width, 32 + child.offsetWidth);
      }
      var childYCenters = [];
      var leftXs = [];
      var rightXs = [];
      for (var i = 0; i < n; ++i) {
        if (i) { height += 16; }
        var child = children[i];
        child.style.top = height + 'px';
        var childHeight = child.offsetHeight, childWidth = child.offsetWidth;
        var leftX = ((width - childWidth) >> 1), rightX = leftX + childWidth;
        child.style.left = leftX + 'px';
        leftXs[i] = leftX;
        rightXs[i] = rightX;
        childYCenters[i] = height + (childHeight >> 1);
        height += childHeight;
      }
      var centerY = (height >> 1);
      for (var i = 0; i < n; ++i) {
        rightArrow(0, leftXs[i], centerY, childYCenters[i] - centerY, 8);
        rightArrow(rightXs[i], width - rightXs[i], childYCenters[i], centerY - childYCenters[i], width - 8);
      }
      break;
    case '+':
      var child = children[0];
      child.style.top = '8px';
      child.style.left = '16px';
      width = child.offsetWidth + 32;
      height = child.offsetHeight + 16;

      var centerY = (height >> 1);

      var loopback = document.createElement('SPAN');
      loopback.style.display = 'inline-block';
      loopback.style.borderLeft = loopback.style.borderRight = loopback.style.borderTop = '1px solid black';
      loopback.style.borderTopLeftRadius = loopback.style.borderTopRightRadius = '6px';
      loopback.style.position = 'absolute';
      loopback.style.left = '8px';
      loopback.style.top = '0px';
      loopback.style.width = (width - 16) + 'px';
      loopback.style.height = (centerY - 8) + 'px';
      div.appendChild(loopback);

      loopback = document.createElement('SPAN');
      loopback.style.display = 'inline-block';
      loopback.style.borderLeft = loopback.style.borderBottom = '1px solid black';
      loopback.style.borderBottomLeftRadius = '6px';
      loopback.style.position = 'absolute';
      loopback.style.left = '8px';
      loopback.style.top = (centerY - 12) + 'px';
      loopback.style.width = '8px';
      loopback.style.height = '12px';
      div.appendChild(loopback);

      loopback = document.createElement('SPAN');
      loopback.style.display = 'inline-block';
      loopback.style.borderRight = loopback.style.borderBottom = '1px solid black';
      loopback.style.borderBottomRightRadius = '6px';
      loopback.style.position = 'absolute';
      loopback.style.left = (width - 16) + 'px';
      loopback.style.top = (centerY - 12) + 'px';
      loopback.style.width = '8px';
      loopback.style.height = '12px';
      div.appendChild(loopback);

      renderArrowhead('\u25C0', div);

      rightArrow(0, 16, centerY, 0);
      rightArrow(width - 16, 16, centerY, 0);
      break;
    case '.':
      for (var i = 0; i < n; ++i) {
        var child = children[i];
        height = Math.max(height, child.offsetHeight);
      }
      rightArrow(0, 16, (height >> 1), 0);
      width = 16;
      for (var i = 0; i < n; ++i) {
        var child = children[i];
        child.style.left = width + 'px';
        width += child.offsetWidth;
        rightArrow(width, 16, (height >> 1), 0);
        width += 16;
        child.style.top = ((height - child.offsetHeight) >> 1) + 'px';
      }
      break;
    default:
      throw new Error(node.op);
  }

  div.style.width = width + 'px';
  div.style.height = height + 'px';

  if (opt_stats) {
    opt_stats.width = width;
    opt_stats.height = height;
  }

  return div;
}

return {
  any: any,
  each: each,
  many: many,
  maybe: maybe,
  or: or,
  appendToDOM: appendToDOM
};

})();
