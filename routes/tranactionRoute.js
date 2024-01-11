const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

router.post("/", transactionController.makeTransaction);
router.put("/", transactionController.updateTransaction);
router.get("/", transactionController.getTransactions);
router.delete("/:transactionId", transactionController.deleteTransaction);
router.get("/suspended-sales", transactionController.getSuspendedTransactions);
router.get(
  "/current-month-average",
  transactionController.getTotalAmountForCurrentMonth
);

module.exports = router;
