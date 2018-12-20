const express = require('express');
// const stripe = require("stripe")(process.env.STRIPE_LIVE_SECRET);
const stripe = require("stripe")(process.env.STRIPE_TEST_SECRET);
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ExpressCustomer = require('./models/expresscustomer.js');
const Counter = require('./models/counter.js');
const https = require("https");
const request = require("request");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
mongoose.Promise = global.Promise;

const app = express();

// Keep Alive app in Heroku
setInterval(function() {
    https.get("https://ananda-spa-backend.herokuapp.com");
}, 300000); // every 5 minutes (300000)


// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}))

// // CORS Middleware
// app.use(function (req, res, next) {
//     res.header('Access-Control-Allow-Origin', "*");
//     res.header('Access-Control-Allow-Headers', '*');
//     if (req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'GET, PUT,POST, PATCH, DELETE');
//         res.status(200).json({});
//     }
//     next();
// });

// CORS Globally
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });
  

// Enable Logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'),
    { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));

app.get('/', (req, res) => {
    console.log("Connection established");
    res.status(200).send("Express Server Working");
});

// Vouchers Left Route
app.get('/vouchers', (req, res) => {
    Counter.findOne({
        counterName: 'Express Facial Customers'
    })
        .then(function (result) {
            var respObj = {
                message: '',
                customerCount: result.total
            };
            console.log("total found")
            res.json(respObj);
        });
});

// Subscriber Global Object

var subscriber = {
    fname: "",
    lname: "",
    email: "",
    id: "",
    voucher: "",
    address: "",
    freevoucher: false,
    upgraded: false
};

// Mailchimp First Tab Route
app.post('/mailchimp', (req, res) => {

    console.log('mailchimp route hit');

    // Check if subscriber already exists
    subscriber.email = encodeURI(req.body.email);
    console.log(subscriber.email);


    var options = {
        method: 'GET',
        url: 'https://us15.api.mailchimp.com/3.0/search-members',
        qs: { query: subscriber.email, list_id: '879953e1ab' },
        headers:
        {
            'postman-token': '2ac842c3-ae9d-c1be-943a-eeae0a871220',
            'cache-control': 'no-cache',
            authorization: process.env.POSTMAN_AUTH,
            'content-type': 'application/json'
        },
        json: true
    };

    request(options, function (error, response, body) {
        // Validate whether subscriber belongs to FreeVoucher or Upgraded
        if (
            !response.body.exact_matches.members[0]) {
            postMailchimp();
        } else if (response.body.exact_matches.members[0].interests.d5d2641f68 === true) {
            postMailchimp();
        } else {
            res.json({ 'message': 'This email has already been used. If you are getting this promotion for somebody else please use their email' });
        }


        function postMailchimp() {
            // Populate Subscriber Global Object
            subscriber.fname = req.body.fname;
            subscriber.lname = req.body.lname;


            //***** 
            // Interests IDs (Mailchimp Groups)
            //
            // '89e3ef05ba': FreeVoucher
            // '0751ff5d8f': UpgradedDeepCleansing
            // d5d2641f68: AbandonCart
            // 
            //*****

            if (response.body.exact_matches.members[0]) {
                subscriber.id = response.body.exact_matches.members[0].id;
                res.json({ 'message': 'First Step Completed' });
                console.log(subscriber.id);
            } else {

                // Send POST request to Mailchimp
                var options = {
                    method: 'POST',
                    url: 'https://us15.api.mailchimp.com/3.0/lists/879953e1ab/members/',
                    headers:
                    {
                        'postman-token': 'aca9edc5-169e-afac-5e2b-aa4d1c4ae07a',
                        'cache-control': 'no-cache',
                        authorization: process.env.POSTMAN_AUTH,
                        'content-type': 'application/json'
                    },
                    body:
                    {
                        email_address: subscriber.email,
                        status: 'subscribed',
                        merge_fields: { FNAME: subscriber.fname, LNAME: subscriber.lname },
                        interests: { '89e3ef05ba': false, '0751ff5d8f': false, d5d2641f68: true }
                    },
                    json: true
                };

                request(options, function (error, response, body) {
                    if (error) throw new Error(error);

                    // Update subscriber object with ID
                    subscriber.id = response.body.id;
                    console.log(response);
                    console.log(response.body.id);
                    console.log(subscriber.id);
                });

                res.json({ 'message': 'First Step Completed' });
            }
        }

        //const emailID = response.body.exact_matches.members[0].id;
        //console.log(emailID);


    });



});


// Charge Route
app.post('/charge', (req, res) => {

    // Parse POST form
    //const name = req.body.name;
    const amount = parseInt(req.body.amount, 10);
    var description = "";

    if (amount == 1000) {
        description = "Free Facial Express + Gratuity";
        subscriber.freevoucher = true;
    } else {
        description = "Deep Pore Cleansing Upgrade + Gratuity";
        subscriber.upgraded = true;
    }



    console.log(req.body);
    console.log(amount);
    stripe.customers.create({
        email: subscriber.email,
        source: req.body.stripeToken
    })
        .then(customer => stripe.charges.create({
            amount,
            description,
            currency: 'usd',
            customer: customer.id
        }))
        .then(charge => {
            var cust = new ExpressCustomer({
                fname: req.body.fname,
                lname: req.body.lname,
                email: req.body.email,
                amount,
                address: {
                    street: req.body.street,
                    city: req.body.city,
                    state: req.body.state,
                    zip_code: req.body.zip_code
                },
                voucher: req.body.voucher,
                createdAt: req.body.createdAt
            });
            cust.save(function (err) {
                if (err) return handleError(err);
                console.log('Record saved: ', cust);
            });

            // Get customer count
            ExpressCustomer.estimatedDocumentCount({}, function (err, count) {
                var resultObj = {
                    message: 'Payment has been successful. You will receive an email with your voucher and/or upgrade shortly',
                    customerCount: count
                };

                console.log('There are ', count + ' customers')

                // Update counter in DB
                Counter.findOneAndUpdate({
                    counterName: 'Express Facial Customers'
                }, {
                        total: count
                    }).then(function () {
                        console.log("counter Updated");
                    });

                // Add Subscriber to MailChimp
                var options = {

                    method: 'PUT',
                    url: 'https://us15.api.mailchimp.com/3.0/lists/879953e1ab/members/' + subscriber.id,
                    headers:
                    {
                        'postman-token': '86c3a131-629d-6d10-a929-68c21985b858',
                        'cache-control': 'no-cache',
                        authorization: process.env.POSTMAN_AUTH,
                        'content-type': 'application/json'
                    },
                    body:
                    {
                        merge_fields: {
                            VOUCHER: cust.voucher,
                            ADDRESS: {
                                addr1: cust.address.street,
                                addr2: '',
                                city: cust.address.city,
                                state: cust.address.state,
                                zip: cust.address.zip_code,
                                country: 'USA'
                            }
                        },
                        interests: { '89e3ef05ba': subscriber.freevoucher, '0751ff5d8f': subscriber.upgraded, d5d2641f68: false }
                    },
                    json: true
                };
                console.log("charge route hit");
                console.log(subscriber.freevoucher, subscriber.upgraded);

                request(options, function (error, response, body) {
                    if (error) throw new Error(error);

                    console.log(body);
                });

                //Reset subscriber object

                subscriber.fname = "";
                subscriber.lname= "";
                subscriber.email= "";
                subscriber.id= "";
                subscriber.voucher= "";
                subscriber.address= "";
                subscriber.freevoucher= false;
                subscriber.upgraded= false; 



                // Send Final response to Client Browser
                res.json(resultObj);
            });





        })
});

// Connect to MongoDB Atlas
const mongoURI = process.env.MONGODB_CONECT;
mongoose.connect(mongoURI);
mongoose.connection.once('open', function () {
    console.log('Connected to MongoDB');
}).on('error', function (error) {
    console.log('Connection error: ', error);
})

// const ExpressCustomer = require('./models/expresscustomer.js');
// var cust = new ExpressCustomer({
//             name: 'Tatiana',
//             email: 'tatiana@gmail.com',
//             amount: 4200,
//             address: {
//                 street: '16120 SW 98th Ct',
//                 city: 'Miami',
//                 state: 'FL',
//                 zip_code: '33157'
//             },
//             createdAt: 12300000000
// });
// cust.save(function(err) {
//     if(err) return handleError(err);
//     console.log('Record saved: ', cust)
// });





var server = app.listen(process.env.PORT || '5000', function () {
    console.log('Server started on port %s', server.address().port);
})





// const token = request.body.stripeToken;

// const charge = stripe.charges.create({
//     amount: 999,
//     currency: 'usd',
//     description: 'Example charge',
//     source: token,
//   }, function(err, charge) {
//     // asynchronously called
//     }  
//   );