const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect('mongodb+srv://socraticus:Tra21ai*@anandaspa-cluster0-iap7t.gcp.mongodb.net/AnandaSpaDB')
mongoose.connection.once('open', function() {
    console.log('Connected to MongoDB');
}).on('error', function(error) {
    console.log('Connection error: ', error);
})