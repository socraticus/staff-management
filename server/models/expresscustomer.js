const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema and Model

const ExpressCustomerSchema = new Schema({
    name: String,
    email: String,
    amount: Number,
    address: {
        street: String,
        city: String,
        state: String,
        zip_code: String
    }
});
