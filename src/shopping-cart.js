// DOM variable declarations
var serverURL = 'https://ananda-spa-backend.herokuapp.com';
var cardErrors = document.getElementById('error');
var submitSquare = document.getElementById('sq-creditcard');
var formBuilt = false;


// Set the sandbox application ID
// var applicationId = "sandbox-sq0idp-Scby0qkWLgtWN2hvzeimag";
// Set the production application ID
var applicationId = "sq0idp-Scby0qkWLgtWN2hvzeimag";

// Set the sandbox location ID
// var locationId = "CBASELrQQ0UM52FOTsL42WvyaysgAQ";
// Set the production location ID
var locationId = "8A9DH6GQH6J54";

// Initialize Vue instance


function testingVue() {
    console.log('accessed from HTML');
    checkoutVue.testing();
}


window.onload = function () {



    // Proxying Vue instance
    var shoppingCartBtn = document.getElementById('shopping-cart-btn');
    shoppingCartBtn.addEventListener('click', function () {
        console.log('accessed from HTML');
        checkoutVue.buildForm();
    });

    // Variable DOM declarations
    var cartIconTotal = document.getElementById('shopping-cart-total-items');
    var shoppingCartIcon = document.getElementById('shopping-cart-icon-wrap');

    var mainVue = new Vue({
        el: '#vue-app',
        data: {
            title: 'This is a Demo',
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
        created: function () {
            this.cart.items = JSON.parse(localStorage.getItem('cartItems') || '[]');
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
                localStorage.setItem('cartItems', JSON.stringify(this.cart.items));
            },
            getCartItem: function (product) {
                for (var i = 0; i < this.cart.items.length; i++) {
                    if (this.cart.items[i].product._id === product._id) {
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
                localStorage.setItem('cartItems', JSON.stringify(this.cart.items));
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

                            console.log(thisVue1.discountResponse);

                            if (thisVue1.discountMessage === 'Your discount has been validated') {
                                mainVue.appliedCode = mainVue.discountCode;
                                mainVue.discountCode = "";
                                console.log(mainVue.appliedCode);
                            }
                        });
                }, 500);
            },
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
            },
            discountType: function () {
                if (this.discountResponse.percentage === true) {
                    return this.discountResponse.discountAmount + "%";
                } else {
                    return "-$" + this.discountResponse.discountAmount;
                }
            },
            showDiscount: function () {
                if ((this.cartTotal - this.cartTotalFinal) === 0) {
                    console.log("false")
                    return false;
                } else {
                    console.log("true")
                    return true;
                }
            }
        },
        filters: {
            twoDecimals: function (value) {
                if (value % 1 === 0) {
                    return value;
                } else {
                    return parseFloat(Math.round(value * 100) / 100).toFixed(2);
                }
            },
        }
    });

    // DOM Interactions with mainVue Instance

    cartIconTotal.innerHTML = mainVue.cart.items.length;

    // Add Listeners to addButtons
    addClickedProduct();

    function addClickedProduct() {

        // Verify if product data has been loaded, if not, load it

        if (mainVue.products.length === 0) {
            axios.get(serverURL + '/square/services-list').then(function (response) {
                mainVue.products = response;
                console.log(mainVue.products);
            }).then(function () {

                var addButtons = document.querySelectorAll("a[productID]");

                for (var i = 0; i < addButtons.length; i++) {
                    addButtons[i].addEventListener('click', function (event) {
                        console.log('clicked')
                        var productID = event.srcElement.attributes.productid.nodeValue;
                        console.log(productID)
                        console.log(mainVue.products)
                        mainVue.products.filter(function (item, index) {
                            if (item._id == productID) {
                                console.log(index);
                                console.log(mainVue.products[index]);
                                mainVue.addProductsToCart(mainVue.products[index]);
                                simulate(shoppingCartIcon, 'click');
                                return true;
                            } else {
                                console.log('false')
                                return false;
                            }
                        });


                    });
                }
            });
        } else {
            console.log('already loaded')
        }
    }

    // Checkout Vue Instance

    var checkoutVue = new Vue({
        el: '#vue-checkout',
        data: {
            cart: mainVue.cart,
            customer: {
                // Doc Reference:
                // https://github.com/square/connect-javascript-sdk/blob/master/docs/Address.md
                billing_address: {
                    first_name: '',
                    last_name: '',
                    address_line_1: '',
                    locality: '',
                    administrative_district_level_1: '',
                    postal_code: ''
                },
                buyer_email_address: '',
                phone_number: ''
            },
            showEmail: true,
            showPayment: true,
            errors: [],
            masterpass: false,
            applePay: false,
            showPaymentForm: false,
            paymentResponse: {
                status: '',
                btn: '',
                body: {}
            },
            showPaymentResponse: false,
            // emailError: false,
            // phoneError: false,
            emailAndPhoneError: {
                emailError: false,
                phoneError: false,
            },
            billingError: {
                first_name: false,
                last_name: false,
                address_line_1: false,
                locality: false,
                administrative_district_level_1: false,
                postal_code: false
            },
            isDisabled: false,
            placeOrderBtn: "PLACE ORDER"
        },
        watch: {
            'customer.phone_number': function (newValue, oldValue) {
                var re = /[a-zA-Z]/;
                if (re.test(newValue)) {
                    this.customer.phone_number = oldValue;
                }

                if (newValue.length === 5 && newValue[0] === "(" && oldValue.length != 6) {
                    this.customer.phone_number = oldValue + ") ";

                }

                if (newValue.length === 6 && newValue[0] === "(" && oldValue.length === 5 && newValue[5] != " ") {
                    this.customer.phone_number = oldValue + " " + newValue[newValue.length - 1];

                }

                if (newValue.length === 10 && oldValue.length === 9 && newValue[newValue.length - 1] != "-") {
                    this.customer.phone_number = oldValue + "-" + newValue[newValue.length - 1];
                }

                if (this.customer.phone_number.length === 3 && oldValue.length != 4) {
                    if (this.customer.phone_number[0] != "(") {
                        this.customer.phone_number = '(' + newValue + ') ';
                    }

                }
                if (this.customer.phone_number.length === 9 && oldValue.length != 10) {
                    this.customer.phone_number = newValue + '-'
                    console.log(newValue[newValue.length - 1]);
                }


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
                return mainVue.showDiscount;
            },
            appliedCode: function () {
                return mainVue.appliedCode;
            },
            discountResponse: function () {
                return mainVue.discountResponse;
            },
            activeCheckout: function () {
                if (this.showEmail) {
                    return {
                        'background-color': 'white',
                        color: '#999'
                    };
                } else {
                    return {
                        // 'background-color': '#777',
                        // 'background-color': 'silver',
                        'background-color': "rgba(173, 20, 87, 0.50)",
                        color: 'white',
                        // 'border-color': "rgba(173, 20, 87, 0.50)"
                        'border-color': "white"
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
                        // 'background-color': '#777',
                        // 'background-color': 'silver',
                        'background-color': "rgba(173, 20, 87, 0.50)",
                        color: 'white',
                        // 'border-color': "rgba(173, 20, 87, 0.50)"
                        'border-color': "white"
                    };
                }
            },
            activePaymentResponse: function () {
                if (!this.showPaymentResponse) {
                    return {
                        'background-color': 'white',
                        color: '#999'
                    };
                } else {
                    return {
                        // 'background-color': '#777',
                        // 'background-color': 'silver',
                        'background-color': "rgba(173, 20, 87, 0.50)",
                        color: 'white',
                        // 'border-color': "rgba(173, 20, 87, 0.50)"
                        'border-color': "white"
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
                            console.log(that.cartTotalFinal, that.customer);
                            axios.post(serverURL + '/square/process-payment', {
                                body: {
                                    nonce: nonce,
                                    amount: that.cartTotalFinal,
                                    customer: that.customer,
                                    cart: that.cart.items,
                                    discount: {
                                        amount: that.calculateDiscount,
                                        appliedCode: that.appliedCode,
                                        details: that.discountResponse
                                    }
                                }
                            }).then(function (response) {
                                console.log(response)
                                console.log(JSON.stringify(response))

                                if (response.status === 200) {
                                    that.paymentResponse.status = "PAYMENT SUCCESSFUL"
                                    that.paymentResponse.btn = "NEW ORDER"
                                    that.paymentResponse.body = {
                                        errors: []
                                    };
                                    that.showPaymentResponse = true
                                } else {
                                    var text = JSON.stringify(response.response.text)
                                    console.log(text);
                                    console.log(typeof text);

                                    console.log(JSON.parse(JSON.parse(text)))
                                    console.log(typeof JSON.parse(JSON.parse(text)))

                                    that.paymentResponse.body = JSON.parse(JSON.parse(text))
                                    that.paymentResponse.status = "PAYMENT METHOD FAILED"
                                    that.paymentResponse.btn = "TRY AGAIN"
                                    that.showPaymentResponse = true
                                }
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
                // Client side form verification
                var validationFailed = false
                var validatedEmailandPhone = this.validEmail(this.customer.buyer_email_address, this.customer.phone_number);
                var validatedBilling = this.validBilling()

                if (validatedEmailandPhone.phoneResult === false || validatedEmailandPhone.emailResult === false || validatedBilling != 0) {
                    validationFailed = true
                    console.log('validationfailed: ' + validationFailed);
                }

                if (validationFailed) {
                    event.preventDefault();
                    return false;
                }

                // Don't submit the form until SqPaymentForm returns with a nonce
                event.preventDefault();
                //console.log('is Disabled: '+isDisabled);
                this.isDisabled = true;
                this.placeOrderBtn = "PROCESSING..."

                // Request a nonce from the SqPaymentForm object
                this.paymentForm.requestCardNonce();
            },
            paymentResult: function (text) {
                var index = text.indexOf("\\");
                while (index >= 0) {
                    text = text.replace("\\", "");
                    index = text.indexOf("\\");
                }
                return text;
            },
            validEmail: function (email, phone) {
                console.log(email);
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (re.test(email) === false) {
                    this.emailAndPhoneError.emailError = true
                } else {
                    this.emailAndPhoneError.emailError = false

                }

                // var rePhone = '';
                // if (rePhone.test(phone) === false) {
                //     this.emailAndPhoneError.phoneError = true
                // } else {
                //     this.emailAndPhoneError.phoneError = false;
                //     this.showEmail = !this.showEmail
                // }

                var rePhone = /^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}$/;
                /*  if (this.customer.phone_number === '') {
                     this.emailAndPhoneError.phoneError = true
                 } else {
                     this.emailAndPhoneError.phoneError = false;
                 }
  */
                if (rePhone.test(phone) === false) {
                    this.emailAndPhoneError.phoneError = true
                } else {
                    this.emailAndPhoneError.phoneError = false

                }

                var emailResult = re.test(email);
                var phoneResult = rePhone.test(phone);
                console.log('emailResult ' + emailResult);
                console.log('phoneResult ' + phoneResult);
                if (this.emailAndPhoneError.phoneError === false && this.emailAndPhoneError.emailError === false) {
                    this.showEmail = !this.showEmail
                }

                return {
                    emailResult: emailResult,
                    phoneResult: phoneResult
                };
            },
            validBilling: function () {
                // billing_address: {
                //     first_name: '',
                //     last_name: '',
                //     address_line_1: '',
                //     locality: '',
                //     administrative_district_level_1: '',
                //     postal_code: ''
                // },

                var totalErrors = 0

                for (var prop in this.customer.billing_address) {
                    if (this.customer.billing_address[prop] === '') {
                        this.billingError[prop] = true;
                        totalErrors += 1
                        console.log(this.billingError)
                        console.log(totalErrors)
                    } else {
                        this.billingError[prop] = false
                        console.log(totalErrors)
                    }
                }

                if (totalErrors === 0) {
                    this.showPayment = !this.showPayment
                }

                return totalErrors
            },
            refreshPaymentForm: function () {
                this.showPaymentResponse = false;
                this.isDisabled = false;
                this.placeOrderBtn = "PLACE ORDER"
            },
            isNumber: function (evt) {
                evt = evt ? evt : window.event;
                var charCode = evt.which ? evt.which : evt.keyCode;

                if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {

                    evt.preventDefault();
                    ;
                } else {
                    return true;
                }
            }
        }
    });

    // Simulate Click Event. Helper function to trigger Webflow animations
    function simulate(element, eventName) {
        var options = extend(defaultOptions, arguments[2] || {});
        var oEvent, eventType = null;

        for (var name in eventMatchers) {
            if (eventMatchers[name].test(eventName)) { eventType = name; break; }
        }

        if (!eventType)
            throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

        if (document.createEvent) {
            oEvent = document.createEvent(eventType);
            if (eventType == 'HTMLEvents') {
                oEvent.initEvent(eventName, options.bubbles, options.cancelable);
            }
            else {
                oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                    options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
            }
            element.dispatchEvent(oEvent);
        }
        else {
            options.clientX = options.pointerX;
            options.clientY = options.pointerY;
            var evt = document.createEventObject();
            oEvent = extend(evt, options);
            element.fireEvent('on' + eventName, oEvent);
        }
        return element;
    }

    function extend(destination, source) {
        for (var property in source)
            destination[property] = source[property];
        return destination;
    }

    var eventMatchers = {
        'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    }
    var defaultOptions = {
        pointerX: 0,
        pointerY: 0,
        button: 0,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true
    }

    //Help functions 

    $(function () {
        var regExp = /^\d*$/;
        $('#ShoppingCartPhone').on('keydown keyup', function (e) {
            var value = String.fromCharCode(e.which) || e.key;
            console.log(e);
            // Only numbers, dots and commas
            if (!regExp.test(value)
                //&& e.which != 188 // ,
                //&& e.which != 190 // .
                && e.which != 8   // backspace
                && e.which != 46  // delete
                && (e.which < 37  // arrow keys
                    || e.which > 40)
                && (e.which < 95  // numeric keys
                    || e.which > 105)
            ) {
                e.preventDefault();
                return false;
            }
        });
    });

    // Restricts input for each element in the set of matched elements to the given inputFilter.
    /*       $.fn.inputFilter = function(inputFilter) {
             return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function() {
               if (inputFilter(this.value)) {
                 this.oldValue = this.value;
                 this.oldSelectionStart = this.selectionStart;
                 this.oldSelectionEnd = this.selectionEnd;
               } else if (this.hasOwnProperty("oldValue")) {
                 this.value = this.oldValue;
                 this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
               }
             });
           };
    
     // Restrict input to digits by using a regular expression filter.
     $("#ShoppingCartPhone").inputFilter(function (value) {
         return /^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}$/.test(value);
     });  */

};