const mongoose = require("mongoose");

const vehicleTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const VehicleType = mongoose.model("VehicleType", vehicleTypeSchema);

module.exports = VehicleType;
