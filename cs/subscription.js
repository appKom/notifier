// Generated by CoffeeScript 1.4.0
(function() {
  var $, setSubscription;

  $ = jQuery;

  setSubscription = function() {
    var image, random, width;
    random = 1 + Math.floor(Math.random() * 27);
    image = './meme/' + random + '.jpg';
    $('#subscription').click(function() {
      Browser.openTab('options.html');
      return window.close;
    });
    width = $('#subscription').width();
    return $('#subscription').html('<img src="' + image + '" width="' + width + '" />');
  };

  $(function() {
    $.ajaxSetup(AJAX_SETUP);
    setSubscription();
    return setTimeout((function() {
      return window.close();
    }), 6000);
  });

}).call(this);
