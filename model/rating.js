const mongoose = require("mongoose");

const ratingSchema = mongoose.Schema({
    customerName:{
        type: String,
        required:true
    },
    location:{
        type: String,
        required:true
    },
    customerNumber:{
        type: Number,
        required:true
    },
    vehicleId:{
        type: String,
        required:true
    },
    rating:{
        type: Number,
        reuired:true
    },
    technicianName:{
        type: String,
        default:null
    },
    technicianNumber:{
        type:Number,
        default:null
    },
    remark:{
        type: String,
        default:""
    },
    date:{
        type: Date,
    }
});

const Rating = mongoose.model('Rating',ratingSchema);

module.exports = Rating;