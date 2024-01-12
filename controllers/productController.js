const Product = require("../models/Product");
const csvParser = require("json2csv").Parser;
const crypto = require("crypto");
const bwipjs = require("bwip-js");
const fs = require("fs");
const path = require("path");

const getAllProducts = async (req, res) => {
  try {
    // Extracting filter parameters from query
    const { size, brand, vehicleType, page = 1, pageSize = 10 } = req.query;

    // Building the filter object
    const filter = {};
    if (size) {
      // Use a regular expression for a case-insensitive partial match
      filter.size = { $regex: new RegExp(size, "i") };
    }
    if (brand) filter.brand = brand;
    if (vehicleType) filter.vehicleType = vehicleType;

    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;

    // Fetching products with filters and pagination
    const products = await Product.find(filter)
      .populate("brand")
      .populate("vehicleType")
      .sort({ createdAt: -1 })
      .exec();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllProductsBySearch = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm;

    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" });
    }

    // Use a regular expression for a case-insensitive partial match
    const regex = new RegExp(searchTerm, "i");

    const products = await Product.find({
      $or: [
        { "brand.name": { $regex: regex } },
        { size: { $regex: regex } },
        { pattern: { $regex: regex } },
        { "vehicleType.name": { $regex: regex } },
        // Exclude the "pr" field if the search term is not a valid number
        isNaN(Number(searchTerm)) ? null : { pr: searchTerm },
        { remarks: { $regex: regex } },
        // Add more fields as needed
      ].filter(Boolean), // Filter out null values
    })
      .populate("brand")
      .populate("vehicleType");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to get a product by its ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("brand") // Populate the 'brand' field with the full brand object
      .populate("vehicleType"); // Populate the 'vehicleType' field with the full vehicleType object;

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to create a new product
const createProduct = async (req, res) => {
  const {
    size,
    brand,
    remarks,
    pr,
    pattern,
    vehicleType,
    barcode,
    price,
    status,
  } = req.body;

  try {
    const newbarcode = Math.floor(
      1000000000000 + Math.random() * 9000000000000
    ).toString();
    const newProduct = new Product({
      size,
      brand,
      remarks,
      pattern,
      pr,
      vehicleType,
      price,
      status: status || true,
      barcode: barcode ? barcode : newbarcode,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to update a product
const updateProduct = async (req, res) => {
  const { size, brand, remarks, pr, pattern, vehicleType, price, status } =
    req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        size,
        brand,
        pattern,
        vehicleType,
        price,
        pr,
        status,
        remarks,
      },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to delete a product
const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// controller function to update the stocklevel
const increaseStockLevel = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!productId || !quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Increase the stock level
    existingProduct.stockLevel += parseInt(quantity);

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to update stock levels (increase subStockLevel and decrease stockLevel) for a particular product
const updateStockLevels = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!productId || isNaN(quantity)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Check if stockLevel is already 0 and attempting to decrease
    if (existingProduct.stockLevel <= 0) {
      return res.status(400).json({ message: "Stock level is already at 0" });
    }
    // Increase subStockLevel
    if (quantity > 0) {
      existingProduct.subStockLevel += parseInt(quantity);
      existingProduct.stockLevel -= parseInt(quantity);
    }

    // Decrease stockLevel
    // if (quantity < 0 && existingProduct.stockLevel >= Math.abs(quantity)) {
    //   existingProduct.stockLevel += parseInt(quantity);
    // } else if (quantity < 0) {
    //   return res
    //     .status(400)
    //     .json({ message: "Decrease quantity exceeds available stock level" });
    // }

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportProductsCSV = async (req, res) => {
  try {
    let products = [];
    var productData = await Product.find({})
      .populate("brand")
      .populate("vehicleType")
      .sort({ createdAt: -1 })
      .exec();
    productData.forEach((product) => {
      const {
        size,
        brand,
        pattern,
        vehicleType,
        stockLevel,
        subStockLevel,
        pr,
        price,
        remarks,
      } = product;
      products.push({
        size,
        brand: brand.name,
        pattern,
        vehicleType: vehicleType.name,
        stockLevel,
        subStockLevel,
        pr,
        price,
        remarks,
      });
    });

    const csvFields = [
      "Size",
      "Brand",
      "Pattern",
      "VehicleType",
      "StockLevel",
      "ShopStockLevel",
      "PR",
      "Price",
      "Remarks",
    ];
    const csv = new csvParser({ csvFields });
    const csvData = csv.parse(products);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attatchment: filename=productData.csv"
    );
    res.status(200).end(csvData);
  } catch (error) {
    res.send({ status: 400, msg: error.message });
  }
};

const getProductByBarcode = async (req, res) => {
  const { barcode } = req.params;

  try {
    const product = await Product.findOne({ barcode })
      .populate("brand")
      .populate("vehicleType")
      .exec();

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found with the provided barcode" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const generateBarcodeImage = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { barcode } = product;

    const imageBuffer = await generateBarcode(barcode);

    // Set response headers for image download
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename=${barcode}.png`);

    // Send the image buffer as the response
    res.end(imageBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getLowStockProductsWarehouse = async (req, res) => {
  try {
    // Find products with stock level less than 10
    const lowStockProducts = await Product.find({ stockLevel: { $lt: 10 } })
      .populate("brand")
      .populate("vehicleType");

    res.json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getLowStockProductsShop = async (req, res) => {
  try {
    // Find products with stock level less than 10
    const lowStockProducts = await Product.find({ subStockLevel: { $lt: 10 } })
      .populate("brand")
      .populate("vehicleType");

    res.json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateBarcode = (barcode) => {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128", // or other barcode type
        text: barcode,
        scale: 3, // Controls the size of the barcode
        includetext: true, // Includes the human-readable text below the barcode
        textxalign: "center", // Aligns the text to the center
      },
      (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      }
    );
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsBySearch,
  increaseStockLevel,
  updateStockLevels,
  exportProductsCSV,
  getProductByBarcode,
  generateBarcodeImage,
  getLowStockProductsWarehouse,
  getLowStockProductsShop,
};
