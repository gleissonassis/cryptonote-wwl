var logger              = require('winston');
var model               = require('../models/contact')();
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
            logger.error('[ContactDAO] An error has occurred while deleting all items', error);
            reject(err);
          } else {
            logger.info('[ContactDAO] The items have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter, pagination, sort) {
      return new Promise(function(resolve, reject) {
        logger.info('[ContactDAO] Getting items from database', filter);

        model.find(filter, projectionCommonFields, pagination)
          .sort(sort)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('[ContactDAO] %d items were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.error('[ContactDAO] An error has ocurred while getting items from database', erro);
            reject(erro);
          });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[ContactDAO] Creating a new item', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.info('[ContactDAO] The item has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('[ContactDAO] An error has ocurred while saving a new item', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },

    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.info('[ContactDAO] Update an item');

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true})
        .then(function(item) {
          logger.info('[ContactDAO] The item has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('[ContactDAO] An error has ocurred while updating an item', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    getTotalByFilter: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('[ContactsDAO] Getting total items from database by filter', JSON.stringify(filter));
        model.count(filter, function( err, count){
          if (err) {
            reject(err);
          } else {
            logger.info('[ContactsDAO] Total items from database ', count);
            resolve(count);
          }
        });
      });
    },

    getById: function(id) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[ContactDAO] Getting an item by id %s', id);

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
            logger.error('[ContactDAO] An error has occurred while getting an item by id %s', id, erro);
            reject(erro);
        });
      });
    },

    disable: function(id) {
      return new Promise(function(resolve, reject) {
        logger.info('[ContactDAO] Disabling an item');

        model.findByIdAndUpdate(id, {_id:id, isEnabled: false}, {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.info('[ContactDAO] The item has been disabled succesfully');
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
