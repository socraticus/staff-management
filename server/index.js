const express = require('express');
const stripe = require("stripe")("sk_test_Z7gcXsGlhzayOk8rUyG8I0em");
const bodyParser = require('body-parser');

const app = express();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}))

// Charge Route
app.post('/', (req, res) => {
    const amount = parseInt(req.body.expressCart, 10);
    var description = "";
    const addressCity = req.body.City;
    if(amount == 1000) {
        description = "Free Facial Express + Gratuity"
    } else {
        description = "Deep Pore Cleansing Upgrade + Gratuity"
    }
    console.log(req.body);
    console.log(amount);
    stripe.customers.create({
        email: req.body.email,
        address_city: req.body.City,
        source: req.body.stripeToken
    })
    .then(customer => stripe.charges.create({
        amount,
        description,
        currency:'usd',
        customer:customer.id
    }))
    .then(charge => res.send('SUCCESS'))
});



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