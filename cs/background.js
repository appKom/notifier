// Generated by CoffeeScript 1.4.0
(function() {
  var $, iteration, loadAffiliationIcon, ls, mainLoop, saveAndCountNews, updateAffiliationNews, updateCoffeeSubscription, updateOfficeAndMeetings, updateUnreadCount;

  $ = jQuery;

  ls = localStorage;

  iteration = 0;

  mainLoop = function() {
    var loopTimeout;
    if (DEBUG) {
      console.log("\n#" + iteration);
    }
    if (ls.useInfoscreen !== 'true') {
      if (iteration % UPDATE_OFFICE_INTERVAL === 0 && ls.showOffice === 'true') {
        updateOfficeAndMeetings();
      }
      if (iteration % UPDATE_COFFEE_INTERVAL === 0 && ls.coffeeSubscription === 'true') {
        updateCoffeeSubscription();
      }
      if (iteration % UPDATE_NEWS_INTERVAL === 0 && ls.showAffiliation1 === 'true' && navigator.onLine) {
        updateAffiliationNews('1');
      }
      if (iteration % UPDATE_NEWS_INTERVAL === 0 && ls.showAffiliation2 === 'true' && navigator.onLine) {
        updateAffiliationNews('2');
      }
    }
    if (10000 < iteration) {
      iteration = 0;
    } else {
      iteration++;
    }
    if (DEBUG || !navigator.onLine) {
      loopTimeout = BACKGROUND_LOOP_OFFLINE;
    } else {
      loopTimeout = BACKGROUND_LOOP;
    }
    return setTimeout((function() {
      return mainLoop();
    }), loopTimeout);
  };

  updateOfficeAndMeetings = function(force) {
    if (DEBUG) {
      console.log('updateOfficeAndMeetings');
    }
    return Office.get(function(status, title, message) {
      if (force || ls.currentStatus !== status || ls.currentStatusMessage !== message) {
        Browser.setIcon('img/icon-' + status + '.png');
        ls.currentStatus = status;
        return Meetings.get(function(meetings) {
          var today;
          today = '### Nå\n' + title + ": " + message + "\n### Resten av dagen\n" + meetings;
          Browser.setTitle(today);
          return ls.currentStatusMessage = message;
        });
      }
    });
  };

  updateCoffeeSubscription = function() {
    if (DEBUG) {
      console.log('updateCoffeeSubscription');
    }
    return Coffee.get(false, function(pots, age) {
      var storedPots;
      if (!isNaN(pots && !isNaN(age))) {
        storedPots = Number(ls.coffeePots);
        if (storedPots < pots) {
          if (ls.currentStatus !== 'meeting') {
            if (age < 10) {
              Coffee.showNotification(pots, age);
            }
          }
        }
        return ls.coffeePots = pots;
      }
    });
  };

  updateAffiliationNews = function(number) {
    var affiliation, affiliationKey, newsLimit;
    if (DEBUG) {
      console.log('updateAffiliationNews' + number);
    }
    affiliationKey = ls['affiliationKey' + number];
    affiliation = Affiliation.org[affiliationKey];
    if (affiliation === void 0) {
      if (DEBUG) {
        return console.log('ERROR: chosen affiliation', ls['affiliationKey' + number], 'is not known');
      }
    } else {
      newsLimit = 10;
      return News.get(affiliation, newsLimit, function(items) {
        if (typeof items === 'string') {
          if (DEBUG) {
            return console.log('ERROR:', items);
          }
        } else if (items.length === 0) {
          return updateUnreadCount(0, 0);
        } else {
          saveAndCountNews(items, number);
          return updateUnreadCount();
        }
      });
    }
  };

  saveAndCountNews = function(items, number) {
    var feedItems, lastNotified, list, newsList, unreadCount;
    feedItems = 'affiliationFeedItems' + number;
    newsList = 'affiliationNewsList' + number;
    unreadCount = 'affiliationUnreadCount' + number;
    lastNotified = 'affiliationLastNotified' + number;
    ls[feedItems] = JSON.stringify(items);
    list = JSON.parse(ls[newsList]);
    ls[unreadCount] = News.countNewsAndNotify(items, list, lastNotified);
    return ls[newsList] = News.refreshNewsList(items);
  };

  updateUnreadCount = function(count1, count2) {
    var unreadCount;
    unreadCount = (Number(ls.affiliationUnreadCount1)) + (Number(ls.affiliationUnreadCount2));
    return Browser.setBadgeText(String(unreadCount));
  };

  loadAffiliationIcon = function() {
    var icon, key, name;
    key = ls.affiliationKey1;
    icon = Affiliation.org[key].icon;
    Browser.setIcon(icon);
    name = Affiliation.org[key].name;
    return Browser.setTitle(name + ' Notifier');
  };

  $(function() {
    var firstBusOk, firstBusProps, prop, secondBusOk, secondBusProps, _i, _j, _len, _len1;
    $.ajaxSetup(AJAX_SETUP);
    if (DEBUG) {
      ls.clear();
    }
    ls.removeItem('currentStatus');
    ls.removeItem('currentStatusMessage');
    if (ls.extensionName === void 0) {
      ls.extensionName = 'Online Notifier';
    }
    if (ls.extensionCreator === void 0) {
      ls.extensionCreator = 'dotKom';
    }
    if (ls.showAffiliation1 === void 0) {
      ls.showAffiliation1 = 'true';
    }
    if (ls.affiliationKey1 === void 0) {
      ls.affiliationKey1 = 'online';
    }
    if (ls.affiliationUnreadCount1 === void 0) {
      ls.affiliationUnreadCount1 = 0;
    }
    if (ls.affiliationNewsList1 === void 0) {
      ls.affiliationNewsList1 = JSON.stringify([]);
    }
    if (ls.affiliationViewedList1 === void 0) {
      ls.affiliationViewedList1 = JSON.stringify([]);
    }
    if (ls.affiliationPalette === void 0) {
      ls.affiliationPalette = 'online';
    }
    if (ls.showAffiliation2 === void 0) {
      ls.showAffiliation2 = 'true';
    }
    if (ls.affiliationKey2 === void 0) {
      ls.affiliationKey2 = 'dusken';
    }
    if (ls.affiliationUnreadCount2 === void 0) {
      ls.affiliationUnreadCount2 = 0;
    }
    if (ls.affiliationNewsList2 === void 0) {
      ls.affiliationNewsList2 = JSON.stringify([]);
    }
    if (ls.affiliationViewedList2 === void 0) {
      ls.affiliationViewedList2 = JSON.stringify([]);
    }
    if (ls.showBus === void 0) {
      ls.showBus = 'true';
    }
    firstBusProps = [ls.firstBus, ls.firstBusName, ls.firstBusDirection, ls.firstBusActiveLines, ls.firstBusInactiveLines];
    secondBusProps = [ls.secondBus, ls.secondBusName, ls.secondBusDirection, ls.secondBusActiveLines, ls.secondBusInactiveLines];
    firstBusOk = true;
    secondBusOk = true;
    for (_i = 0, _len = firstBusProps.length; _i < _len; _i++) {
      prop = firstBusProps[_i];
      if (prop === void 0) {
        firstBusOk = false;
      }
    }
    for (_j = 0, _len1 = secondBusProps.length; _j < _len1; _j++) {
      prop = secondBusProps[_j];
      if (prop === void 0) {
        secondBusOk = false;
      }
    }
    if (!firstBusOk) {
      ls.firstBus = 16011333;
      ls.firstBusName = 'Gløshaugen Nord';
      ls.firstBusDirection = 'til byen';
      ls.firstBusActiveLines = JSON.stringify([5, 22]);
      ls.firstBusInactiveLines = JSON.stringify([169]);
    }
    if (!secondBusOk) {
      ls.secondBus = 16010333;
      ls.secondBusName = 'Gløshaugen Nord';
      ls.secondBusDirection = 'fra byen';
      ls.secondBusActiveLines = JSON.stringify([5, 22]);
      ls.secondBusInactiveLines = JSON.stringify([169]);
    }
    if (ls.showOffice === void 0) {
      ls.showOffice = 'true';
    }
    if (ls.showCantina === void 0) {
      ls.showCantina = 'true';
    }
    if (ls.left_cantina === void 0) {
      ls.left_cantina = 'hangaren';
    }
    if (ls.right_cantina === void 0) {
      ls.right_cantina = 'realfag';
    }
    if (ls.openChatter === void 0) {
      ls.openChatter = 'false';
    }
    if (ls.showNotifications === void 0) {
      ls.showNotifications = 'true';
    }
    if (ls.coffeeSubscription === void 0) {
      ls.coffeeSubscription = 'true';
    }
    if (ls.coffeePots === void 0) {
      ls.coffeePots = 0;
    }
    if (ls.useInfoscreen === void 0) {
      ls.useInfoscreen = 'false';
    }
    if (ls.everOpenedOptions === void 0) {
      ls.everOpenedOptions = 'false';
    }
    if (ls.everOpenedOptions === 'false' && !DEBUG) {
      Browser.openTab('options.html');
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'background', 'loadOptions (fresh install)']);
      }
    }
    if (ls.useInfoscreen === 'true') {
      Browser.openTab('infoscreen.html');
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'background', 'loadInfoscreen']);
      }
    }
    if (ls.openChatter === 'true') {
      Browser.openBackgroundTab('http://webchat.freenode.net/?channels=online');
      if (!DEBUG) {
        _gaq.push(['_trackEvent', 'background', 'loadChatter']);
      }
    }
    loadAffiliationIcon();
    setInterval((function() {
      return document.location.reload();
    }), 86400000);
    window.updateOfficeAndMeetings = updateOfficeAndMeetings;
    window.updateCoffeeSubscription = updateCoffeeSubscription;
    window.updateAffiliationNews = updateAffiliationNews;
    window.loadAffiliationIcon = loadAffiliationIcon;
    return mainLoop();
  });

}).call(this);
