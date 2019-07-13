const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema and Model

const IntakeformSchema = new Schema({
  id: Number,
  clientid: Number,
  createdate: Date,
  recommendation: String,
  groupon: String,
  business: String,
  business_yelp: Boolean,
  business_google: Boolean,
  business_groupon: Boolean,
  business_recommendation: Boolean,
  fullname: String,
  phone: String,
  address: String,
  citystate: String,
  email: String,
  datebirth: Date,
  parentname: String,
  parentsignature: String,
  wearcontact: Boolean,
  surgery: Boolean,
  surgerydescribe: String,
  skincancer: Boolean,
  dermatitis: Boolean,
  keloidscarring: Boolean,
  acne: Boolean,
  rosacea: Boolean,
  broken: Boolean,
  treatment: Boolean,
  hypo: Boolean,
  hyperpig: Boolean,
  burns: Boolean,
  anycondition: Boolean,
  anyconditiondescription: String,
  allergies: Boolean,
  latexallergies: Boolean,
  otherallergies: Boolean,
  otherallergiesdescription: String,
  prescription: Boolean,
  prescriptiondescription: String,
  pregnant: Boolean,
  technician: Boolean,
  techniciandescription: String,
  appointment: String,
  oftenfacials: String,
  oftenbody: String,
  cosmetic: Boolean,
  finelines: Boolean,
  wrinkles: Boolean,
  dull: Boolean,
  loss: Boolean,
  dry: Boolean,
  oily: Boolean,
  pores: Boolean,
  redness: Boolean,
  sensit: Boolean,
  dark: Boolean,
  pimples: Boolean,
  skin: Boolean,
  other: Boolean,
  otherextradescription: String,
  routine: String,
  cleanser: Boolean,
  toner: Boolean,
  moisturizer: Boolean,
  spf: Boolean,
  vitamin: Boolean,
  scrubs: Boolean,
  speciality: Boolean,
  mask: Boolean,
  supplements: Boolean,
  exercise: Boolean,
  scar: Boolean,
  skinsensitive: Boolean,
  pictures: Boolean,
  signature: String
});

const Intakeform = mongoose.model("intakeforms", IntakeformSchema);

module.exports = Intakeform;
