const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema and Model

const MinorformSchema = new Schema({
    id: Number,
    type: String,
    fullname: String,
    datebirth: Date,
    datecreated: Date,
    minorfullname: String,
    signature: String
});


const Minorform = mongoose.model('minorforms', MinorformSchema);

module.exports = Minorform;