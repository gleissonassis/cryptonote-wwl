var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.address;

  app.route('/v1/addresses')
    .get(expressHelper.requireLogin, controller.getAll)
    .post(expressHelper.requireLogin, controller.createAddress);

  app.route('/v1/addresses/:address/balance')
    .post(expressHelper.requireLogin, controller.updateBalance);

  app.route('/v1/addresses/:address')
    .get(expressHelper.requireLogin, controller.getByAddress)
    .delete(expressHelper.requireLogin, controller.delete);
};
