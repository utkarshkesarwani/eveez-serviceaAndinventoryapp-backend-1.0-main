const Service_Request = require("../model/servicerequest");
const User = require("../model/user");

async function TechnicianForLoc(req, res) {
  try {
    console.log(req.user, "jshjs");
    let location = req.user.location;
    console.log(location, "loc");

    let technicianData = await User.find(
      {
        $and: [{ role: "Technician" }],
      },
      { _id: 0, name: 1 }
    );

    res.status(200).send(technicianData);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

module.exports = {
  TechnicianForLoc,
};
