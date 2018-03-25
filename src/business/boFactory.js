var MailTemplateBO        = require('./mailTemplateBO');
var UserBO                = require('./userBO');
var NotificationBO        = require('./notificationBO');
var TransactionBO         = require('./transactionBO');
var AddressBO             = require('./addressBO');
var DAOFactory            = require('../daos/daoFactory');
var ModelParser           = require('../models/modelParser');
var HelperFactory         = require('../helpers/helperFactory');

function factory(dao) {
  switch (dao) {
    case 'mailTemplate':
      return new MailTemplateBO({
        mailTemplateDAO: DAOFactory.getDAO('mailTemplate'),
        modelParser: new ModelParser()
      });
    case 'address':
      return new AddressBO({
        addressDAO: DAOFactory.getDAO('address'),
        modelParser: new ModelParser(),
        cdalHelper: HelperFactory.getHelper('cdal'),
        dateHelper: HelperFactory.getHelper('date')
      });
    case 'transaction':
      return new TransactionBO({
        transactionDAO: DAOFactory.getDAO('transaction'),
        modelParser: new ModelParser(),
        cdalHelper: HelperFactory.getHelper('cdal'),
        dateHelper: HelperFactory.getHelper('date'),
        addressBO: factory('address')
      });
    case 'notification':
      var modelParser = new ModelParser();

      return new NotificationBO({
        mailTemplateBO: new MailTemplateBO({
          mailTemplateDAO: DAOFactory.getDAO('mailTemplate'),
          modelParser: modelParser,
        }),
        userBO: new UserBO({
          userDAO: DAOFactory.getDAO('user'),
          jwtHelper: HelperFactory.getHelper('jwt'),
          modelParser: modelParser,
          userHelper: HelperFactory.getHelper('user')
        }),
        dynamicTextHelper: HelperFactory.getHelper('dynamicText'),
        sendMailHelper: HelperFactory.getHelper('sendMail'),
      });
    case 'user':
      return new UserBO({
        userDAO: DAOFactory.getDAO('user'),
        jwtHelper: HelperFactory.getHelper('jwt'),
        modelParser: new ModelParser(),
        notificationBO: factory('notification')
      });
    default:
      return null;
  }
};

module.exports = {getBO: factory};
