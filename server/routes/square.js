const express = require('express');
const router = express.Router();
const Mailchimp = require('mailchimp-api-v3')
const crypto = require('crypto');
const SquareConnect = require('square-connect');
const bodyParser = require('body-parser');
const cors = require('cors');
const Service = require('../models/service.js');
const request = require("request");
const nodemailer = require('nodemailer');

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
				console.error(error)
				res.json(error);
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
						console.error(error)
						res.json(error)
					});
				}
			}
			console.log('Finished Eliminating ' + (filteredCustomer.length - 1) + " duplicates");
			return;
		}

	}, function (error) {
		console.error(error);
	});

	// Add Subscriber to Mailchimp

	var mailchimpID = null

	var options = {
		method: 'GET',
		url: 'https://us15.api.mailchimp.com/3.0/search-members',
		qs: { list_id: '0dcc5d126d', query: customer_body.email_address },
		headers:
		{
			'Postman-Token': process.env.POSTMAN_TOKEN,
			'cache-control': 'no-cache',
			Authorization: process.env.POSTMAN_AUTH,
		}
	};

	request(options, function (error, response, body) {
		console.log('This is the body: ' + body);
		console.log('This is the query response: ' + JSON.stringify(response));

		if (error) throw new Error(error);

		if (JSON.parse(body).exact_matches.total_items === 0) {
			postMailchimp();
		} else {
			mailchimpID = JSON.parse(body).exact_matches.members[0].id;
			console.log('This is mailchimpID: ' + mailchimpID);
		}


	});

	function postMailchimp() {

		// Send POST request to Mailchimp

		console.log("postMailchimp function called")

		var options = {
			method: 'POST',
			url: 'https://us15.api.mailchimp.com/3.0/lists/0dcc5d126d/members/',
			headers:
			{
				'postman-token': process.env.POSTMAN_TOKEN,
				'cache-control': 'no-cache',
				authorization: process.env.POSTMAN_AUTH,
				'content-type': 'application/json'
			},
			body:
			{
				email_address: customer_body.email_address,
				status: 'subscribed',
				merge_fields: {
					FNAME: customer_body.given_name,
					LNAME: customer_body.family_name,
					ADDRESS: {
						addr1: customer_body.address.address_line_1,
						city: customer_body.address.locality,
						state: customer_body.address.administrative_district_level_1,
						zip: customer_body.address.postal_code
					}
				}
			},
			json: true
		};

		request(options, function (error, response, body) {
			console.log("this is Malchimp response: " + JSON.stringify(response))
			if (error) throw new Error(error);

			if (response.statusCode === 200) {
				mailchimpID = response.body.id
				console.log('This is mailchimpID: ' + mailchimpID)
			}

		});

	}

	// Modify Mailchimp Tags
	function postMailchimpTags(tags) {
		var options = {
			method: 'POST',
			url: 'https://us15.api.mailchimp.com/3.0/lists/0dcc5d126d/members/' + mailchimpID + '/tags',
			headers:
			{
				'Postman-Token': process.env.POSTMAN_TOKEN,
				'cache-control': 'no-cache',
				Authorization: process.env.POSTMAN_AUTH,
				'Content-Type': 'application/json'
			},
			body: { tags: tags },
			json: true
		};

		request(options, function (error, response, body) {
			if (error) throw new Error(error);

			console.log(JSON.stringify(body));
		});
	}

	// Charge the customer's card
	var chargeCustomer = function (customer_id) {
		console.log("chargeCustomer called " + customer_id);

		// Create new order
		var orders_api = new SquareConnect.OrdersApi();
		var order_body = new SquareConnect.CreateOrderRequest();
		var line_item_body = new SquareConnect.OrderLineItem();

		order_body.idempotency_key = crypto.randomBytes(64).toString('hex');

		// Add discount to order
		console.log(request_params.body.discount.amount);

		if (request_params.body.discount.amount !== 0) {
			addDiscountToOrder()
		}

		function addDiscountToOrder() {
			if (request_params.body.discount.details.percentage === true && request_params.body.discount.details.discountAmount !== 0) {
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
		}

		// Add line items to order
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

				// Add Tags To Mailchimp Subscriber
				var tags = order_body.line_items.map(tag => {
					return {
						name: tag.name,
						status: "active"
					}
				})
				console.log("These are the tags: " + tags)
				postMailchimpTags(tags)

				res.json({
					'status': 200,
					'title': 'Payment Successful',
					'result': "Payment Successful (see console for transaction output)"
				});
			}, function (error) {

				// Add Payment Failed Tag To Mailchimp Subscriber
				var tags = [
					{
						name: "Payment Failed",
						status: "active"
					}
				];

				postMailchimpTags(tags)

				sendMailReceipt()

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

//  Nodemailer send order receipts

function sendMailReceipt() {

	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,

		auth: {
			type: 'OAuth2',
			user: 'contact@anandaspamiami.com',
			clientId: process.env.GMAIL_OAuth_ClientID,
			clientSecret: process.env.GMAIL_Client_Secret,
			refreshToken: '1/_eim3SumpBsCquSqJgjqEtqQq6wcS7XzhfMUiXmXyMs',
		}
	})

	// Get HTML from Square

	request('https://squareup.com/receipt/preview/cMXC8356kEGLRZfqgdFdeyMF', (error, response, html) => {
		if (!error && response.statusCode === 200) {

			// Send mail
			const mailOptions = {
				from: 'Ananda Spa <contact@anandaspamiami.com>',
				to: 'arielvv85@gmail.com',
				subject: 'Nodemailer test',
				text: 'Payment Failed',
				html: html
			}

			transporter.sendMail(mailOptions, function (err, res) {
				if (err) {
					console.log('Error: ' + JSON.stringify(err))
				} else {
					console.log('Email Sent')
				}
			})

			console.log(html)
		}
	})


};

// Example of how request works
app.get('/square-receipt', function (req, res, next) {
	request('https://squareup.com/receipt/preview/cMXC8356kEGLRZfqgdFdeyMF', (error, response, html) => {
		if (!error && response.statusCode === 200) {
			response.send(html)
		}
	})
})


app.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		errors: [
			{
				detail: "Personal fields missing"
			}
		]
	})
})

router.get('/services-list', function (req, res, next) {
	Service.find().then(function (result) {
		res.send(result);
	})
})

module.exports = router;