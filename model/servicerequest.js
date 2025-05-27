const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { mailtomanager } = require("../controllers/mailit");

const servicerequestSchema = new mongoose.Schema({
  ticket_no: {
    type: Number,
  },

  ticket_id: {
    type: String,
  },

  created_by: {
    type: String,
  },

  customer_name: {
    type: String,
    required: true,
  },

  customer_mobile: {
    type: Number,
    required: true,
  },

  customer_email: {
    type: String,
    required: true,
  },

  vehicle: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },
  hub: {
    type: String,
  },

  assigned_to: {
    check: {
      type: Boolean,
      default: false,
    },
    technician: {
      type: String,
      default: null,
    },
    date_time: {
      type: Date,
      default: null,
    },
    id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },

  technician_comment: {
    type: String,
  },

  at_hub: {
    type: Boolean,
  },

  odometer_reading: {
    type: Number,
    required: true,
  },

  request_type: {
    type: String,
    required: true,
  },

  issue_description: {
    type: String,
    required: true,
  },

  status: {
    to_do: {
      check: {
        type: Boolean,
        default: false,
      },
      date_time: {
        type: Date,
        default: null,
      },
    },
    in_progress: {
      check: {
        type: Boolean,
        default: false,
      },
      date_time: {
        type: Date,
        default: null,
      },
    },
    done: {
      check: {
        type: Boolean,
        default: false,
      },
      date_time: {
        type: Date,
        default: null,
      },
    },
    cancel: {
      check: {
        type: Boolean,
        default: false,
      },
      date_time: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        default: null,
      },
    },
  },

  iot_number:{
    type: String,
    default: null,
  },
  iot_working:{
    type: Boolean,
    default: null,
  },
  iot_image:{
    type:String,
    default: null,
  },

  issue_photo: [],
  vehicle_image: {
    type: Array,
    default: null,
  },
  issue_type: {
    type: Array,
    required: true,
    validate: (array) => array.every((entery) => typeof entery === "string"),
  },

  spare_parts: [
    {
      make: {
        type: String,
        default: null,
      },
      product_name: {
        type: String,
        default: null,
      },
      count: {
        type: Number,
        default: null,
      },
      used_count: {
        type: Number,
        default: 0,
      },
      unused_count: {
        type: Number,
        default: 0,
      },
      price:{
        type: Number,
        default:0,
      },
      part_image:{
        old_part_image:{
          image:{
            type: String,
            default: null,
          }
        },
        new_part_image:{
          image:{
            type: String,
            default: null,
          }
        },
        unused_part_image:[String],
      },
      date: {
        type: Date,
        default: Date.now,
        set: function (value) {
          let today = new Date();
          let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
          return ISTDate;
        },
      },
    },
  ],

  requested_parts: [
    {
      make: {
        type: String,
        default: null,
      },
      product_name: {
        type: String,
        default: null,
      },
      count: {
        type: Number,
        default: null,
      },
      Approved: {
        type: Boolean,
        default: false,
      },
      Rejected: {
        type: Boolean,
        default: false,
      },
      part_image: {
        old_part_image: {
          image: {
            type: String,
            default: null,
          },
        },
      },
      date: {
        type: Date,
        default: Date.now,
        set: function (value) {
          let today = new Date();
          let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
          return ISTDate;
        },
      },
    },
  ],

  new_parts_images: [String],
  // old_parts_images: [String],

  date: {
    type: Date,
    default: Date.now,
    set: function (value) {
      let today = new Date();
      let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
      return ISTDate;
    },
  },

  closure_date: {
    type: Date,
    default: null,
  },
});

// Adding the auto-increment plugin to the schema
servicerequestSchema.plugin(AutoIncrement, {
  inc_field: "ticket_no",
  start_seq: 100000,
});

// creating a new collection
const Service_Request = new mongoose.model(
  "Service_Request",
  servicerequestSchema
);

//Exporting the model
module.exports = Service_Request;
