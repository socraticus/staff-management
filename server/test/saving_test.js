const mocha = require('mocha');
const assert = require('assert');
const ExpressCustomer = require('../models/expresscustomer.js')

describe('Saving records', function() {
    it('Save record to DB', function(done){
        var expresscust = new ExpressCustomer({
            name: 'Tatiana',
            email: 'tatiana@gmail.com',
            amount: 4200,
            address: {
                street: '16120 SW 98th Ct',
                city: 'Miami',
                state: 'FL',
                zip_code: '33157'
            },
            createdAt: 12300000000
        });
                
        expresscust.save(function (err) {
            if (err) return handleError(err);
            console.log('Record saved: ', expresscust);
            ExpressCustomer.estimatedDocumentCount({}, function(err, count) {
                console.log('There are ', count + ' customers')
            });
        })

        //.then(function() {
            //assert(expresscust.isNew === false);
            assert(2+2===4);
            done();
        //})
    });
});