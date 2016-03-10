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
var Spreadsheet = require('edit-google-spreadsheet');

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

app.use('/api', require('./api/api')(model));
app.use('/private', require('./api/crud')(model, oauth2));

app.use('/api/spreadsheet', oauth2.required, function(req, res){

  console.log("url: /api/spreadsheet");

  Spreadsheet.load({
      debug: true,
      spreadsheetName: 'Demo Data',
      worksheetName: 'Total',

      // Choose from 1 of the 5 authentication methods:

      //    1. Username and Password has been deprecated. OAuth2 is recommended. 

      // OR 2. OAuth
      // oauth : {
      //   email: 'my-name@google.email.com',
      //   keyFile: 'my-private-key.pem'
      // },

      // OR 3. OAuth2 (See get_oauth2_permissions.js)
      oauth2: {
        client_id: config.oauth2.clientId,
        client_secret: config.oauth2.clientSecret,
        refresh_token: ''
      },

      // OR 4. Static Token
      // accessToken: {
      //   type: 'Bearer',
      //   token: 'my-generated-token'
      // },

      // OR 5. Dynamic Token
      // accessToken: function(callback) {
      //   //... async stuff ...
      //   callback(null, token);
      // }
    }, function sheetReady(err, spreadsheet) {
      //use speadsheet!
      if (err) {res.status(err.code).send(err.message || 'Something broke!')}
      console.log(spreadsheet)
    });
});

// Redirect root to /books
app.get('/', function (req, res) {
  // res.redirect('/books');
  var date = new Date();
  console.log('server response '+date);
  res.send('yo. ' + date);
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
