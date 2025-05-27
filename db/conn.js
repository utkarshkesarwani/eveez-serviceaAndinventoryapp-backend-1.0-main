//database connection
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { logger } = require("../logger/lgs");

const dbURI = process.env.DB_URI;

//"mongodb://eveeziot:Eveez%24I0T%25@eveez.in:37017/livedata?authSource=admin"
//"mongodb://eveeziot:Eveez%24I0T%25@eveez.in:37017/ioteveez?authSource=admin"
//'mongodb://eveeziot:Eveez$I0T%@eveez.in:37017/live_data'
//'mongodb://eveeziot:Eveez$I0T%@eveez.in:37017/ioteveez'

mongoose.set("strictQuery", false);

db = mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((con) => {
    console.log(
      `\n Connected to Database: ${con.connection.host}, Time : ${logger()}\n `
    );
  })
  .catch((err) => console.log(err));