const { response } = require("express");
const Service_Request = require("../model/servicerequest");

const getIssueTypesCount = async (req, res) => {
  const helperObj = {};
  const resultArray = [];
  let location;
  const{timeSpan} = req.body;

  //check if user provides seperate location
  if ((req.body.location)) {
    location = req.body.location;
  } else {
    location = req.user.location;
  }

  try {
    let serviceRequests;
    let startDate = "";
    if(timeSpan.toLowerCase() == "monthly"){
      startDate = new Date(new Date().getTime() - 30*24*60*60*1000);
    }else if(timeSpan.toLowerCase() == "weekly"){
      startDate = new Date(new Date().getTime() - 7*24*60*60*1000);
    }
    if (req.body.technician) {
      const technician = req.body.technician;
      serviceRequests = await Service_Request.find({
        date: { $gte: startDate },
        location,
        "assigned_to.technician": technician,
      });
    } else {
      serviceRequests = await Service_Request.find({
        date: { $gte: startDate },
        location,
      });
    }
    serviceRequests.forEach((ele) => {
      ele.issue_type.forEach((issue) => {
        if (helperObj.hasOwnProperty(issue)) {
          helperObj[issue] = helperObj[issue] + 1;
        } else {
          helperObj[issue] = 1;
        }
      });
    });
    const Keys = Object.keys(helperObj)
    Keys.forEach((key) => {
      resultArray.push({ name: key, count: helperObj[key] });
    });
    const sortedArr = resultArray.sort((a, b) =>b.count - a.count);
    res.json(sortedArr);
  } catch (error) {
    res.status(500).send("Something went wrong");
    console.log(error);
  }
};

module.exports = { getIssueTypesCount };
