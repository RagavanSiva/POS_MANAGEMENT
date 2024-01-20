require("dotenv").config();
const express = require("express");
const app = express();
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConnection");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);

connectDB();
// app.use(logger);
app.use(cors());
app.use(express.json());

app.use(cookieParser());
app.use("/brand", require("./routes/brandRoute"));
app.use("/vehicle", require("./routes/vehicleRoute"));
app.use("/product", require("./routes/productRoute"));
app.use("/transaction", require("./routes/tranactionRoute"));
app.use("/customer", require("./routes/customerRoute"));

app.get("/", (req, res) => {
  res.json({
    message: "Main Service",
  });
});
app.use(errorHandler);
mongoose.connection.once("open", () => {
  console.log("connection to MongoDB");
  app.listen(PORT, () => {
    console.log("Server running on port ", PORT);
  });
});
mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}\n`,
    "mongoErrLog.log"
  );
});
