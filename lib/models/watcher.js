'use strict';

var chalk   = require('chalk');
var Task    = require('./task');
var debug   = require('debug')('ember-cli:watcher');
var Promise = require('../ext/promise');
var exec    = Promise.denodeify(require('child_process').exec);
var os      = require('os');
var debug   = require('debug')('ember-cli:watcher');

module.exports = Task.extend({
  verbose: true,
  initialized: false,
  init: function() {
    debug('init');

    this.exec = this.exec || exec;
    this._watcher().then(function() {
      debug('didInitialize');
      this.initialized = true;
    }.bind(this)).catch(function(reason) {
      debug('failed to initialize %o \n %s', reason, reason && reason.stack);
    });
  },

  hasWatchman: function() {
    if (/win\d{2}/.test(os.platform())) {
      debug('hasWatchman windows -> false');
      return Promise.reject();
    } else {
      debug('hasWatchman: `which watchman`');
      return this.exec('which watchman');
    }
  },

  buildOptions: function() {
    if (this.polling()) {
      return Promise.resolve({
        polling: true,
        verbose: this.verbose,
        watchman: false
      });
    } else {
      return this.hasWatchman().then(function() {
        debug('buildOptions: watchman found');
        return {
          polling: false,
          verbose: this.verbose,
          watchman: this.node() === true ? false : true
        };
      }.bind(this), function() {
        debug('buildOptions: watchman not found');
        return {
          polling: false,
          verbose: this.verbose,
          watchman: false
        };
      }.bind(this));
    }
  },

  _watcher: function() {
    if (this._w) { return this._w; }

    return this._w = this.buildOptions().then(function(options) {
      debug('buildOptions %o', options);
      var watcher = this.watcher || new (require('broccoli-sane-watcher'))(this.builder, options);

      if (!this.watcher) {
        if (options.watchman) {
          this.ui.writeLine('using: WatchmanWatcher');
        } else if (options.polling) {
          this.ui.writeLine('using: PollWatcher');
        } else {
          this.ui.writeLine('could not find watchman, falling back to: NodeWatcher');
        }
      }

      watcher.on('error', this.didError.bind(this));
      watcher.on('change', this.didChange.bind(this));
      
      return watcher;
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
    debug('didChange: %o', results);
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
    var args = arguments;
    this.then(function() {
      this.watcher.on.apply(this.watcher, args);
    }.bind(this));
  },

  off: function() {
    var args = arguments;
    this.then(function() {
      this.watcher.off.apply(this.watcher, args);
    }.bind(this));
  },

  polling: function () {
    return this.options && this.options.watcher === 'polling';
  },

  node: function () {
    return this.options && this.options.watcher === 'node';
  }
});
