const { logger } = require("../logger/lgs");
const { issueType } = require("../model/issueType");

async function createIssueType(req, res) {
  try {
    let { no, name } = req.body.data;
    let dataExists = await getAllIssueType.findOne({ $or: [{ no }, { name }] });

    if (dataExists) {
      return res.status(400).json({
        code: 0,
        message: "Data Already Exists",
        data: dataExists,
      });
    }

    let newData = new issueType(req.body.data);
    await newData.save();

    return res.status(200).json({
      code: 1,
      message: "Issue TypeCreated Successfully",
      data: newData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 0,
      data: "Internal Server Error",
      error: error.message,
    });
  }
}
async function getAllIssueType(req, res) {
  try {
    let data = await issueType.find({});

    return res.status(200).json({ code: 1, data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 0,
      data: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = { createIssueType, getAllIssueType };
