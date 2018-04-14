var MailTemplateBO        = require('./mailTemplateBO');
var UserBO                = require('./userBO');
var NotificationBO        = require('./notificationBO');
var TransactionBO         = require('./transactionBO');
var ContactBO             = require('./contactBO');
var AddressBO             = require('./addressBO');
var AlertBO               = require('./alertBO');
var DAOFactory            = require('../daos/daoFactory');
var ModelParser           = require('../models/modelParser');
var HelperFactory         = require('../helpers/helperFactory');

function factory(bo) {
  switch (bo) {
    case 'alert':
      return new AlertBO({
        alertDAO: DAOFactory.getDAO('alert'),
        modelParser: new ModelParser(),
        dateHelper: HelperFactory.getHelper('date')
      });
    case 'mailTemplate':
      return new MailTemplateBO({
        mailTemplateDAO: DAOFactory.getDAO('mailTemplate'),
        modelParser: new ModelParser()
      });
    case 'contact':
      return new ContactBO({
        contactDAO: DAOFactory.getDAO('contact'),
        modelParser: new ModelParser(),
        dateHelper: HelperFactory.getHelper('date')
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
        addressBO: factory('address'),
        alertBO: factory('alert')
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
        notificationBO: factory('notification'),
        addressBO: factory('address')
      });
    default:
      return null;
  }
};

module.exports = {getBO: factory};
