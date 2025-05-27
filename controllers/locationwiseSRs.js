const Service_Request = require("../model/servicerequest");

//locationwise Service Requests
async function getLocationwiseSRs(req, res){
    try {
        let locationwiseSRObj = []

        let Data = await Service_Request.aggregate([
            {
              $group: {
                _id: "$location",
                count: { $sum: 1 }
              }
            }
          ])

        res.status(200).send(Data)

        
    } catch (error) {
        res.status(500).send(`Error: ${error}`)
    } 
}

module.exports = {
    getLocationwiseSRs
}