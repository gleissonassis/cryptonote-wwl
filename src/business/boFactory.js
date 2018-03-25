var MailTemplateBO        = require('./mailTemplateBO');
var UserBO                = require('./userBO');
var NotificationBO        = require('./notificationBO');
var DAOFactory            = require('../daos/daoFactory');
var ModelParser           = require('../models/modelParser');
var JWTHelper             = require('../helpers/jwtHelper');
var UserHelper            = require('../helpers/userHelper');
var DynamicTextHelper     = require('../helpers/dynamicTextHelper');
var StringReplacerHelper  = require('../helpers/stringReplacerHelper');
var SendMailHelper        = require('../helpers/sendMailHelper');
var nodemailer            = require('nodemailer');

function factory(dao) {
  switch (dao) {
    case 'mailTemplate':
      return new MailTemplateBO({
        mailTemplateDAO: DAOFactory.getDAO('mailTemplate'),
        modelParser: new ModelParser()
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
          jwtHelper: new JWTHelper(),
          modelParser: modelParser,
          userHelper: new UserHelper()
        }),
        dynamicTextHelper: new DynamicTextHelper({
          stringReplacerHelper: new StringReplacerHelper()
        }),
        sendMailHelper: new SendMailHelper(nodemailer),
      });
    case 'user':
      return new UserBO({
        userDAO: DAOFactory.getDAO('user'),
        jwtHelper: new JWTHelper(),
        modelParser: new ModelParser(),
        notificationBO: factory('notification')
      });
    default:
      return null;
  }
};

module.exports = {getBO: factory};
