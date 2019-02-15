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
router.get('/', function (req, res, next) {
	// Set the app and location ids for sqpaymentform.js to use
	res.send({
		'title': 'Make Payment',
		'square_application_id': applicationId,
		'square_location_id': locationId
	});
});

router.post('/process-payment', function (req, res, next) {
	var request_params = req.body;
	var parsedAmount = parseInt(request_params.body.amount * 100);

	var idempotency_key = crypto.randomBytes(64).toString('hex');

	console.log("This is request_params: " + JSON.stringify(request_params));

	// Create new customer
	var customers_api = new SquareConnect.CustomersApi();
	var customer_body = new SquareConnect.CreateCustomerRequest();

	customer_body.given_name = request_params.body.customer.billing_address.first_name
	customer_body.family_name = request_params.body.customer.billing_address.last_name
	customer_body.email_address = request_params.body.customer.buyer_email_address
	customer_body.address = request_params.body.customer.billing_address;

	// Verify if customer already exists
	customers_api.listCustomers().then(function (data) {
		console.log('API called successfully. Returned data: ' + data);

		var filteredCustomer = data.customers.filter(function (item, index) {
			if (item.given_name === customer_body.given_name && item.family_name === customer_body.family_name) {
				var customer_id = item.id;
				console.log("Filtered Item: " + JSON.stringify(item));
				return true;
			} else {
				return false;
			}
		});

		if (filteredCustomer.length === 0) {
			customers_api.createCustomer(customer_body).then(function (data) {
				console.log('API called successfully. Returned data: ' + (data));
				var parsedData = JSON.stringify(data);
				// console.log(parsedData);
				console.log(data.customer)

				var customer_id = data.customer.id;
				console.log(customer_id)
				chargeCustomer(customer_id);
			}, function (error) {
				console.error(error);
			});
		} else {
			// Eliminate duplicates if existing
			for (i = 0; i < filteredCustomer.length; i++) {
				if (i === 0) {
					var customer_id = filteredCustomer[0].id;
					chargeCustomer(customer_id);
				} else {
					customers_api.deleteCustomer(filteredCustomer[i].id).then(function (data) {
						console.log('API called successfully. Returned data: ' + JSON.stringify(data));
					}, function (error) {
						console.error(error);
					});
				}
			}
			console.log('Finished Eliminating ' + (filteredCustomer.length - 1) + " duplicates");
			return;
		}

	}, function (error) {
		console.error(error);
	});




	// Charge the customer's card
	var chargeCustomer = function (customer_id) {
		console.log("chargeCustomer called " + customer_id);

		// Create new order
		var orders_api = new SquareConnect.OrdersApi();
		var order_body = new SquareConnect.CreateOrderRequest();
		var line_item_body = new SquareConnect.OrderLineItem();

		order_body.idempotency_key = crypto.randomBytes(64).toString('hex');

		if (request_params.body.discount.details.percentage === true) {
			order_body.discounts = [
				{
					name: request_params.body.discount.appliedCode,
					percentage: request_params.body.discount.details.discountAmount.toString()
				}
			];
		} else {
			order_body.discounts = [
				{
					name: request_params.body.discount.appliedCode,
					amount_money: {
						amount: request_params.body.discount.amount,
						currency: "USD"
					}
				}
			];
		}

		order_body.line_items = new Array();

		for (i = 0; i < request_params.body.cart.length; i++) {
			line_item_body = {
				name: request_params.body.cart[i].product.name,
				quantity: request_params.body.cart[i].quantity.toString(),
				base_price_money: {
					amount: request_params.body.cart[i].product.price * 100,
					currency: "USD"
				}
			};
			order_body.line_items.push(line_item_body);
		}

		console.log("This is order_body " + JSON.stringify(order_body));
		// console.log("This is line_item " + JSON.stringify(line_item_body));

		orders_api.createOrder(locationId, order_body).then(function (order_data) {
			console.log('CreateOrder API called successfully. Returned data: ' + JSON.stringify(order_data));

			// Charge Transaction
			// /*
			var transactions_api = new SquareConnect.TransactionsApi();
			var request_body = {
				card_nonce: request_params.body.nonce,
				amount_money: {
					amount: order_data.order.total_money.amount,
					currency: 'USD'
				},
				idempotency_key: idempotency_key,
				customer_id: customer_id,
				order_id: order_data.order.id
			};
			transactions_api.charge(locationId, request_body).then(function (data) {
				console.log('Transactions API called successfully. Returned data: ' + JSON.stringify(data));
				res.json({
					'title': 'Payment Successful',
					'result': "Payment Successful (see console for transaction output)"
				});
			}, function (error) {
				console.log('Transactions API error. Returned data: ' + JSON.stringify(error));
				// res.json({
				// 	'title': 'Payment Failure',
				// 	'result': "Payment Failed (see console for error output)"
				// });
				res.json(error);
			});
			// */
		}, function (error) {
			console.error("This is the createOrder error: " + JSON.stringify(error));
		});


	};


});

router.get('/services-list', function (req, res, next) {
	Service.find().then(function (result) {
		res.send(result);
	})
})

module.exports = router;