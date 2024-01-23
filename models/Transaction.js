const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const paymentMethodEnum = ["cash", "cheque", "AC"];
const transactionSchema = new Schema({
  customId: {
    type: String,
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantitySold: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  additionalAmount: {
    type: Number,
  },
  recievedAmount: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
  },
  changefee: {
    type: Number,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: paymentMethodEnum,
    required: true,
  },
  chequeNo: {
    type: String,
  },
  chequeDueDate: {
    type: Date,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
