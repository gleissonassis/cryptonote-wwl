var ExpressHelper         = require('../../helpers/expressHelper');

module.exports = function(app) {
  var expressHelper = new ExpressHelper();
  var controller = app.controllers.contact;

  app.route('/v1/contacts')
    .get(expressHelper.requireLogin, controller.getAll)
    .post(expressHelper.requireLogin, controller.save);

  app.route('/v1/contacts/:id')
    .get(expressHelper.requireLogin, controller.getById)
    .put(expressHelper.requireLogin, controller.update)
    .delete(expressHelper.requireLogin, controller.delete);
};
