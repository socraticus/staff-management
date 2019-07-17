const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const cors = require("cors");
const request = require("request");
let plivo = require("plivo");

const app = express();

// Body Parser Middleware
router.use(
  bodyParser.urlencoded({
    extended: false
  })
);
router.use(bodyParser.json());

// CORS Middleware
// CORS Middleware
const whitelist = [
  "https://www.anandaspamiami.com",
  "https://ananda-spa-user-profile.firebaseapp.com"
];
const corsOptions = {
  origin: function(origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
  // optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
// router.use(cors(corsOptions));
router.use(cors());

//Routes sections----------------------------------------------------------------------------

/* GET home page of Facial form route. */
router.get("/", function(req, res, next) {
  // Set the app and location ids for sqpaymentform.js to use
  res.send({
    title: "Plivo is here!!!"
  });
});

//Methods----------------------------------------------------------------------------------------/
router.post("/sms", function(req, res, next) {
  var request_params = req.body;
  console.log(request_params);
  /*  res.send({
    request_params
  }); */
  let client = new plivo.Client(
    "MAYWUYZJUZMJIXYJJJMD",
    "MTNiZTNmYmZhZjJmMDc4ZWU3MjNjYTU2MTAwMWQ1"
  );
  client.messages
    .create(
      "+1 786-232-0269",
      request_params.number,
      "This is a promotional message sent from anandaSPA, thank you for choosing us"
    )
    .then(function(message_created) {
      console.log(message_created);
    });
});
//Methods----------------------------------------------------------------------------------------/
module.exports = router;
