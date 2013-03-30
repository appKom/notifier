// Generated by CoffeeScript 1.4.0
(function() {
  var $, log, ls, setNotification;

  $ = jQuery;

  ls = localStorage;

  setNotification = function() {
    var creator, description, feedKey, feedName, image, link, maxlength, title;
    try {
      title = ls.notificationTitle;
      link = ls.notificationLink;
      description = ls.notificationDescription;
      creator = ls.notificationCreator;
      image = ls.notificationImage;
      feedKey = ls.notificationFeedKey;
      feedName = ls.notificationFeedName;
      maxlength = 90;
      if (maxlength < description.length) {
        description = description.substring(0, maxlength) + '...';
      }
      $('#notification').click(function() {
        Browser.openTab(link);
        return window.close;
      });
      $('#notification').html('\
      <div class="item">\
        <div class="title">' + title + '</div>\
        <img src="' + image + '" />\
        <div class="textwrapper">\
          <div class="emphasized">- Av ' + creator + '</div>\
          <div class="description">' + description + '</div>\
        </div>\
      </div>\
      </a>');
      if (Affiliation.org[feedKey].getImage !== void 0) {
        return Affiliation.org[feedKey].getImage(link, function(link, image) {
          return $('img').prop('src', image);
        });
      }
    } catch (e) {
      return log('ERROR in desktop notification', e);
    }
  };

  log = function(object) {
    if (DEBUG) {
      return Browser.getBackgroundProcess().console.log(object);
    }
  };

  $(function() {
    setNotification();
    return setTimeout((function() {
      return window.close();
    }), 5500);
  });

}).call(this);
