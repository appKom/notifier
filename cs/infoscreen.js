// Generated by CoffeeScript 1.4.0
(function() {
  var $, animateCreatorName, changeCreatorName, createBusDataRequest, displayItems, findUpdatedPosts, insertBusInfo, iteration, listDinners, ls, mainLoop, newsLimit, updateAffiliationNews, updateBus, updateCantinas, updateCoffee, updateHours, updateMeetings, updateOffice, updateServant,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = jQuery;

  ls = localStorage;

  iteration = 0;

  newsLimit = 8;

  mainLoop = function() {
    if (DEBUG) {
      console.log("\n#" + iteration);
    }
    if (iteration % UPDATE_OFFICE_INTERVAL === 0 && ls.showOffice === 'true') {
      updateOffice();
    }
    if (iteration % UPDATE_SERVANT_INTERVAL === 0 && ls.showOffice === 'true') {
      updateServant();
    }
    if (iteration % UPDATE_MEETINGS_INTERVAL === 0 && ls.showOffice === 'true') {
      updateMeetings();
    }
    if (iteration % UPDATE_COFFEE_INTERVAL === 0 && ls.showOffice === 'true') {
      updateCoffee();
    }
    if (iteration % UPDATE_CANTINAS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateCantinas();
    }
    if (iteration % UPDATE_HOURS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateHours();
    }
    if (iteration % UPDATE_BUS_INTERVAL === 0 && ls.showBus === 'true') {
      updateBus();
    }
    if (iteration % UPDATE_NEWS_INTERVAL === 0 && ls.showAffiliation1 === 'true' && navigator.onLine) {
      updateAffiliationNews('1');
    }
    if (iteration % UPDATE_NEWS_INTERVAL === 0 && ls.showAffiliation2 === 'true' && navigator.onLine) {
      updateAffiliationNews('2');
    }
    if (10000 < iteration) {
      iteration = 0;
    } else {
      iteration++;
    }
    return setTimeout((function() {
      return mainLoop();
    }), PAGE_LOOP);
  };

  updateOffice = function() {
    if (DEBUG) {
      console.log('updateOffice');
    }
    return Office.get(function(status, title, message) {
      if (ls.currentStatus !== status || ls.currentStatusMessage !== message) {
        $('#office img').attr('src', 'img/status-' + status + '.png');
        $('#office #subtext').html(message);
        ls.currentStatus = status;
        return ls.currentStatusMessage = message;
      }
    });
  };

  updateServant = function() {
    if (DEBUG) {
      console.log('updateServant');
    }
    return Servant.get(function(servant) {
      return $('#todays #schedule #servant').html('- ' + servant);
    });
  };

  updateMeetings = function() {
    if (DEBUG) {
      console.log('updateMeetings');
    }
    return Meetings.get(function(meetings) {
      meetings = meetings.replace(/\n/g, '<br />');
      return $('#todays #schedule #meetings').html(meetings);
    });
  };

  updateCoffee = function() {
    if (DEBUG) {
      console.log('updateCoffee');
    }
    return Coffee.get(true, function(pots, age) {
      $('#todays #coffee #pots').html('- ' + pots);
      return $('#todays #coffee #age').html(age);
    });
  };

  updateCantinas = function() {
    if (DEBUG) {
      console.log('updateCantinas');
    }
    Cantina.get(ls.left_cantina, function(menu) {
      $('#cantinas #left .title').html(ls.left_cantina);
      return $('#cantinas #left #dinnerbox').html(listDinners(menu));
    });
    return Cantina.get(ls.right_cantina, function(menu) {
      $('#cantinas #right .title').html(ls.right_cantina);
      return $('#cantinas #right #dinnerbox').html(listDinners(menu));
    });
  };

  listDinners = function(menu) {
    var dinner, dinnerlist, _i, _len;
    dinnerlist = '';
    if (typeof menu === 'string') {
      ls.noDinnerInfo = 'true';
      dinnerlist += '<li>' + menu + '</li>';
    } else {
      ls.noDinnerInfo = 'false';
      for (_i = 0, _len = menu.length; _i < _len; _i++) {
        dinner = menu[_i];
        if (dinner.price !== null) {
          dinner.price = dinner.price + ',-';
          dinnerlist += '<li id="' + dinner.index + '">' + dinner.price + ' ' + dinner.text + '</li>';
        } else {
          dinnerlist += '<li class="message" id="' + dinner.index + '">"' + dinner.text + '"</li>';
        }
      }
    }
    return dinnerlist;
  };

  updateHours = function() {
    if (DEBUG) {
      console.log('updateHours');
    }
    Hours.get(ls.left_cantina, function(hours) {
      return $('#cantinas #left .hours').html(hours);
    });
    return Hours.get(ls.right_cantina, function(hours) {
      return $('#cantinas #right .hours').html(hours);
    });
  };

  updateBus = function() {
    if (DEBUG) {
      console.log('updateBus');
    }
    if (!navigator.onLine) {
      $('#bus #firstBus .name').html(ls.firstBusName);
      $('#bus #secondBus .name').html(ls.secondBusName);
      $('#bus #firstBus .first .line').html('<div class="error">Frakoblet fra api.visuweb.no</div>');
      return $('#bus #secondBus .first .line').html('<div class="error">Frakoblet fra api.visuweb.no</div>');
    } else {
      createBusDataRequest('firstBus', '#firstBus');
      return createBusDataRequest('secondBus', '#secondBus');
    }
  };

  createBusDataRequest = function(bus, cssIdentificator) {
    var activeLines;
    activeLines = ls[bus + 'ActiveLines'];
    activeLines = JSON.parse(activeLines);
    return Bus.get(ls[bus], activeLines, function(lines) {
      return insertBusInfo(lines, ls[bus + 'Name'], cssIdentificator);
    });
  };

  insertBusInfo = function(lines, stopName, cssIdentificator) {
    var busStop, i, spans, _results;
    busStop = '#bus ' + cssIdentificator;
    spans = ['first', 'second', 'third', 'fourth'];
    $(busStop + ' .name').html(stopName);
    for (i in spans) {
      $(busStop + ' .' + spans[i] + ' .line').html('');
      $(busStop + ' .' + spans[i] + ' .time').html('');
    }
    if (typeof lines === 'string') {
      return $(busStop + ' .first .line').html('<div class="error">' + lines + '</div>');
    } else {
      if (lines['departures'].length === 0) {
        return $(busStop + ' .first .line').html('<div class="error">....zzzZZZzzz....<br />(etter midnatt vises ikke)</div>');
      } else {
        _results = [];
        for (i in spans) {
          $(busStop + ' .' + spans[i] + ' .line').append(lines['destination'][i]);
          _results.push($(busStop + ' .' + spans[i] + ' .time').append(lines['departures'][i]));
        }
        return _results;
      }
    }
  };

  updateAffiliationNews = function(number) {
    var feedItems, key, name, selector;
    if (DEBUG) {
      console.log('updateAffiliationNews' + number);
    }
    feedItems = ls['affiliationFeedItems' + number];
    selector = number === '1' ? '#left' : '#right';
    if (ls.showAffiliation2 !== 'true') {
      selector = '#full';
    }
    if (feedItems !== void 0) {
      feedItems = JSON.parse(feedItems);
      return displayItems(feedItems, selector, 'affiliationNewsList' + number, 'affiliationViewedList' + number, 'affiliationUnreadCount' + number);
    } else {
      key = ls['affiliationKey' + number];
      name = Affiliation.org[key].name;
      selector = number === '1' ? '#left' : '#right';
      return $('#news ' + selector).html('<div class="post"><div class="title">Nyheter</div><div class="item">Frakoblet fra ' + name + '</div></div>');
    }
  };

  displayItems = function(items, column, newsListName, viewedListName, unreadCountName) {
    var altLink, feedKey, index, link, newsList, updatedList, viewedList;
    $('#news ' + column).html('');
    feedKey = items[0].feedKey;
    newsList = JSON.parse(ls[newsListName]);
    viewedList = JSON.parse(ls[viewedListName]);
    updatedList = findUpdatedPosts(newsList, viewedList);
    viewedList = [];
    $.each(items, function(index, item) {
      var altLink, date, descLimit, htmlItem, unreadCount, _ref;
      if (index < newsLimit) {
        viewedList.push(item.link);
        unreadCount = Number(ls[unreadCountName]);
        htmlItem = '<div class="post"><div class="title">';
        if (index < unreadCount) {
          if (_ref = item.link, __indexOf.call(updatedList.indexOf, _ref) >= 0) {
            htmlItem += '<span class="unread">UPDATED <b>::</b> </span>';
          } else {
            htmlItem += '<span class="unread">NEW <b>::</b> </span>';
          }
        }
        date = altLink = '';
        if (item.altLink !== null) {
          altLink = ' name="' + item.altLink + '"';
        }
        if (item.date !== null && ls.showAffiliation2 === 'false') {
          date = ' den ' + item.date;
        }
        descLimit = 140;
        if (ls.showAffiliation2 === 'true') {
          descLimit = 100;
        }
        if (item.description.length > descLimit) {
          item.description = item.description.substr(0, descLimit) + '...';
        }
        htmlItem += item.title + '\
        </div>\
          <div class="item" data="' + item.link + '"' + altLink + '>\
            <img src="' + item.image + '" width="107" />\
            <div class="emphasized">- Av ' + item.creator + date + '</div>\
            ' + item.description + '\
          </div>\
        </div>';
        return $('#news ' + column).append(htmlItem);
      }
    });
    ls[viewedListName] = JSON.stringify(viewedList);
    Browser.setBadgeText('');
    ls[unreadCountName] = 0;
    $('.item').click(function() {
      var altLink, useAltLink;
      altLink = $(this).attr('name');
      useAltLink = Affiliation.org[ls.affiliationKey1].useAltLink;
      if (altLink !== void 0 && useAltLink === true) {
        Browser.openTab($(this).attr('name'));
      } else {
        Browser.openTab($(this).attr('data'));
      }
      return window.close();
    });
    if (Affiliation.org[feedKey].useAltLink) {
      altLink = $('.item[data="' + link + '"]').attr('name');
      if (altLink !== 'null') {
        $('.item[data="' + link + '"]').attr('data', altLink);
      }
    }
    if (Affiliation.org[feedKey].getImage !== void 0) {
      for (index in viewedList) {
        link = viewedList[index];
        Affiliation.org[feedKey].getImage(link, function(link, image) {
          return $('.item[data="' + link + '"] img').attr('src', image);
        });
      }
    }
    if (Affiliation.org[feedKey].getImages !== void 0) {
      return Affiliation.org[feedKey].getImages(viewedList, function(links, images) {
        var _results;
        _results = [];
        for (index in links) {
          _results.push($('.item[data="' + links[index] + '"] img').attr('src', images[index]));
        }
        return _results;
      });
    }
  };

  findUpdatedPosts = function(newsList, viewedList) {
    var i, j, updatedList;
    updatedList = [];
    for (i in newsList) {
      if (newsList[i] === viewedList[0]) {
        break;
      }
      for (j in viewedList) {
        if (j === 0) {
          continue;
        }
        if (newsList[i] === viewedList[j]) {
          updatedList.push(newsList[i]);
        }
      }
    }
    return updatedList;
  };

  changeCreatorName = function(name) {
    clearTimeout(ls.changeCreatorNameTimeoutId);
    return animateCreatorName(name);
  };

  animateCreatorName = function(name, build) {
    var random, text;
    text = $('#pagefliptyping').text();
    if (text.length === 0) {
      build = true;
      name = name + " with <3";
    }
    random = Math.floor(350 * Math.random() + 50);
    if (!build) {
      $('#pagefliptyping').text(text.slice(0, text.length - 1));
      return ls.animateCreatorNameTimeoutId = setTimeout((function() {
        return animateCreatorName(name);
      }), random);
    } else {
      if (text.length !== name.length) {
        if (text.length === 0) {
          $('#pagefliptyping').text(name.slice(0, 1));
        } else {
          $('#pagefliptyping').text(name.slice(0, text.length + 1));
        }
        return ls.animateCreatorNameTimeoutId = setTimeout((function() {
          return animateCreatorName(name, true);
        }), random);
      }
    }
  };

  $(function() {
    var affiliation, logo;
    if (DEBUG) {
      $('html').css('cursor', 'auto');
      $('#overlay').hide();
    }
    $.ajaxSetup(AJAX_SETUP);
    ls.removeItem('currentStatus');
    ls.removeItem('currentStatusMessage');
    if (ls.showOffice !== 'true') {
      $('#office').hide();
    }
    if (ls.showOffice !== 'true') {
      $('#todays').hide();
    }
    if (ls.showCantina !== 'true') {
      $('#cantinas').hide();
    }
    if (ls.showBus !== 'true') {
      $('#bus').hide();
    }
    if (ls.showAffiliation2 !== 'true') {
      _gaq.push(['_trackEvent', 'infoscreen', 'loadSingleColumn', ls.affiliationKey1]);
    } else {
      _gaq.push(['_trackEvent', 'infoscreen', 'loadDoubleColumn', ls.affiliationKey1], ['_trackEvent', 'infoscreen', 'loadDoubleColumn', ls.affiliationKey2]);
    }
    if (ls.affiliationKey1 !== 'online') {
      affiliation = ls.affiliationKey1;
      logo = Affiliation.org[affiliation].logo;
      if (logo !== void 0 && logo !== '') {
        if (DEBUG) {
          console.log('Applying affiliation logo', logo);
        }
        $('#logo').prop('src', logo);
      }
    }
    $('link[rel="shortcut icon"]').attr('href', Affiliation.org[ls.affiliationKey1].icon);
    $('#palette').attr('href', Palettes.get(ls.affiliationPalette));
    if (OPERATING_SYSTEM === 'Windows') {
      $('#pagefliptext').attr("style", "bottom:9px;");
      $('#pagefliplink').attr("style", "bottom:9px;");
    }
    changeCreatorName(ls.extensionCreator);
    setInterval((function() {
      return $(".pageflipcursor").animate({
        opacity: 0
      }, "fast", "swing", function() {
        return $(this).animate({
          opacity: 1
        }, "fast", "swing");
      });
    }), 600);
    setInterval((function() {
      var hours, minutes, _d;
      _d = new Date();
      minutes = _d.getMinutes();
      hours = _d.getHours();
      if (minutes < 10) {
        minutes = '0' + minutes;
      }
      if (hours < 10) {
        hours = '0' + hours;
      }
      $("#bus #clock #minutes").html(minutes);
      return $("#bus #clock #hours").html(hours);
    }), 1000);
    setInterval((function() {
      var linebreaks, num, random;
      random = Math.ceil(Math.random() * 25);
      linebreaks = ((function() {
        var _i, _results;
        _results = [];
        for (num = _i = 0; 0 <= random ? _i <= random : _i >= random; num = 0 <= random ? ++_i : --_i) {
          _results.push('<br />');
        }
        return _results;
      })()).join(' ');
      $('#overlay').html(linebreaks + 'preventing image burn-in...');
      $('#overlay').css('opacity', 1);
      return setTimeout((function() {
        return $('#overlay').css('opacity', 0);
      }), 3500);
    }), 1800000);
    if (!DEBUG) {
      setTimeout((function() {
        return document.location.reload();
      }), 86400000);
    }
    return mainLoop();
  });

}).call(this);
