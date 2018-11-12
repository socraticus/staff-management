const express = require('express');
const stripe = require("stripe")("sk_test_Z7gcXsGlhzayOk8rUyG8I0em");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ExpressCustomer = require('./models/expresscustomer.js');
const Counter = require('./models/counter.js');
const http = require("https");
const request = require("request");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
mongoose.Promise = global.Promise;

const app = express();


// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}))

// CORS Middleware
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, PUT,POST, PATCH, DELETE');
        res.status(200).json({});
    }
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
                message: 'Voucher Total Retrieved',
                customerCount: result.total
            };
            console.log("total found")
            res.json(respObj);
        })
})

// Mailchimp First Tab Route
app.post('/mailchimp', (req, res) => {
    
    console.log('mailchimp route hit');
    
    // Check if subscriber already exists
    let email = encodeURI(req.body.email);
    console.log(email);


    var options = {
        method: 'GET',
        url: 'https://us15.api.mailchimp.com/3.0/search-members',
        qs: { query: email, list_id: '879953e1ab' },
        headers:
        {
            'postman-token': '2ac842c3-ae9d-c1be-943a-eeae0a871220',
            'cache-control': 'no-cache',
            authorization: 'Basic YW55c3RyaW5nOjJlOWNkZDg3OGNkY2ZjNWI1ZmFhOGFmMDAzNjJmNTJhLXVzMTU=',
            'content-type': 'application/json'
        },
        // body:
        // {
        //     email_address: 'urist.mcvankab@freddiesjokes.com',
        //     status: 'subscribed',
        //     merge_fields: { FNAME: 'Urist', LNAME: 'McVankab' }
        // },
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        fs.writeFile('mailchimp.log', response);
        fs.writeFile('mailchimp_body.log', body);

        // console.log(body);
        console.log('Files Written');
    });

    console.log('Query sent');

});


// Charge Route
app.post('/charge', (req, res) => {

    // Parse POST form
    //const name = req.body.name;
    const amount = parseInt(req.body.amount, 10);
    var description = "";

    if (amount == 1000) {
        description = "Free Facial Express + Gratuity"
    } else {
        description = "Deep Pore Cleansing Upgrade + Gratuity"
    }
    console.log(req.body);
    console.log(amount);
    stripe.customers.create({
        email: req.body.email,
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
                    message: 'SUCCESS',
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
                    method: 'POST',
                    url: 'https://us15.api.mailchimp.com/3.0/lists/879953e1ab/members/',
                    headers:
                    {
                        'postman-token': '86c3a131-629d-6d10-a929-68c21985b858',
                        'cache-control': 'no-cache',
                        authorization: 'Basic YW55c3RyaW5nOjJlOWNkZDg3OGNkY2ZjNWI1ZmFhOGFmMDAzNjJmNTJhLXVzMTU=',
                        'content-type': 'application/json'
                    },
                    body:
                    {
                        email_address: cust.email,
                        status: 'subscribed',
                        merge_fields: {
                            FNAME: cust.fname,
                            LNAME: cust.lname,
                            VOUCHER: cust.voucher,
                            ADDRESS: cust.street + ", " + cust.city + ", " + cust.state + ", " + cust.zip_code
                        }
                    },
                    json: true
                };

                request(options, function (error, response, body) {
                    if (error) throw new Error(error);

                    console.log(body);
                });


                // Send Final response to Client Browser
                res.json(resultObj);
            });





        })
});

// Connect to MongoDB Atlas

mongoose.connect('mongodb+srv://socraticus:Tra21ai*@anandaspa-cluster0-iap7t.gcp.mongodb.net/AnandaSpaDB')
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





var server = app.listen(process.env.PORT || '8080', function () {
    console.log('Server started on port %s', server.address().port)
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