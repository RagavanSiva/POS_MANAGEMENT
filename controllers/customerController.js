const Customer = require("../models/Customer"); // Make sure to provide the correct path to your Customer model

const customerController = {
  createCustomer: async (req, res) => {
    try {
      const customer = new Customer(req.body);
      await customer.save();
      res.status(201).send(customer);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  getCustomers: async (req, res) => {
    try {
      // Extracting the filter parameter from the query
      const filter = req.query.filter;

      // Building the query object based on the filter parameter
      const query = filter
        ? {
            $or: [
              { name: { $regex: filter, $options: "i" } }, // Case-insensitive regex for name
              { phoneNumber: { $regex: filter, $options: "i" } }, // Case-insensitive regex for phoneNumber
              { address: { $regex: filter, $options: "i" } }, // Case-insensitive regex for address
            ],
          }
        : {};

      // Fetching customers based on the query
      const customers = await Customer.find(query);

      res.send(customers);
    } catch (error) {
      res.status(500).send(error);
    }
  },
  getCustomersForSearch: async (req, res) => {
    try {
      // Extracting the filter parameter from the query
      const filter = req.query.filter;
      if (!filter) {
        return res.status(400).json({ message: "Search term is required" });
      }

      // Building the query object based on the filter parameter
      const query = filter
        ? {
            $or: [
              { name: { $regex: filter, $options: "i" } }, // Case-insensitive regex for name
              { phoneNumber: { $regex: filter, $options: "i" } }, // Case-insensitive regex for phoneNumber
              { address: { $regex: filter, $options: "i" } }, // Case-insensitive regex for address
            ],
          }
        : {};

      // Fetching customers based on the query
      const customers = await Customer.find(query);

      res.send(customers);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  getCustomerById: async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return res.status(404).send();
      }
      res.send(customer);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  updateCustomerById: async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      "name",
      "phoneNumber",
      "vehicleNumber",
      "address",
      "active",
    ];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).send({ error: "Invalid updates!" });
    }

    try {
      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!customer) {
        return res.status(404).send();
      }
      res.send(customer);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  deleteCustomerById: async (req, res) => {
    try {
      const customer = await Customer.findByIdAndDelete(req.params.id);
      if (!customer) {
        return res.status(404).send();
      }
      res.send(customer);
    } catch (error) {
      res.status(500).send(error);
    }
  },
};

module.exports = customerController;
