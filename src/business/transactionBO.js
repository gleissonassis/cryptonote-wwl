var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var transactionDAO = dependencies.transactionDAO;
  var modelParser = dependencies.modelParser;
  var cdalHelper = dependencies.cdalHelper;
  var dateHelper = dependencies.dateHelper;
  var addressBO = dependencies.addressBO;

  return {
    dependencies: dependencies,

    clear: function() {
      return transactionDAO.clear();
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        if (!filter) {
          filter = {};
        }
        filter.isEnabled = true;
        logger.info('[TransactionBO] Listing all items by filter ', filter);
        transactionDAO.getAll(filter)
          .then(function(r) {
            return r.map(function(item) {
              return modelParser.clear(item);
            });
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getById: function(userId, id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        var filter = {
          _id: id
        };

        if (userId) {
          filter.userId = userId;
        }

        chain
          .then(function() {
            return self.getAll(filter);
          })
          .then(function(r) {
            if (r.length) {
              return r[0];
            } else {
              throw {
                status: 404,
                message: 'Transaction not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getBlockchainTransaction: function(userId, id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.info('[TransactionBO] Trying to find the transcation', userId, id);
            return self.getById(userId, id);
          })
          .then(function(transaction) {
            logger.info('[TransactionBO] Sending the request to CDAL to get blockchain transaction',
              transaction.transactionHash);
            return cdalHelper.getBlockchainTransaction(transaction.transactionHash);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    createTransaction: function(transaction) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.info('[TransactionBO] Checking if the address belongs to user',
              JSON.stringify(transaction.from));

            return addressBO.getByAddress(transaction.userId, transaction.from);
          })
          .then(function() {
            transaction.status = 0;
            logger.info('[TransactionBO] Saving the new transaction at database', JSON.stringify(transaction));
            return self.save(transaction);
          })
          .then(function(r) {
            logger.info('[TransactionBO] Transaction was created successfully', JSON.stringify(r));
            transaction.id = r.id;

            logger.info('[TransactionBO] Sending the transaction to CDAL');
            return cdalHelper.createTransaction(transaction);
          })
          .then(function(r) {
            logger.info('[TransactionBO] CDAL has returned a response', JSON.stringify(r));

            transaction.transactionHash = r.transactionHash;
            transaction.status = 1;
            logger.info('[TransactionBO] Updating the transactionHash for the transaction',
              JSON.stringify(transaction));
            return self.update(transaction);
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
            logger.debug('[TransactionBO] Saving the entity. Entity: ', JSON.stringify(entity));
            var o = modelParser.prepare(entity, true);
            o.createdAt = dateHelper.getNow();
            logger.debug('[TransactionBO] Entity  after prepare: ', JSON.stringify(o));
            return transactionDAO.save(o);
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
            logger.debug('[TransactionBO] Updating the entity. Entity: ', JSON.stringify(entity));
            var o = modelParser.prepare(entity, false);
            o.updatedAt = dateHelper.getNow();
            logger.debug('[TransactionBO] Entity  after prepare: ', JSON.stringify(o));
            return transactionDAO.update(o);
          })
          .then(function(r) {
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    delete: function(userId, transactionId) {
      var self = this;

      return new Promise(function(resolve, reject) {
        self.getbyId(userId, transactionId)
          .then(function(r) {
            if (r.status === 0) {
              return transactionDAO.disable(id);
            } else {
              throw {
                staus: 409,
                message: 'The transaction can not be deleted. Transaction status is ' + r.status
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getByTransactionHash: function(transactionHash) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.info('[TransactionBO] Getting the transaction by transactionHash', transactionHash);
            return self.getAll({transactionHash: transactionHash});
          })
          .then(function(r) {
            if (r.length) {
              logger.info('[TransactionBO] Transaction found by transactionHash', transactionHash);
              return r[0];
            } else {
              logger.info('[TransactionBO] Transaction not found by transctionHash', transactionHash);
              return null;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    createTransactionFromCDAL: function(cdalTransaction) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.info('[TransactionBO] Trying to find the address associated to the CDAL transaction',
              cdalTransaction.ownerId,
              cdalTransaction.address);
            return addressBO.getByAddress(cdalTransaction.ownerId, cdalTransaction.address);
          })
          .then(function() {
            logger.info('[TransactionBO] An address was found so a transaction will be created');
            var transaction = {
              status: 1,
              userId: cdalTransaction.ownerId,
              transactionHash: cdalTransaction.transactionHash,
              extra: {
                paymentId: cdalTransaction.paymentId
              },
              createdAt: cdalTransaction.createdAt,
              updatedAt: cdalTransaction.updatedAt,
              to: {
                address: cdalTransaction.address,
                amount: cdalTransaction.amount
              }
            };

            logger.info('[TransactionBO] Saving the new transaction parsed from CDAL transaction',
              JSON.stringify(transaction));
            return self.save(transaction);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    parseCDALTransaction: function(cdalTransaction) {
      var self = this;
      var transaction = null;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        logger.info('[TransactionBO] Parsing a CDAL transaction', JSON.stringify(cdalTransaction));
        chain
          .then(function() {
            if (!cdalTransaction.transactionHash) {
              throw {
                status: 422,
                message: 'The CDAL transaction must have an transactionHash attribute'
              };
            }
          })
          .then(function() {
            logger.info('[TransactionBO] Trying to find a transaction by transactionHash',
              cdalTransaction.transactionHash);
            return self.getByTransactionHash(cdalTransaction.transactionHash);
          })
          .then(function(r) {
            if (r) {
              logger.info('[Transaction] Transaction found by transactionHash',
                cdalTransaction.transactionHash);
              return r;
            } else {
              logger.info('[Transaction] There is no transaction to the transactionHash',
                cdalTransaction.transactionHash);
              return self.createTransactionFromCDAL(cdalTransaction);
            }
          })
          .then(function(r) {
            logger.info('[TransactionBO] Checking it the transaction is confirmed', cdalTransaction.isConfirmed);
            if (cdalTransaction.isConfirmed) {
              logger.info('[TransactionBO] The transaction is confirmed the new status is 2',
                cdalTransaction.isConfirmed);
              r.status = 2;
              return self.update(r);
            } else {
              logger.info('[TransactionBO] The CDAL transaction is not confirmed yet so nothing to do',
                cdalTransaction.isConfirmed);
              return r;
            }
          })
          .then(function(r) {
            transaction = r;
            var p = [];

            logger.info('[TransactionBO] Getting the address involved on this transaction to updated balance');
            p.push(addressBO.getAll({'address': r.from}));
            p.push(addressBO.getAll({'address': r.to.address}));

            return Promise.all(p);
          })
          .then(function(r) {
            var p = [];

            for (var i = 0; i < r.length; i++) {
              if (r[i].length) {
                logger.info('[TransactionBO] Updating the balance for the address', r[i][0].address);
                p.push(addressBO.updateBalance(r[i][0].userId, r[i][0].address));
              }
            }

            return Promise.all(p);
          })
          .then(function(r) {
            return transaction;
          })
          .then(resolve)
          .catch(reject);
      });
    },
  };
};
