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
const juice = require('juice');
const juiceResources = require('juice-resources-promise');
const puppeteer = require('puppeteer');
const firebase = require('firebase');
const firebase_admin = require('firebase-admin');
const https = require('https');
var inlineCss = require('inline-css');
const cheerio = require('cheerio');

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

router.get('/get-receipt', function (req, res, next) {
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
			const $ = cheerio.load(html);
			$('head').empty();
			$('head').append('<meta content="width=device-width, initial-scale=1" name="viewport"><meta content="noindex,nofollow" name="robots"><meta charset="utf-8"><title>Receipt from Ananda Spa</title><style>body,input,button,td>.p,.td-merchant-header-info,.table-payment-header td{font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;line-height:30px;color:#3d454d;font-weight:normal}html,body{background-color:#f2f4f5}body,input,button{-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:none;width:100% !important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;margin:0}body{min-height:400px;margin:0;padding:0}#outlook a{padding:0}table{-premailer-cellpadding:0;-premailer-cellspacing:0;border:0;border-collapse:collapse;border-spacing:0;border-width:0}td{line-height:0px;font-size:0px;border-collapse:collapse;padding:0}td>.p{margin:0;padding:0}a:link,a:visited,a:focus,a:hover,a:active,a:href{text-decoration:none}.h1{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;text-align:center;color:#3d454d;font-size:64px;line-height:64px;white-space:nowrap}.h2{color:white;font-size:18px;line-height:26px;margin:0}.receipt-content-wrapper{text-align:left;margin-left:auto;margin-right:auto;margin-top:16px;-premailer-cellpadding:0;-premailer-cellspacing:0;border:0;width:100%;-premailer-width:100%;min-width:320px;max-width:375px}.table-container-section{background:white;width:100%;-premailer-width:100%;min-width:100%}.receipt-bottom-edge,.receipt-top-edge{border:0;display:block;max-width:375px;width:100%}.pseudo-body{min-height:400px;background-color:#f2f4f5 !important;width:100%;-premailer-width:100%;line-height:100%}.centering-table,.table-receipt-bottom-edge{background-color:#f2f4f5 !important}.td-inner-line-break{padding-left:12px;padding-right:12px}.half-col-left{width:70%;-premailer-width:70%}.half-col-right{width:30%;-premailer-width:30%}.full-col{width:100%;-premailer-width:100%}.td-automatic-receipt-banner{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:21px;color:#85898c;text-align:center;padding:12px 16px}.automatic-receipt-link{color:#2996cc;text-decoration:underline !important}.outreach-disclaimer-link{color:#85898c;text-decoration:underline !important}.td-outreach-disclaimer{font-size:11px;line-height:16px;text-align:center;padding-right:15px;padding-left:15px}.td-outreach-disclaimer b{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:normal}.refund-header-wrapper{overflow:hidden;background-color:#3eb21b}.merchant-header-wrapper{overflow:hidden}.vertical-center-sibling{height:32px;-premailer-height:32;vertical-align:middle;display:inline-block}.table-footer{background-color:#f2f4f5}.table-footer .p{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:12px;font-weight:normal;letter-spacing:0.2px;line-height:18px;color:#85898c}.table-footer .footer-link a{color:#85898c;text-decoration:underline !important}.table-footer a{color:#85898c;text-decoration:none}.footer-line-break{height:1px;-premailer-height:1;display:block;background-color:#e0e2e3;font-size:0;line-height:0}body.sensitive-data p,body.sensitive-data .p,body.sensitive-data .replyable-header-wrapper .p,body.sensitive-data .table-footer .p,body.sensitive-data .table-footer a,body.sensitive-data .table-footer .footer-link a,body.sensitive-data .td-receipt-address .last-location,body.sensitive-data .item-modifier-name .p,body.sensitive-data .td-cash-amount .p,body.sensitive-data .non-taxable-items .p,body.sensitive-data .refund-date .p,body.sensitive-data .td-payment-card .p,body.sensitive-data .table-return-policy .p,body.sensitive-data .table-custom-text .p,body.sensitive-data .table-date-and-tenders .p,body.sensitive-data .table-date-and-tenders a,body.sensitive-data .register-upsell-tile .register-upsell-tile-header,body.sensitive-data .register-upsell-tile .register-upsell-tile-body{color:#3d454d}.primary-button__link{background-color:#3d454d;border-radius:5px;border:1px solid #3d454d;color:white;display:inline-block;font-size:14px;height:40px;letter-spacing:0.3px;line-height:40px;padding-left:24px;padding-right:24px;white-space:nowrap;font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500}.receipt-content-wrapper--546476 .curated-image{background-color:#546476}.receipt-content-wrapper--546476 .feedback-visible .curated-image{background-color:#43505e}.receipt-content-wrapper--546476 .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#546476}.receipt-content-wrapper--a973a9 .curated-image{background-color:#a973a9}.receipt-content-wrapper--a973a9 .feedback-visible .curated-image{background-color:#875c87}.receipt-content-wrapper--a973a9 .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#a973a9}.receipt-content-wrapper--456d9c .curated-image{background-color:#456d9c}.receipt-content-wrapper--456d9c .feedback-visible .curated-image{background-color:#37577d}.receipt-content-wrapper--456d9c .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#456d9c}.receipt-content-wrapper--5a97c4 .curated-image{background-color:#5a97c4}.receipt-content-wrapper--5a97c4 .feedback-visible .curated-image{background-color:#48799d}.receipt-content-wrapper--5a97c4 .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#5a97c4}.receipt-content-wrapper--71b7bc .curated-image{background-color:#71b7bc}.receipt-content-wrapper--71b7bc .feedback-visible .curated-image{background-color:#5a9296}.receipt-content-wrapper--71b7bc .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#71b7bc}.receipt-content-wrapper--9bbf6a .curated-image{background-color:#9bbf6a}.receipt-content-wrapper--9bbf6a .feedback-visible .curated-image{background-color:#7c9955}.receipt-content-wrapper--9bbf6a .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#9bbf6a}.receipt-content-wrapper--8897a7 .curated-image{background-color:#8897a7}.receipt-content-wrapper--8897a7 .feedback-visible .curated-image{background-color:#6d7986}.receipt-content-wrapper--8897a7 .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#8897a7}.receipt-content-wrapper--e76c6d .curated-image{background-color:#e76c6d}.receipt-content-wrapper--e76c6d .feedback-visible .curated-image{background-color:#b95657}.receipt-content-wrapper--e76c6d .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#e76c6d}.receipt-content-wrapper--e38484 .curated-image{background-color:#e38484}.receipt-content-wrapper--e38484 .feedback-visible .curated-image{background-color:#b66a6a}.receipt-content-wrapper--e38484 .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#e38484}.receipt-content-wrapper--ed9356 .curated-image{background-color:#ed9356}.receipt-content-wrapper--ed9356 .feedback-visible .curated-image{background-color:#be7645}.receipt-content-wrapper--ed9356 .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#ed9356}.receipt-content-wrapper--e3b14d .curated-image{background-color:#e3b14d}.receipt-content-wrapper--e3b14d .feedback-visible .curated-image{background-color:#b68e3e}.receipt-content-wrapper--e3b14d .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#e3b14d}.receipt-content-wrapper--997c61 .curated-image{background-color:#997c61}.receipt-content-wrapper--997c61 .feedback-visible .curated-image{background-color:#7a634e}.receipt-content-wrapper--997c61 .feedback-visible .curated-image-arrow{border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:#997c61}.refund-visible .curated-image{background-color:#3eb21b}.curated-image table{table-layout:fixed;width:100%;-premailer-width:100%;word-wrap:break-word}.td-merchant-header-info{color:white;padding-left:36px;padding-right:36px;width:100%;-premailer-width:100%;height:141px;-premailer-height:141}.td-merchant-header-info h2 a{color:white;text-decoration:none}.merchant-header__image{vertical-align:middle}.merchant-header__name{font-size:16px;line-height:18px;letter-spacing:0.3px;padding-top:24px;color:white;font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500}.td-curated-image-arrow{height:8px;-premailer-height:8}.curated-image-arrow{height:0;width:0;border-top-width:0;border-bottom-width:8px;border-bottom-style:solid;border-bottom-color:white;border-right-width:8px;border-right-style:solid;border-right-color:transparent;border-left-width:8px;border-left-style:solid;border-left-color:transparent;vertical-align:bottom}.table-date-and-tenders td{width:140px;-premailer-width:140}.table-date-and-tenders td,.table-date-and-tenders img,.table-date-and-tenders .p{vertical-align:top}.table-date-and-tenders .p{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:21px;padding:3.5px 0;color:#85898c}.table-date-and-tenders a{color:#85898c;text-decoration:none}.table-date-and-tenders .card-icon{padding-top:3px}.td-payment-time{white-space:nowrap}.table-payment-header td .currency_symbol{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;font-size:26px;vertical-align:super;line-height:1}.table-payment-header .h1-super-long-payment-total{font-size:44px}.table-refund-header .p,.table-refund-header .h1{color:#00bd20}.table-refund-header .refunded-text{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;text-transform:uppercase;letter-spacing:0.1em}.table-payment-info{border-collapse:separate;word-wrap:break-word}.table-payment-info .p{padding:3.5px 0;color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:21px}.table-payment-info .tr-refund-header .p{font-weight:500;text-transform:uppercase;font-size:13px;letter-spacing:0.1em}.receipt-number .p{padding-bottom:24px}.item-modifier-name{padding-left:6px;padding-right:6px}.item-modifier-name,.item-modifier-name .p{color:#85898c}.gift-card-balance-amount.p,.gift-card-balance-label.p,.item-description.p,.td-cash-amount .p{font-size:14px;color:#85898c;line-height:18px}.non-taxable-items.p{font-size:11px;color:#85898c;line-height:18px}.tr-discount .p,.tr-discount .h1,.tr-negative-rounding .p,.tr-negative-rounding .h1,.tr-refunded-amount .p,.tr-refunded-amount .h1{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;color:#00bd20}.half-col-right .refunded-amount{white-space:nowrap}.tr-refunded-data .half-col-right,.tr-refunded-data .half-col-left{width:50%;-premailer-width:50%}.refund-date.p,.refund-variation.p,.refund-reason.p{font-size:14px;color:#85898c;line-height:14px}.purchase-total.p{font-weight:bold}.amount-refunded.p{font-weight:bold}.td-payment-card{padding-left:6px}.td-payment-card .p{font-size:14px;line-height:13px;color:#85898c}.td-signature img{margin-bottom:-10px;width:160px;-premailer-width:160}.table-return-policy{table-layout:fixed;word-wrap:break-word}.table-return-policy .p{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:21px;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;color:#85898c}.table-custom-text{table-layout:fixed;word-wrap:break-word}.table-custom-text .p{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:21px;font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;text-align:center}.chip-application-id.p{white-space:nowrap}.table-pending-details{background:white}.td-pending-details{font-size:14px;line-height:18px}.td-pending-details{padding:23px 17px}.td-pending-details-arrow{font-size:0 !important;line-height:0 !important;width:33px;-premailer-width:33;height:100%;-premailer-height:100%}.pending-details-link{display:block;width:100%;height:100%;text-decoration:none;color:#3d454d}.table-merchant-info,.table-caviar-info{table-layout:fixed;word-wrap:break-word}.td-map-container{width:100%;-premailer-width:100%}.td-map-container img{display:block}.merchant-info__map{display:block;max-width:375px;width:100%;max-height:120px}.td-receipt-address.half-col-left{padding-left:18px}.td-receipt-address .receipt-profile-name,.td-receipt-address .receipt-address{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:23px;text-align:center;text-decoration:none}.td-receipt-address .receipt-profile-name a,.td-receipt-address .receipt-address a{color:#3d454d;text-decoration:underline}.td-receipt-address #receipt-phone-number a{text-decoration:none;color:#3d454d}.td-receipt-address .receipt-profile-name{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500}.td-receipt-address .last-location{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:23px;color:#85898c}.td-social-link{text-align:center;vertical-align:middle;height:32px;-premailer-height:32;width:56px;-premailer-width:56}.td-social-link a{vertical-align:middle}.td-social-link img{display:inline-block;vertical-align:middle}.order-caviar-link{background-color:#f97242;color:#ffffff}.td-receipt-caviar .caviar-headline{line-height:18px}.table-program{height:120px;-premailer-height:120}.table-program td,.table-program .p{font-size:12px;line-height:16px}.td-program-image{width:120px;-premailer-width:120;height:120px;-premailer-height:120;text-align:center;font-size:0;line-height:0}.td-program-content{padding-right:10px;text-align:left}.td-program-content b{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;font-size:14px}.td-program-arrow{font-size:0 !important;line-height:0 !important;width:33px;-premailer-width:33;height:120px;-premailer-height:120}.program-link{text-decoration:none;color:#3d454d}.receipt-content-wrapper--546476 .table-question{background-color:#546476}.receipt-content-wrapper--a973a9 .table-question{background-color:#a973a9}.receipt-content-wrapper--456d9c .table-question{background-color:#456d9c}.receipt-content-wrapper--5a97c4 .table-question{background-color:#5a97c4}.receipt-content-wrapper--71b7bc .table-question{background-color:#71b7bc}.receipt-content-wrapper--9bbf6a .table-question{background-color:#9bbf6a}.receipt-content-wrapper--8897a7 .table-question{background-color:#8897a7}.receipt-content-wrapper--e76c6d .table-question{background-color:#e76c6d}.receipt-content-wrapper--e38484 .table-question{background-color:#e38484}.receipt-content-wrapper--ed9356 .table-question{background-color:#ed9356}.receipt-content-wrapper--e3b14d .table-question{background-color:#e3b14d}.receipt-content-wrapper--997c61 .table-question{background-color:#997c61}.question-text{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:16px;font-weight:normal;letter-spacing:0.2px;line-height:24px;color:white}.choices{width:100%;-premailer-width:100%;height:100%;-premailer-height:100%}.choice{text-align:center;vertical-align:middle}.choice a{vertical-align:middle;display:block;width:100%;-premailer-width:100%;height:100%;-premailer-height:100%}.choice a img{vertical-align:middle;display:inline-block}.face{width:74px;-premailer-width:74;height:52px;-premailer-height:52}.rating-star{width:48px;-premailer-width:48;height:36px;-premailer-height:36}.feedback-btn-outer img{display:block}.feedback-btn-inner a{text-decoration:none;font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;display:inline-block;text-align:center;text-decoration:none;-webkit-text-size-adjust:none;width:100%;font-size:13px}.marketing-campaign-tile__link{display:block;text-decoration:none}.receipt-content-wrapper--546476 .marketing-campaign-tile__callout{background-color:#546476}.receipt-content-wrapper--546476 .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#546476}.receipt-content-wrapper--a973a9 .marketing-campaign-tile__callout{background-color:#a973a9}.receipt-content-wrapper--a973a9 .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#a973a9}.receipt-content-wrapper--456d9c .marketing-campaign-tile__callout{background-color:#456d9c}.receipt-content-wrapper--456d9c .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#456d9c}.receipt-content-wrapper--5a97c4 .marketing-campaign-tile__callout{background-color:#5a97c4}.receipt-content-wrapper--5a97c4 .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#5a97c4}.receipt-content-wrapper--71b7bc .marketing-campaign-tile__callout{background-color:#71b7bc}.receipt-content-wrapper--71b7bc .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#71b7bc}.receipt-content-wrapper--9bbf6a .marketing-campaign-tile__callout{background-color:#9bbf6a}.receipt-content-wrapper--9bbf6a .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#9bbf6a}.receipt-content-wrapper--8897a7 .marketing-campaign-tile__callout{background-color:#8897a7}.receipt-content-wrapper--8897a7 .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#8897a7}.receipt-content-wrapper--e76c6d .marketing-campaign-tile__callout{background-color:#e76c6d}.receipt-content-wrapper--e76c6d .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#e76c6d}.receipt-content-wrapper--e38484 .marketing-campaign-tile__callout{background-color:#e38484}.receipt-content-wrapper--e38484 .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#e38484}.receipt-content-wrapper--ed9356 .marketing-campaign-tile__callout{background-color:#ed9356}.receipt-content-wrapper--ed9356 .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#ed9356}.receipt-content-wrapper--e3b14d .marketing-campaign-tile__callout{background-color:#e3b14d}.receipt-content-wrapper--e3b14d .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#e3b14d}.receipt-content-wrapper--997c61 .marketing-campaign-tile__callout{background-color:#997c61}.receipt-content-wrapper--997c61 .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .marketing-campaign-tile__link{color:#997c61}.marketing-campaign-tile{background-color:white;border-top:1px solid #e0e2e3;border-bottom:1px solid #e0e2e3;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif}.marketing-campaign-tile .marketing-campaign-tile__callout{width:140px;vertical-align:middle;background-size:cover}.marketing-campaign-tile .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value{background-color:white;font-size:28px;font-weight:500;height:41px;padding-top:23px;border-radius:32px;margin:0px 38px;line-height:21px;width:64px}.marketing-campaign-tile .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value.coupon_offer_type_percent .marketing-campaign-tile__link{margin-left:6px}.marketing-campaign-tile .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value.coupon_offer_type_fixed .marketing-campaign-tile__link{margin-right:6px}.marketing-campaign-tile .marketing-campaign-tile__callout .marketing-campaign-tile__coupon_value .currency_symbol{font-size:14px;vertical-align:top;line-height:10px}.marketing-campaign-tile .marketing-campaign-tile__content{padding:10px 10px 10px 14px;font-size:14px;color:#3d454d;vertical-align:top}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__header{font-size:14px;line-height:20px;padding-top:6px;padding-bottom:6px;font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__header .marketing-campaign-tile__link{color:#3d454d}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__header .marketing-campaign-tile__link:visited{color:#3d454d}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__coupon_expiration{font-size:14px;font-weight:300;line-height:20px;padding-bottom:6px}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__coupon_expiration .marketing-campaign-tile__link{color:#3d454d}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__coupon_expiration .marketing-campaign-tile__link:visited{color:#3d454d}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__action{font-size:14px;font-weight:300;line-height:20px;padding-bottom:6px}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__action .marketing-campaign-tile__link{color:#85898c}.marketing-campaign-tile .marketing-campaign-tile__content .marketing-campaign-tile__action .marketing-campaign-tile__link:visited{color:#85898c}.table-referral-tile-section{text-align:center;width:260px;-premailer-width:260}.program-referral-tile .td-program-image{font-size:36px;background-image:url(https://d3g64w74of3jgu.cloudfront.net/receipts/assets/program-coupon-badge-1x-84c929d7384f8df36adc5d1375a4e390.png);background-size:80px 80px;background-repeat:no-repeat;background-position:50% 50%}.program-referral-tile .reward-amount{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;color:white;line-height:1}.program-referral-tile .reward-amount span{font-size:16px;vertical-align:super}.program-referral-tile .td-program-content a{color:black}.register-upsell-tile{background-color:#f2f4f5}.register-upsell-tile .register-upsell-tile-header,.register-upsell-tile .register-upsell-tile-body{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:21px;padding-left:45px;padding-right:45px}.register-upsell-tile .register-upsell-tile-header{font-family:SQMarket, HelveticaNeue-Medium, "Helvetica Neue Medium", Helvetica-Bold, Helvetica, Arial, sans-serif;font-weight:500;padding-top:24px;padding-bottom:2px}.register-upsell-tile .register-upsell-tile-body{color:#85898c;padding-bottom:12px}.register-upsell-tile .register-upsell-tile-button{vertical-align:top;padding-bottom:24px}.voter-registration-tile{background-color:white;border:1px solid #e0e2e3;border-collapse:separate;border-radius:3px}.voter-registration-tile .voter-registration-tile__icon{padding-top:24px}.voter-registration-tile .voter-registration-tile__header,.voter-registration-tile .voter-registration-tile__body{color:#3d454d;font-family:SQMarket, HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;letter-spacing:0.2px;line-height:21px;padding-left:30px;padding-right:30px}.voter-registration-tile .voter-registration-tile__header{font-size:18px;padding-top:12px;padding-bottom:6px}.voter-registration-tile .voter-registration-tile__body{color:#85898c;padding-bottom:12px;font-size:14px}.voter-registration-tile .voter-registration-tile__button{vertical-align:top;padding-bottom:24px}</style>')
			const resulthtml=$.html()

			const mailOptions = {
				from: 'Ananda Spa <contact@anandaspamiami.com>',
				to: 'armenterosroilan@gmail.com',
				subject: 'Nodemailer test',
				text: 'Payment Failed',
				html: resulthtml
			}

			transporter.sendMail(mailOptions, function (err, res) {
				if (err) {
					console.log('Error: ' + JSON.stringify(err))
				} else {
					console.log('Email Sent')
				}
			})

			res.send(resulthtml);
		}
	})
})

module.exports = router;