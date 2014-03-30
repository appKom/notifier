// Generated by CoffeeScript 1.4.0
(function() {
  var $, animateOracleAnswer, animateOracleQuestion, bindOracle, changeOracleAnswer, changeOracleQuestion, chatterText, clickDinnerLink, clickHours, createBusDataRequest, displayItems, fadeButtonText, findUpdatedPosts, insertBusInfo, intervalId, iteration, listDinners, ls, mainLoop, newsLimit, optionsText, oraclePrediction, tipsText, updateAffiliationNews, updateBus, updateCantinas, updateCoffee, updateHours, updateMeetings, updateServant,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = jQuery;

  ls = localStorage;

  iteration = 0;

  intervalId = null;

  newsLimit = 4;

  mainLoop = function(force) {
    console.lolg("\n#" + iteration);
    if (navigator.onLine) {
      if (ls.showCantina === 'true') {
        if (force || iteration % UPDATE_HOURS_INTERVAL === 0) {
          updateHours();
        }
      }
      if (ls.showCantina === 'true') {
        if (force || iteration % UPDATE_CANTINAS_INTERVAL === 0) {
          updateCantinas();
        }
      }
      if (ls.showAffiliation1 === 'true') {
        if (force || iteration % UPDATE_NEWS_INTERVAL === 0) {
          updateAffiliationNews('1');
        }
      }
      if (ls.showAffiliation2 === 'true') {
        if (force || iteration % UPDATE_NEWS_INTERVAL === 0) {
          updateAffiliationNews('2');
        }
      }
    }
    if (Affiliation.org[ls.affiliationKey1].hw) {
      if (ls.showOffice === 'true') {
        if (force || iteration % UPDATE_SERVANT_INTERVAL === 0) {
          updateServant();
        }
      }
      if (ls.showOffice === 'true') {
        if (force || iteration % UPDATE_MEETINGS_INTERVAL === 0) {
          updateMeetings();
        }
      }
      if (ls.showOffice === 'true') {
        if (force || iteration % UPDATE_COFFEE_INTERVAL === 0) {
          updateCoffee();
        }
      }
    }
    if (ls.showBus === 'true') {
      if (force || iteration % UPDATE_BUS_INTERVAL === 0) {
        updateBus();
      }
    }
    if (10000 < iteration) {
      return iteration = 0;
    } else {
      return iteration++;
    }
  };

  updateServant = function() {
    console.lolg('updateServant');
    return Servant.get(function(servant) {
      return $('#todays #schedule #servant').html('- ' + servant);
    });
  };

  updateMeetings = function() {
    console.lolg('updateMeetings');
    return Meetings.get(function(meetings) {
      meetings = meetings.replace(/\n/g, '<br />');
      return $('#todays #schedule #meetings').html(meetings);
    });
  };

  updateCoffee = function() {
    console.lolg('updateCoffee');
    return Coffee.get(true, function(pots, age) {
      $('#todays #coffee #pots').html('- ' + pots);
      return $('#todays #coffee #age').html(age);
    });
  };

  updateCantinas = function(first) {
    var menu1, menu2, update;
    console.lolg('updateCantinas');
    update = function(shortname, menu, selector) {
      var name;
      name = Cantina.names[shortname];
      $('#cantinas #' + selector + ' .title').html(name);
      $('#cantinas #' + selector + ' #dinnerbox').html(listDinners(menu));
      return clickDinnerLink('#cantinas #' + selector + ' #dinnerbox li', shortname);
    };
    menu1 = JSON.parse(ls.leftCantinaMenu);
    menu2 = JSON.parse(ls.rightCantinaMenu);
    update(ls.leftCantina, menu1, 'left');
    return update(ls.rightCantina, menu2, 'right');
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

  clickDinnerLink = function(cssSelector, cantina) {
    return $(cssSelector).click(function() {
      Analytics.trackEvent('clickDinner', $(this).text());
      ls.clickedCantina = cantina;
      Browser.openTab(Cantina.url);
      return window.close();
    });
  };

  updateHours = function(first) {
    var update;
    console.lolg('updateHours');
    update = function(shortname, hours, selector) {
      $('#cantinas #' + selector + ' .hours').html(hours);
      return clickHours('#cantinas #' + selector + ' .hours', shortname);
    };
    update(ls.leftCantina, ls.leftCantinaHours, 'left');
    return update(ls.rightCantina, ls.rightCantinaHours, 'right');
  };

  clickHours = function(cssSelector, cantina) {
    return $(cssSelector).click(function() {
      Analytics.trackEvent('clickHours', $(this).text());
      ls.clickedHours = Hours.cantinas[cantina];
      Browser.openTab(Hours.url);
      return window.close();
    });
  };

  updateBus = function() {
    var i, j, spans, stops;
    console.lolg('updateBus');
    if (!navigator.onLine) {
      stops = ['firstBus', 'secondBus'];
      spans = ['first', 'second', 'third'];
      for (i in stops) {
        for (j in spans) {
          $('#bus #' + stops[i] + ' .' + spans[j] + ' .line').html('');
          $('#bus #' + stops[i] + ' .' + spans[j] + ' .time').html('');
        }
      }
      $('#bus #firstBus .name').html(ls.firstBusName);
      $('#bus #secondBus .name').html(ls.secondBusName);
      $('#bus #firstBus .error').html('<div class="error">Frakoblet fra api.visuweb.no</div>');
      return $('#bus #secondBus .error').html('<div class="error">Frakoblet fra api.visuweb.no</div>');
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
      $('#bus ' + cssIdentificator + ' .error').html('');
      return insertBusInfo(lines, ls[bus + 'Name'], cssIdentificator);
    });
  };

  insertBusInfo = function(lines, stopName, cssIdentificator) {
    var busStop, i, spans, _results;
    busStop = '#bus ' + cssIdentificator;
    spans = ['first', 'second', 'third'];
    $(busStop + ' .name').html(stopName);
    for (i in spans) {
      $(busStop + ' .' + spans[i] + ' .line').html('');
      $(busStop + ' .' + spans[i] + ' .time').html('');
    }
    if (typeof lines === 'string') {
      if (navigator.onLine) {
        return $(busStop + ' .first .error').html(lines + '<br />Prøv Orakelet i stedet');
      } else {
        return $(busStop + ' .first .error').html(lines);
      }
    } else {
      if (lines['departures'].length === 0) {
        return $(busStop + ' .first .error').html('....zzzZZZzzz....');
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

  bindOracle = function() {
    if (Oracle.predict() !== null) {
      $('#oracle #question').attr('placeholder', Oracle.predict() + Oracle.msgPredictPostfix);
      Analytics.trackEvent('oracleSuggest');
    }
    $('#oracle').on('keyup', '#question', function(e) {
      var question;
      question = $('#oracle #question').val();
      if (e.which === 13) {
        if (question !== '') {
          return Oracle.ask(question, function(answer) {
            changeOracleAnswer(answer);
            Analytics.trackEvent('oracleAnswer');
            if (Oracle.predict() !== null) {
              return $('#oracle #question').attr('placeholder', Oracle.predict() + Oracle.msgPredictPostfix);
            }
          });
        } else {
          changeOracleAnswer(Oracle.greet());
          return Analytics.trackEvent('oracleGreet');
        }
      } else if (question === '' && e.which !== 9) {
        changeOracleAnswer('');
        return Analytics.trackEvent('oracleClear');
      }
    });
    return $('#oracle').on('keydown', '#question', function(e) {
      if (e.which === 9) {
        e.preventDefault();
        oraclePrediction();
        return Analytics.trackEvent('oraclePrediction');
      }
    });
  };

  changeOracleAnswer = function(answer) {
    var func;
    console.lolg('changeOracleAnswer to "' + answer + '"');
    clearTimeout(Number(ls.animateOracleAnswerTimeoutId));
    if (answer.match(/<\/?\w+>/g)) {
      if ($('#oracle #answer .piece').size() === 0) {
        $('#oracle #answer').append('<div class="piece">' + answer + '</div>');
        return $('#oracle #answer .piece a').attr('target', '_blank');
      } else {
        return $('#oracle #answer .piece').fadeOut(400, function() {
          $('#oracle #answer .piece').remove();
          $('#oracle #answer').append('<div class="piece">' + answer + '</div>');
          return $('#oracle #answer .piece a').attr('target', '_blank');
        });
      }
    } else {
      func = function(answer) {
        var i, pieces, _results;
        pieces = answer.split('@');
        for (i in pieces) {
          $('#oracle #answer').append('<div class="piece"></div>');
        }
        _results = [];
        for (i in pieces) {
          _results.push(animateOracleAnswer(pieces[i], i, function(index) {}));
        }
        return _results;
      };
      if ($('#oracle #answer .piece').size() === 0) {
        return func(answer);
      } else {
        return $('#oracle #answer .piece').fadeOut(400, function() {
          $('#oracle #answer .piece').remove();
          return func(answer);
        });
      }
    }
  };

  animateOracleAnswer = function(line, index, callback, build) {
    var millisecs, text;
    text = $('#oracle #answer .piece').eq(index).text();
    if (text.length === 0) {
      build = true;
    }
    millisecs = 6;
    if (!build) {
      $('#oracle #answer .piece').eq(index).text(text.slice(0, text.length - 1));
      return ls.animateOracleAnswerTimeoutId = setTimeout((function() {
        return animateOracleAnswer(line, index, callback);
      }), millisecs);
    } else {
      if (text.length !== line.length) {
        if (text.length === 0) {
          $('#oracle #answer .piece').eq(index).text(line.slice(0, 1));
        } else {
          $('#oracle #answer .piece').eq(index).text(line.slice(0, text.length + 1));
        }
        return ls.animateOracleAnswerTimeoutId = setTimeout((function() {
          return animateOracleAnswer(line, index, callback, true);
        }), millisecs);
      } else {
        return callback(index);
      }
    }
  };

  oraclePrediction = function() {
    var question;
    question = Oracle.predict();
    if (question !== null) {
      changeOracleQuestion(question);
      return Oracle.ask(question, function(answer) {
        changeOracleAnswer(answer);
        return $('#oracle #question').focus();
      });
    } else {
      $('#oracle #question').focus();
      return setTimeout((function() {
        return changeOracleAnswer(Oracle.msgAboutPredict);
      }), 200);
    }
  };

  changeOracleQuestion = function(question) {
    clearTimeout(Number(ls.animateOracleQuestionTimeoutId));
    return animateOracleQuestion(question);
  };

  animateOracleQuestion = function(line) {
    var build, random, text;
    text = $('#oracle #question').val();
    if (text.length === 0) {
      build = true;
    }
    random = Math.floor(100 * Math.random() + 10);
    if (text.length !== line.length) {
      if (text.length === 0) {
        $('#oracle #question').val(line.slice(0, 1));
      } else {
        $('#oracle #question').val(line.slice(0, text.length + 1));
      }
      return ls.animateOracleQuestionTimeoutId = setTimeout((function() {
        return animateOracleQuestion(line);
      }), random);
    }
  };

  updateAffiliationNews = function(number) {
    var feedItems, key, name, selector;
    console.lolg('updateAffiliationNews' + number);
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
      $('#news ' + selector).html('<div class="post"><div class="item"><div class="title">' + name + '</div>Frakoblet fra nyhetsstrøm</div></div>');
      return $('#news ' + selector).click(function() {
        return Browser.openTab(Affiliation.org[key].web);
      });
    }
  };

  displayItems = function(items, column, newsListName, viewedListName, unreadCountName) {
    var feedKey, newsList, storedImages, updatedList, viewedList;
    $('#news ' + column).html('');
    feedKey = items[0].feedKey;
    newsList = JSON.parse(ls[newsListName]);
    viewedList = JSON.parse(ls[viewedListName]);
    updatedList = findUpdatedPosts(newsList, viewedList);
    viewedList = [];
    storedImages = JSON.parse(ls.storedImages);
    $.each(items, function(index, item) {
      var altLink, date, descLimit, htmlItem, readUnread, storedImage, unreadCount, _ref;
      if (index < newsLimit) {
        viewedList.push(item.link);
        unreadCount = Number(ls[unreadCountName]);
        readUnread = '';
        if (index < unreadCount) {
          if (_ref = item.link, __indexOf.call(updatedList.indexOf, _ref) >= 0) {
            readUnread += '<span class="unread">UPDATED <b>::</b> </span>';
          } else {
            readUnread += '<span class="unread">NEW <b>::</b> </span>';
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
        storedImage = storedImages[item.link];
        if (storedImage !== void 0) {
          if (-1 === item.image.indexOf('http')) {
            item.image = storedImage;
          }
        }
        htmlItem = '\
        <div class="post">\
          <div class="item" data="' + item.link + '"' + altLink + '>\
            <div class="title">' + readUnread + item.title + '</div>\
            <img src="' + item.image + '" width="107" />\
            ' + item.description + '\
            <div class="author">&ndash; Av ' + item.creator + date + '</div>\
          </div>\
        </div>';
        return $('#news ' + column).append(htmlItem);
      }
    });
    ls[viewedListName] = JSON.stringify(viewedList);
    Browser.setBadgeText('');
    ls[unreadCountName] = 0;
    return $('#news ' + column + ' .item').click(function() {
      var altLink, link, useAltLink;
      link = $(this).attr('data');
      altLink = $(this).attr('name');
      useAltLink = Affiliation.org[feedKey].useAltLink;
      if (altLink !== void 0 && useAltLink === true) {
        link = $(this).attr('name');
      }
      Browser.openTab(link);
      Analytics.trackEvent('clickNews', link);
      return window.close();
    });
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

  optionsText = function(show) {
    return fadeButtonText(show, 'Innstillinger');
  };

  tipsText = function(show) {
    return fadeButtonText(show, '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Tips++');
  };

  chatterText = function(show) {
    var irc, text;
    irc = Affiliation.org[ls.affiliationKey1].irc;
    text = 'Join ' + irc.channel + ' :)';
    return fadeButtonText(show, '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;\
    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ' + text);
  };

  fadeButtonText = function(show, msg) {
    var fadeInSpeed, fadeOutSpeed;
    fadeInSpeed = 150;
    fadeOutSpeed = 50;
    if (show) {
      $('#buttontext').html(msg);
      return $('#buttontext').fadeIn(fadeInSpeed);
    } else {
      $('#buttontext').fadeOut(fadeOutSpeed);
      return $('#buttontext').html('');
    }
  };

  $(function() {
    var busLanes, clickBus, i, icon, key, logo, openAtb, placeholder, shorter, stayUpdated, timetables;
    if (ls.useInfoscreen === 'true') {
      Browser.openTab('infoscreen.html');
      Analytics.trackEvent('toggleInfoscreen');
      setTimeout((function() {
        return window.close();
      }), 250);
    }
    if (window.screen.availHeight < 700) {
      shorter = window.screen.availHeight - 100;
      $('body').css('height', shorter + 'px');
    }
    if (ls.showAffiliation2 !== 'true') {
      $('#news #right').hide();
      $('#news #left').attr('id', 'full');
      Analytics.trackEvent('loadSingleAffiliation', ls.affiliationKey1);
      Analytics.trackEvent('loadAffiliation1', ls.affiliationKey1);
    } else {
      Analytics.trackEvent('loadDoubleAffiliation', ls.affiliationKey1 + ' - ' + ls.affiliationKey2);
      Analytics.trackEvent('loadAffiliation1', ls.affiliationKey1);
      Analytics.trackEvent('loadAffiliation2', ls.affiliationKey2);
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
    if (ls.affiliationKey1 !== 'online') {
      $('#mobileText').hide();
    }
    key = ls.affiliationKey1;
    logo = Affiliation.org[key].logo;
    icon = Affiliation.org[key].icon;
    placeholder = Affiliation.org[key].placeholder;
    $('#logo').prop('src', logo);
    $('link[rel="shortcut icon"]').attr('href', icon);
    $('#news .post img').attr('src', placeholder);
    $('#chatterIcon').attr('src', icon);
    if (!Affiliation.org[ls.affiliationKey1].irc) {
      $('#chatterButton').hide();
      $('#chatterIcon').hide();
    }
    Analytics.trackEvent('loadPalette', ls.affiliationPalette);
    $('#logo').click(function() {
      var name, web;
      name = Affiliation.org[ls.affiliationKey1].name;
      Analytics.trackEvent('clickLogo', name);
      web = Affiliation.org[ls.affiliationKey1].web;
      Browser.openTab(web);
      return window.close();
    });
    $('#optionsButton').click(function() {
      Browser.openTab('options.html');
      Analytics.trackEvent('clickOptions');
      return window.close();
    });
    $('#tipsButton').click(function() {
      if ($('#tips').filter(':visible').length === 1) {
        return $('#tips').fadeOut('fast');
      } else {
        $('#tips').fadeIn('fast');
        return Analytics.trackEvent('clickTips');
      }
    });
    $('#tips:not(a)').click(function() {
      return $('#tips').fadeOut('fast');
    });
    $('#tips a').click(function() {
      var link;
      link = $(this).attr('href');
      Browser.openTab(link);
      Analytics.trackEvent('clickTipsLink', link);
      return window.close();
    });
    $('#chatterButton').click(function() {
      var channel, irc, noNick, server;
      irc = Affiliation.org[ls.affiliationKey1].irc;
      server = irc.server;
      channel = irc.channel;
      noNick = irc.noNick;
      Browser.openTab('https://kiwiirc.com/client/' + server + '/' + channel);
      Analytics.trackEvent('clickChatter', ls.affiliationKey1);
      return window.close();
    });
    timetables = JSON.parse(localStorage.busTimetables);
    clickBus = function() {
      var line, link;
      try {
        line = $(this).find('.line').text().trim().split(' ')[0];
        link = timetables[line];
        Browser.openTab(link);
        Analytics.trackEvent('clickTimetable');
        return window.close();
      } catch (e) {
        return console.lolg('ERROR: Failed at clickBus', e);
      }
    };
    busLanes = ['.first', '.second', '.third'];
    for (i in busLanes) {
      $('#bus #firstBus ' + busLanes[i]).click(clickBus);
      $('#bus #secondBus ' + busLanes[i]).click(clickBus);
    }
    openAtb = function() {
      Browser.openTab('http://www.atb.no');
      Analytics.trackEvent('clickAtb');
      return window.close();
    };
    $('#bus #atbLogo').click(openAtb);
    $('#bus .error').click(openAtb);
    bindOracle();
    $('#oracle #name').click(function() {
      return $('#oracle #question').focus();
    });
    $('#optionsButton').mouseenter(function() {
      return optionsText(true);
    });
    $('#optionsButton').mouseleave(function() {
      return optionsText(false);
    });
    $('#tipsButton').mouseenter(function() {
      return tipsText(true);
    });
    $('#tipsButton').mouseleave(function() {
      return tipsText(false);
    });
    $('#chatterButton').mouseenter(function() {
      return chatterText(true);
    });
    $('#chatterButton').mouseleave(function() {
      return chatterText(false);
    });
    $('#chatterIcon').mouseenter(function() {
      return chatterText(true);
    });
    $('#chatterIcon').mouseleave(function() {
      return chatterText(false);
    });
    $(document).konami({
      code: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'],
      callback: function() {
        Analytics.trackEvent('toggleKonami');
        $('head').append('<style type="text/css">\
        @-webkit-keyframes adjustHue {\
          0% { -webkit-filter: hue-rotate(0deg); }\
          10% { -webkit-filter: hue-rotate(36deg); }\
          20% { -webkit-filter: hue-rotate(72deg); }\
          30% { -webkit-filter: hue-rotate(108deg); }\
          40% { -webkit-filter: hue-rotate(144deg); }\
          50% { -webkit-filter: hue-rotate(180deg); }\
          60% { -webkit-filter: hue-rotate(216deg); }\
          70% { -webkit-filter: hue-rotate(252deg); }\
          80% { -webkit-filter: hue-rotate(288deg); }\
          90% { -webkit-filter: hue-rotate(324deg); }\
          100% { -webkit-filter: hue-rotate(360deg); }\
        }</style>');
        return $('#background').attr('style', '-webkit-animation:adjustHue 10s alternate infinite;');
      }
    });
    $('#oracle #question').focus();
    stayUpdated = function(now) {
      var loopTimeout, timeout;
      console.lolg(ONLINE_MESSAGE);
      loopTimeout = DEBUG ? PAGE_LOOP_DEBUG : PAGE_LOOP;
      intervalId = setInterval((function() {
        return mainLoop();
      }), PAGE_LOOP);
      timeout = now ? 0 : 2000;
      return setTimeout((function() {
        return mainLoop(true);
      }), timeout);
    };
    window.addEventListener('online', stayUpdated);
    window.addEventListener('offline', function() {
      console.lolg(OFFLINE_MESSAGE);
      clearInterval(intervalId);
      return updateBus();
    });
    if (navigator.onLine) {
      return stayUpdated(true);
    }
  });

}).call(this);
