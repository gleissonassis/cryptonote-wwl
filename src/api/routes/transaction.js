var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.transaction;

  app.route('/v1/transactions')
    .get(expressHelper.requireLogin, controller.getAll)
    .post(expressHelper.requireLogin, controller.createTransaction);

  app.route('/v1/addresses/:address/transactions')
    .get(expressHelper.requireLogin, controller.getAll);

  app.route('/v1/transactions/:id/blockchain-transaction')
    .get(expressHelper.requireLogin, controller.getBlockchainTransaction);

  app.route('/v1/transactions/:id')
    .get(expressHelper.requireLogin, controller.getById)
    .delete(expressHelper.requireLogin, controller.delete);

  app.route('/v1/transactions/notifications')
    .post(controller.parseCDALTransaction);
};
