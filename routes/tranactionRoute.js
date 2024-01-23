const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

router.post("/", transactionController.makeTransaction);
router.put("/", transactionController.updateTransaction);
router.get("/", transactionController.getTransactions);
router.get("/download", transactionController.exportTransactionCSV);
router.delete("/:transactionId", transactionController.deleteTransaction);
router.get("/suspended-sales", transactionController.getSuspendedTransactions);
router.get(
  "/current-month-average",
  transactionController.getTotalAmountForCurrentMonth
);
router.patch(
  "/isCompleted/:transactionId",
  transactionController.updateIsCompleted
);
router.patch(
  "/update-received-amount/:transactionId",
  transactionController.updateReceivedAmount
);

module.exports = router;
