const mongoose = require("mongoose");
const Brand = require("./Brand");
const VehicleType = require("./VehicleType");

const productSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  pattern: {
    type: String,
  },
  vehicleType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleType",
  },
  stockLevel: {
    type: Number,
    default: 0,
  },
  subStockLevel: {
    type: Number,
    default: 0,
  },
  pr: {
    type: Number,
  },
  price: {
    type: Number,
    required: true,
  },
  barcode: {
    type: String,
  },
  remarks: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
