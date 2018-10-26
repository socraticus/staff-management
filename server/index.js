const express = require('express');
const stripe = require("stripe")("sk_test_Z7gcXsGlhzayOk8rUyG8I0em");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const app = express();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}))

// CORS Middleware
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

// Charge Route
app.post('/', (req, res) => {
    const amount = parseInt(req.body.amount, 10);
    var description = "";

    if(amount == 1000) {
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
        amount: 1000,
        description: 'whatever',
        currency:'usd',
        customer:customer.id
    }))
    .then(charge => res.json({"message":"SUCCESS"}))
});

// Connect to MongoDB Atlas

mongoose.connect('mongodb+srv://socraticus:Tra21ai*@anandaspa-cluster0-iap7t.gcp.mongodb.net/AnandaSpaDB')
mongoose.connection.once('open', function() {
    console.log('Connected to MongoDB');
}).on('error', function(error) {
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


app.post('/submit', (req, res) => {
    console.log(req.body);
    res.json({"message":"SUCCESS"})
})


const port = 5000

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
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