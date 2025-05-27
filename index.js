const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const routes = require("./routes/routes");
const { logger } = require("./logger/lgs");
const XLSX = require("xlsx");
var bodyParser = require("body-parser");
const cron = require("node-cron");
const QRCode = require("./model/qrCode");
const {addMonthlyServiceRequestCron} = require("./controllers/addservicerequest");
const {getDifferentTimePeriods} = require('./utils/date');


require("dotenv").config();
const PORT = process.env.PORT || 3600;

require("./db/conn");
// Initializing Server
const server = express();

//Defining Authentication Middleware
const authenticate = function (req, res, next) {
  let tkn = req.body.key || req.headers["key"];
  if (tkn == process.env.SERVER_KEY) {
    next();
  } else {
    console.log(
      `Unauthenticated User, IP Address : ${req.ip}, Time : ${logger()}`
    );
    res.send("Unauthenticated User");
  }
};

//Using Middlewares
server.use(bodyParser.json({ limit: "50mb" }));
server.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

server.use(express.json());
server.use(
  cors({
    origin: "*",
  })
);

server.use(cookieParser());
server.use(authenticate);
// server.use(routes);

// server.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// });

server.use("/api", routes);


// Define a cron job to run every midnight (0:00)
cron.schedule("0 0 * * *", async () => {
  try {
    // Find and update the documents with generationCount equal to 3
    const updatedQRCodes = await QRCode.updateMany(
      { generationCount: { $gte: 1, $lte: 3 } },
      { $set: { generationCount: 0, disabled: false } }
    );

    console.log(`${updatedQRCodes.nModified} documents updated.`);
  } catch (error) {
    console.error("Error updating documents:", error);
  }
});

// cron job for 5th of every month to create monthly service tickets 
cron.schedule('0 9 1 * *', () => {
  try {
    const xyz = addMonthlyServiceRequestCron();
    console.log(xyz);
  } catch (error) {
    console.log("error");
  }
});

console.log(getDifferentTimePeriods());

//Listening to the requests
server.listen(PORT, () => {
  console.log(`Server running on PORT : ${PORT}, Time : ${logger()}`);
});