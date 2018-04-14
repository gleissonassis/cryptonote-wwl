var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var alertDAO = dependencies.alertDAO;
  var modelParser = dependencies.modelParser;
  var dateHelper = dependencies.dateHelper;

  return {
    dependencies: dependencies,

    clear: function() {
      return alertDAO.clear();
    },

    getTotalByFilter: function(filter) {
      if (!filter) {
        filter = {};
      }

      logger.info('[AlertBO] Getting the total of items by filter ', JSON.stringify(filter));
      return alertDAO.getTotalByFilter(filter);
    },

    getAll: function(filter, pagination, sort) {
      return new Promise(function(resolve, reject) {
        if (!filter) {
          filter = {};
        }

        if (!sort) {
          sort = '-createdAt';
        }

        logger.info('[AlertBO] Listing all items by filter ',
          JSON.stringify(filter),
          JSON.stringify(pagination),
          JSON.stringify(sort));

        alertDAO.getAll(filter, pagination, sort)
          .then(function(r) {
            return r.map(function(item) {
              return modelParser.clear(item);
            });
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getUnreadAlerts: function(userId) {
      var filter = {
        'read.isRead': false,
        userId: userId
      };

      return this.getAll(filter);
    },

    createAlert: function(userId, type, systemMessage, data, info) {
      var alert = {
        userId: userId,
        type: type,
        systemMessage: systemMessage || 'System alert',
        data: data,
        createdAt: dateHelper.getNow(),
        read: {
          isRead: false,
          info: info
        }
      };

      return this.save(alert);
    },

    createLoginOkAlert: function(userId, data, info) {
      return this.createAlert(userId, 'LOGIN_OK', 'Login OK', data, info);
    },

    createFailedLoginAlert: function(userId, data, info) {
      return this.createAlert(userId, 'LOGIN_FAILED', 'Failed login', data, info);
    },

    createNewTransactionAlert: function(userId, data) {
      return this.createAlert(userId, 'TRANSACTION_NEW', 'New transaction', data, null);
    },

    createTransactionConfirmedAlert: function(userId, data) {
      return this.createAlert(userId, 'TRANSACTION_CONFIRMED', 'Transaction confirmed', data, null);
    },

    save: function(entity) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.debug('[AlertDAO] Saving the entity. Entity: ', JSON.stringify(entity));
            var o = modelParser.prepare(entity, true);
            o.createdAt = dateHelper.getNow();
            logger.debug('[AlertDAO] Entity  after prepare: ', JSON.stringify(o));
            return alertDAO.save(o);
          })
          .then(function(r) {
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getById: function(id) {
      return new Promise(function(resolve, reject) {
        alertDAO.getById(id)
          .then(function(mailTemplate) {
            if (mailTemplate) {
              return modelParser.clear(mailTemplate);
            } else {
              throw {
                status: 404,
                message: 'Alert not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    updateIsReadFlag: function(userId, info) {
      return alertDAO.updateIsReadFlag(userId, info);
    }
  };
};
