const Brand = require("../models/Brand");

// Controller function to get all brands
const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to create a new brand
// Controller function to create a new brand
const createBrand = async (req, res) => {
  const { name, active } = req.body;

  try {
    // Check for duplicate brand name
    const existingBrand = await Brand.findOne({ name });

    if (existingBrand) {
      return res
        .status(400)
        .json({ message: "Brand with this name already exists" });
    }

    const newBrand = new Brand({
      name,
      active: active || true,
    });

    const savedBrand = await newBrand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to update a brand
const updateBrand = async (req, res) => {
  const { name, active } = req.body;

  try {
    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      { name, active },
      { new: true } // Return the updated document
    );

    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json(updatedBrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to delete a brand
const deleteBrand = async (req, res) => {
  try {
    const deletedBrand = await Brand.findByIdAndDelete(req.params.id);

    if (!deletedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
};
