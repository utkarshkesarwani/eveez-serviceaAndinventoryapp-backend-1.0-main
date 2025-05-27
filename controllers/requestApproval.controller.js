const Service_Request = require("../model/servicerequest");
const { ServiceApprovalRequest } = require("../model/serviceRequestsApproval");

const storeRequests = async (req, res) => {
  try {
    const { location } = req.user;
    const { ticketId, technician } = req.body;

    if (!ticketId || !technician) {
      return res.status(400).json({
        message: "Ticket id and technician names are required",
        data: [],
      });
    }

    const ongoingRequest = await ServiceApprovalRequest.find({
      ticket_id: ticketId.toUpperCase().trim(),
      status: "pending",
    });

    if (ongoingRequest.length > 0) {
      return res.status(400).json({
        message: "Request already raised",
        data: ongoingRequest,
      });
    }

    const requestedData = {
      ticket_id: ticketId,
      technician: technician,
      location,
    };

    const doc = new ServiceApprovalRequest(requestedData);

    const result = await doc.save();

    console.log(result);

    res.status(200).json({
      message: "Request Added Successfully",
      data: [result],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something Went Wrong",
      data: [],
    });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const { role, location } = req.user;
    const { status } = req.body;

    // Check user role for authorization
    if (role !== "Manager") {
      return res.status(401).json({
        message: "Unauthorized User",
        data: [],
      });
    }

    // Validate the status
    if (!status) {
      return res.status(400).json({
        message: "Status is required",
        data: [],
      });
    }

    // Fetch the requests based on location and status
    const resData = await ServiceApprovalRequest.find({
      location,
      status: status.toLowerCase().trim(),
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Records found",
      data: resData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
      data: [],
    });
  }
};

const handleRequests = async (req, res) => {
  const { ticketId, status } = req.body;
  const { location, role } = req.user;
  const resultArr = [];

  try {
    let error = "";
    if (role != "Manager") {
      error = {
        code: 401,
        message: "Unauthorized User",
      };
      throw error;
    }

    console.log("110");

    if (!status || !ticketId) {
      error = {
        code: 400,
        message: "Ticket Id and Status are required",
      };
      throw error;
    }

    const currentStatus = status.toLowerCase().trim();

    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    const GMTtoday = new Date();
    //IST Today
    let today = new Date(GMTtoday.getTime() + IST_OFFSET);

    if (currentStatus == "approved") {
      const [ticketRes] = await Service_Request.find({
        ticket_id: ticketId.toUpperCase().trim(),
        location,
      });

      if (!ticketRes) {
        error = {
          code: 404,
          message: "Service request not found",
        };
        throw error;
      }

      ticketRes.status.done.check = true;
      ticketRes.status.done.date_time = today;
      ticketRes.closure_date = today;

      const saveRequest = await ticketRes.save();
    }

    const approveRequest = await ServiceApprovalRequest.updateOne(
      {
        ticket_id: ticketId.toUpperCase().trim(),
        status: "pending",
      },
      {
        status: currentStatus,
      },
      {
        new: true,
      }
    );

    console.log(approveRequest);

    if (approveRequest?.modifiedCount == 1) {
      resultArr.push({
        message: "Request updated successfully",
        data: [],
      });
    } else {
      error = {
        code: 500,
        message: "Error updating the requset",
      };
      throw error;
    }
    res.json(resultArr);
  } catch (error) {
    console.log(error);
    if (error?.code) {
      return res.status(error.code).json({
        message: error.message,
        data: [],
      });
    } else {
      res.status(500).json({
        message: "Something went wrong",
        data: [],
      });
    }
  }
};

module.exports = {
  storeRequests,
  getAllRequests,
  handleRequests,
};
