var logger              = require('winston');
var model               = require('../models/transaction')();
var Promise             = require('promise');
var $                   = require('mongo-dot-notation');

module.exports = function() {
  var projectionCommonFields = {
    __v: false,
    isEnabled: false,
  };

  return {
    clear: function() {
      return new Promise(function(resolve, reject) {
        model.remove({}, function(err) {
          if (err) {
            logger.error('[TransactionDAO] An error has occurred while deleting all items', error);
            reject(err);
          } else {
            logger.info('[TransactionDAO] The items have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Getting items from database', filter);

        model.find(filter, projectionCommonFields)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('[TransactionDAO] %d items were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.error('[TransactionDAO] An error has ocurred while getting items from database', erro);
            reject(erro);
          });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Creating a new item', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.info('[TransactionDAO] The item has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('[TransactionDAO] An error has ocurred while saving a new item', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },

    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Update an item');

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true})
        .then(function(item) {
          logger.info('[TransactionDAO] The item has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('[TransactionDAO] An error has ocurred while updating an item', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    getById: function(id) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Getting an item by id %s', id);

        self.getAll({_id: id, isEnabled: true})
        .then(function(items) {
          if (items.length === 0) {
            logger.info('[AddressDAO] Item not found');
            resolve(null);
          } else {
            logger.info('[AddressDAO] The item was found');
            logger.debug(JSON.stringify(items[0]));
            resolve(items[0]);
          }
        }).catch(function(erro) {
            logger.error('[TransactionDAO] An error has occurred while getting an item by id %s', id, erro);
            reject(erro);
        });
      });
    },

    disable: function(id) {
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Disabling an item');

        model.findByIdAndUpdate(id, {_id:id, isEnabled: false}, {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.info('[TransactionDAO] The item has been disabled succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('An error has ocurred while disabling an item', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },
  };
};
