var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    status: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    from: {
      type: String,
      required: false
    },
    to: {
      address: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      }
    },
    fee: {
      type: Number,
      required: false
    },
    changeAddress: {
      type: String,
      required: false
    },
    transactionHash: {
      type: String,
      required: false
    },
    extra: {
      anonymity: {
        type: Number,
        required: false
      },
      paymentId: {
        type: String,
        required: false
      }
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: false
    },
    isEnabled: {
      type: Boolean,
      required: true
    }
  });

  model = model ? model : mongoose.model('transactions', schema);

  return model;
};
