var UserDAO             = require('./userDAO');
var MailTemplateDAO     = require('./mailTemplateDAO');
var AddressDAO          = require('./addressDAO');
var ContactDAO          = require('./contactDAO');
var TransactionDAO      = require('./transactionDAO');
var AlertDAO            = require('./alertDAO');

module.exports = {
  getDAO: function(dao) {
    switch (dao) {
      case 'alert':
        return new AlertDAO();
      case 'transaction':
        return new TransactionDAO();
      case 'contact':
        return new ContactDAO();
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
