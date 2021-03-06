var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    name: {
      type: String,
      required:true,
    },
    email: {
      type: String,
      required:true,
    },
    password: {
      type: String,
      required:true,
    },
    isEnabled : {
      type: Boolean,
      required:true,
    },
    role: {
      type: String,
      required:true,
    },
    loginHistory: [
      {
        date: {
          type: Date,
          required: true
        },
        ip: {
          type: String,
          required: true,
        },
        userAgent: {
          type: String,
          required: true
        }
      }
    ],
    confirmation: {
      key: {
        type: String,
        required: true
      },
      date: {
        type: Date,
      },
      info: {
        ip: {
          type: String,
        },
        userAgent: {
          type: String,
        }
      },
      isConfirmed : {
        type: Boolean
      },
    },
    internalKey: {
      type: String,
      required: true
    },
    defaultCurrency: {
      type: String,
      required: false
    },
    language: {
      type: String,
      required: false
    },
    twoFactorAuth: {
      secret: {
        type: Object,
        required: false,
      },
      dataUrl: {
        type: String,
        required: false
      },
      isEnabled: {
        type: Boolean,
        required: false
      },
      createdAt: {
        type: Date,
        required: false
      },
      updatedAt: {
        type: Date,
        required: false
      },
      info: {
        ip: {
          type: String,
        },
        userAgent: {
          type: String,
        }
      }
    }
  });

  model = model ? model : mongoose.model('users', schema);

  return model;
};
