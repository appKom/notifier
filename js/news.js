"use strict";

var News = {
  debug: 0,
  msgAffiliationRequired: 'Tilhørighet må spesifiseres',
  msgUnknownFeedType: 'Ukjent type nyhetsstrøm, verken RSS eller Atom, what is it precious?',
  msgUnsupportedType: 'Tilhørigheten har et nyhetsformat som ikke støttes enda',
  msgCallbackRequired: 'Callback er påkrevd',
  msgFeedConnectionError: 'Frakoblet fra feeden til ',
  msgNoDescription: 'Uten tekst',
  msgNoTitle: 'Uten tittel',
  newsLimit: 10, // Get more news than needed to check for old news that have been updated
  newsLimitToShow: 4, // How many news posts we will actually show
  unreadMaxCount: 3, // 0-indexed like the list its counting, actually +1

  _autoLoadDefaults_: function() {
    if (ls.showNotifications1 === undefined)
      ls.showNotifications1 = 'true';
    if (ls.showNotifications2 === undefined)
      ls.showNotifications2 = 'true';
  },

  get: function(affiliation, callback) {
    // News.get() is called by the background page periodically
    if (typeof affiliation === 'undefined') {
      console.error(this.msgAffiliationRequired);
      return;
    }
    if (typeof callback === 'undefined') {
      console.error(this.msgCallbackRequired);
      return;
    }

    // Fetching news and images for an arbitrary number of affiliations
    // who are using arbitrary website solutions, feeds and APIs is a
    // complex task with _lots_ of edge cases.
    //
    // Therefore it is _critical_ to understand what goes on here.
    // Fortunately, it is rather simple when boiled down to pseudo code:
    //
    // News.get
    //   Website?
    //     Scraping, finds images too
    //   Json?
    //     Parsing, finds images too
    //   Feed?
    //     Feed with images?
    //       Parsing, finds images too
    //     Feed without images?
    //       Request all site links from feed posts
    //         Scrape each returned site for news image

    //
    // First, find out how we are going to get news for this affiliation
    //

    switch (affiliation.news.type) {
      case "website": {
        if (this.debug) console.info('News: Via website for', affiliation.name);
        this.fetchWebsite(affiliation, callback);
        break;
      }
      case "json": {
        if (this.debug) console.info('News: Via JSON for', affiliation.name);
        this.fetchJson(affiliation, callback);
        break;
      }
      case "feed": {
        if (this.debug) console.info('News: Via feed for', affiliation.name);
        this.fetchFeed(affiliation, callback);
        break;
      }
      default: {
        console.error(this.msgUnsupportedType);
      }
    }

    // Oh, and while we are explaining stuff. This is what
    // the array of posts looks like. Array of posts:
    //
    // [
    //   0: {
    //     title: "something"
    //     link: "some link"
    //     image: "some image"
    //     description: "some stuff"
    //     author: "someone"
    //   },
    //   1: {
    //     and so on...
    //   },
    // ],
  },

  //
  // Fetch functions
  // Fetches from websites, APIs and news feeds
  //

  fetchWebsite: function(affiliation, callback) {
    var self = this;
    // Fetch the organization's website
    Ajaxer.getCleanHtml({
      url: affiliation.web,
      success: function(website) {
        // Now we have fetched the website, time to scrape for posts
        affiliation.news.scrape(website, self.newsLimit, function(posts) {
          // Now we have the news posts, time to scrape for images and finish up
          self.fetchImagesAndFinishUp(affiliation, posts, callback);
        });
      },
      error: function(e) {
        console.error('Could not fetch ' + affiliation.name + ' website');
      },
    });
  },

  fetchJson: function(affiliation, callback) {
    var self = this;
    // Fetch JSON from the organization's API
    Ajaxer.getJson({
      url: affiliation.news.url,
      success: function(json) {
        // Now we have fetched the JSON, time to parse it
        affiliation.news.parse(json, self.newsLimit, function(posts) {
          // Now we have the news posts, time to scrape for images and finish up
          self.fetchImagesAndFinishUp(affiliation, posts, callback);
        });
      },
      error: function(e) {
        console.error('Could not fetch from ' + affiliation.name + ' JSON API');
      },
    });
  },

  fetchFeed: function(affiliation, callback) {
    var self = this;
    // Fetch RSS or Atom feed
    Ajaxer.getXml({
      url: affiliation.news.feed,
      success: function(xml) {
        // Now we have fetched the feed, time to parse it
        self.parseFeed(xml, affiliation, self.newsLimit, function(posts) {
          // Now we have the news posts, time to scrape for images and finish up
          self.fetchImagesAndFinishUp(affiliation, posts, callback);
        });
      },
      error: function(jqXHR, text, err) {
        // Misconfigured servers will send XML with HTML headers
        if (jqXHR.status == 200 && jqXHR.responseText && jqXHR.responseText.match(/^\<\?xml/) != null) {
          var xml = jqXHR.responseText;
          this.success(xml);
        }
        // Else, actual error
        else {
          var errorMsg = self.msgFeedConnectionError + affiliation.name;
          console.error(errorMsg);
          callback(errorMsg);
        }
      },
    });
  },

  //
  // Finishup
  // Called after the above fetch functions,
  // fetches images and calls postprocessing
  //

  fetchImagesAndFinishUp: function(affiliation, posts, callback) {

    // Minor helper function to keep things DRY
    var postProcessHelper = function(posts, affiliation) {
      for (var i in posts) {
        posts[i] = this.postProcess(posts[i], affiliation);
      }
      return posts;
    }.bind(this);

    // We now have the parsed posts, but we (likely) need to get images for them
    if (affiliation.news.imageScraping !== undefined) {
      if (this.debug) console.log('News: Affiliation is "' + affiliation.name + '", image fetching is', affiliation.news.imageScraping);
      Images.get(posts, affiliation, function(posts) {
        posts = postProcessHelper(posts, affiliation);
        callback(posts);
      });
    }
    // Otherwise, no need for image scraping, just postprocess and do callback
    else {
      if (this.debug) console.log('News: Affiliation is "' + affiliation.name + '", no image fetching specified');
      posts = postProcessHelper(posts, affiliation);
      callback(posts);
    }
  },

  //
  // Feed parsing
  //

  // Need to know about the news feeds used in Online Notifier:
  // These RSS fields are always used:
  // - title
  // - link
  // - desc - often wrapped in <![CDATA[content here]]>
  // These RSS fields are sometimes used:
  // - guid - usually the same as link
  // - pubDate
  // - category
  // - dc:creator - author name or username
  // - enclosure - may contain an image as an XML attribute: url="news_post_image.jpg"
  // - link - may contain an image as an XML attribute: href="news_post_image.jpg"
  // - source
  // In Atom feeds, these are the usual fields:
  // - id - a useless ID
  // - published - the publishing date, must be parsed
  // - updated - the updated date, must be parsed
  // - title
  // - content - is the full entry as HTML
  // - link[rel="self"] - is this entry in XML format, useless
  // - link[rel="alternate"] - is the entry as text/html, good!
  // - author -> name - name is a subtag of the author tag
  parseFeed: function(xml, affiliation, limit, callback) {
    var posts = [];
    var self = this;
    var count = 0;

    // RSS feed?
    if ($(xml).find('item').length != 0) {
      // Parse each RSS item
      $(xml).find('item').each( function() {
        if (count++ < limit) {
          var item = self.parseRssItem(this, affiliation);
          posts.push(item);
        }
      });
      callback(posts);
    }

    // Atom feed?
    else if ($(xml).find('entry').length != 0) {
      // Parse each Atom entry
      $(xml).find('entry').each( function() {
        if (count++ < limit) {
          var entry = self.parseAtomEntry(this, affiliation);
          posts.push(entry);
        }
      });
      callback(posts);
    }

    // Unknown feed type
    else {
      console.error(this.msgUnknownFeedType);
    }
  },

  parseRssItem: function(item, affiliation) {
    var post = {};

    //
    // Title field
    //

    // - "If I've seen RSS feeds with multiple title fields in one item? Why, yes. Yes I have." - MrClean
    post.title = $(item).find("title").filter(':first').text();
    post.title = this.stripCdata(item, 'title', post.title);

    //
    // Link field
    //

    post.link = $(item).find("link").filter(':first').text();
    if (post.link.trim() === '') {
      // If link field is broken by jQuery (dammit moon moon)
      // then check GUID field for a link instead (e.g. Adressa)
      var guid = $(item).find('guid').filter(':first').text();
      if (guid.indexOf('http') !== -1) {
        post.link = guid;
      }
    }

    //
    // Description field
    //

    // First, try to get HTML, if not working try getting text
    post.description = $(item).find("description").filter(':first').html();
    if (typeof post.description === 'undefined') {
      post.description = $(item).find("description").filter(':first').text();
    }
    try {
      // Some feeds have better news descriptions in the "content:encoded" rather
      // than in the "description" field, e.g. HC's feed
      var encodedContent = $(item).find("content\\:encoded").filter(':first').text();
      if (encodedContent === '') {
        // In case browser does not grok tags with colons, stupid browser
        encodedContent = $(item).find("encoded").filter(':first').text();
      }
      post.description = encodedContent;
    }
    catch (err) {
      // Do nothing, we were just checking, move along quitely
    }
    post.description = this.stripCdata(item, 'description', post.description);

    //
    // Creator field
    //

    post.creator = $(item).find("dc\\:creator").filter(':first').text();
    if (post.creator === '') {
      // In case browser does not grok tags with colons, stupid browser
      post.creator = $(item).find("creator").filter(':first').text();
    }
    if (post.creator === '') {
      // Check for author in rarely used <author> field
      // - Universitetsavisa and Adressa uses this
      var author = $(item).find("author").filter(':first').text();
      if (author !== '') {
        author = author.trim();
        var pieces = author.match(/[a-zA-Z0-9æøåÆØÅ\.\- ]+/g);
        if (pieces !== null) {
          post.creator = pieces[pieces.length-1];
        }
      }
    }

    //
    // Date field
    //

    post.date = $(item).find("pubDate").filter(':first').text().substr(5, 11);

    //
    // Image field
    //

    // Check for image in <content:encoded> and in rarely used tags <enclosure> and <bilde>
    post.image = '';
    try {
      // Some feeds use encoded content, which often contains an image src
      var encodedContent = $(item).find("content\\:encoded").filter(':first').text();
      if (encodedContent === '') {
        // In case browser does not grok tags with colons, stupid browser
        encodedContent = $(item).find("encoded").filter(':first').text();
      }
      if (encodedContent !== '') {
        post.image = this.checkDescriptionForImageLink(post.image, encodedContent, affiliation.web);
      }
      // Samfundet uses this little trick to get images in their feed
      var linkEnclosure = $(item).find('link[rel="enclosure"]').filter(':first');
      if (linkEnclosure.length !== 0) {
        post.image = linkEnclosure['0'].attributes.href.value;
        post.image = post.image.split('?')[0];
      }
      // Universitetsavisa/Adressa does this little trick to get images in their feed
      var enclosure = $(item).find('enclosure').filter(':first');
      if (enclosure.length !== 0) {
        if (enclosure['0'].attributes.type.value.match(/image/g) !== null) {
          if (this.debug) console.warn('News: Found image in enclosure', enclosure['0'].attributes);
          post.image = enclosure['0'].attributes.url.value;
          post.image += '?isimage=.jpg'; // Help image-URLs without file extension pass through Images.control()
        }
      }
      // Gemini uses this rather blunt hack to put images in their feed
      var bilde = $(item).find('bilde');
      if (bilde.length !== 0) {
        post.image = bilde['0'].value;
      }
    }
    catch (err) {
      // Do nothing, we were just checking, move along quitely
    }

    //
    // Done
    //

    return post;
  },

  parseAtomEntry: function(entry, affiliation) {
    var post = {};

    // Title field
    post.title = $(entry).find("title").filter(':first').text();

    // Link field
    post.link = $(entry).find("link[rel='alternate'][type='text/html']").filter(':first').attr('href');
    if (isEmpty(post.link))
      post.link = $(entry).find("link[rel='alternate']").filter(':first').attr('href');

    // Description field
    post.description = $(entry).find("content").filter(':first').text();
    if (isEmpty(post.description))
      post.description = $(entry).find("summary").filter(':first').text();

    // Creator field
    post.creator = $(entry).find("author name").filter(':first').text();

    // Date field
    post.date = $(entry).find("published").filter(':first').text();
    var dateTest = new Date(post.date.substr(5,11));
    if (dateTest != 'Invalid Date') {
      post.date = dateTest.toDateString();
    }
    else {
      dateTest = new Date(post.date);
      post.date = dateTest.toDateString();
    }
    if (post.date == 'Invalid Date') {
      post.date = null;
    }

    return post;
  },

  //
  // Post processing of news posts
  //

  postProcess: function(post, affiliation) {
    // All posts from all sources must go through postprocessing.

    //
    // Tag the post
    //

    // Tag the posts with the key and name of the source affiliation
    post.feedKey = affiliation.key;
    post.feedName = affiliation.name;

    //
    // Image field
    //

    // If we haven't found a good image, scour the description for an alternative, arrrr
    // NOTE: This must be done before HTML is removed during postprocessing of the description! (look below)
    if (isEmpty(post.image) || post.image === affiliation.placeholder) {
      post.image = this.checkDescriptionForImageLink(post.image, post.description, affiliation.web);
    }
    // Do a check to see that the image we found was not useless
    if (Images.control(post.image) === false) {
      post.image = affiliation.placeholder;
    }

    //
    // Title field
    //

    post.title = this.treatTextField(post.title, this.msgNoTitle);

    //
    // Link field
    //

    // Trim link either way
    post.link = post.link.trim(); // This is muy importanté for everything to work well later on

    //
    // Description field
    //

    post.description = this.treatTextField(post.description, this.msgNoDescription);
    // Remove HTML from description (must be done AFTER checking for CDATA tags)
    // NOTE: This must be done after the description is checked for an image link (look above)
    post.description = post.description.replace(/<[^>]*>/g, ''); // Tags
    // post.description = post.description.replace(/&(#\d+|\w+);/g, ''); // Entities, this works, but ppl should be allowed to use entitites

    //
    // Creator field
    //

    // Didn't find a creator, set the feedname as creator
    if (post.creator == undefined || post.creator.length == 0)
      post.creator = post.feedName;
    // Capitalize creator name either way
    post.creator = post.creator.capitalize();
    // Remove unnecessary inline spaces
    post.creator = post.creator.replace(/\s+/g,' ');
    // Abbreviate long creator names
    if (post.creator != affiliation.name) {
      if (post.creator.indexOf(',') !== -1) {
        // Multiple authors, abbreviate each separately
        var authors = post.creator.split(',');
        for (var i = 0; i < authors.length; i++) {
          authors[i] = this.abbreviateName(authors[i]);
        }
        post.creator = authors.join(',');
      }
      else {
        post.creator = this.abbreviateName(post.creator);
      }
    }

    //
    // Date field
    //

    // In case pubDate didn't exist, set to null
    if (post.date == '')
      post.date = null;

    //
    // Done
    //

    return post;
  },

  refreshNewsList: function(items) {
    var freshList = [];
    items.forEach(function(item, index) {
      freshList.push(item.link);
    });
    return JSON.stringify(freshList);
  },

  countNewsAndNotify: function(items, newsList, lastNotifiedName) {
    var unreadCount = 0;
    var maxNewsAmount = this.unreadMaxCount;
    if (items.length-1 < maxNewsAmount)
      maxNewsAmount = items.length-1;

    // Count feed items
    var self = this;
    for (var i=0; i<items.length; i++) {

      var item = items[i];
      var link = item.link;

      // Counting...
      if (newsList.indexOf(link) === -1) {
        unreadCount++;
        // Send a desktop notification about the first new item
        if (unreadCount == 1) {
          if (ls[lastNotifiedName] != link) {
            ls[lastNotifiedName] = item.link;
            self.showNotification(item);
          }
        }
      }
      // All counted :)
      else {
        if (unreadCount == 0) {
          if (self.debug) console.log('No new posts');
          return 0;
        }
        else if (maxNewsAmount <= unreadCount) {
          if (self.debug) console.log(maxNewsAmount + '+ unread posts');
          return maxNewsAmount + 1;
        }
        else {
          if (self.debug) console.log('1-' + (maxNewsAmount - 1) + ' unread posts');
          return unreadCount;
        }
      }

      // Stop counting if unread number is greater than maxNewsAmount
      if ((maxNewsAmount - 1) < i) { // Remember i is counting 0
        if (self.debug) console.log((maxNewsAmount + 1) + ' unread posts (stopped counting)');
        return maxNewsAmount + 1;
      }
    };

    // We'll usually not end up here
    if (items.length == 0) {
      if (this.debug) console.log('no items to count!');
    }
    else {
      if (this.debug) console.error('something went wrong trying to count these items:', items);
    }
    return 0;
  },

  /*
   * Demo item contains:
   * - demo: true
   * - key: 'someAffiliation'
   * Normal item contains:
   * - title: 'Some news'
   * - description: 'Some ~tweet sized description'
   * - link: 'http://somedomain.com/somearticle'
   * - feedKey: 'someAffiliation'
   * - OPTIONAL image: 'http://somedomain.com/somearticle/someimage.png'
   */
  showNotification: function(item) {
    // Fail?
    if (item === undefined) {
      console.error('News.showNotification got an undefined item to show. If you are trying to use demo mode, check description in this function.');
      return;
    }
    // Demo mode
    if (item.demo) {
      var image = Affiliation.org[item.feedKey].placeholder;
      image = Browser.getUrl(image);
      item = {
        title: Affiliation.org[item.feedKey].name + ' Notifier',
        description: 'Slik ser et nyhetsvarsel ut.\n"Testing.. 3.. 2.. 1.. *Liftoff!*"',
        link: Affiliation.org[item.feedKey].web,
        image: image,
        feedKey: item.feedKey,
      }
      // Need to run it by the background process because the event listeners are there
      Browser.getBackgroundProcess().Browser.createNotification(item);
    }
    // Normal mode
    else {
      if (this.debug) console.log('News: Showing notification "' + item.title + '"');
      var showIt = function() {
        if ((item.feedKey === ls.affiliationKey1 && ls.showNotifications1 === 'true') || (item.feedKey === ls.affiliationKey2 && ls.showNotifications2 === 'true')) {

          // Save timestamp
          ls.lastNotifiedTime = new Date().getTime();

          // TODO: For the two methods of getting images below; whenever a broken
          // image link is used, the notification will never show. A solution to
          // this (should we ever bother) is to test-load the image first and not
          // use if it the link is clearly broken.

          Browser.createNotification(item);
        }
      }
      // Make sure notifications are sent with at least 10 seconds inbetween
      var showTime = 0;
      var lastTime = ls.lastNotifiedTime;
      if (isNumber(lastTime)) {
        var diff = new Date().getTime() - lastTime;
        if (diff < 10000) { // less than 10 seconds?
          showTime = 10000;
        }
      }
      // Debugging? Show it instantly
      if (DEBUG) showTime = 0;
      // Showtime, show it!
      setTimeout(showIt, showTime);
    }
  },

  //
  // Utility functions
  //

  stripCdata: function(item, tagName, postField) {
    // If feed uses CDATA-tags in title and description we need to be more clever
    // to get the information we want outta there (e.g. Adressa)
    if (postField.trim() == '' || postField.match('CDATA') != null) {
      var string = $(item).find(tagName).filter(':first')['0']['innerHTML'];
      if (typeof string != 'undefined') {
        string = string.replace(/(\<|&lt;)?!(\-\-)?\[CDATA\[/g, '');
        string = string.replace(/\]\](\-\-)?(\>|&gt;)?/g, '');
        return string;
      }
    }
    return postField;
  },

  treatTextField: function(field, onEmptyText) {
    // Decode HTML entities
    field = $('<div/>').html(field).text();
    // Remove multiple whitespace
    field = field.replace(/\s\s+/g,'');
    // Remove meta information from title or description, within curly brackets {}
    field = field.replace(/\{.*\}/gi,'');
    // Shorten 'bedriftspresentasjon' to 'bedpres'
    field = field.replace(/edrift(s)?presentasjon/gi, 'edpres');
    // Trimming
    field = field.trim();
    // Empty field?
    if (field == '')
      field = onEmptyText;
    return field;
  },

  checkDescriptionForImageLink: function(oldImage, description, website) {
    // This function is far from perfect, but it does the job in most cases
    var pieces = description.match(/src="(.*?(\.(jpg|bmp|png)))("|\?)/i);
    if (pieces != null) {
      var image = pieces[1];
      // No HTML in the resulting string?
      if (image.match(/[\<\>]/g) === null) {
        if (image.startsWith('http')) {
          // Assume image with direct link
          return image;
        }
        else if (image.startsWith('//')) {
          // Assume image with direct link, but optional protocol
          return 'http' + image;
        }
        else {
          // Assume image with relative link
          return website + image;
        }
      }
    }
    // Check for YouTube-links as well (we can fetch thumbnail images)
    pieces = description.match(/youtube.com\/embed\/([a-z0-9_\-]+)/i);
    if (pieces != null) {
      var id = pieces[1];
      // A YouTube thumbnail has the format http://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg
      return 'http://img.youtube.com/vi/' + id + '/0.jpg';
    }
    return oldImage;
  },

  abbreviateName: function(oldName) {
    if (typeof oldName != 'undefined') {
      // Abbreviate middle names if name is long
      if (18 < oldName.length) {
        var pieces = oldName.split(' ');
        if (2 < pieces.length) {
          // Add first name
          var newName = pieces[0];
          // Add one letter per middle name
          for (var i = 1; i < pieces.length - 1; i++)
            newName += ' ' + pieces[i].charAt(0).toUpperCase() + '.';
          // Add last name
          newName += ' ' + pieces[pieces.length-1];
          return newName;
        }
      }
    }
    else {
      if (this.debug) console.error('cannot abbreviate an undefined name');
    }
    return oldName;
  },

}

// Auto-load self
News._autoLoadDefaults_();
