var BOFactory             = require('../../business/boFactory');
var UserHelper            = require('../../helpers/userHelper');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var userHelper = new UserHelper();
  var business = BOFactory.getBO('user');
  var notificationBO = BOFactory.getBO('notification');
  var alertBO = BOFactory.getBO('alert');

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
          return business.generateToken(req.body.email, req.body.password, null, {
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
      var chain = Promise.resolve();
      var user = null;
      var info = {
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      chain
        .then(function() {
          return business.generateToken(req.body.email, req.body.password, req.body.twoFactorAuthToken, info);
        })
        .then(function(r) {
          user = r;

          return alertBO.createLoginOkAlert(user.id, {email: req.body.email}, info);
        })
        .then(function() {
          return user;
        })
        .then(rh.ok)
        .catch(function(error) {
          //this promise will not part of this chain, it is just to notify
          //the user a failed login
          business.getByEmail(req.body.email)
            .then(function(r) {
              if (r) {
                alertBO.createFailedLoginAlert(r.id, {email: req.body.email, error: error}, info);
              }
            });

          rh.error(error);
        });
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
    },

    generate2FAToken: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.get2FAToken(req.currentUser.id, req.body.name)
        .then(rh.ok)
        .catch(rh.error);
    },

    configure2FAToken: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      var info = {
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };
      business.configure2FAToken(req.body.action === 'enable', req.currentUser.id, req.body.twoFactorAuthToken, info)
        .then(rh.ok)
        .catch(rh.error);
    },
  };
};
