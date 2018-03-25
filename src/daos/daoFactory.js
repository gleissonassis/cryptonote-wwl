var UserDAO             = require('./userDAO');
var MailTemplateDAO     = require('./mailTemplateDAO');
var AddressDAO          = require('./addressDAO');
var TransactionDAO      = require('./transactionDAO');

module.exports = {
  getDAO: function(dao) {
    switch (dao) {
      case 'transaction':
        return new TransactionDAO();
      case 'user':
        return new UserDAO();
      case 'mailTemplate':
        return new MailTemplateDAO();
      case 'address':
        return new AddressDAO();
      default:
        return null;
    }
  }
};
