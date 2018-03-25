var BOFactory             = require('../../business/boFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');
var UserHelper            = require('../../helpers/userHelper');

module.exports = function() {
  var business = BOFactory.getBO('address');
  var userHelper = new UserHelper();

  return {
    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      var filter = {};

      if (!userHelper.isAdministrator(req.currentUser)) {
        filter.userId = req.currentUser.id;
      }

      business.getAll(filter)
        .then(rh.ok)
        .catch(rh.error);
    },

    createAddress: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.createAddress(req.currentUser.id)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    updateBalance: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.updateBalance(req.currentUser.id, req.params.address)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    getByAddress: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var userId = null;

      if (!userHelper.isAdministrator(req.currentUser)) {
        userId = req.currentUser.id;
      }

      business.getByAddress(userId, req.params.address)
        .then(rh.ok)
        .catch(rh.error);
    },

    delete: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var userId = null;

      if (!userHelper.isAdministrator(req.currentUser)) {
        userId = req.currentUser.id;
      }

      business.delete(userId, req.params.address)
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
