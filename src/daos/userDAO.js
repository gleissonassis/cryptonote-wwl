var logger              = require('winston');
var model               = require('../models/user')();
var Promise             = require('promise');
var $                   = require('mongo-dot-notation');

module.exports = function() {
  var projectionAllFields = {
    password: false,
    __v: false,
    isEnabled: false,
    loginHistory: false,
  };

  var projectionCommonFields = {
    password: false,
    __v: false,
    isEnabled: false,
    wallet: false,
    loginHistory: false,
    isEnabled: false,
    confirmation: false,
    internalKey: false
  };

  return {
    clear: function() {
      return new Promise(function(resolve, reject) {
        model.remove({}, function(err) {
          if (err) {
            logger.error('[UserDAO] An error has occurred while deleting all users', error);
            reject(err);
          } else {
            logger.info('[UserDAO] The users have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter, allFields, includeLoginHistory) {
      return new Promise(function(resolve, reject) {
        logger.info('[UserDAO] Getting users from database', filter);

        var projection = {};

        if (!allFields) {
          projection = Object.assign({}, projectionCommonFields);
        } else {
          projection = Object.assign({}, projectionAllFields);
        }

        if (includeLoginHistory) {
          delete projection.loginHistory;
        }

        logger.debug('includeLoginHistory:' , includeLoginHistory);
        logger.debug('Projection configuration ', projection);

        model.find(filter, projection)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('[UserDAO] %d users were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.error('[UserDAO] An error has ocurred while getting users from database', erro);
            reject(erro);
          });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[UserDAO] Creating an new user', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.info('[UserDAO] The user has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('[UserDAO] An error has ocurred while saving a new user', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },


    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.info('[UserDAO] Update a user');

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.info('[UserDAO] The user has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('[UserDAO] An error has ocurred while updateing an user', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    getById: function(id, allFields, includeLoginHistory) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[UserDAO] Getting a user by id %s', id);
        logger.debug('[UserDAO] includeLoginHistory:' , includeLoginHistory);

        self.getAll({_id: id, isEnabled: true}, allFields, includeLoginHistory)
        .then(function(users) {
          if (users.length === 0) {
            resolve(null);
            logger.info('[UserDAO] User not found');
          } else {
            resolve(users[0]);
            logger.info('[UserDAO] The user was found');
          }
        }).catch(function(erro) {
            logger.error('[UserDAO] An error has occurred while geeting an user by id %s', id, erro);
            reject(erro);
        });
      });
    },

    getByConfirmationKey: function(id, confirmationKey) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[UserDAO] Getting a user by confirmation key %s', id);

        self.getAll({_id: id, 'confirmation.key': confirmationKey, 'confirmation.isConfirmed': false, isEnabled: true})
        .then(function(users) {
          if (users.length === 0) {
            logger.info('[UserDAO] User not found');
            return null;
          } else {
            logger.info('[UserDAO] The user was found');
            return users[0];
          }
        })
        .then(resolve)
        .catch(function(erro) {
            logger.error('[UserDAO] An error has occurred while geeting an user confirmation key %s', id, erro);
            reject(erro);
        });
      });
    },

    getByInternalKey: function(id, internalKey) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[UserDAO] Getting a user by internal key %s', id);

        self.getAll({_id: id, internalKey: internalKey, isEnabled: true})
        .then(function(users) {
          if (users.length === 0) {
            logger.info('[UserDAO] User not found');
            return null;
          } else {
            logger.info('[UserDAO] The user was found');
            return users[0];
          }
        })
        .then(resolve)
        .catch(function(erro) {
            logger.error('[UserDAO] An error has occurred while geeting an user by internal key %s', id, erro);
            reject(erro);
        });
      });
    },

    confirmUser: function(id, confirmationKey, info) {
      return this.update({
        _id: id,
        confirmation: {
          info: info,
          date: new Date(),
          key: confirmationKey,
          isConfirmed: true
        }
      });
    },

    resetPassword: function(id, newInternalKey, newPassword) {
      return this.update({
        _id: id,
        password: newPassword,
        internalKey: newInternalKey
      });
    },

    disable: function(id) {
      return new Promise(function(resolve, reject) {
        logger.info('[UserDAO] Disabling an user');

        model.findByIdAndUpdate(id, {_id:id, isEnabled: false}, {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.info('[UserDAO] The user has been disabled succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('[UserDAO] An error has ocurred while disabling an user', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    addLoginToHistory: function(userId, ip, userAgent) {
      return new Promise(function(resolve, reject) {
        logger.info('[UserDAO] Adding to login history of the user the attempt');

        var history = {
          date: Date.now(),
          ip: ip,
          userAgent: userAgent
        };

        logger.debug(history);

        model.findByIdAndUpdate(userId, {$push: {loginHistory: history}}, {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.info('[UserDAO] The history has been updated succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('[UserDAO] An error has ocurred while updating this user login history', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    }
  };
};
