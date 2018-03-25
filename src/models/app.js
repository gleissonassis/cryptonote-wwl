var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    name: {
      type: String,
      required:true,
    },
    key: {
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
    }
  });

  model = model ? model : mongoose.model('users', schema);

  return model;
};
