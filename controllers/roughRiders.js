const XLSX = require("xlsx");
const Service_Request = require("../model/servicerequest");
const User = require("../model/user");
const cityHub = require("../model/cityhub");
const Rider = require("../model/rider");

async function updateTicketsToOtherTechnician(req, res) {
  try {
    let result = [];
    let cnt = 1;
    let srData = await Service_Request.find({
      $or: [
        { "assigned_to.technician": "S.NAGARAJ" },
        { "assigned_to.technician": "Chandan" },
      ],
      location: "Bangalore",
      "status.done.check": false,
    });

    console.log(srData.length);

    for (let sr of srData) {
      let oldTechnician = sr.assigned_to.technician;
      let newTechnician;
      let status;

      if (sr["status"].done.check) {
        status = "Done";
      } else if (sr["status"].to_do.check && sr["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      if (cnt < 161) {
        newTechnician = "Shiva";
      } else if (cnt >= 161 && cnt < 322) {
        newTechnician = "Krishna U";
      } else {
        newTechnician = "purushotham";
      }

      sr.assigned_to.technician = newTechnician;

      await sr.save();
      console.log(
        `Technician changed from ${oldTechnician} to ${newTechnician}`
      );
      result.push({
        ticket_id: sr.ticket_id,
        oldTechnician,
        newTechnician,
        status,
        vehicle_no: sr.vehicle_no,
      });
      cnt++;
    }
    res.status(200).json({ code: 1, data: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 0, data: err.message });
  }
}

async function serviceHistory(req, res) {
  try {
    let result = {
      vehicles: 0,
      to_do: 0,
      in_progress: 0,
      done: 0,
    };

    let srData = {
      code: 1,
      data: [
        {
          vehicle: "NCRSH0087",
          message: "Added",
          ticket: "SR103475",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0159",
          message: "Added",
          ticket: "SR103476",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0050",
          message: "Added",
          ticket: "SR103477",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0042",
          message: "Added",
          ticket: "SR103478",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0204",
          message: "Added",
          ticket: "SR103479",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0083",
          message: "Added",
          ticket: "SR103480",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0034",
          message: "Added",
          ticket: "SR103481",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0041",
          message: "Added",
          ticket: "SR103482",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0693",
          message: "Added",
          ticket: "SR103483",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0559",
          message: "Added",
          ticket: "SR103484",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0078",
          message: "Added",
          ticket: "SR103485",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0613",
          message: "Added",
          ticket: "SR103486",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0563",
          message: "Added",
          ticket: "SR103487",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0557",
          message: "Added",
          ticket: "SR103488",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0561",
          message: "Added",
          ticket: "SR103489",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0572",
          message: "Added",
          ticket: "SR103490",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0659",
          message: "Added",
          ticket: "SR103491",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0125",
          message: "Added",
          ticket: "SR103492",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0111",
          message: "Added",
          ticket: "SR103493",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0271",
          message: "Added",
          ticket: "SR103494",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0417",
          message: "Added",
          ticket: "SR103495",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0413",
          message: "Added",
          ticket: "SR103496",
          technician: "Shiv Kumar",
        },
        {
          vehicle: 2103232384,
          message: "Added",
          ticket: "SR103497",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0242",
          message: "Added",
          ticket: "SR103498",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0123",
          message: "Added",
          ticket: "SR103499",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0087",
          message: "Added",
          ticket: "SR103500",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0446",
          message: "Added",
          ticket: "SR103501",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0038",
          message: "Added",
          ticket: "SR103502",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0005",
          message: "Added",
          ticket: "SR103503",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0263",
          message: "Added",
          ticket: "SR103504",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0071",
          message: "Added",
          ticket: "SR103505",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0050",
          message: "Added",
          ticket: "SR103506",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0090",
          message: "Added",
          ticket: "SR103507",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0332",
          message: "Added",
          ticket: "SR103508",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSF0110",
          message: "Added",
          ticket: "SR103509",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0395",
          message: "Added",
          ticket: "SR103510",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0390",
          message: "Added",
          ticket: "SR103511",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0145",
          message: "Added",
          ticket: "SR103512",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSF0000",
          message: "Added",
          ticket: "SR103513",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0073",
          message: "Added",
          ticket: "SR103514",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0034",
          message: "Added",
          ticket: "SR103515",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0506",
          message: "Added",
          ticket: "SR103516",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0195",
          message: "Added",
          ticket: "SR103517",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0533",
          message: "Added",
          ticket: "SR103518",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSF0261",
          message: "Added",
          ticket: "SR103519",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0162",
          message: "Added",
          ticket: "SR103520",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0376",
          message: "Added",
          ticket: "SR103521",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0091",
          message: "Added",
          ticket: "SR103522",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0202",
          message: "Added",
          ticket: "SR103523",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0026",
          message: "Added",
          ticket: "SR103524",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRBZ0275",
          message: "Added",
          ticket: "SR103525",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0898",
          message: "Added",
          ticket: "SR103526",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0304",
          message: "Added",
          ticket: "SR103527",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRBZ0104",
          message: "Added",
          ticket: "SR103528",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0412",
          message: "Added",
          ticket: "SR103529",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0373",
          message: "Added",
          ticket: "SR103530",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0112",
          message: "Added",
          ticket: "SR103531",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0154",
          message: "Added",
          ticket: "SR103532",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRBZ0090",
          message: "Added",
          ticket: "SR103533",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRBZ0069",
          message: "Added",
          ticket: "SR103534",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0355",
          message: "Added",
          ticket: "SR103535",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0038",
          message: "Added",
          ticket: "SR103536",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0205",
          message: "Added",
          ticket: "SR103537",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSF0302",
          message: "Added",
          ticket: "SR103538",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0104",
          message: "Added",
          ticket: "SR103539",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0146",
          message: "Added",
          ticket: "SR103540",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0059",
          message: "Added",
          ticket: "SR103541",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0054",
          message: "Added",
          ticket: "SR103542",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0817",
          message: "Added",
          ticket: "SR103543",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0014",
          message: "Added",
          ticket: "SR103544",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRBZ0231",
          message: "Added",
          ticket: "SR103545",
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0076",
          message: "Added",
          ticket: 103333,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0162",
          message: "Added",
          ticket: 103334,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0224",
          message: "Added",
          ticket: 103335,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0036",
          message: "Added",
          ticket: 103336,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0190",
          message: "Added",
          ticket: 103337,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0220",
          message: "Added",
          ticket: 103338,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSS0058",
          message: "Added",
          ticket: 103340,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0584",
          message: "Added",
          ticket: 103341,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSS0610",
          message: "Added",
          ticket: 103342,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0422",
          message: "Added",
          ticket: 103343,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0046",
          message: "Added",
          ticket: 103344,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0162",
          message: "Already Added",
          ticket: "SR103334",
        },
        {
          vehicle: "NCRSS0162",
          message: "Added",
          ticket: 103345,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0606",
          message: "Added",
          ticket: 103346,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0649",
          message: "Added",
          ticket: 103347,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0655",
          message: "Added",
          ticket: 103348,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0168",
          message: "Added",
          ticket: 103349,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0172",
          message: "Added",
          ticket: 103350,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0614",
          message: "Added",
          ticket: 103351,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRFR0249",
          message: "Already Added",
          ticket: "SR101390",
        },
        {
          vehicle: "NCRFR0249",
          message: "Added",
          ticket: 103352,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRFR0061",
          message: "Added",
          ticket: 103354,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0418",
          message: "Added",
          ticket: 103355,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSF0145",
          message: "Added",
          ticket: 103356,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRBZ0130",
          message: "Added",
          ticket: 103357,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0321",
          message: "Added",
          ticket: 103358,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0160",
          message: "Added",
          ticket: 103359,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRFR0007",
          message: "Added",
          ticket: 103360,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRFR0048",
          message: "Added",
          ticket: 103361,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSF0006",
          message: "Added",
          ticket: 103362,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0278",
          message: "Added",
          ticket: 103363,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0786",
          message: "Added",
          ticket: 103364,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSS0261",
          message: "Added",
          ticket: 103365,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0351",
          message: "Added",
          ticket: 103366,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0120",
          message: "Added",
          ticket: 103367,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSS0679",
          message: "Added",
          ticket: 103368,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0287",
          message: "Added",
          ticket: 103369,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0256",
          message: "Added",
          ticket: 103370,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0191",
          message: "Added",
          ticket: 103371,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRBZ0098",
          message: "Added",
          ticket: 103372,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0534",
          message: "Added",
          ticket: 103373,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSF0045",
          message: "Already Added",
          ticket: "SR102202",
        },
        {
          vehicle: "NCRSF0045",
          message: "Added",
          ticket: 103374,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRBZ0112",
          message: "Added",
          ticket: 103375,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0009",
          message: "Added",
          ticket: 103376,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0134",
          message: "Added",
          ticket: 103377,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRFR0065",
          message: "Added",
          ticket: 103378,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0368",
          message: "Added",
          ticket: 103379,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0150",
          message: "Added",
          ticket: 103380,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0117",
          message: "Added",
          ticket: 103381,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRFR0406",
          message: "Added",
          ticket: 103382,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0529",
          message: "Added",
          ticket: 103383,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0708",
          message: "Added",
          ticket: 103384,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRBZ0193",
          message: "Added",
          ticket: 103385,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0470",
          message: "Added",
          ticket: 103386,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSF0078",
          message: "Added",
          ticket: 103387,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0035",
          message: "Added",
          ticket: 103388,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0212",
          message: "Added",
          ticket: 103389,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSS0006",
          message: "Added",
          ticket: 103390,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0102",
          message: "Added",
          ticket: 103391,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSF0098",
          message: "Added",
          ticket: 103392,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0248",
          message: "Added",
          ticket: 103393,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSH0155",
          message: "Added",
          ticket: 103394,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSS0477",
          message: "Added",
          ticket: 103395,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0827",
          message: "Added",
          ticket: 103396,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSF0152",
          message: "Added",
          ticket: 103397,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSH0118",
          message: "Added",
          ticket: 103398,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSS0129",
          message: "Already Added",
          ticket: "SR101820",
        },
        {
          vehicle: "NCRSS0129",
          message: "Added",
          ticket: 103399,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRFR0231",
          message: "Added",
          ticket: 103400,
          technician: "Shiv Kumar",
        },
        {
          vehicle: "NCRSS0671",
          message: "Added",
          ticket: 103401,
          technician: "Shiv Kumar",
        },

        {
          vehicle: "NCRSS0680",
          message: "Added",
          ticket: 103402,
          technician: "Shiv Kumar",
        },
      ],
    };

    console.log("bef", srData.data.length);
    for (let sr of srData.data) {
      let requestData = await Service_Request.findOne(
        { ticket_id: sr.ticket },
        { status: 1, assigned_to: 1 }
      );
      let status = "";

      if (requestData) {
        if (requestData["status"].done.check) {
          status = "Done";
          result.done += 1;
        } else if (
          requestData["status"].to_do.check &&
          requestData["status"].in_progress.check
        ) {
          status = "In Progress";
          result.in_progress += 1;
        } else {
          status = "To Do";
          result.to_do += 1;
        }

        sr["status"] = status;
        sr["technician"] = requestData.assigned_to.technician;
        result.vehicles += 1;
      } else {
        console.log(sr.ticket);
        let requestData = await Service_Request.findOne(
          { ticket_no: sr.ticket },
          { ticket_id: 1, status: 1, assigned_to: 1 }
        );
        let status = "";
        if (requestData) {
          if (requestData["status"].done.check) {
            status = "Done";
            result.done += 1;
          } else if (
            requestData["status"].to_do.check &&
            requestData["status"].in_progress.check
          ) {
            status = "In Progress";
            result.in_progress += 1;
          } else {
            status = "To Do";
            result.to_do += 1;
          }

          result.vehicles += 1;
          sr.ticket = requestData.ticket_id;
          sr["status"] = status;
          sr["technician"] = requestData.assigned_to.technician;
        } else {
          console.log(sr.ticket);
        }
      }
    }
    console.log("afr", result.length);
    // console.log("sr len", srData.data.data.length);

    res.status(200).json({ code: 1, data: srData.data });
  } catch (error) {
    console.log("Error", error);
  }
}

async function capitalVehicleNumber() {
  try {
    let rData = await Rider.find({});
    let length = rData.length;

    for (let i = 0; i < rData.length; i++) {
      const sr = rData[i];

      if (sr.vehicle_no) {
        console.log(sr.vehicle_no, i);
        sr.vehicle_no = sr.vehicle_no.toUpperCase();
        try {
          await sr.save();
        } catch (error) {
          // await sr.remove()
          console.log(sr.vehicle, "deleted");
          continue;
        }
      }
      console.log(sr.vehicle_no, i);
    }

    console.log("Done");
  } catch (error) {
    console.log("Error", error);
  }
}

async function trimVehicleNumber() {
  try {
    let rData = await Rider.find({ vehicle_no: / / });
    let length = rData.length;

    for (let i = 0; i < rData.length; i++) {
      const sr = rData[i];

      if (sr.vehicle_no) {
        console.log(sr.vehicle_no, i);
        sr.vehicle_no = sr.vehicle_no.trim();
        await sr.save();
      }
      console.log(sr.vehicle_no, i);
    }

    console.log("Done");
  } catch (error) {
    console.log("Error", error);
  }
}

async function addCHDRiders() {
  try {
    let result = [];
    const filePath = "C:/Users/Abubakar Shaikh/Downloads/CHD Riders.xlsx";
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log(jsonData);

    for (let vData of jsonData) {
      let vehicle = vData["Rider Vehicle Number"];
      let riderName = vData["Rider Name"];
      let location = vData["Location"];

      let Data = await Rider.findOne({ vehicle_no: vehicle });

      if (Data) {
        console.log(`${vehicle} already exists`);
      } else {
        if (riderName) {
          let rider = new Rider({
            name: riderName,
            mob_number: Number(vData["Rider Mobile number"]),
            email: vData["Rider email"],
            location: location,
            vehicle_no: vehicle,
            owner: vData["Owner Name"],
            owner_mob: Number(vData["Owner Mobile Number"]),
            owner_email: vData["Owner Email address"],
          });

          await rider
            .save()
            .then(async (data) => {
              console.log(`${riderData.name} saved`);

              let ownerDtls = await User.find({
                mob_number: Number(vData["Owner Mobile Number"]),
                role: "Owner",
              });

              if (!ownerDtls) {
                const owner = new User({
                  name: vData["Owner Name"],
                  mob_number: Number(vData["Owner Mobile Number"]),
                  email: vData["Owner Email address"],
                  location,
                  role: "Owner",
                });

                await owner
                  .save()
                  .then((data) => {
                    console.log(`Owner ${riderData.owner} saved`);
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              }
            })
            .catch((error) => {
              console.log(error);
            });
          console.log(`Rider for ${vehicle} created`);
        }
      }
    }
  } catch {
    console.log(error);
  }
}

async function crudUsers() {
  const filePath =
    "C:/Users/Abubakar Shaikh/OneDrive/Desktop/Eveez Copy/GitHUb Service WEBAPP/stacker_backend/NCR_roles.xlsx";
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(data);

  try {
    // let hubs = await cityHub.find({})

    // console.log(hubs);

    for (const userData of data) {
      let hub = userData["hub_name"];
      console.log(hub);

      let hubDetails = await cityHub.findOne({ name: hub });
      console.log("hu", hubDetails);

      let user = await User.findOne({ mob_number: userData["mob_number"] });
      // console.log("user", user);

      if (user && hubDetails) {
        user.hub_id = [hubDetails.city_hub_id];
        await user
          .save()
          .then((data) => {
            console.log(`${user.name} saved`);
          })
          .catch((error) => {
            console.log(error);
          });
      } else if (userData["mob_number"] === 8951003658) {
        user.hub_id = ["BLR001", "BLR002"];
        await user.save();
      } else {
        console.log(`${userData.Name}, ${userData["mob_number"]} Not Saved`);
      }
    }
    console.log("Riders imported successfully.");
  } catch (error) {
    console.error("Error importing riders:", error);
  }
}

async function updateUsers() {
  try {
    await Service_Request.updateMany(
      { location: "Hyderabad" },
      { $set: { hub_id: "HYD001" } }
    );
  } catch (error) {
    console.error("Error importing riders:", error);
  }
}

async function updateRequests() {
  try {
    let data = await Service_Request.find({
      location: "Bangalore",
      "assigned_to.check": true,
    });

    for (const request of data) {
      let technician = request.assigned_to.technician;

      let technicianDetails = await User.findOne(
        { name: technician },
        { hub_id: 1 }
      );

      if (technicianDetails) {
        let hub_id = technicianDetails.hub_id;
        if (hub_id.length > 0) {
          request.hub_id = hub_id[0];
          await request.save().then((data) => {
            console.log(`${request.ticket_id} saved for hub ${hub_id}`);
          });
        } else {
          console.log(`No Hub Id for ${technician}`);
        }
      } else {
        console.log(`${technician} Not Found`);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  crudUsers,
  updateUsers,
  updateRequests,
  capitalVehicleNumber,
  trimVehicleNumber,
  serviceHistory,
  updateTicketsToOtherTechnician,
};
