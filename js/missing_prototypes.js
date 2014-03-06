
// Small prototype library for Online Notifier

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.startsWith = function (prefix) {
  return this.indexOf(prefix) == 0;
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
}
