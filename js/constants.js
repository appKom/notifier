"use strict";

//
// Debugging
//

// Declare DEBUG constant, but be sure we aren't in production
var DEBUG = Browser.inProduction() ? false : true;

// Disable logging if in production
if (!DEBUG) {
	window.console = {};
	window.console.log = function(){};
	window.console.info = function(){};
	window.console.warn = function(){};
	window.console.error = function(){};
}

//
// All other constants
//

// API servers
var API_SERVER_2 = 'http://passoa.online.ntnu.no/api/';
var API_SERVER_1 = 'http://online.duvholt.net/api/';

// Loops & intervals
var BACKGROUND_LOOP = 60000; // 60s
var BACKGROUND_LOOP_DEBUG = 5000; // 5s, respond fairly quickly for us developers
var PAGE_LOOP = 10000; // 10s
var PAGE_LOOP_DEBUG = 5000; // 5s
var ONLINE_MESSAGE = '\nNow online, run mainloop\n';
var OFFLINE_MESSAGE = '\nNow offline, stop execution\n';

// Update stuff at every X intervals
var UPDATE_AFFILIATION_INTERVAL = 1; // recommended: 1
var UPDATE_CANTINAS_INTERVAL = 60; // recommended: 60
var UPDATE_BUS_INTERVAL = 2; // recommended: 1
var UPDATE_NEWS_INTERVAL = 20; // recommended: 20

// Hard totals
// It's this, or doing synchronous XMLHttpRequests, which have been deprecated in Chrome now, so.. yeah.
var MEME_AMOUNT = 31;
