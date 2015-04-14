"use strict";

var DEBUG = 1;

// Production detection
if (Browser.inProduction()) {
	DEBUG = 0;
}

// Logging setup
console.lolg = function() {
	// Console logging that only happens in debug mode
	// The name "lolg" is a tribute to Lorents Odin Lervik Gravås
	if (DEBUG) {
		console.log.apply(console, arguments);
	}
};

// API servers
var API_SERVER_1 = 'http://passoa.online.ntnu.no/api/';
var API_SERVER_2 = 'http://online.duvholt.net/api/';

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
var MEME_AMOUNT = 30;

// Support lines to catch a heisenbug
if (window.DEBUG) {
    console.info('spent', Date.now() - window.timeHeisenbug, 'ms on everything before constants.js');
    window.timeHeisenbug = Date.now();
}