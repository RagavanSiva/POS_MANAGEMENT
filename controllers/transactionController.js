const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const { format } = require("date-fns");
const csvParser = require("json2csv").Parser;
// Function to generate a formatted transaction ID
const generateTransactionId = async () => {
  try {
    const latestTransaction = await Transaction.findOne().sort({ _id: -1 });

    if (latestTransaction && latestTransaction.customId) {
      const lastId = parseInt(latestTransaction.customId.split("MOH")[1]);
      const newId = lastId + 1;
      return `MOH${newId.toString().padStart(5, "0")}`;
    } else {
      // If no previous transactions, start from MOH00001
      return "MOH00001";
    }
  } catch (error) {
    throw error;
  }
};

const makeTransaction = async (req, res) => {
  try {
    const {
      products,
      recievedAmount,
      isSuspended,
      paymentMethod,
      customer,
      discount,
      chequeNo,
      chequeDueDate,
      isCompleted,
      additionalAmount,
      totalAmount,
      changefee,
    } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Generate transaction ID
    const transactionId = await generateTransactionId();
    // Calculate totalAmount for the entire transaction

    // Create a new transaction
    const newTransaction = new Transaction({
      customId: transactionId,
      products,
      totalAmount,
      recievedAmount: recievedAmount,
      isSuspended: isSuspended,
      paymentMethod: paymentMethod,
      customer: customer,
      discount: discount,
      chequeNo: chequeNo,
      chequeDueDate: chequeDueDate ? new Date(chequeDueDate) : null,
      isCompleted,
      additionalAmount,
      changefee,
    });

    // Save the transaction to the database
    const savedTransaction = await newTransaction.save();
    if (!isSuspended) {
      // Update product details (e.g., decrease stock levels)
      for (const productInfo of products) {
        const { product, quantitySold } = productInfo;

        // Find the product in the database
        const existingProduct = await Product.findById(product);

        if (!existingProduct) {
          // If the product is not found, you may want to handle this scenario
          return res
            .status(404)
            .json({ message: `Product with ID ${product} not found` });
        }

        // Update product details (e.g., decrease stock levels)
        existingProduct.subStockLevel -= quantitySold;

        // Save the updated product
        await existingProduct.save();
      }
    }
    const latestTransaction = await Transaction.findOne()
      .populate({
        path: "products.product", // Assuming "product" is the field inside the "products" array
        model: "Product",
        populate: [
          { path: "brand", model: "Brand" },
          { path: "vehicleType", model: "VehicleType" },
        ],
      })
      .sort({ _id: -1 });
    res.json(latestTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    // Extract startDate and endDate from query parameters
    const {
      startDate,
      endDate,
      isSuspended,
      paymentMethod,
      isCompleted,
      customerName,
      page = 1,
      limit = 10,
    } = req.query;
    const isSuspendedFilter = isSuspended
      ? { isSuspended: isSuspended === "true" }
      : {};

    const filter = {};

    if (startDate) {
      filter.transactionDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999); // Set to end of the day
      filter.transactionDate = {
        ...filter.transactionDate,
        $lte: endOfDay,
      };
    }
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    isCompleted
      ? (filter.isCompleted = isCompleted)
      : (filter.isCompleted = false);
    if (customerName) {
      filter.customer = customerName;
    }
    // Build the query based on the date and suspension filter
    const query = { ...filter, ...isSuspendedFilter };
    const skip = (page - 1) * limit;

    const totalCount = await Transaction.countDocuments(query);
    // Retrieve transactions from the database with optional date filter
    console.log(query);
    const transactions = await Transaction.find(query)
      .sort({
        transactionDate: "desc",
      })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate("customer");

    // Map transactions to include customId, total price, and date
    const mappedTransactions = transactions.map((transaction) => {
      return {
        customId: transaction?.customId,
        totalPrice: transaction.totalAmount,
        transactionDate: transaction.transactionDate,
        recievedAmount: transaction.recievedAmount,
        paymentMethod: transaction.paymentMethod,
        customer: transaction.customer,
        chequeNo: transaction.chequeNo,
        chequeDueDate: transaction.chequeDueDate,
        _id: transaction._id,
        // Add more fields if needed
      };
    });

    res.json({
      totalSize: totalCount,
      transactions: mappedTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getSuspendedTransactions = async (req, res) => {
  try {
    // Extract startDate and endDate from query parameters
    const { isSuspended } = req.query;
    const isSuspendedFilter = isSuspended
      ? { isSuspended: isSuspended === "true" }
      : {};

    const query = { ...isSuspendedFilter };

    // Retrieve transactions from the database with optional date filter
    const transactions = await Transaction.find(query)
      .populate({
        path: "products.product", // Assuming "product" is the field inside the "products" array
        model: "Product",
        populate: {
          path: "brand", // Populate the "brand" field inside each product
          model: "Brand", // The model to use for populating "brand"
        }, // The model to use for population
      })
      .sort({
        transactionDate: "desc",
      });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTotalAmountForCurrentMonth = async (req, res) => {
  try {
    // Get the current date
    const currentDate = new Date();

    // Set the start and end dates for the current month
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Filter transactions for the current month
    const transactions = await Transaction.find({
      transactionDate: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth,
      },
      isSuspended: false,
      isCompleted: true,
    });

    // Calculate the total amount for the transactions
    const totalAmount = transactions.reduce(
      (total, transaction) => total + transaction.totalAmount,
      0
    );

    res.json({ totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const {
      transactionId,
      newProducts,
      paymentMethod,
      customer,
      discount,
      chequeNo,
      chequeDueDate,
      isCompleted,
      additionalAmount,
      totalAmount,
      changefee,
      recievedAmount,
    } = req.body;

    if (
      !transactionId ||
      !newProducts ||
      !Array.isArray(newProducts) ||
      newProducts.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Find the existing transaction by ID
    const existingTransaction = await Transaction.findById(transactionId);

    if (!existingTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Add new products to stock levels
    for (const newProductInfo of newProducts) {
      const { product: newProductId, quantitySold } = newProductInfo;

      const newProduct = await Product.findById(newProductId);

      if (newProduct) {
        newProduct.subStockLevel -= quantitySold;
        await newProduct.save();
      }
    }

    // Update the transaction with new products
    existingTransaction.products = newProducts;
    existingTransaction.isSuspended = false;
    existingTransaction.paymentMethod = paymentMethod;
    existingTransaction.customer = customer;
    existingTransaction.discount = discount;
    existingTransaction.chequeNo = chequeNo;
    existingTransaction.chequeDueDate = chequeDueDate;
    existingTransaction.additionalAmount = additionalAmount;
    existingTransaction.changefee = changefee;
    existingTransaction.isCompleted = isCompleted;

    existingTransaction.recievedAmount = recievedAmount;
    existingTransaction.totalAmount = totalAmount;

    // Save the updated transaction
    const updatedTransaction = await existingTransaction.save();

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    // Find the existing transaction by ID
    const existingTransaction = await Transaction.findById(transactionId);

    if (!existingTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Delete the transaction
    await Transaction.deleteOne({ _id: transactionId });

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportTransactionCSV = async (req, res) => {
  try {
    let transactionlist = [];
    const { startDate, endDate, isSuspended = false } = req.query;
    const isSuspendedFilter = isSuspended
      ? { isSuspended: isSuspended === "true" }
      : {};

    const filter = {};

    if (startDate) {
      filter.transactionDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999); // Set to end of the day
      filter.transactionDate = {
        ...filter.transactionDate,
        $lte: endOfDay,
      };
    }
    filter.isCompleted = true;
    // Build the query based on the date and suspension filter
    const query = { ...filter, ...isSuspendedFilter };

    // Retrieve transactions from the database with optional date filter
    const transactions = await Transaction.find(query).sort({
      transactionDate: "desc",
    });
    transactions.forEach((transaction) => {
      const { customId, totalAmount, recievedAmount, transactionDate } =
        transaction;
      transactionlist.push({
        customId,
        totalAmount,
        recievedAmount,
        transactionDate: format(transactionDate, "yyyy-MM-dd"),
      });
    });

    const csvFields = ["Bill No", "Total Amount", "Receieved Amount", "Date"];
    const csv = new csvParser({ csvFields });
    const csvData = csv.parse(transactionlist);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attatchment: filename=transactionData.csv"
    );
    res.status(200).end(csvData);
  } catch (error) {
    res.send({ status: 400, msg: error.message });
  }
};

const updateIsCompleted = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { isCompleted } = req.body;

    if (isCompleted === undefined || typeof isCompleted !== "boolean") {
      return res
        .status(400)
        .json({ message: "Invalid value for isCompleted." });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { isCompleted },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateReceivedAmount = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { deductAmount } = req.body;

    if (!transactionId || !deductAmount || isNaN(deductAmount)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Find the existing transaction by ID
    const existingTransaction = await Transaction.findById(transactionId);

    if (!existingTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Deduct the specified amount from the received amount
    existingTransaction.recievedAmount += parseFloat(deductAmount);

    // Save the updated transaction
    const updatedTransaction = await existingTransaction.save();

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  makeTransaction,
  getTransactions,
  getSuspendedTransactions,
  getTotalAmountForCurrentMonth,
  updateTransaction,
  deleteTransaction,
  exportTransactionCSV,
  updateIsCompleted,
  updateReceivedAmount,
};
