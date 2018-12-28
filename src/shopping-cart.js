// DOM variable declarations
var serverURL = 'https://ananda-spa-backend.herokuapp.com';
var cardErrors = document.getElementById('error');
var submitSquare = document.getElementById('sq-creditcard');
var formBuilt = false;

// Set the application ID
var applicationId = "sandbox-sq0idp-Scby0qkWLgtWN2hvzeimag";

// Set the location ID
var locationId = "CBASELrQQ0UM52FOTsL42WvyaysgAQ";

// Initialize Vue instance

window.onload = function () {

    // DOM Variable Declarations
    var cartIconTotal = document.getElementById('shopping-cart-total-items');
    var addCartDeepCleansing = document.getElementById('add-cart-deep-cleansing');
    var addCartDermapen = document.getElementById('add-cart-dermapen');

    var mainVue = new Vue({
        el: '#vue-app',
        data: {
            title: 'This is a Demo',
            cart: {
                items: []
            },
            products: [
                {
                    id: '1',
                    name: 'Deep Cleansing Facial',
                    price: 35
                },
                {
                    id: '2',
                    name: 'Dermapen',
                    price: 69
                }
            ]
        },
        methods: {
            addProductsToCart: function (product) {
                var cartItem = this.getCartItem(product);

                if (cartItem != null) {
                    cartItem.quantity++;
                } else {
                    this.cart.items.push({
                        product: product,
                        quantity: 1
                    });
                }

                cartIconTotal.innerHTML = this.cart.items.length;
            },
            getCartItem: function (product) {
                for (var i = 0; i < this.cart.items.length; i++) {
                    if (this.cart.items[i].product.id === product.id) {
                        return this.cart.items[i];
                    }
                }

                return null;
            },
            changeQTY: function (cartItem) {

            },
            removeItemFromCart: function (cartItem) {
                var index = this.cart.items.indexOf(cartItem);

                if (index !== -1) {
                    this.cart.items.splice(index, 1);
                }

                cartIconTotal.innerHTML = this.cart.items.length;
            }
        },
        computed: {
            cartTotal: function () {
                var total = 0;

                this.cart.items.forEach(function (item) {
                    total += item.quantity * item.product.price;
                });

                return total;
            }
        }
    });

    // DOM Interactions with mainVue Instance

    cartIconTotal.innerHTML = mainVue.cart.items.length;


    addCartDeepCleansing.addEventListener('click', function (event) {
        event.preventDefault();

        mainVue.addProductsToCart(mainVue.products[0]);
    });

    addCartDermapen.addEventListener('click', function (event) {
        event.preventDefault();

        mainVue.addProductsToCart(mainVue.products[1]);
    });

    // Checkout Vue Instance

    var checkoutVue = new Vue({
        el: '#vue-checkout',
        data: {
            cart: mainVue.cart,
            customer: {
                email: '',
                fname: '',
                lname: '',
                street: '',
                city: '',
                state: '',
                zip: ''
            },
            showEmail: true,
            showPayment: true,
            errors: [],
            masterpass: false,
            applePay: false,
            showPaymentForm: false,

        },
        watch: {
            formBuild: function () {
                // Check if form was already built
                if (showPaymentForm) {
                    return;
                } else {
                    if (SqPaymentForm.isSupportedBrowser()) {
                        var paymentDiv = document.getElementById("modal-wrapper-checkout");
                        if (paymentDiv.style.display === "none") {
                          paymentDiv.style.display = "block";
                        }
                        this.paymentForm.build();
                        this.paymentForm.recalculateSize();
                        this.showPaymentForm = !showPaymentForm;
                      } else {
                        // Show a "Browser is not supported" message to your buyer
                      }
                    
                }
            }
        },
        computed: {
            cartTotal: function () {
                return mainVue.cartTotal;
            },
            activeCheckout: function () {
                if (this.showEmail) {
                    return {
                        'background-color': 'white',
                        color: '#999'
                    };
                } else {
                    return {
                        'background-color': '#777',
                        color: 'white'
                    };
                }

            },
            activePayment: function () {
                if (this.showPayment) {
                    return {
                        'background-color': 'white',
                        color: '#999'
                    };
                } else {
                    return {
                        'background-color': '#777',
                        color: 'white'
                    };
                }

            },
            activeSeparator: function () {
                if (this.showPayment) {
                    return {
                        height: '1px'
                    };
                } else {
                    return {
                        height: '0.5px'
                    };
                }
            }

        },
        methods: {
            mounted: function () {
                var that = this;
                this.paymentForm = new SqPaymentForm({
                    autoBuild: false,
                    applicationId: applicationId,
                    locationId: locationId,
                    inputClass: "sq-input",
                    // Initialize the payment form elements

                    // Customize the CSS for SqPaymentForm iframe elements
                    inputStyles: [{
                        fontSize: '14px',
                        fontFamily: 'Helvetica',
                        //padding: '8px 12px',
                        color: '#888',
                        backgroundColor: 'transparent',
                        lineHeight: '20px',
                        placeholderColor: '#888',
                        _webkitFontSmoothing: 'antialiased',
                        _mozOsxFontSmoothing: 'grayscale'
                    }],

                    // Initialize Apple Pay placeholder ID
                    applePay: false,

                    // Initialize Masterpass placeholder ID
                    masterpass: false,

                    // Initialize the credit card placeholders
                    cardNumber: {
                        elementId: 'sq-card-number',
                        placeholder: '• • • •  • • • •  • • • •  • • • •'
                    },
                    cvv: {
                        elementId: 'sq-cvv',
                        placeholder: 'CVV'
                    },
                    expirationDate: {
                        elementId: 'sq-expiration-date',
                        placeholder: 'MM/YY'
                    },
                    postalCode: {
                        elementId: 'sq-postal-code',
                        placeholder: '12345'
                    },

                    // SqPaymentForm callback functions
                    callbacks: {
                        /*
                           * callback function: methodsSupported
                           * Triggered when: the page is loaded.
                           */
                        methodsSupported: function (methods) {
                            // Only show the button if Apple Pay for Web is enabled
                            // Otherwise, display the wallet not enabled message.
                            that.applePay = methods.applePay;
                            that.masterpass = methods.masterpass;
                        },

                        /*
                           * Digital Wallet related functions
                           */
                        createPaymentRequest: function () {
                            var paymentRequestJson;
                            /* ADD CODE TO SET/CREATE paymentRequestJson */
                            return paymentRequestJson;
                        },
                        validateShippingContact: function (contact) {
                            var validationErrorObj;
                            /* ADD CODE TO SET validationErrorObj IF ERRORS ARE FOUND */
                            return validationErrorObj;
                        },

                        /*
                           * callback function: cardNonceResponseReceived
                           * Triggered when: SqPaymentForm completes a card nonce request
                           */
                        cardNonceResponseReceived: function (errors, nonce, cardData) {
                            if (errors) {
                                errors.forEach(function (error) {
                                    that.errors.push(error.message);
                                });
                                return;
                            }
                            // Assign the nonce value to the hidden form field
                            document.getElementById("card-nonce").value = nonce;

                            // POST the nonce form to the payment processing page
                            document.getElementById("nonce-form").submit();
                        },
                        /*
                           * callback function: paymentFormLoaded
                           * Triggered when: SqPaymentForm is fully loaded
                           */
                        paymentFormLoaded: function () {
                            console.log("paymentFormLoaded");
                            /* HANDLE AS DESIRED */
                        }
                    }
                });
            },
            requestCardNonce: function (event) {
                // Don't submit the form until SqPaymentForm returns with a nonce
                event.preventDefault();

                // Request a nonce from the SqPaymentForm object
                this.paymentForm.requestCardNonce();
            }
        }
    });


};

// export default {

//     data: function () {
//         return {
//             errors: [],
//             masterpass: false,
//             applePay: false
//         };
//     },
//     watch: {
//         showPaymentForm: function () {
//             if (!this.showPaymentForm) {
//                 return 1;
//             }
//             this.paymentForm.build();
//         }
//     },
//     props: {
//         showPaymentForm: Boolean,
//         id: Number
//     },
//     mounted: function () {
//         let locationId = "75MBQ5SS3SKJK";
//         let applicationId = "sq0idp-gbQhcOCpmb2X4W1588Ky7A";
//         let that = this;
//         this.paymentForm = new SqPaymentForm({
//             autoBuild: false,
//             applicationId: applicationId,
//             locationId: locationId,
//             inputClass: "sq-input",
//             // Initialize the payment form elements

//             // Customize the CSS for SqPaymentForm iframe elements
//             inputStyles: [
//                 {
//                     fontSize: ".9em"
//                 }
//             ],

//             // Initialize Apple Pay placeholder ID
//             applePay: {
//                 elementId: that.id + "-sq-apple-pay"
//             },

//             // Initialize Masterpass placeholder ID
//             masterpass: {
//                 elementId: that.id + "-sq-masterpass"
//             },

//             // Initialize the credit card placeholders
//             cardNumber: {
//                 elementId: that.id + "-sq-card-number",
//                 placeholder: "Card number"
//             },
//             cvv: {
//                 elementId: that.id + "-sq-cvv",
//                 placeholder: "CVV"
//             },
//             expirationDate: {
//                 elementId: that.id + "-sq-expiration-date",
//                 placeholder: "MM / YY"
//             },
//             postalCode: {
//                 elementId: that.id + "-sq-postal-code",
//                 placeholder: "Zip Code"
//             },

//             // SqPaymentForm callback functions
//             callbacks: {
//                 /*
//                    * callback function: methodsSupported
//                    * Triggered when: the page is loaded.
//                    */
//                 methodsSupported: function (methods) {
//                     // Only show the button if Apple Pay for Web is enabled
//                     // Otherwise, display the wallet not enabled message.
//                     that.applePay = methods.applePay;
//                     that.masterpass = methods.masterpass;
//                 },

//                 /*
//                    * Digital Wallet related functions
//                    */
//                 createPaymentRequest: function () {
//                     var paymentRequestJson;
//                     /* ADD CODE TO SET/CREATE paymentRequestJson */
//                     return paymentRequestJson;
//                 },
//                 validateShippingContact: function (contact) {
//                     var validationErrorObj;
//                     /* ADD CODE TO SET validationErrorObj IF ERRORS ARE FOUND */
//                     return validationErrorObj;
//                 },

//                 /*
//                    * callback function: cardNonceResponseReceived
//                    * Triggered when: SqPaymentForm completes a card nonce request
//                    */
//                 cardNonceResponseReceived: function (errors, nonce, cardData) {
//                     if (errors) {
//                         errors.forEach(function (error) {
//                             that.errors.push(error.message);
//                         });
//                         return;
//                     }
//                     // Assign the nonce value to the hidden form field
//                     document.getElementById("card-nonce").value = nonce;

//                     // POST the nonce form to the payment processing page
//                     document.getElementById("nonce-form").submit();
//                 },
//                 /*
//                    * callback function: paymentFormLoaded
//                    * Triggered when: SqPaymentForm is fully loaded
//                    */
//                 paymentFormLoaded: function () {
//                     console.log("paymentFormLoaded");
//                     /* HANDLE AS DESIRED */
//                 }
//             }
//         });
//     },
//     methods: {
//         requestCardNonce: function (event) {
//             // Don't submit the form until SqPaymentForm returns with a nonce
//             event.preventDefault();

//             // Request a nonce from the SqPaymentForm object
//             this.paymentForm.requestCardNonce();
//         }
//     }
// }; 


