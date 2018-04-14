var BOFactory             = require('../../business/boFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var business = BOFactory.getBO('alert');

  return {
    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var chain = Promise.resolve();

      var filter = {};
      filter.userId = req.currentUser.id;

      var sort = req.query.sort;
      var pagination = {};

      if (req.query.limit) {
        pagination.limit = parseInt(req.query.limit);
      }

      if (req.query.offset && req.query.limit) {
        pagination.skip = parseInt(req.query.offset) * pagination.limit;
      }

      chain
        .then(function() {
          return business.getTotalByFilter(filter);
        })
        .then(function(r) {
          res.set('X-Total-Count', r);
          return business.getAll(filter, pagination, sort);
        })
        .then(rh.ok)
        .catch(rh.error);
    },

    getUnreadAlerts: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var chain = Promise.resolve();
      var alerts = null;
      var info = {
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      chain
        .then(function() {
          return business.getUnreadAlerts(req.currentUser.id);
        })
        .then(function(r) {
          alerts = r;
          business.updateIsReadFlag(req.currentUser.id, info);
        })
        .then(function() {
          return alerts;
        })
        .then(rh.ok)
        .catch(rh.error);
    },

    getById: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var chain = Promise.resolve();

      chain
        .then(function() {
          return business.getById(req.params.id);
        })
        .then(rh.ok)
        .catch(rh.error);
    },
  };
};
