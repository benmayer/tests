// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var path = require('path');
var express = require('express');
var session = require('cookie-session');
var spreadheets = require('edit-google-spreadsheet');

var app = express();
var config = require('./config')();

// Configure the session and session storage.
// MemoryStore isn't viable in a multi-server configuration, so we
// use encrypted cookies. Redis or Memcache is a great option for
// more secure sessions, if desired.
// [START session]
app.use(session({
  secret: config.secret,
  signed: true
}));
// [END session]

// OAuth2
var oauth2 = require('./lib/oauth2')(config.oauth2);
app.use(oauth2.router);

// Setup modules and dependencies
var model = require('./api/model')(config);


app.use('/api/spreadsheet', function(req, res){
  // GoogleSpreadsheets({
  //     key: '1A0FntcSV76QxWYCyWSgbv9Xu8lBH13Ac23SyL_V5kGc',
  //     auth: oauth2.getClient()
  // }, function(err, spreadsheet) {
  //     spreadsheet.worksheets[0].cells({
  //         range: 'R1C1:R5C5'
  //     }, function(err, cells) {
  //         // Cells will contain a 2 dimensional array with all cell data in the
  //         // range requested.
  //         console.log(cells);
  //         res.send(cells);
  //     });
  // });
});

// Redirect root to /books
app.get('/', function (req, res) {
  res.redirect('/books');
});

// Basic 404 handler
app.use(function (req, res) {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use(function (err, req, res, next) {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});

if (module === require.main) {
  // Start the server
  var server = app.listen(config.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
  });
}

module.exports = app;
