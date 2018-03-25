var UserDAO             = require('./userDAO');
var MailTemplateDAO     = require('./mailTemplateDAO');

module.exports = {
  getDAO: function(dao) {
    switch (dao) {
      case 'user':
        return new UserDAO();
      case 'mailTemplate':
        return new MailTemplateDAO();
      default:
        return null;
    }
  }
};
