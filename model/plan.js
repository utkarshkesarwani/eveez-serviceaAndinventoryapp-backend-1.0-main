const mongoose = require("mongoose")


const planSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
    },
    
    planName: {
        type: String,
        required: true,
        trim: true
    },

    fup: String,
    
    subscriptions_cost: {
        type: String,
        required: true
    },


    type: {
        type: String,
        required: true
    },

    range: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    number_of_passsengers: {
        type: String,
        required: true
    },

    registration: {
        type: String,
        required: true
    },

    carrying_capacity: {
        type: String,
        required: true
    },

    speed_range: {
        type: String,
        required: true
    },

    battery_capacity: {
        type: String,
        required: true
    },

})

const Plan = mongoose.model("Plan", planSchema)

module.exports = Plan