var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var contactDAO = dependencies.contactDAO;
  var modelParser = dependencies.modelParser;
  var dateHelper = dependencies.dateHelper;

  return {
    dependencies: dependencies,

    clear: function() {
      return contactDAO.clear();
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        if (!filter) {
          filter = {};
        }
        filter.isEnabled = true;
        logger.info('[ContactDAO] Listing all items by filter ', JSON.stringify(filter));
        contactDAO.getAll(filter)
          .then(function(r) {
            return r.map(function(item) {
              return modelParser.clear(item);
            });
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getById: function(id) {
      return new Promise(function(resolve, reject) {
        contactDAO.getById(id)
          .then(function(item) {
            if (item) {
              return modelParser.clear(item);
            } else {
              throw {
                status: 404,
                message: 'Contact not found'
              };
            }
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
            logger.debug('[ContactDAO] Saving the entity. Entity: ', JSON.stringify(entity));
            var o = modelParser.prepare(entity, true);
            o.createdAt = dateHelper.getNow();
            logger.debug('[ContactDAO] Entity  after prepare: ', JSON.stringify(o));
            return contactDAO.save(o);
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
            o.updatedAt = dateHelper.getNow();
            return contactDAO.update(o);
          })
          .then(function(r) {
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    delete: function(id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getById(id)
          .then(function(r) {
            return contactDAO.disable(r.id);
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
