const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema and Model

const CounterSchema = new Schema({
    counterName: String,
    total: Number
});

const Counter = mongoose.model('counters', CounterSchema)

module.exports = Counter;