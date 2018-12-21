const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema and Model

const DiscountSchema = new Schema({
    promotionName: String,
    createdAt: Number,
    beginning: Number,
    ending: Number,
    discountAmount: Number,
    percentage: Boolean,
    discountCode: String
});

const Discount = mongoose.model('discounts', DiscountSchema)

module.exports = Discount;