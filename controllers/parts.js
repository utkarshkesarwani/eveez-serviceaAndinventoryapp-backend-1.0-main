const Part = require("../model/part");
const xlsx = require("xlsx");
const updatePartsPrice = async (req, res) => {
  let file = req.file;

  // use xlsx to convert buffer data into JSON
  const workbook = xlsx.read(file.buffer, { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = xlsx.utils.sheet_to_json(worksheet);
  const result = {
    unSuccessCount: 0,
    successCount: 0,
    unSuccessful: [],
    success: [],
  };
  for (ele of jsonData) {
    const data = await Part.find({
      make: /Lectrix/,
      product_name: { $regex: `${ele.PART_NAME}`, $options: "i" },
    });
    if (data.length != 0) {
      data[0].price = ele.SP;
      try {
        let doc = new Part(data[0]);
        let response = await doc.save();
        result.success.push(response);
        result.successCount += 1;
      } catch (error) {
        console.log("internal", error, "internal");
        result.unSuccessful.push({
          PART_NAME: ele.PART_NAME,
          reason: error.message,
        });
        result.unSuccessCount += 1;
      }
    } else {
      result.unSuccessful.push({
        PART_NAME: ele.PART_NAME,
        reason: "Part not found",
      });
      result.unSuccessCount += 1;
    }
  }

  // for (ele of jsonData) {
  //   try {
  //     const doc = new Part({
  //       product_name: ele.PART_NAME + " LXS",
  //       make: "Lectrix",
  //       price: ele.SP,
  //     });
  //     const response = doc.save();
  //     result.success.push(response);
  //     result.successCount += 1;
  //   } catch (err) {
  //     result.unSuccessful.push({
  //       PART_NAME: ele.PART_NAME,
  //       reason: "Part not found",
  //     });
  //     result.unSuccessCount += 1;
  //     console.log(err);
  //   }
  // }

  res.json(result);
};

const partsPrice = async (req, res) => {
  const { part_name, make } = req.body.data;
  let responseData=[];
  console.log(part_name, make);
  try {
    const data = await Part.find({
      make: make,
      product_name: { $regex: `${part_name}`, $options: "i" },
    });
    responseData = data.map((ele)=>{
      if(!ele.price){
        return {...ele,price:0}
      }
    })
    res.json(data);
  } catch (error) {
    res.status(500).send("Internal Server Error, Unable to get parts price");
    console.log(error);
  }
};
module.exports = { updatePartsPrice, partsPrice };
