const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema and Model

const ServiceSchema = new Schema({
    name: String,
    price: Number,
    duration: String
});

const Service = mongoose.model('services', ServiceSchema);

module.exports = Service;