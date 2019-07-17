const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema and Model

const phoneSchema = new Schema({
  number: Number
});

const phone = mongoose.model("phones", phoneSchema);

module.exports = phone;
