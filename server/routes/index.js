const express = require('express');
const router = express.Router();
const util = require('util');
const crypto = require('crypto');
const SquareConnect = require('square-connect');
const bodyParser = require('body-parser');

const app = express();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}))

/* GET home page of square route. */
router.get('/', function(req, res, next) {
	// Set the app and location ids for sqpaymentform.js to use
	res.render('index', {
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
		res.render('process-payment', {
			'title': 'Payment Successful',
			'result': "Payment Successful (see console for transaction output)"
		});
	}, function(error) {
		console.log(util.inspect(error.status, false, null));
		res.render('process-payment', {
			'title': 'Payment Failure',
			'result': "Payment Failed (see console for error output)"
		});
	});

});

module.exports = router;