const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const cors = require("cors");
const Intakeform = require("../models/intakeform.js");
const Facialform = require("../models/facialform.js");
const Minorform = require("../models/minorform.js");
const Massageform = require("../models/massageform.js");
const request = require("request");

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
    title: "Facial Form"
  });
});

router.get("/getAll", function(req, res, next) {
  Intakeform.find({}, "createdate fullname email phone", function(err, result) {
    res.send(result);
  });
});

router.post("/getItem", function(req, res, next) {
  var request_params = req.body;
  Intakeform.findOne({ _id: request_params.body.id }, function(err, result) {
    res.send(result);
  });
});

router.post("/insert", function(req, res, next) {
  var request_params = req.body;
  Intakeform.find({ email: request_params.body.email }).then(function(result) {
    if (result.length) {
      console.log("this record alredy exist");
      res.json({
        status: 409,
        title: "Intakeitem exist",
        result: "this record alredy exist"
      });
    } else {
      var Intakeitem = new Intakeform(request_params.body);

      Intakeitem.save(function(err, intakeform) {
        if (err) {
          res.json({
            status: 500,
            title: "Intakeitem fail",
            err: err
          });
          return console.error(err);
        }
        console.log(" saved to Intakeitem collection.");
        res.json({
          status: 200,
          title: "Intakeitem Successful",
          result: "Intakeitem Successful"
        });
      });
    }
  });
});

router.get("/test", function(req, res, next) {
  intakeformMigration();
});
//Routes sections----------------------------------------------------------------------------

//Methods section----------------------------------------------------------------------------

function intakeformMigration() {
  Facialform.find().distinct("email", function(error, emails) {
    console.log(emails.length);
    emails.forEach(item => {
      Facialform.findOne({ email: item, fullname: { $ne: [] } }, function(
        err,
        resad
      ) {
        var obj = JSON.stringify(resad);
        var result = JSON.parse(obj);
        delete result._id;
        result.push({ "recommendation" : "" });
        result.push({ "groupon" : "" });
        result.push({ "parentname" : "" });
        result.push({ "parentsignature" : "" });
        console.log(result);
        var intakeitem = new Intakeform(result);

        intakeitem.save(function(err, intakeform) {
          if (err) return console.error(err);
          console.log(" saved to intakeitem collection.");
        });
      });
    });
  });
}

function minorAndMassageMigration() {
  request(
    "https://ananda-spa-miami-dev.firebaseapp.com/dev/minor_list.json",
    (error, response, html) => {
      if (!error && response.statusCode === 200) {
        var x = JSON.parse(html);

        for (i = 0; i < x.apps.length; i++) {
          var options = {
            url:
              "https://admin.okto.us/api/core/GetOneApplicationIntake?clientid=32d5c181-5835-41f0-bc4b-6d53cf07dfb0&id=" +
              x.apps[i].id
          };
          if (x.apps[i].type == "Intake") {
            request(options, (error, response, body) => {
              if (!error && response.statusCode === 200) {
                var data = JSON.parse(body);
                var y = JSON.parse(data);
                var item = y.app[0];
                var Massageitem = new Massageform(item);

                Massageitem.save(function(err, massageform) {
                  if (err) return console.error(err);
                  console.log(" saved to Massageitem collection.");
                });
              }
            });
          }
          if (x.apps[i].type == "Minor") {
            request(options, (error, response, body) => {
              if (!error && response.statusCode === 200) {
                var data = JSON.parse(body);
                var y = JSON.parse(data);
                var item = {
                  id: y.app[0].id,
                  type: y.app[0].type,
                  fullname: y.app[0].fullname,
                  datebirth: y.app[0].datebirth,
                  datecreated: y.app[0].datecreated,
                  minorfullname: y.app[0].minorfullname,
                  signature: y.app[0].signature
                };
                var Minoritem = new Minorform(item);

                Minoritem.save(function(err, minorform) {
                  if (err) return console.error(err);
                  console.log(" saved to Minoritem collection.");
                });
              }
            });
          }
        }
      }
    }
  );
}

//Methods section----------------------------------------------------------------------------
module.exports = router;
