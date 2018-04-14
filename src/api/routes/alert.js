var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.alert;

  app.route('/v1/me/alerts/unread')
    .get(expressHelper.requireLogin, controller.getUnreadAlerts);

  app.route('/v1/me/alerts')
    .get(expressHelper.requireLogin, controller.getAll);

  app.route('/v1/me/alerts/:id')
    .get(expressHelper.requireLogin, controller.getById);
};
