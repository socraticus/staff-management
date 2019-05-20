const express = require('express');
const router = express.Router();
const Mailchimp = require('mailchimp-api-v3')
const crypto = require('crypto');
const SquareConnect = require('square-connect');
const bodyParser = require('body-parser');
const cors = require('cors');
const Service = require('../models/service.js');
const Facialform = require('../models/facialform.js');
const Facialcustomer = require('../models/facialcustomer.js');
const request = require("request");
const nodemailer = require('nodemailer');
const juice = require('juice');
const juiceResources = require('juice-resources-promise');
const puppeteer = require('puppeteer');
const firebase = require('firebase');
const firebase_admin = require('firebase-admin');
const https = require('https');
var inlineCss = require('inline-css');
const cheerio = require('cheerio');
const fs = require('fs');
var twilio = require('twilio');

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

var accountSid = process.env.TWILIO_ACCOUNTSID; // Your Account SID from www.twilio.com/console
var authToken = process.env.TWILIO_AUTHTOKEN;   // Your Auth Token from www.twilio.com/console
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
	customer_body.phone_number = request_params.body.customer.phone_number;

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

	function twoDecimals(value) {
		if (value % 1 === 0) {
			return value;
		} else {
			return parseFloat(Math.round(value * 100) / 100).toFixed(2);
		}
	}

	function buildReceipt(order_data, transaction) {



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

		request('https://ananda-spa-miami-dev.firebaseapp.com/dev/receipt.html', (error, response, html) => {
			if (!error && response.statusCode === 200) {
				request('https://squareup.com/receipt/preview/' + transaction.transaction.tenders[0].id, (error, response, body) => {
					if (!error && response.statusCode === 200) {
						// Send mail
						var total_amount = twoDecimals(order_data.order.total_money.amount / 100);
						list = order_data.order.line_items;

						var products = new String;
						console.log("this is the total amount: " + total_amount);
						const $ = cheerio.load(html);
						$('.preheader').empty();
						$('.preheader').append('Receipt for $' + total_amount + ' at Ananda Spa');
						$('.currency-USD').empty();
						$('.currency-USD').append('<div class="h1 language-en currency-USD" style="font-family:SQMarket,HelveticaNeue-Medium,&quot;Helvetica Neue Medium&quot;,Helvetica-Bold,Helvetica,Arial,sans-serif;font-weight:500;color:#3d454d;font-size:64px;line-height:64px;white-space:nowrap" align="center"><span class="currency_symbol" style="font-family:SQMarket,HelveticaNeue-Medium,&quot;Helvetica Neue Medium&quot;,Helvetica-Bold,Helvetica,Arial,sans-serif;font-weight:500;font-size:26px;vertical-align:super;line-height:1">$</span>' + total_amount + '</div>');

						for (i = 0; i < list.length; i++) {
							if (list[i].quantity == '1') {
								products = products + '<td align="left" class="half-col-left" valign="top" style="line-height:0px;font-size:0px;border-collapse:collapse;width:70%;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" width="70%"><div class="p item-name" style="font-family:SQMarket,HelveticaNeue,&quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#3d454d;font-weight:normal;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">' + list[i].name + '</div></td><td align="right" class="half-col-right" valign="top" style="line-height:0px;font-size:0px;border-collapse:collapse;width:30%;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" width="30%"><div class="p" style="font-family:SQMarket,HelveticaNeue,&quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#3d454d;font-weight:normal;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">$' + twoDecimals((list[i].gross_sales_money.amount) / 100) + '</div></td></tr>';
							}
							else {
								products = products + '<tr><td align="left" class="half-col-left" valign="top" style="line-height:0px;font-size:0px;border-collapse:collapse;width:70%;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" width="70%"><div class="p item-name" style="font-family:SQMarket,HelveticaNeue,&quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#3d454d;font-weight:normal;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">' + list[i].name + ' × ' + list[i].quantity + '</div><div class="p item-description item-quantity" style="font-family:SQMarket,HelveticaNeue,&quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size:14px;line-height:18px;color:#85898c;font-weight:normal;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">($' + twoDecimals((list[i].base_price_money.amount) / 100) + ' ea.)</div></td><td align="right" class="half-col-right" valign="top" style="line-height:0px;font-size:0px;border-collapse:collapse;width:30%;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" width="30%"><div class="p" style="font-family:SQMarket,HelveticaNeue,&quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#3d454d;font-weight:normal;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">$' + twoDecimals((list[i].gross_sales_money.amount) / 100) + '</div></td></tr>';
							}
						}

						//console.log("this is the total email: "+request_params.body.customer.buyer_email_address);
						$('.table-payment-info').first().empty();
						var htmlBegin = '<tbody><tr><td colspan="2" style="border-top-width:1px;border-top-color:#e0e1e2;border-top-style:dashed;line-height:0px;font-size:0px;border-collapse:collapse;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" height="1"><img width="1" height="1" border="0" alt="" style="line-height:0;font-size:0" src="https://ci5.googleusercontent.com/proxy/UwK6A9S2fL_3B_fYXA66KlYB8NK1pvuIwfnFiqzB4F-bHx-h20zQP39YLeFxfkgl2oga6q7RVoWWIhE07dNaXqia3Cmo49vsBzbLq6mm6qYNTTroYMlbZd7GE2fYDZHRphsGrG4xhUV-fOmDEe4wCHra3wA=s0-d-e1-ft#https://d3g64w74of3jgu.cloudfront.net/receipts/assets/spacer-aaefc7206bbc074481af8eb7755a10ed.png" class="CToWUd"></td></tr><tr><td width="100%" height="7" colspan="2" style="line-height:0px;font-size:0px;border-collapse:collapse;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"></td></tr>';
						var line = '<tr><td colspan="2" style="border-top-width:1px;border-top-color:#e0e1e2;border-top-style:dashed;line-height:0px;font-size:0px;border-collapse:collapse;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" height="1"><img width="1" height="1" border="0" alt="" style="line-height:0;font-size:0" src="https://ci5.googleusercontent.com/proxy/UwK6A9S2fL_3B_fYXA66KlYB8NK1pvuIwfnFiqzB4F-bHx-h20zQP39YLeFxfkgl2oga6q7RVoWWIhE07dNaXqia3Cmo49vsBzbLq6mm6qYNTTroYMlbZd7GE2fYDZHRphsGrG4xhUV-fOmDEe4wCHra3wA=s0-d-e1-ft#https://d3g64w74of3jgu.cloudfront.net/receipts/assets/spacer-aaefc7206bbc074481af8eb7755a10ed.png" class="CToWUd"></td></tr><tr><td width="100%" height="7" colspan="2" style="line-height:0px;font-size:0px;border-collapse:collapse;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"></td></tr>';

						var total = '<tr><td align="left" class="half-col-left" style="line-height:0px;font-size:0px;border-collapse:collapse;width:70%;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" width="70%"><div class="p" style="font-family:SQMarket,HelveticaNeue,&quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#3d454d;font-weight:normal;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">Total</div></td><td align="right" class="half-col-right" style="line-height:0px;font-size:0px;border-collapse:collapse;width:30%;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" width="30%"><div class="p purchase-total" style="font-family:SQMarket,HelveticaNeue,&quot;Helvetica Neue&quot;,Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#3d454d;font-weight:bold;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">$' + total_amount + '</div></td></tr>';
						if (order_data.order.total_discount_money.amount) {
							var discount_name = list[0].discounts[0].name;
							var discount = '<tr class="tr-discount"><td align="left" class="half-col-left" style="line-height:0px;font-size:0px;border-collapse:collapse;width:70%;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" width="70%"><div class="p" style="font-family:SQMarket,HelveticaNeue-Medium,&quot;Helvetica Neue Medium&quot;,Helvetica-Bold,Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#00bd20;font-weight:500;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">' + discount_name + ' </div></td><td align="right" class="half-col-right" style="line-height:0px;font-size:0px;border-collapse:collapse;width:30%;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0" width="30%"><div class="p" style="font-family:SQMarket,HelveticaNeue-Medium,&quot;Helvetica Neue Medium&quot;,Helvetica-Bold,Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#00bd20;font-weight:500;letter-spacing:0.2px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:3.5px;padding-right:0;padding-bottom:3.5px;padding-left:0">-$' + twoDecimals((order_data.order.total_discount_money.amount) / 100) + '</div></td></tr>';
							$('.table-payment-info').first().append(htmlBegin + products + line + discount + line + total + '</tbody>');

						}
						else {
							$('.table-payment-info').first().append(htmlBegin + products + line + total + '</tbody>');
						}


						const X = cheerio.load(body);
						var time = X('.td-payment-time').text();
						const receipt_id = X('.half-col-right').last().children().first().next().text();
						$('.half-col-right').last().children().first().next().text(receipt_id);

						const auth_code = X('.half-col-right').last().children().first().next().next().text();
						$('.half-col-right').last().children().first().next().next().text(auth_code);

						const card_type = X('.card-icon').prev().text();
						console.log('card type is: ' + card_type);
						$('.card-icon').prev().text(card_type);

						const icon = X('.card-icon').find('img').attr('src');
						$('.card-icon').find('img').attr('src', icon);
						console.log("right: " + icon);

						$('.td-payment-time').empty();
						$('.td-payment-time').append(time);

						var result = $.html();


						const mailOptions = {
							from: 'Ananda Spa <contact@anandaspamiami.com>',
							to: request_params.body.customer.buyer_email_address,
							subject: 'Receipt from Ananda Spa',
							text: 'Payment Success',
							html: result
						}

						transporter.sendMail(mailOptions, function (err, res) {
							if (err) {
								console.log('Error: ' + JSON.stringify(err))
							} else {
								console.log('Email Sent Success')
							}
						})

						const client = require('twilio')(accountSid, authToken);

						client.messages
							.create({
								body: 'Dear ' + request_params.body.customer.billing_address.first_name + ', you have a new receipt from Ananda SPA Miami, please read your email or follow this link->https://squareup.com/receipt/preview/' + transaction.transaction.tenders[0].id + ' for more information about it. Thanks for choosing us',
								from: '+13056942458',
								to: '+1' + request_params.body.customer.phone_number
							})
							.then(message => console.log(message.sid));


						//res.send(result);
					}
				})

			}
		})

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
				buildReceipt(order_data, data); //sending receipt to the customers via sms and email
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

				//sendMailReceipt()
				var request = require("request")

				var url = "http://api.snapcuba.org/transaction.json"

				request({
					url: url,
					json: true
				}, function (error, response, body) {

					if (!error && response.statusCode === 200) {
						console.log(body) // Print the json response

						//buildReceipt(order_data, body);
					}
				})


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

/* function sendMailReceipt() {

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


}; */

// Example of how request works
router.get('/square-receipt', function (req, res, next) {
	request('https://squareup.com/receipt/preview/cMXC8356kEGLRZfqgdFdeyMF', (error, response, html) => {
		if (!error && response.statusCode === 200) {
			juice.juiceResources(html, function (err, html) {
				console.log("Juice method called");
				if (err) {
					console.log(err)
					console.log('Error: ' + JSON.stringify(err));
				}
				console.log('html');
				res.send(html);
			})

			request('https://d3g64w74of3jgu.cloudfront.net/receipts/assets/application-081d1a2e363192dabcc3417e30d322a8.css',
				(error, response, html) => {
					res.send(response);
				})
			const options = {
				preserveImportant: true,
				removeStyleTags: false,
				applyAttributesTableElements: false,
				applyWidthAttributes: false
			}
			juiceResources(html, options).then(inline => {
				res.send(inline)
			}).catch(console.error);

			res.send(html);
		}
	})



	// Using Puppeteer to send receipt

	// Initialize Firebase
	// var config = {
	// 	apiKey: "AIzaSyDbVv1bVyoARmdFXccAkBM8-eAgG_LuVGU",
	// 	authDomain: "ananda-spa-user-profile.firebaseapp.com",
	// 	databaseURL: "https://ananda-spa-user-profile.firebaseio.com",
	// 	projectId: "ananda-spa-user-profile",
	// 	storageBucket: "ananda-spa-user-profile.appspot.com",
	// 	messagingSenderId: "265611520363"
	//   };
	//   firebase.initializeApp(config);

	firebase_admin.initializeApp({
		credential: firebase_admin.credential.cert({
			projectId: "ananda-spa-user-profile",
			clientEmail: "firebaseanandaadmin@ananda-spa-user-profile.iam.gserviceaccount.com",
			privateKey: process.env.FIREBASE_PRIVATE_KEY
		}),
		databaseURL: "https://ananda-spa-user-profile.firebaseio.com",
		storageBucket: "ananda-spa-user-profile.appspot.com",
	});

	var storage = firebase_admin.storage();
	var storageRef = storage.ref('screenshots')
	console.log('Square receipt route')

		(async () => {
			console.log('async route')
			const browser = await puppeteer.launch();
			const page = await browser.newPage();


			await page.goto('https://squareup.com/login');
			await page.screenshot({ path: 'screenshot.png' }).then((screenshot) => {
				console.log('Screenshot captured: ' + screenshot)

				storageRef.put(screenshot).then(console.log('file uploaded')).catch(console.log(Error));
			});
			console.log(`Current directory: ${process.cwd()}`);





			await browser.close();
		})();


})


router.use((error, req, res, next) => {
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

function senderrors(errmessage, customer) {

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

	const mailOptions = {
		from: 'Ananda Spa <contact@anandaspamiami.com>',
		to: 'armenterosroilan@gmail.com',
		subject: 'Error notification',
		text: 'error with customer '+customer.billing_address.first_name,
		html: errmessage
	}

	transporter.sendMail(mailOptions, function (err, res) {
		if (err) {
			console.log('Error: ' + JSON.stringify(err))
		} else {
			console.log('Email Sent Success')
		}
	})

	const client = require('twilio')(accountSid, authToken);

	client.messages
		.create({
			body: 'Dear Ariel you have a problem with a client '+ customer.billing_address.first_name+' with the number '+customer.phone_number,
			from: '+13056942458',
			to: '+13052242628'
		})
		.then(message => console.log(message.sid));

}

function sendclicked(errmessage) {

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

	const mailOptions = {
		from: 'Ananda Spa <contact@anandaspamiami.com>',
		to: 'armenterosroilan@gmail.com',
		subject: 'Error notification',
		text: 'Please open the logs',
		html: errmessage
	}

	transporter.sendMail(mailOptions, function (err, res) {
		if (err) {
			console.log('Error: ' + JSON.stringify(err))
		} else {
			console.log('Email Sent Success')
		}
	})


}

router.post('/process-errors', function (req, res, next) {
	var request_params = req.body;
	console.log(request_params);
	senderrors(request_params.body.error, request_params.body.customer);

})

router.post('/process-clicked', function (req, res, next) {
	var request_params = req.body;
	console.log(request_params);
	sendclicked(request_params.body.error);

})



function facialformmigration() {

	request('http://api.snapcuba.org/customers.json', (error, response, html) => {
		if (!error && response.statusCode === 200) {
			var x = JSON.parse(html);



			for (i = 0; i < x.data.length; i++) {
				var options = {
					url: 'https://admin.okto.us/api/core/ApplicationSPAFacial_GO?clientid=32d5c181-5835-41f0-bc4b-6d53cf07dfb0&id=' + x.data[i].id,

				}

				request(options, (error, response, body) => {
					if (!error && response.statusCode === 200) {
						var data = JSON.parse(body);
						var y = JSON.parse(data);
						var item = y.app[0];
						var facialfitem = new Facialform(item);

						facialfitem.save(function (err, facialform) {
							if (err) return console.error(err);
							console.log(" saved to facialitem collection.");
						});
					}
				})


			}


		}
	})




}

function facialcustomermigration() {
	request('http://api.snapcuba.org/customers.json', (error, response, html) => {
		if (!error && response.statusCode === 200) {
			var x = JSON.parse(html);
			for (i = 0; i < x.data.length; i++) {

				var facialCitem = new Facialcustomer(x.data[i]);

				facialCitem.save(function (err, facialcustomer) {
					if (err) return console.error(err);
					console.log(" saved to facialCitem collection.");
				});
			}
		}
	})
}

Array.prototype.unique = function (a) {
	return function () { return this.filter(a) }
}(function (a, b, c) {
	return c.indexOf(a, b + 1) < 0
});

function removeDuplicates(originalArray, prop) {
	var newArray = [];
	var lookupObject = {};

	for (var i in originalArray) {
		lookupObject[originalArray[i][prop]] = originalArray[i];
	}

	for (i in lookupObject) {
		newArray.push(lookupObject[i]);
	}
	return newArray;
}

router.get('/exceljs', function (req, res, next) {
	var Excel = require('exceljs');
	var workbook = new Excel.Workbook();
	var sheet = workbook.addWorksheet('MySheet');
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	var retext = /[a-zA-Z]/;
	sheet.columns = [
		{ header: 'Email', key: 'email', width: 32 },
		{ header: 'First Name', key: 'name', width: 32 },
		{ header: 'Last Name', key: 'lastname', width: 32 },
		{ header: 'Address', key: 'address', width: 32 },
		{ header: 'sms', key: 'sms', width: 32 },
		{ header: 'Date Added', key: 'added', width: 32 },
		{ header: 'Birthdate', key: 'datebirth', width: 32 }
	];



	Facialform.find().then(function (customers) {


		for (i = 0; i < customers.length; i++) {
			var fullname = (customers[i].fullname).split(" ");
			var lastname = "";
			if (fullname.length == 2) {
				lastname = fullname[1];
			}
			if (fullname.length == 3) {
				lastname = fullname[1] + " " + fullname[2];
			}
			if (retext.test(customers[i].phone)) {
				customers[i].phone = " ";
			}
			if (customers[i].email != "" && re.test(customers[i].email)) {
				sheet.addRow({ email: customers[i].email, name: fullname[0], lastname: lastname, address: customers[i].address, sms: customers[i].phone, added: customers[i].createdate, datebirth: customers[i].datebirth });
			}

			//console.log(customers[i].fullname + " agregado");
		}



		workbook.csv.writeFile('./customers.xlsx')
			.then(function () {
				console.log("excel created");
			});

		var tempfile = require('tempfile');
		var tempFilePath = tempfile('.xlsx');
		console.log("tempFilePath : ", tempFilePath);
		workbook.xlsx.writeFile(tempFilePath).then(function () {
			res.sendFile(tempFilePath, function (err) {
				console.log('---------- error downloading file: ', err);
			});
			console.log('file is written');
		});
	})



})


module.exports = router;