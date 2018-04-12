var BOFactory             = require('../../business/boFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var business = BOFactory.getBO('contact');

  return {
    getAll: function(req, res) {
      var chain = Promise.resolve();
      var rh = new HTTPResponseHelper(req, res);

      var filter = {
        userId: req.currentUser.id
      };

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

    save: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.userId = req.currentUser.id;
      business.save(req.body)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    update: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.userId = req.currentUser.id;
      req.body.id = req.params.id;
      business.update(req.body)
        .then(rh.ok)
        .catch(rh.error);
    },

    getById: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getById(req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    },

    delete: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.delete(req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
