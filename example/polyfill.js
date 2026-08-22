const util = require('util');

if (!util.styleText) {
  util.styleText = function (format, text) {
    return text;
  };
}

if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return [...this].reverse();
  };
}
