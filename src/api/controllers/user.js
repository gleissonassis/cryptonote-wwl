var BOFactory             = require('../../business/boFactory');
var UserHelper            = require('../../helpers/userHelper');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var userHelper = new UserHelper();
  var business = BOFactory.getBO('user');
  var notificationBO = BOFactory.getBO('notification');

  return {
    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getAll({})
        .then(rh.ok)
        .catch(rh.error);
    },

    save: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      if (!userHelper.isAdministrator(req.currentUser)) {
        req.body.role = 'user';
      }

      business.save(req.body)
        .then(function() {
          return business.generateToken(req.body.email, req.body.password, {
            ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          });
        })
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    update: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.id = req.params.id;

      if (!userHelper.isAdministrator(req.currentUser)) {
        req.body.role = 'user';
      }

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

    updateMe: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.id = req.currentUser.id;
      business.update(req.body)
        .then(rh.ok)
        .catch(rh.error);
    },

    getMe: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getById(req.currentUser.id, true)
        .then(rh.ok)
        .catch(rh.error);
    },

    delete: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.delete(req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    },

    auth: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.generateToken(req.body.email, req.body.password, {
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      })
        .then(rh.ok)
        .catch(rh.error);
    },

    getLoginHistory: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getLoginHistory(req.params.id)
        .then(rh.ok)
        .catch(rh.error);
    },

    confirmUser: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.confirmUser(req.params.id,
                          req.params.key,
                          {
                           ip: req.headers['x-forwarded-for'] ||
                               req.headers['x-real-ip'] ||
                               req.connection.remoteAddress,
                           userAgent: req.headers['user-agent']
                         })
        .then(rh.ok)
        .catch(rh.error);
    },

    sendNotification: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var data = req.body;
      data.userId = req.params.id;
      notificationBO.sendNotification(data)
        .then(rh.ok)
        .catch(rh.error);
    },

    resetPassword: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.resetPassword(req.params.id, req.params.key, req.body.newPassword)
        .then(rh.ok)
        .catch(rh.error);
    },

    updateToken: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.generateNewToken(req.currentUser)
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
