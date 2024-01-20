const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

// Create a new customer
router.post("/", customerController.createCustomer);

// Get all customers or filter by name, phoneNumber, or address
router.get("/", customerController.getCustomers);
router.get("/search", customerController.getCustomersForSearch);

// Get a customer by ID
router.get("/:id", customerController.getCustomerById);

// Update a customer by ID
router.patch("/:id", customerController.updateCustomerById);

// Delete a customer by ID
router.delete("/:id", customerController.deleteCustomerById);

module.exports = router;
