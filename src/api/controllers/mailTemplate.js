var BOFactory             = require('../../business/boFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var business = BOFactory.getBO('mailTemplate');

  return {
    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getAll({})
        .then(rh.ok)
        .catch(rh.error);
    },

    save: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.save(req.body)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    update: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
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
