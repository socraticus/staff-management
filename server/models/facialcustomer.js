const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FacialcustomerSchema = new Schema({
    id: Number,
    createdate: Date,
    fullname: String,
    email: String,
    phone: String,
    datebirth: Date
});

const Facialcustomer = mongoose.model('facialcustomers', FacialcustomerSchema);

module.exports = Facialcustomer;