'use strict';

var chalk   = require('chalk');
var Task    = require('./task');
var debug   = require('debug')('ember-cli:watcher');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  verbose: true,

  init: function() {
    this._watcher();
  },

  _watcher: function() {
    var watcher = this.watcher;
    var _w;

    if (this._w) { return this._w; }
    if (watcher) {
      _w = Promise.resolve({
        watcher: watcher
      });
    } else {
      _w = new Promise(function(resolve) {
        var watcher = new (require('broccoli-sane-watcher'))(this.builder, {
          verbose: this.verbose,
          poll: false,
          watchman: true
        });

        resolve({
          watcher: watcher
        });
      }.bind(this));
    }

    return this._w = _w.then(function(w) {
      w.watcher.on('error', this.didError.bind(this));
      w.watcher.on('change', this.didChange.bind(this));
      
      return w;
    }.bind(this));
  },

  didError: function(error) {
    debug('didError %o', error);
    this.ui.writeError(error);
    this.analytics.trackError({
      description: error && error.message
    });
  },

  then: function(fulfillment, rejection) {
    return this._watcher().then(fulfillment, rejection);
  },

  didChange: function(results) {
    debug('didChange %o', results);
    var totalTime = results.totalTime / 1e6;

    this.ui.writeLine('');
    this.ui.writeLine(chalk.green('Build successful - ' + Math.round(totalTime) + 'ms.'));

    this.analytics.track({
      name:    'ember rebuild',
      message: 'broccoli rebuild time: ' + totalTime + 'ms'
    });

    this.analytics.trackTiming({
      category: 'rebuild',
      variable: 'rebuild time',
      label:    'broccoli rebuild time',
      value:    parseInt(totalTime, 10)
    });
  },

  on: function() {
    this.watcher.on.apply(this.watcher, arguments);
  },

  off: function() {
    this.watcher.off.apply(this.watcher, arguments);
  },

  polling: function () {
    return this.options && this.options.watcher === 'polling';
  }
});
