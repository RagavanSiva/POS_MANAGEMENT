const VehicleType = require("../models/VehicleType");

// Controller function to get all vehicle types
const getAllVehicleTypes = async (req, res) => {
  try {
    const vehicleTypes = await VehicleType.find();
    res.json(vehicleTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to create a new vehicle type
const createVehicleType = async (req, res) => {
  const { name, active } = req.body;

  try {
    const newVehicleType = new VehicleType({
      name,
      active: active || true,
    });

    const savedVehicleType = await newVehicleType.save();
    res.status(201).json(savedVehicleType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to update a vehicle type
const updateVehicleType = async (req, res) => {
  const { name, active } = req.body;

  try {
    const updatedVehicleType = await VehicleType.findByIdAndUpdate(
      req.params.id,
      { name, active },
      { new: true } // Return the updated document
    );

    if (!updatedVehicleType) {
      return res.status(404).json({ message: "Vehicle type not found" });
    }

    res.json(updatedVehicleType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to delete a vehicle type
const deleteVehicleType = async (req, res) => {
  try {
    const deletedVehicleType = await VehicleType.findByIdAndDelete(
      req.params.id
    );

    if (!deletedVehicleType) {
      return res.status(404).json({ message: "Vehicle type not found" });
    }

    res.json({ message: "Vehicle type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllVehicleTypes,
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
};
