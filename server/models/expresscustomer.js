const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema and Model

const ExpressCustomerSchema = new Schema({
    fname: String,
    lname: String,
    email: String,
    amount: Number,
    address: {
        street: String,
        city: String,
        state: String,
        zip_code: String
    },
    voucher: Number,
    createdAt: Number
});

const ExpressCustomer = mongoose.model('expresscustomers', ExpressCustomerSchema)

module.exports = ExpressCustomer;