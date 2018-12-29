const express = require('express');
const router = express.Router();
const util = require('util');
const crypto = require('crypto');
const SquareConnect = require('square-connect');
const bodyParser = require('body-parser');
const cors = require('cors');

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
//router.use(cors())

/* GET home page of square route. */
router.get('/', function(req, res, next) {
	// Set the app and location ids for sqpaymentform.js to use
	res.send( {
		'title': 'Make Payment',
		'square_application_id': process.env.square_application_id_sandbox,
		'square_location_id': process.env.square_location_id_sandbox
	});
});

router.post('/process-payment', function(req,res,next){
    console.log(req.body);
	var request_params = req.body;

	var idempotency_key = crypto.randomBytes(64).toString('hex');

	// Charge the customer's card
	var transactions_api = new SquareConnect.TransactionsApi();
	var request_body = {
		card_nonce: request_params.nonce,
		amount_money: {
			amount: 100, // $1.00 charge
			currency: 'USD'
		},
		idempotency_key: idempotency_key
	};
	transactions_api.charge(process.env.square_location_id_sandbox, request_body).then(function(data) {
		console.log(util.inspect(data, false, null));
		res.json( {
			'title': 'Payment Successful',
			'result': "Payment Successful (see console for transaction output)"
		});
	}, function(error) {
		console.log(util.inspect(error.status, false, null));
		res.json( {
			'title': 'Payment Failure',
			'result': "Payment Failed (see console for error output)"
		});
	});

});

module.exports = router;