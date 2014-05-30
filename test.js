/* jshint node: true */
'use strict';

var http = require('http');

var options = {
  hostname: 'localhost',
  port: 8011,
  path: '/upload',
  method: 'POST'
};

var http = require('http');

var server = http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('hello, world!');
});

server.listen(8011);

var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });

  res.on('end', function(){
    server.close();
  });

});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.write('data\n');
req.write('data\n');
req.end();
