'use strict';

var assert        = require('../../../helpers/assert');
var ExpressServer = require('../../../../lib/tasks/server/express-server');
var MockUI        = require('../../../helpers/mock-ui');
var MockProject   = require('../../../helpers/mock-project');
var http          = require('http');

describe('express-server', function() {
  var subject, ui, project;

  describe('output', function() {
    beforeEach(function() {
      ui = new MockUI();
      project = new MockProject();

      subject = new ExpressServer({
        ui: ui,
        project: project
      });
    });

    it('with proxy', function() {
      return subject.start({
        proxy: 'http://localhost:3001/',
        host:  '0.0.0.0',
        port: '1337',
      }).then(function() {
        var output = ui.output.trim().split('\n');
        assert.deepEqual(output[1], 'Serving on http://0.0.0.0:1337');
        assert.deepEqual(output[0], 'Proxying to http://localhost:3001/');
        assert.deepEqual(output.length, 2, 'expected only two lines of output');
      });
    });

    it('without proxy', function() {
      return subject.start({
        host:  '0.0.0.0',
        port: '1337'
      }).then(function() {
        var output = ui.output.trim().split('\n');
        assert.deepEqual(output[0], 'Serving on http://0.0.0.0:1337');
        assert.deepEqual(output.length, 1, 'expected only one line of output');
      });
    });
  });

  describe('behaviour', function() {
    describe('with proxy', function() {
      var origin;
      var port = 8811;
      var hostname = '0.0.0.0';
      var server;

      before(function() {
        ui = new MockUI();
        project = new MockProject();

        server = new ExpressServer({
          ui: ui,
          project: project
        });

        origin = http.createServer(function (req, res) {
          res.writeHead(200, {
            'Content-Type': 'text/plain'
          });

          res.end('hello, world!');
        });

        origin.listen(8011);

        return server.start({
          /*proxy: 'http://0.0.0.0:' + proxyPort + '/',*/
          proxy: 'http://0.0.0.0:' + 9999 + '/',
          host:  hostname,
          port:  port
        });
      });

      after(function(){
        origin.close();
      });

      it.only('proxies GET',    function(done) {
        var requestOptions = {
          hostname: 'localhost',
          port: 8011,
          path: '/upload',
          method: 'POST'
        };

        console.log('request:', requestOptions);

        http.request(requestOptions, function(res) {
          console.log('oooo');
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
          });

          res.on('end', function(){
            server.close();
          });

          res.on('error', function(reason) {
            console.error(reason);
            done(reason);
          });
        });
      });

      it('proxies PUT',    function() { });
      it('proxies POST',   function() { });
      it('proxies DELETE', function() { });
    });
  });
});
