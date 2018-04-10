var UserDAO             = require('./userDAO');
var MailTemplateDAO     = require('./mailTemplateDAO');
var AddressDAO          = require('./addressDAO');
var ContactDAO          = require('./contactDAO');
var TransactionDAO      = require('./transactionDAO');

module.exports = {
  getDAO: function(dao) {
    switch (dao) {
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
