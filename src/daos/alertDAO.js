var logger              = require('winston');
var model               = require('../models/alert')();
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
            logger.error('[AlertDAO] An error has occurred while deleting all items', error);
            reject(err);
          } else {
            logger.info('[AlertDAO] The items have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getTotalByFilter: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('[AlertDAO] Getting total items from database by filter', JSON.stringify(filter));
        model.count(filter, function( err, count){
          if (err) {
            reject(err);
          } else {
            logger.info('[AlertDAO] Total items from database ', count);
            resolve(count);
          }
        });
      });
    },

    getAll: function(filter, pagination, sort) {
      return new Promise(function(resolve, reject) {
        logger.info('[AlertDAO] Getting items from database', filter);

        model.find(filter, projectionCommonFields, pagination)
          .sort(sort)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('[AlertDAO] %d items were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.error('[AlertDAO] An error has ocurred while getting items from database', erro);
            reject(erro);
          });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[AlertDAO] Creating a new item', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.info('[AlertDAO] The item has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('[AlertDAO] An error has ocurred while saving a new item', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },

    getById: function(id) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[AlertDAO] Getting an item by id %s', id);

        self.getAll({_id: id, isEnabled: true})
        .then(function(items) {
          if (items.length === 0) {
            logger.info('[AlertDAO] Item not found');
            resolve(null);
          } else {
            logger.info('[AlertDAO] The item was found');
            logger.debug(JSON.stringify(items[0]));
            resolve(items[0]);
          }
        }).catch(function(erro) {
            logger.error('[AlertDAO] An error has occurred while getting an item by id %s', id, erro);
            reject(erro);
        });
      });
    },

    updateIsReadFlag: function(userId, info) {
      return new Promise(function(resolve, reject) {
        logger.info('[AlertDAO] Updating alerts ', userId);

        model.updateMany({userId: userId, 'read.isRead': false}, $.flatten({
          'read.isRead': true,
          'read.readAt': new Date(),
          'read.info': info,
          updatedAt: new Date()
        }))
        .then(function() {
          logger.info('[AlertDAO] isRead flag has been updated succesfully');
          resolve();
        }).catch(function(error) {
          logger.error('[AlertDAO] An error has ocurred while updating isRead flag', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    }
  };
};
