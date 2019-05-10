// DOM variable declarations
var serverURL = 'https://ananda-spa-apitest.herokuapp.com';

// Initialize Vue instance


function testingVue() {
    console.log('accessed from HTML');
    Facialform.testing();
}


window.onload = function () {

    var Facialform = new Vue({
        el: '#vue-facial-form',
        data: {
            title: 'This is a Form Demo',
            cart: {
                items: []
            },
            products: [],
            discountCode: '',
            appliedCode: '',
            discountMessage: '',
            discountResponse: {
                message: '',
                discountAmount: 0,
                percentage: true
            },
        },
        watch: {

        },

        methods: {

        },
        computed: {

        },
        filters: {

        }
    });





};