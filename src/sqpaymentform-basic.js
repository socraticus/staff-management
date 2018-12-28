// DOM variable declarations
var serverURL = 'https://ananda-spa-backend.herokuapp.com';
var cardErrors = document.getElementById('error');
var submitSquare = document.getElementById('sq-creditcard');
var formBuilt = false;

// Set the application ID
var applicationId = "sandbox-sq0idp-Scby0qkWLgtWN2hvzeimag";

// Set the location ID
var locationId = "CBASELrQQ0UM52FOTsL42WvyaysgAQ";

// // Load Square Form in dedicated checkout page
// document.addEventListener("DOMContentLoaded", function (event) {
//   if (SqPaymentForm.isSupportedBrowser()) {
//     paymentForm.build();
//     //paymentForm.recalculateSize();
//   }
// });

// Load Square Form in hidden div
function buildForm() {
  // Check if form was already built
  if (formBuilt === true) {
    return;
  } else if (SqPaymentForm.isSupportedBrowser()) {
    var paymentDiv = document.getElementById("modal-wrapper-checkout");
    if (paymentDiv.style.display === "none") {
      paymentDiv.style.display = "block";
    }
    paymentForm.build();
    paymentForm.recalculateSize();
    formBuilt = true;
  } else {
    // Show a "Browser is not supported" message to your buyer
  }


}


/*
 * function: requestCardNonce
 *
 * requestCardNonce is triggered when the "Pay with credit card" button is
 * clicked
 *
 * Modifying this function is not required, but can be customized if you
 * wish to take additional action when the form button is clicked.
 */
function requestCardNonce(event) {

  // Don't submit the form until SqPaymentForm returns with a nonce
  event.preventDefault();

  // Request a nonce from the SqPaymentForm object
  paymentForm.requestCardNonce();
}

// Create and initialize a payment form object
var paymentForm = new SqPaymentForm({

  // Initialize the payment form elements
  applicationId: applicationId,
  locationId: locationId,
  inputClass: 'sq-input',
  autoBuild: false,

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
     * callback function: createPaymentRequest
     * Triggered when: a digital wallet payment button is clicked.
     * Replace the JSON object declaration with a function that creates
     * a JSON object with Digital Wallet payment details
     */
    createPaymentRequest: function () {

      return {
        requestShippingAddress: false,
        requestBillingInfo: true,
        currencyCode: "USD",
        countryCode: "US",
        total: {
          label: "MERCHANT NAME",
          amount: "100",
          pending: false
        },
        lineItems: [
          {
            label: "Subtotal",
            amount: "100",
            pending: false
          }
        ]
      }
    },

    /*
     * callback function: cardNonceResponseReceived
     * Triggered when: SqPaymentForm completes a card nonce request
     */
    cardNonceResponseReceived: function (errors, nonce, cardData) {
      if (errors) {
        // Log errors from nonce generation to the Javascript console
        console.log("Encountered errors:");
        errors.forEach(function (error) {
          console.log('  ' + error.message);
          alert(error.message);
        });

        return;
      }
      // Assign the nonce value to the hidden form field
      // document.getElementById('card-nonce').value = nonce;

      // AJAX Submit to Server
      // cardErrors.innerHTML = "PROCESSING... Please do not reload";
      var xhr = new XMLHttpRequest();
      xhr.open('POST', serverURL + '/square/process-payment', true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.onload = function (event) {
        console.log(event);
        var reply = JSON.parse(event.target.response);
        console.log(reply.title);
        document.getElementById('error').innerHTML = reply.title;
      };
      xhr.send(encodeURI('nonce=' + nonce));



      // POST the nonce form to the payment processing page
      // document.getElementById('nonce-form').submit();

    },

    /*
     * callback function: unsupportedBrowserDetected
     * Triggered when: the page loads and an unsupported browser is detected
     */
    unsupportedBrowserDetected: function () {
      /* PROVIDE FEEDBACK TO SITE VISITORS */
    },

    /*
     * callback function: inputEventReceived
     * Triggered when: visitors interact with SqPaymentForm iframe elements.
     */
    inputEventReceived: function (inputEvent) {
      switch (inputEvent.eventType) {
        case 'focusClassAdded':
          /* HANDLE AS DESIRED */
          break;
        case 'focusClassRemoved':
          /* HANDLE AS DESIRED */
          break;
        case 'errorClassAdded':
          document.getElementById("error").innerHTML = "Please fix card information errors before continuing.";
          break;
        case 'errorClassRemoved':
          /* HANDLE AS DESIRED */
          document.getElementById("error").style.display = "none";
          break;
        case 'cardBrandChanged':
          /* HANDLE AS DESIRED */
          break;
        case 'postalCodeChanged':
          /* HANDLE AS DESIRED */
          break;
      }
    },

    /*
     * callback function: paymentFormLoaded
     * Triggered when: SqPaymentForm is fully loaded
     */
    paymentFormLoaded: function () {
      /* HANDLE AS DESIRED */
      console.log("The form loaded!");
    }
  }
});