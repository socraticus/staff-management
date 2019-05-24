const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const Intakeform = require('../models/intakeform.js');
const Facialform = require('../models/facialform.js');
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

//Routes sections----------------------------------------------------------------------------

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
            res.json({
                'status': 409,
                'title': 'Intakeitem exist',
                'result': "this record alredy exist"
            });
        }
        else {
            var Intakeitem = new Intakeform(request_params.body);

            Intakeitem.save(function (err, intakeform) {
                if (err) {
                    res.json({
                        'status': 500,
                        'title': 'Intakeitem fail',
                        'err': err
                    });
                    return console.error(err);
                }
                console.log(" saved to Intakeitem collection.");
                res.json({
                    'status': 200,
                    'title': 'Intakeitem Successful',
                    'result': "Intakeitem Successful"
                });
            });
        }
    })




})


router.get('/test', function (req, res, next) {
    intakeformMigration();

})
//Routes sections----------------------------------------------------------------------------

//Methods section----------------------------------------------------------------------------

function intakeformMigration() {
    Facialform.find().distinct('email', function (error, emails) {
        console.log(emails.length);
        /* emails.forEach(item => {
            var facialitem = Facialform.findOne({ email: item , fullname :{ $ne: [] }});
            console.log(facialitem);
            var intakeitem =new Intakeform(facialitem);

            intakeitem.save(function (err, intakeform) {
                if (err) return console.error(err);
                console.log(" saved to intakeitem collection.");
            });
        }); */
        Facialform.findOne({ email: emails[0], fullname: { $ne: [] } },'fullname', function (err, resad) {

            console.log(resad);
            var intakeitem = new Intakeform(resad);

            intakeitem.save(function (err, intakeform) {
                if (err) return console.error(err);
                console.log(" saved to intakeitem collection.");
            });
        });

    });
}






//Methods section----------------------------------------------------------------------------
module.exports = router;