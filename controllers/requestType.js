const Service_Request = require("../model/servicerequest");
const { requestTypeDetail } = require("../model/requestType");

const getRequestTypesCount = async (req, res) => {
  let location;

  //check if user provides seperate location
  if ((req.body.location)) {
    location = req.body.location;
  } else {
    location = req.user.location;
  }
  let lastDate;
  let resultObj = {};
  let responseArray = [];
  if (req.params.timeSpan == "weekly") {
    const differenceTime = 7 * 24 * 60 * 60 * 1000;
    const date = new Date();
    lastDate = new Date(date.getTime() - differenceTime);
  }
  if (req.params.timeSpan == "monthly") {
    const differenceTime = 30 * 24 * 60 * 60 * 1000;
    const date = new Date();
    lastDate = new Date(date.getTime() - differenceTime);
  }
  console.log(lastDate);
  try {
    let requestTypes = await requestTypeDetail.find({});
    requestTypes.forEach((ele) => {
      resultObj[ele.name] = 0;
    });
    const serviceRequests = await Service_Request.find({
      date: { $gte: lastDate },
      location,
    });
    serviceRequests.map((ele) => {
      resultObj[ele.request_type] = resultObj[ele.request_type] + 1;
    });
    for (key in resultObj) {
      responseArray.push({ name: key, count: resultObj[key] });
    }
    res.json(responseArray);
  } catch (err) {
    res.status(500).send("Something Went Wrong");
    console.log(err);
  }
};

module.exports = {
  getRequestTypesCount,
};
