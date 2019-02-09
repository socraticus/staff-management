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


function testingVue() {
    console.log('accessed from HTML');
    checkoutVue.testing();
}


window.onload = function () {

    // Add Listeners to addButtons
    addClickedProduct()

    // Proxying Vue instance
    var shoppingCartBtn = document.getElementById('shopping-cart-btn');
    shoppingCartBtn.addEventListener('click', function () {
        console.log('accessed from HTML');
        checkoutVue.buildForm();
    });

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
                },
                {
                    id: '3',
                    name: 'Discount',
                    price: 10
                }
            ],
            discountCode: '',
            discountMessage: 'test',
            discountResponse: {
                message: '',
                discountAmount: 0,
                percentage: true
            },
            showDiscount: false
        },
        watch: {
            discountCode: function () {
                if (this.discountCode.length >= 1 && this.cartTotal === 0) {
                    this.discountMessage = 'You must add services to the cart first';
                    this.discountCode = '';
                    return;
                }
                if (this.discountCode.length >= 1 && this.cartTotal > 0) {

                    this.discountMessage = '';

                    if (this.discountCode.length === 8) {
                        // this.discountMessage = 'Validating...';
                        this.validateDiscount();
                    }
                }
                
            }
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
            },
            validateDiscount: function () {

                var thisVue1 = this;

                setTimeout(function () {

                    thisVue1.discountMessage = 'Validating...';

                    axios.get(serverURL + "/discounts/?discountCode=" + thisVue1.discountCode)
                        .then(function (response) {

                            // Populate discountResponse property
                            thisVue1.discountResponse.message = response.message;
                            thisVue1.discountResponse.discountAmount = response.discountAmount;
                            thisVue1.discountResponse.percentage = response.percentage;

                            thisVue1.discountMessage = response.message;

                            console.log(responsethisVue1.discountResponse);

                            if (thisVue1.discountMessage === 'Your discount has been validated') {
                                thisVue1.showDiscount = true;
                                console.log(thisVue1.showDiscount)
                            }
                        });
                }, 500);
            }
        },
        computed: {
            cartTotal: function () {
                var total = 0;

                this.cart.items.forEach(function (item) {
                    total += item.quantity * item.product.price;
                });

                return total;
            },
            calculateDiscount: function () {

                if (this.discountResponse.percentage === true) {
                    return (this.discountResponse.discountAmount * this.cartTotal / 100);
                } else
                    return (this.discountResponse.discountAmount);

            },
            cartTotalFinal: function () {
                return this.cartTotal - this.calculateDiscount;
            }
        },
        filters: {
            twoDecimals: function (value) {
                if (value % 1 === 0) {
                    return value;
                } else {
                    return parseFloat(Math.round(value * 100) / 100).toFixed(2);
                }
            }
        }
    });

    // DOM Interactions with mainVue Instance

    cartIconTotal.innerHTML = mainVue.cart.items.length;

    function addClickedProduct() {
        var addButtons = document.querySelectorAll("a[productID]");

        for (var i = 0; i < addButtons.length; i++) {
            var productID = addButtons[i].getAttribute('productid')
            
            addButtons[i].addEventListener('click', function (event) {
                console.log('clicked')
                console.log(productID);
                console.log(event)
            })
        }
        console.log(addButtons)
    }

    // addCartDeepCleansing.addEventListener('click', function (event) {
    //     event.preventDefault();

    //     mainVue.addProductsToCart(mainVue.products[0]);
    // });

    // addCartDermapen.addEventListener('click', function (event) {
    //     event.preventDefault();

    //     mainVue.addProductsToCart(mainVue.products[1]);
    // });

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
        filters: {
            twoDecimals: function (value) {
                if (value % 1 === 0) {
                    return value;
                } else {
                    return parseFloat(Math.round(value * 100) / 100).toFixed(2);
                }
            }
        },
        computed: {
            cartTotal: function () {
                return mainVue.cartTotal;
            },
            cartTotalFinal: function () {
                return mainVue.cartTotalFinal;
            },
            calculateDiscount: function () {
                return mainVue.calculateDiscount;
            },
            discountCode: function () {
                return mainVue.discountCode;
            },
            showDiscount: function () {
                if ((mainVue.cartTotal - mainVue.cartTotalFinal) === 0) {
                    console.log("false")
                    return false;
                } else {
                    console.log("true")
                    return true;
                }
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
            },
            paymentForm: function () {
                var that = this;
                var paymentForm = new SqPaymentForm({
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
                            // that.applePay = methods.applePay;
                            // that.masterpass = methods.masterpass;
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
                            // POST the nonce form to the payment processing page
                            console.log(that.cartTotal, that.customer);
                            axios.post(serverURL + '/square/process-payment', {
                                body: {
                                    nonce: nonce,
                                    amount: that.cartTotal,
                                    customer: that.customer
                                }
                            }).then(function (response) {
                                console.log(response);
                            });

                            // document.getElementById("nonce-form").submit();
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

                return paymentForm;
            }


        },
        methods: {
            testing: function () {
                console.log('Vue accessed');
            },
            buildForm: function () {
                // Check if form was already built
                if (this.showPaymentForm) {
                    return;
                } else {
                    if (SqPaymentForm.isSupportedBrowser()) {
                        var paymentDiv = document.getElementById("modal-wrapper-checkout");
                        if (paymentDiv.style.display === "none") {
                            paymentDiv.style.display = "block";
                        }
                        this.paymentForm.build();
                        this.paymentForm.recalculateSize();
                        this.showPaymentForm = !this.showPaymentForm;
                    } else {
                        // Show a "Browser is not supported" message to your buyer
                    }

                }
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