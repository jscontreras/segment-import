/**
 * Segment helper library.
 */

(function() {
  var request = require('request');
  var path = 'https://api.segment.io/v1/import/';

  module.exports = {
    batchImport: function batchImport(writeKey, batch, fn) {
      var auth = {
        user: writeKey || '',
        pass: ''
      };
      var opts = {
        uri: path,
        method: 'POST',
        timeout: 50000,
        followRedirect: true,
        maxRedirects: 10,
        auth: auth,
        body: batch,
        json: true
      };
      request(opts, fn);
    },
    singleImport: function batchImport(writeKey, record, fn) {
      var pathSpec = 'https://api.segment.io/v1/' + record.method;
      var auth = {
        user: writeKey || '',
        pass: ''
      };
      var opts = {
        uri: pathSpec,
        method: 'POST',
        timeout: 50000,
        followRedirect: true,
        maxRedirects: 10,
        auth: auth,
        body: record,
        json: true
      };
      request(opts, fn);
    }
  };

}());