const express = require('express');
const router = express.Router();
const util = require('util');
const crypto = require('crypto');
const SquareConnect = require('square-connect');
const bodyParser = require('body-parser');
const cors = require('cors');
const Service = require('../models/service.js');

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

// Select betwen production and sandbox credentials

// Set the sandbox application ID
// var applicationId = process.env.square_application_id_sandbox;
// Set the production application ID
var applicationId = process.env.SQUARE_PROD_APP_ID;

// Set the sandbox location ID
// var locationId = process.env.square_location_id_sandbox;
// Set the production location ID
var locationId = process.env.SQUARE_PROD_LOCATION_ID;

/* GET home page of square route. */
router.get('/', function(req, res, next) {
	// Set the app and location ids for sqpaymentform.js to use
	res.send( {
		'title': 'Make Payment',
		'square_application_id': applicationId,
		'square_location_id': locationId
	});
});

router.post('/process-payment', function(req,res,next){
    // console.log(req.body);
	var request_params = req.body;
	console.log("THIS IS THE TYPE " + typeof(request_params.body.amount))
	console.log("THIS IS PARSED " + parseInt(request_params.body.amount * 100))
	console.log("Email is: " + request_params.body.customer.buyer_email_address);
	console.log("Billing is: " + request_params.body.customer.billing_address);
	var parsedAmount = parseInt(request_params.body.amount * 100);
    
	var idempotency_key = crypto.randomBytes(64).toString('hex');

	// Charge the customer's card
	var transactions_api = new SquareConnect.TransactionsApi();
	var request_body = {
		card_nonce: request_params.body.nonce,
		amount_money: {
			amount: parsedAmount,
			currency: 'USD'
		},
		idempotency_key: idempotency_key,
		buyer_email_address: request_params.body.customer.buyer_email_address,
		billing_address: request_params.body.customer.billing_address
    };
    // console.log(request_body);
	transactions_api.charge(locationId, request_body).then(function(data) {
		// console.log(util.inspect(data, false, null));
		res.json( {
			'title': 'Payment Successful',
			'result': "Payment Successful (see console for transaction output)"
		});
	}, function(error) {
        console.log(error);
		// console.log(util.inspect(error.status, false, null));
		res.json( {
			'title': 'Payment Failure',
			'result': "Payment Failed (see console for error output)"
		});
	});

});

router.get('/services-list', function (req, res, next) {
	Service.find().then(function(result) {
		res.send(result);
	})
})

module.exports = router;