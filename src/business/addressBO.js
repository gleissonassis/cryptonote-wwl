var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var addressDAO = dependencies.addressDAO;
  var modelParser = dependencies.modelParser;
  var cdalHelper = dependencies.cdalHelper;
  var dateHelper = dependencies.dateHelper;

  return {
    dependencies: dependencies,

    clear: function() {
      return addressDAO.clear();
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        if (!filter) {
          filter = {};
        }
        filter.isEnabled = true;
        logger.info('[AddressBO] Listing all items by filter ', JSON.stringify(filter));
        addressDAO.getAll(filter)
          .then(function(r) {
            return r.map(function(item) {
              return modelParser.clear(item);
            });
          })
          .then(resolve)
          .catch(reject);
      });
    },

    updateBalance: function(userId, address) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var wwlAddress = null;

        chain
          .then(function() {
            logger.info('[AddressBO] Trying to get a WWL address from databae', userId, address);
            return self.getByAddress(userId, address);
          })
          .then(function(r) {
            logger.info('[AddressBO] WWL Address found', JSON.stringify(r));
            wwlAddress = r;

            logger.info('[AddressBO] Trying to get the CDAL Address', userId, address);
            return cdalHelper.getAddress(userId, address);
          })
          .then(function(r) {
            logger.info('[AddressBO] CDAL Address found', JSON.stringify(r));

            wwlAddress.balance.available = r.balance.available;
            wwlAddress.balance.locked = r.balance.locked;

            logger.info('[AddressBO] Updating the WWL Address balance', JSON.stringify(wwlAddress));
            return self.update(wwlAddress);
          })
          .then(function(r) {
            return modelParser.clear(r.balance);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getBalance: function(userId, address) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            var filter = {
              userId: userId
            };

            if (address) {
              filter.address = address;
            }

            logger.info('[AddressBO] Getting all addresses to calculate the balance', JSON.stringify(filter));
            return self.getAll(filter);
          })
          .then(function(r) {
            var balance = {
              available: 0,
              locked: 0,
              total: 0
            };

            for (var i = 0; i < r.length; i++) {
              logger.info('[AddressBO] Adding the balance for the address', JSON.stringify(r[i]));
              balance.available += r[i].balance.available;
              balance.locked += r[i].balance.locked;
            }

            balance.total = balance.available + balance.locked;

            logger.info('[AddressBO] Actual balance ', JSON.stringify(balance));
            return balance;
          })
          .then(resolve)
          .catch(reject);
      });
    },

    createAddress: function(userId) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var cdalAddress = null;

        chain
          .then(function() {
            logger.info('[AddressBO] Sending a new address request to CDAL', userId);
            return cdalHelper.createAddress(userId);
          })
          .then(function(r) {
            logger.info('[AddressBO] CDAL has returned an address', JSON.stringify(r));
            cdalAddress = r;
            return r;
          })
          .then(function() {
            var address = {
              userId: userId,
              address: cdalAddress.address,
              balance: {
                available: cdalAddress.balance.available,
                locked: cdalAddress.balance.locked
              },
              createdAt: dateHelper.getNow(),
              isEnabled: true
            };
            logger.info('[AddressBO] Saving the new address for the user', JSON.stringify(address));
            return self.save(address);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    save: function(entity) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.debug('[AddressBO] Saving the entity. Entity: ', JSON.stringify(entity));
            var o = modelParser.prepare(entity, true);
            logger.debug('[AddressBO] Entity  after prepare: ', JSON.stringify(o));
            return addressDAO.save(o);
          })
          .then(function(r) {
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    update: function(entity) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            var o = modelParser.prepare(entity, false);
            return addressDAO.update(o);
          })
          .then(function(r) {
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getByAddress: function(userId, address) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var filter = {
          address: address
        };

        if (userId) {
          filter.userId = userId;
        }

        self.getAll(filter)
          .then(function(items) {
            if (items.length) {
              logger.info('[AddressBO] Address found by address', JSON.stringify(items[0]));
              return items[0];
            } else {
              throw {
                status: 404,
                message: 'Address ' + address + ' not found',
                error: 'ADDRESS_NOT_FOUND'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    delete: function(userId, address) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getByAddress(userId, address)
          .then(function(r) {
            return addressDAO.disable(r.id);
          })
          .then(function() {
            return {};
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
