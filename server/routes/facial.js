const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const Intakeform = require('../models/intakeform.js');
const request = require("request");

const app = express();



// Body Parser Middleware
router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json());

// CORS Middleware
// CORS Middleware
const whitelist = ['https://www.anandaspamiami.com', 'https://ananda-spa-user-profile.firebaseapp.com'];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
    // optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
// router.use(cors(corsOptions));
router.use(cors());

/* GET home page of Facial form route. */
router.get('/', function (req, res, next) {
    // Set the app and location ids for sqpaymentform.js to use
    res.send({
        'title': 'Facial Form'
    });
});

router.post('/insert', function (req, res, next) {
    var request_params = req.body;
    Intakeform.find({ email: request_params.body.email }).then(function (result) {
        if (result.length) {
            console.log('this record alredy exist');
        }
        else {
            var Intakeitem = new Intakeform(request_params.body);

            Intakeitem.save(function (err, intakeform) {
                if (err) return console.error(err);
                console.log(" saved to Intakeitem collection.");
            });
        }
    })




})


router.get('/test', function (req, res, next) {

    res.send("My first form route");

})

module.exports = router;