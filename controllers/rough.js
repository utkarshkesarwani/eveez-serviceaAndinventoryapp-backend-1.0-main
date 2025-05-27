const XLSX = require("xlsx");
const issueType = require("../model/issueType");

async function importIssueType(req, res) {
  const filePath =
    "C:/Users/Abubakar Shaikh/OneDrive/Documents/Issue_Types.xlsx";
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  console.log(jsonData);

  for (let data of jsonData) {
    let replacement;
    let warranty;

    let { Sr_No, Job_Details, Customer_TAT, Replacement, Hrs } = data;

    let exists = await issueType.findOne({ name: Job_Details });
    console.log(exists, "exists");

    if (!exists) {
      if (Replacement) {
        if (Replacement.length >= 2) {
          if (Replacement === "Under warranty") {
            warranty = true;
          }
          replacement = true;
        }
      }
      let newData = new issueType({
        name: Job_Details,
        time_limit: Hrs,
        replacement,
        under_warranty: warranty,
      });

      console.log(newData);

      await newData.save();
    }
  }
}

async function incIssueType(){
  let sr_no=1
  let data = await issueType.find({})

  for (const dt of data) {
    dt.no = sr_no
    await dt.save()

    sr_no += 1
    
  }
}
module.exports = {
  importIssueType,
  incIssueType
};
