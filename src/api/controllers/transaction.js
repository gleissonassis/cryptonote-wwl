var BOFactory             = require('../../business/boFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var business = BOFactory.getBO('transaction');

  return {
    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var chain = Promise.resolve();

      var filter = {};

      if (req.params.address) {
        filter = {
          '$and': [
            {'$or': [{
              userId: req.currentUser.id,
              from: req.params.address,
              isEnabled: true
            },{
              userId: req.currentUser.id,
              'to.address': req.params.address,
              isEnabled: true
            }
            ]}
          ]
        };
      } else {
        filter.userId = req.currentUser.id;
      }

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

    createTransaction: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.userId = req.currentUser.id;
      business.createTransaction(req.body)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    getBlockchainTransaction: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getBlockchainTransaction(req.currentUser.id, req.params.id)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    getById: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      business.getById(req.currentUser.id, req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    },

    delete: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      business.delete(req.currentUser.id, req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    },

    parseCDALTransaction: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      business.parseCDALTransaction(req.body)
        .then(rh.ok)
        .catch(rh.error);
    },
  };
};
