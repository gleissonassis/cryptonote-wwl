var CDALHelper              = require('./cdalHelper');
var RequestHelper           = require('./requestHelper');
var DateHelper              = require('./dateHelper');
var SendMailHelper          = require('./sendMailHelper');
var DynamicTextHelper       = require('./dynamicTextHelper');
var StringReplacerHelper    = require('./stringReplacerHelper');
var UserHelper              = require('./userHelper');
var JWTHelper               = require('./jwtHelper');
var request                 = require('request');
var nodemailer              = require('nodemailer');

module.exports = {
  getHelper: function(helper) {
    switch (helper) {
      case 'cdal':
        return new CDALHelper({
          requestHelper: this.getHelper('request')
        });
      case 'request':
        return new RequestHelper({
          request: request
        });
      case 'date':
        return new DateHelper();
      case 'sendMail':
        return new SendMailHelper({
          nodemailer: nodemailer
        });
      case 'stringReplacer':
        return new StringReplacerHelper();
      case 'user':
        return new UserHelper();
      case 'jwt':
        return new JWTHelper();
      case 'dynamicText':
        return new DynamicTextHelper({
          stringReplacerHelper: this.getHelper('stringReplacer')
        });
      default:
        return null;
    }
  }
};
