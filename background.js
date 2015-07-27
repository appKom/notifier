"use strict";

var iteration = 0;
var intervalId = null;

var mainLoop = function(force) {
  console.log("\n#" + iteration);

  if (ls.showCantina === 'true')
    if (force || iteration % UPDATE_CANTINAS_INTERVAL === 0)
      updateCantinas();
  if (force || iteration % UPDATE_NEWS_INTERVAL === 0)
    updateAffiliationNews('1');
  if (ls.showAffiliation2 === 'true')
    if (force || iteration % UPDATE_NEWS_INTERVAL === 0)
      updateAffiliationNews('2');
  // Only if hardware
  if (Affiliation.org[ls.affiliationKey1].hardware)
    if (force || iteration % UPDATE_AFFILIATION_INTERVAL === 0)
      updateAffiliation();

  // No reason to count to infinity
  if (10000 < iteration)
    iteration = 0;
  else
    iteration++;
};

//
// Status (office status, meetings, and servant for affiliation)
//

var updateAffiliation = function(callback) {
  console.log('updateAffiliation');
  // Fetch
  Affiliation.get(ls.affiliationKey1, function() {
    // Run relevant background updates
    if (Affiliation.org[ls.affiliationKey1].hardware) {
      updateStatusAndMeetings();
      updateCoffeeSubscription();
    }
    // Callback
    if (typeof callback === 'function') callback();
  });
};

var updateStatusAndMeetings = function(force, callback) {
  console.log('updateStatusAndMeetings');
  
  // Get meeting data
  var meeting = ls.meetingString;

  // Get status data
  var strings = JSON.parse(ls.statusStrings);
  var statusCode = strings.statusCode;
  var statusTitle = strings.statusTitle;
  var statusMessage = strings.statusMessage;

  // Update the icon and icon hover text if data is new
  if (force || ls.backgroundLastStatusCode !== statusCode || ls.backgroundLastStatusMessage !== statusMessage) {
    // Save them
    ls.backgroundLastStatusCode = statusCode;
    ls.backgroundLastStatusMessage = statusMessage;
    // Food status
    if (Object.keys(Affiliation.foods).indexOf(statusCode) > -1) {
      statusTitle = Affiliation.foods[status].title;
      Browser.setIcon(Affiliation.foods[statusCode].icon);
    }
    // Regular status
    else {
      // Set icon
      var errorIcon = Affiliation.org[ls.affiliationKey1].icon;
      var statusIcon = Affiliation.org[ls.affiliationKey1].hardware.statusIcons[statusCode];
      if (statusCode === 'error' || typeof(statusIcon) === 'undefined') {
        Browser.setIcon(errorIcon);
      }
      else {
        Browser.setIcon(statusIcon);
      }
    }
    // Extension title (hovering mouse over icon shows the title text).
    // This string is padded with one newline top and bottom, as well as two spaces on the left and right side of all strings.
    var today = '\n  ### Nå  \n  ' + statusTitle + ": " + statusMessage + "  \n\n  ### Resten av dagen  \n  " + meeting.replace(/\n/g, "  \n  ") + "\n";
    Browser.setTitle(today);
  }
  if (typeof callback === 'function') callback();
};

//
// Coffee
//

var updateCoffeeSubscription = function(callback) {
  console.log('updateCoffeeSubscription');
  // Get
  var coffeeData = JSON.parse(ls.coffeeData);
  // Hope for the best
  try {
    var date = coffeeData.date;
    var pots = coffeeData.pots;

    // No coffee yields pots=0 and date=null
    if (pots && date) {

      // Parse that date
      date = new Date(date);
      var age = Coffee.minuteDiff(date);

      // Check for NaN here
      if (!isNaN(pots) && !isNaN(age)) {
        var storedPots = Number(ls.coffeePots);
        // New pot number?
        if (storedPots < pots) {
          // Not a meeting? Or DEBUG mode.
          if (ls.backgroundLastStatusCode !== 'meeting') {
            // Made less than 10 minutes ago?
            if (age < 10) {
              // And no meme was served within the last 10 minutes?
              if ((Date.now() - Number(ls.coffeeMemeTime)) > 600000) {
                // Send meme to everyone who has a coffee subscription :D
                Coffee.showNotification(pots, age);
                ls.coffeeMemeTime = Date.now();
              }
              else {console.log('Nope to coffee, last one was less than 10 minutes ago')}
            }
            else {console.log('Nope to coffee, not made less than 10 minutes ago')}
          }
          else {console.log('Nope to coffee, there is a meeting going on')}
        }
        // And remember to update localStorage
        ls.coffeePots = pots;
      }
    }
    if (typeof callback === 'function') callback();
  }
  catch (e) {
    console.error(e);
  }
};

//
// Cantina
//

var updateCantinas = function(callback) {
  console.log('updateCantinas');
  // Fetch
  Cantina.get(ls.cantina1, function(result1) {
    Cantina.get(ls.cantina2, function(result2) {
      // Save
      ls.cantina1Data = JSON.stringify(result1);
      ls.cantina2Data = JSON.stringify(result2);
      // Callback
      if (typeof callback === 'function') callback();
    });
  });
};

//
// Affiliation news
//

var updateAffiliationNews = function(number, callback) {
  console.log('updateAffiliationNews'+number);
  // Get affiliation
  var affiliationKey = ls['affiliationKey'+number];
  var affiliation = Affiliation.org[affiliationKey];
  // Get news for this affiliation
  if (affiliation) {
    News.get(affiliation, function(posts) {
      // Error message, log it maybe
      if (typeof posts === 'string') {
        console.error(posts);
      }
      // Empty news posts, don't count
      else if (posts.length === 0) {
        updateUnreadCount(0, 0);
      }
      // News is here! NEWS IS HERE! FRESH FROM THE PRESS!
      else {
        saveAndCountNews(posts, number);
        updateUnreadCount();
        // fetchAndStoreImageLinks(number); // TODO: This needs to be a thing of the past ////////////
      }
      if (typeof callback === 'function') callback();
    });
  }
  else {
    console.error('Chosen affiliation "' + affiliationKey + '" is not known');
    if (typeof callback === 'function') callback();
  }
};

var saveAndCountNews = function(items, number) {
  var feedItems = 'affiliationNews' + number;
  var newsList = 'affiliationNewsList' + number;
  var unreadCount = 'affiliationUnreadCount' + number;
  var lastNotified = 'affiliationLastNotified' + number;

  ls[feedItems] = JSON.stringify(items);
  var list = JSON.parse(ls[newsList]);
  ls[unreadCount] = News.countNewsAndNotify(items, list, lastNotified);
  ls[newsList] = News.refreshNewsList(items);
};

var updateUnreadCount = function(count1, count2) {
  // TODO: Tag all news with a "read" boolean, use this for counting and showing which news are unread
  // TODO: If the user does not want noficiations from a source, then all should be marked as read
  var unreadCount = (Number(ls.affiliationUnreadCount1)) + (Number(ls.affiliationUnreadCount2));
  Browser.setBadgeText(String(unreadCount));
};

// var fetchAndStoreImageLinks = function(number) {
//   var key = ls['affiliationKey'+number];
//   var newsList = JSON.parse(ls['affiliationNewsList'+number]);
//   // If the organization has it's own getImage function, use it
//   if (Affiliation.org[key].getImage !== undefined) {
//     for (var i in newsList) {
//       var link = newsList[i];
//       // It's important to get the link from the callback within the function below,
//       // not the above code, - because of race conditions mixing up the news posts, async ftw.
//       Affiliation.org[key].getImage(link, function(link, image) {
//         if (null !== image[0]) {
//           var storedImages = JSON.parse(ls.storedImages);
//           storedImages[link] = image[0];
//           ls.storedImages = JSON.stringify(storedImages);
//         }
//       });
//     }
//   }
//   // If the organization has it's own getImages (plural) function, use it
//   if (Affiliation.org[key].getImages !== undefined) {
//     Affiliation.org[key].getImages(newsList, function(links, images) {
//       var storedImages = JSON.parse(ls.storedImages);
//       for (var i in links) {
//         if (null !== images[i]) {
//           storedImages[links[i]] = images[i];
//         }
//       }
//       ls.storedImages = JSON.stringify(storedImages);
//     });
//   }
// };

//
// Prepare Affiliations
// (must run before other affiliation things!)
// (executes itself once)
//

(function prepareAffiliations() {
  // Clears values that should start empty
  Affiliation.clearAffiliationData();
  // Check if both current affiliations still exist, reset if not
  var keys = Object.keys(Affiliation.org);
  Defaults.resetAffiliationsIfNotExist(ls.affiliationKey1, ls.affiliationKey2, keys);
  // Turn off hardwarefeatures if they're not available
  var isAvailable = (Affiliation.org[ls.affiliationKey1].hardware ? true : false);
  Defaults.setHardwareFeatures(isAvailable);
}());

//
// Load Affiliation Icon
// (executes itself once)
//

var loadAffiliationIcon = (function() {
  var load = function() {
    var key = ls.affiliationKey1;
    // Set badge icon
    var icon = Affiliation.org[key].icon;
    Browser.setIcon(icon);
    // Set badge title
    var name = Affiliation.org[key].name;
    Browser.setTitle(name + ' Notifier');
  }
  load(); // Run once
  return load; // Return for later use
}());

//
// Browser Setup
// (executes itself once)
//

(function browserSetup() {
  Browser.bindCommandHotkeys();
  Browser.registerNotificationListeners();
  Browser.bindOmniboxToOracle();
}());

//
// Daily Statistics
// (executes itself once)
//

(function dailyStatistics() {
  // Send some basic statistics once a day
  setInterval( function() {
    // App version is interesting
    Analytics.trackEvent('appVersion', Browser.getAppVersion() + ' @ ' + Browser.name);
    // Ever clicked edit? Interesting
    Analytics.trackEvent('everClickedEdit', ls.everClickedEdit);
    // Affiliation is also interesting, in contrast to the popup some of these are inactive users
    // To find inactive user count, subtract these stats from popup stats
    if (ls.showAffiliation2 !== 'true') {
      Analytics.trackEvent('singleAffiliation', ls.affiliationKey1);
      Analytics.trackEvent('affiliation1', ls.affiliationKey1);
    }
    else {
      Analytics.trackEvent('doubleAffiliation', ls.affiliationKey1 + ' - ' + ls.affiliationKey2);
      Analytics.trackEvent('affiliation1', ls.affiliationKey1);
      Analytics.trackEvent('affiliation2', ls.affiliationKey2);
    }
  }, 1000 * 60 * 60 * 24);
}());

//
// Document ready function
//

$(document).ready( function() {

  // Enter main loop, keeping everything up-to-date
  var stayUpdated = function(now) {
    console.info(ONLINE_MESSAGE);
    var loopTimeout = (DEBUG ? BACKGROUND_LOOP_DEBUG : BACKGROUND_LOOP);
    // Schedule for repetition
    intervalId = setInterval( function() {
      mainLoop();
    }, loopTimeout);
    // Run once right now (just wait 2 secs to avoid network-change errors)
    var timeout = (now ? 0 : 2000);
    setTimeout( function() {
      mainLoop(true);
    }, timeout);
  };
  // When offline, mainloop is stopped to decrease power consumption
  window.addEventListener('online', stayUpdated);
  window.addEventListener('offline', function() {
    console.warn(OFFLINE_MESSAGE);
    clearInterval(intervalId);
  });

  if (navigator.onLine) {
    // If Online, go ahead and start the stayUpdated-function
    stayUpdated(true);
  }
  else {
    // If offline, run mainloop once, it fetches error messages
    // Keep in mind: this here is at program startup, we have to get something to display
    mainLoop();
  }
});
