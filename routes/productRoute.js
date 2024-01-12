const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Define routes for Product
router.get("/", productController.getAllProducts);
router.get(
  "/lowstock-warehouse",
  productController.getLowStockProductsWarehouse
);
router.get("/lowstock-shop", productController.getLowStockProductsShop);
router.get("/barcode/:barcode", productController.getProductByBarcode);
router.get("/csv-download", productController.exportProductsCSV);
router.get("/search", productController.getAllProductsBySearch);
router.get("/:id", productController.getProductById); // New route to get a product by ID
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.patch("/increase/:productId", productController.increaseStockLevel);
router.patch("/update-stock/:productId", productController.updateStockLevels);
router.get(
  "/download-barcode/:productId",
  productController.generateBarcodeImage
);
module.exports = router;
