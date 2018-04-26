var Promise         = require('promise');
var md5             = require('../helpers/md5');
var logger          = require('../config/logger');
var settings        = require('../config/settings');

module.exports = function(dependencies) {
  var userDAO = dependencies.userDAO;
  var jwtHelper = dependencies.jwtHelper;
  var modelParser = dependencies.modelParser;
  var notificationBO = dependencies.notificationBO;
  var addressBO = dependencies.addressBO;
  var dateHelper = dependencies.dateHelper;
  var speakeasy = dependencies.speakeasy;
  var qrCode = dependencies.qrCode;

  return {
    dependencies: dependencies,

    clear: function() {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.info('[UserBO] Clearing the collection from database');
            return userDAO.clear();
          })
          .then(function() {
            logger.info('[UserBO] All items has been removed successfully from data base');
            return true;
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getAll: function(filter, allFields) {
      return new Promise(function(resolve, reject) {
        filter.isEnabled = true;
        logger.info('[UserBO] Listing all items by filter ', filter);
        userDAO.getAll(filter, allFields)
          .then(function(r) {
            resolve(r.map(function(item) {
              return modelParser.clearUser(item);
            }));
          })
          .catch(reject);
      });
    },

    createUserWithoutValidations: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getByEmail(entity.email)
          .then(function(user) {
            if (!user) {
              logger.debug('[UserBO] Saving the new user. Entity: ', JSON.stringify(entity));
              var o = modelParser.prepare(entity, true);
              o.password = md5(entity.password);
              logger.debug('[UserBO] Entity  after prepare: ', JSON.stringify(o));
              return userDAO.save(o);
            } else {
              throw {
                status: 409,
                message: 'The email ' + entity.email + ' is already in use by other user'
              };
            }
          })
          .then(function(r) {
            resolve(modelParser.clearUser(r));
          })
          .catch(reject);
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var confirmationKey = null;
        var user = null;
        var chain = Promise.resolve();

        // generating a random number for confirmation key and internal key
        var randomConfirmationKey =  'KEY' + (new Date().getTime() * Math.random());
        var randomInternalKey =  'KEY' + (new Date().getTime() * Math.random());
        logger.debug('[UserBO] Generating random numbers to create confirmation key and internal key',
                     randomConfirmationKey,
                     randomInternalKey);

        chain
          .then(function() {
            return userDAO.getTotalByFilter();
          })
          .then(function(r) {
            if (r >= settings.maximumUsers) {
              throw {
                status: 409,
                error: 'MAXIMUM_USERS_EXCEEDED'
              };
            } else {
              return self.getByEmail(entity.email);
            }
          })
          .then(function(user) {
            if (!user) {
              logger.debug('[UserBO] Saving the new user. Entity: ', JSON.stringify(entity));
              var o = modelParser.prepare(entity, true);
              if (o.password) {
                o.password = md5(entity.password);
              }

              confirmationKey = md5(randomConfirmationKey);
              o.confirmation = {
                key: confirmationKey,
                isConfirmed: false
              };
              o.internalKey = md5(randomInternalKey + confirmationKey);

              logger.debug('[UserBO] Entity  after prepare: ', JSON.stringify(o));

              return userDAO.save(o);
            } else {
              throw {
                status: 409,
                message: 'The email ' + entity.email + ' is already in use by other user'
              };
            }
          })
          .then(function(r) {
            return modelParser.clearUser(r);
          })
          .then(function(r) {
            //this notification will not be part of the chain
            notificationBO.sendNotification({
              userId: r.id,
              type: 'new-user'
            });
            return r;
          })
          .then(function(r) {
            user = r;

            logger.info('[UserBO] Creating an address for the new user', user.id);
            return addressBO.createAddress(user.id);
          })
          .then(function(r) {
            logger.info('[UserBO] The new address has been created successfully', JSON.stringify(r));
            return user;
          })
          .then(resolve)
          .catch(reject);
      });
    },

    update: function(entity) {
      var self = this;

      return new Promise(function(resolve, reject) {
        logger.info('[UserBO] Updating a user ', JSON.stringify(entity));

        var o = modelParser.prepare(entity, false);
        self.getByEmail(entity.email)
          .then(function(user) {
            if (!user || (user && user.id === entity.id)) {
              if (o.password) {
                o.password = md5(o.password);
              }

              // generating a new internal key for security reasons
              o.internalKey = md5(o.internalKey + new Date());

              return userDAO.update(o);
            } else {
              logger.debug('User id: ', user.id);
              logger.debug('Entity id: ', entity.id);

              throw {
                status: 409,
                message: 'The email ' + entity.email + ' is already in use by other user'
              };
            }
          })
          .then(function(r) {
            resolve(modelParser.clearUser(r));
          })
          .catch(reject);
      });
    },

    getById: function(id, allFields) {
      return new Promise(function(resolve, reject) {
        userDAO.getById(id, allFields)
          .then(function(user) {
            if (user) {
              return modelParser.clearUser(user);
            } else {
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getByLogin: function(email, password, twoFactorAuth) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var user = null;
        var chain = Promise.resolve();

        chain
          .then(function() {
            if (!email || !password) {
              reject({
                status: 422,
                message: 'Email and password are required fields'
              });
            } else {
              var filter = {
                email: email,
                password: md5(password)
              };

              return self.getAll(filter, true);
            }
          })
          .then(function(r) {
            if (r.length) {
              return r[0];
            } else {
              throw {
                status: 404,
                message: 'User not found by the supplied credentials'
              };
            }
          })
          .then(function(r) {
            user = r;

            logger.info('[UserBO] Checking if 2FA is enabled', JSON.stringify(user.twoFactorAuth));
            if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
              return self.validate2FAToken(user.id, twoFactorAuth, false);
            } else {
              return true;
            }
          })
          .then(function(r) {
            if (r) {
              return self.getById(user.id);
            } else {
              throw {
                status: 404,
                error: 'INVALID_2FA_TOKEN',
                message: 'User not found by the supplied credentials'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getByEmail: function(email, allFields) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var filter = {
          email: email
        };

        self.getAll(filter, allFields)
          .then(function(users) {
            if (users.length) {
              logger.info('[UserBO] User found by email', JSON.stringify(users[0]));
              return users[0];
            } else {
              return null;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    generateToken: function(email, password, twoFactorAuthToken, info) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var user = null;

        self.getByLogin(email, password, twoFactorAuthToken)
          .then(function(r) {
            user = r;
            if (user) {
              return userDAO.addLoginToHistory(user.id, info.ip, info.userAgent);
            } else {
              return null;
            }
          })
          .then(function() {
            if (user) {
              logger.info('[UserBO] The user was found. Generating a new token for him');
              user = modelParser.clearUser(user);
              user.token = jwtHelper.createToken(user);
              logger.debug('[UserBO] Generated token', user.token);

              return user;
            } else {
              logger.warn('[UserBO] The user was not found by email and password', email);
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    delete: function(id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getById(id)
          .then(function(user) {
            if (!user) {
              throw {
                status: 404,
                message: 'User not found'
              };
            } else {
              return userDAO.disable(id);
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getLoginHistory: function(id) {
      return new Promise(function(resolve, reject) {
        userDAO.getById(id, true, true)
          .then(function(user) {
            if (user) {
              return user.loginHistory;
            } else {
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    confirmUser: function(userId, key, info) {
      return new Promise(function(resolve, reject) {
        userDAO.getByConfirmationKey(userId, key)
          .then(function(user) {
            if (user) {
              return userDAO.confirmUser(userId, key, info);
            } else {
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    resetPassword: function(userId, internalKey, newPassword) {
      return new Promise(function(resolve, reject) {
        userDAO.getByInternalKey(userId, internalKey)
          .then(function(user) {
            if (user) {
              return userDAO.resetPassword(userId, md5(Math.random() + internalKey), md5(newPassword));
            } else {
              throw {
                status: 404,
                message: 'User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    generateNewToken: function(user) {
      var self = this;

      return new Promise(function(resolve, reject) {
        logger.info('[UserBO] Updating a new token for the user ', JSON.stringify(user));

        self.getByEmail(user.email)
          .then(function(user) {
            logger.info('[UserBO] An user was found by email, so a new token will be generated');
            if (user) {
              user.token = jwtHelper.createToken(user);
              logger.info('New token ', JSON.stringify(user));
              return user;
            } else {
              throw {
                status: 404,
                message: 'Can not update the token. User not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    generateDataUrl: function(otpauthUrl) {
      return new Promise(function(resolve, reject) {
        qrCode.toDataURL(otpauthUrl, function(err, dataUrl) {
          if (err) {
            reject(err);
          } else {
            resolve(dataUrl);
          }
        });
      });
    },

    generate2FAToken: function(user) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var secret = null;

        chain
          .then(function() {
            secret = speakeasy.generateSecret({
              name: settings.twoFactorAuth.name + ' (' + user.email + ')',
              issuer: settings.twoFactorAuth.issuer
            });
            return self.generateDataUrl(secret.otpauth_url);
          })
          .then(function(r) {
            user.twoFactorAuth = {
              secret: secret.base32,
              isEnabled: false,
              createdAt: dateHelper.getNow(),
              dataUrl: r,
              info: {
                ip: '',
                userAgent: ''
              }
            };
            return self.update(user);
          })
          .then(function() {
            return user.twoFactorAuth;
          })
          .then(resolve)
          .catch(reject);
      });
    },

    get2FAToken: function(userId) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var user = null;

        chain
          .then(function() {
            return self.getById(userId, true);
          })
          .then(function(r) {
            user = r;

            if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
              return user.twoFactorAuth;
            } else {
              return self.generate2FAToken(user);
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    validate2FAToken: function(userId, twoFactorAuthToken) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            return self.getById(userId, true);
          })
          .then(function(r) {
            var verified = false;

            if (r.twoFactorAuth) {
              var options = {
                secret: r.twoFactorAuth.secret,
                encoding: 'base32',
                token: twoFactorAuthToken,
                window: 1
              };

              logger.info('[UserBO] Checking if the provided token is valid against 2fa token info',
                twoFactorAuthToken,
                JSON.stringify(options));
              verified = speakeasy.totp.verify(options);
            }

            if (verified) {
              logger.info('[UserBO] The provided token is valid against 2fa token info', twoFactorAuthToken);
              return true;
            } else {
              logger.warn('[UserBO] The provided token is not valid against 2fa token info', twoFactorAuthToken);
              return false;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    configure2FAToken: function(isEnabled, userId, twoFactorAuthToken, info) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            return self.validate2FAToken(userId, twoFactorAuthToken);
          })
          .then(function(r) {
            if (r) {
              return userDAO.configure2FAToken(isEnabled, userId, info);
            } else {
              throw {
                status: 409,
                error: 'INVALID_2FA_TOKEN'
              };
            }
          })
          .then(function() {
            return {
              twoFactorAuthToken: twoFactorAuthToken
            };
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
