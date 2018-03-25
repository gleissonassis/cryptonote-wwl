var logger        = require('../config/logger');
var settings      = require('../config/settings');

module.exports = function(dependencies) {
  if (!dependencies) {
    dependencies = {};
  }

  var requestHelper = dependencies.requestHelper;

  return {
    options: settings.cdal,

    createAddress: function(ownerId) {
      logger.info('[CDALHelper] Creating a new CDAL address for ', ownerId);
      var url = this.options.baseUrl + '/' + ownerId + '/addresses';
      return requestHelper.postJSON(url, [], {}, []);
    },

    getAddress: function(ownerId, address) {
      logger.info('[CDALHelper] Getting address informations ', ownerId, address);
      var url = this.options.baseUrl + '/' + ownerId + '/addresses/' + address;
      return requestHelper.getJSON(url, []);
    },

    createTransaction: function(transaction) {
      logger.info('[CDALHelper] Creating a new CDAL transaction', JSON.stringify(transaction));

      var cdalTransaction = {
        anonymity: transaction.extra.anonymity,
        fee: transaction.fee,
        paymentId: transaction.extra.paymentId,
        addresses: [transaction.from],
        transfers: [transaction.to],
        changeAddress: transaction.changeAddress
      };
      var url = this.options.baseUrl + '/' + transaction.userId + '/transactions';
      return requestHelper.postJSON(url, [], cdalTransaction, []);
    },

    getBlockchainTransaction: function(transactionHash) {
      logger.info('[CDALHelper] Getting blockchain transaction informations', JSON.stringify(transactionHash));


      var url = this.options.baseUrl + '/blockchain-transactions/' + transactionHash;
      return requestHelper.getJSON(url, [], {}, []);
    }
  };
};
