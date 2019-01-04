
// DOM Variable Declarations
var form = document.getElementById('shopping-cart-tab2');
var formTab1 = document.getElementById('shopping-cart-tab1');
var cardErrors = document.getElementById('express-card-errors');
var cardErrors1rstTab = document.getElementById('express-card-errors-1stTab');
var cardErrorsDiscount = document.getElementById('express-card-errors-discount');
var serverURL = 'https://ananda-spa-backend.herokuapp.com';
var fname = document.getElementById('express-first-name');
var lname = document.getElementById('express-last-name');
var emailValue = document.getElementById('express-email');
var discountBtn = document.getElementById('express-discount-btn');
var discountField = document.getElementById('express-discount-field');
var drawer = document.getElementById('drawer-outside-slip');
var drawerBtn = document.getElementById('drawer-discount-btn');
var amount = 1000;

//Shopping Cart

//Adjust Total
var addUpgrade = function () {
  $('#express-row-upgrade').css('display', 'flex');
  $('#express-row-gratuity').hide();
  $('#express-row-total').text('$35.00');
  $('input[name=expressCart][value="3500"]').prop('checked', true);
  $('#express-checkbox-first').prop('checked', true);
  $('#express-checkbox-second').prop('checked', true);
  amount = 3500;
};

var removeUpgrade = function () {
  $('#express-row-upgrade').hide();
  $('#express-row-gratuity').css('display', 'flex');
  $('#express-row-total').text('$10.00');
  $('input[name=expressCart][value="1000"]').prop('checked', true);
  $('#express-checkbox-first').prop('checked', false);
  $('#express-checkbox-second').prop('checked', false);
  amount = 1000;
};

var applyDiscount = function () {

};

$('input[name=expressCart][value="1000"]').on('click', removeUpgrade);

$('input[name=expressCart][value="3500"]').on('click', addUpgrade);

$('input[name=checkbox], input[name=checkbox-2]').change(function () {
  if ($(this).is(':checked')) {
    addUpgrade();
  } else {
    removeUpgrade();
  }
});

// AJAX request to Get Vouchers Left

var voucherxhr = new XMLHttpRequest();
voucherxhr.open('GET', serverURL + "/vouchers", true);
//voucherxhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
voucherxhr.onload = function (event) {
  updateVoucherCount(event);
}
voucherxhr.send();

// Process Response from AJAX

var updateVoucherCount = function (event) {
  console.log(event);
  var reply = JSON.parse(event.target.response);
  console.log(reply.message, reply.customerCount);
  cardErrors.innerHTML = reply.message;

  // Update Voucher counter in DOM
  var firstDigit = document.getElementById('express-digit1');
  var secondDigit = document.getElementById('express-digit2');

  // Calculate remainder on base 50
  var finalCount = 50 - reply.customerCount % 50;

  if (finalCount < 10) {
    firstDigit.innerText = 0;
    secondDigit.innerText = finalCount;
  } else {
    firstDigit.innerText = JSON.stringify(finalCount).slice(0, 1);
    secondDigit.innerHTML = JSON.stringify(finalCount).slice(1);
  }


};

// Apply Discount Code to Order
discountBtn.addEventListener('click', function (event) {
  event.preventDefault();

  cardErrorsDiscount.innerHTML = "PROCESSING... Validating your discount";

  // AJAX request to Validate Discount code
  var discountURL = serverURL + "/discounts/?discountCode=" + discountField.value;
  var discountxhr = new XMLHttpRequest();
  discountxhr.open('GET', discountURL, true);
  discountxhr.onload = function (evt) {
    console.log(evt);
    var reply = JSON.parse(evt.target.response);
    console.log(reply);
    cardErrorsDiscount.innerHTML = reply.message;
    if (reply.message === 'Your discount has been validated') {
      var calculatedDisc = 0;
      if (amount === 1000) {
        cardErrorsDiscount.innerHTML = 'This discount applies only to the Deep Cleansing Facial. Please add it to the cart and reapply discount';
        return;
      } else {
        $('#express-row-discount').css('display', 'flex');

        $('#express-discount-value').text(function () {
          if (reply.percentage === true) {
            calculatedDisc = parseFloat(amount * reply.discountAmount / 10000).toFixed(2);
            return "-$" + calculatedDisc;
          } else {
            calculatedDisc = reply.discountAmount;
            return "-$" + calculatedDisc;
          }
        });

        $('#express-row-total').text("$" + parseFloat(amount / 100 - calculatedDisc).toFixed(2));
        amount = amount - (calculatedDisc * 100);

      }
    }
  };

  discountxhr.send();

});

// Apply discount from Drawer
function discountFromDrawer() {
  addUpgrade();
  var disc = drawerBtn.getAttribute('data')
  discountField.value = disc;
  simulate(discountBtn, 'click');
}

// *******
// Webflow Animation of finish Quiz
// *******

var ix = Webflow.require('ix');

var $bubble1 = $('#express-bubble1');
$bubble1.attr('clicked', false);

var $bubble2 = $('#express-bubble2');
$bubble2.attr('clicked', false);

var $bubble3 = $('#express-bubble3');
$bubble3.attr('clicked', false);

var $bubble4 = $('#express-bubble4');
$bubble4.attr('clicked', false);

var quizClickCount = 0

// Define Animation

var $target = $('#express-finish-quiz');
$target.on('click', function () {
  window.location.href = '#express-form-label';
})

var trigger = {
  "type": "click",
  "stepsA": [{
    "transition": "transform 500ms ease-in-out 0",
    "x": "0px",
    "y": "0px",
    "z": "0px"
  }],
  "stepsB": []
};

// Add Listenners and trigger animation

$bubble1.on("click", function () {
  if ($bubble1.attr('clicked') == 'false') {
    $bubble1.attr('clicked', true);
    quizClickCount += 1
    console.log(quizClickCount);
    if (quizClickCount == 4) {
      triggerAnimation()
    }
  } else {
    return;
  }
});

$bubble2.on("click", function () {
  if ($bubble2.attr('clicked') == 'false') {
    $bubble2.attr('clicked', true);
    quizClickCount += 1;
    console.log(quizClickCount);
    if (quizClickCount == 4) {
      triggerAnimation();
    }
  } else {
    return;
  }
});

$bubble3.on("click", function () {
  if ($bubble3.attr('clicked') == 'false') {
    $bubble3.attr('clicked', true);
    quizClickCount += 1;
    console.log(quizClickCount);
    if (quizClickCount == 4) {
      triggerAnimation();
    }
  } else {
    return;
  }
});

$bubble4.on("click", function () {
  if ($bubble4.attr('clicked') == 'false') {
    $bubble4.attr('clicked', true);
    quizClickCount += 1;
    console.log(quizClickCount);
    if (quizClickCount == 4) {
      triggerAnimation();
    }
  } else {
    return;
  }
});

function triggerAnimation() {
  setTimeout(function () {
    ix.run(trigger, $target);
  }, 3000);
}


//************//
//Stripe Implementation
//************//

//Initialize Stripe
// var stripe = Stripe('pk_live_hILIhM39DUQfAFiKOkqnGExj');
var stripe = Stripe('pk_test_j5U5yJvpdZW8Jt0HBC7lTMQX');
var elements = stripe.elements();

// Custom styling can be passed to options when creating an Element.
var style = {
  base: {
    color: '#32325d',
    lineHeight: '18px',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4'
    }
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a'
  }
};

// Create an instance of the card Element.
var card = elements.create('card', {
  style: style
});

// Add an instance of the card Element into the `card-element` <div>.
card.mount('#card-element');

/*Elements validates user input as it is typed. To help your customers catch mistakes, 
you should listen to change events on the card Element and display any errors*/
card.addEventListener('change', function (event) {
  var displayError = document.getElementById('express-card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

// Create a token or display an error when the form is submitted.
form.addEventListener('submit', function (event) {
  event.preventDefault();



  stripe.createToken(card, {
    name: document.getElementById('express-card-name-2').value,
    address_line1: document.getElementById('Express-Street-Address-2').value,
    address_city: document.getElementById('express-city').value,
    address_state: document.getElementById('express-state').value,
    address_zip: document.getElementById('express-Zip-Code').value
  }).then(function (result) {
    if (result.error) {
      // Inform the customer that there was an error.
      var errorElement = document.getElementById('express-card-errors');
      errorElement.textContent = result.error.message;
    } else {
      // Send the token to your server.
      stripeTokenHandler(result.token);
    }
  });
});

// Submit the token and the rest of your form to my server
function stripeTokenHandler(token) {

  cardErrors.innerHTML = "PROCESSING... Please do not reload";
  var xhr = new XMLHttpRequest();
  xhr.open('POST', serverURL + '/charge', true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function (event) {
    updateVoucherCount(event);
  };


  //Gather Form Data

  var nameInput = document.getElementById('express-card-name-2').value;
  var addressInput = document.getElementById('Express-Street-Address-2').value;
  var cityInput = document.getElementById('express-city').value;
  var stateInput = document.getElementById('express-state').value;
  var zipInput = document.getElementById('express-Zip-Code').value;
  var createdAt = Date.now();
  // Generate random Voucher Code
  function getRandomVoucher(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  var voucher = getRandomVoucher(100000, 999999);

  console.log(voucher);

  xhr.send(encodeURI('stripeToken=' + token.id + "&" + "email=" + emailValue.value + "&" + "amount=" + amount +
    "&" + "name=" + nameInput + "&fname=" + fname.value + "&lname=" + lname.value + "&street=" + addressInput + "&city=" + cityInput +
    "&state=" + stateInput + "&zip_code=" + zipInput + "&createdAt=" + createdAt + "&voucher=" + voucher));

}


// Fix problem with G in Google Reviews
$('#review-container').find('.romw .romw-source-logo img').css("width", "25px")


// Link to Tab2 from Button in Tab1
$('#express-Tab2').addClass('inactiveLink');


$('#express-golden-button1').on('click', function (evt) {
  evt.preventDefault();



  // Validade form fields

  if (fname.value === '' || lname.value === '' || emailValue.value === '') {
    cardErrors1rstTab.innerHTML = "* Please fill in all required fields";
  } else {

    // Send Form Tab 1 to Server

    var xhr1 = new XMLHttpRequest();
    xhr1.open('POST', serverURL + '/mailchimp', true);
    xhr1.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr1.onload = function (event) {
      var mailchimpQueryresponse = JSON.parse(event.currentTarget.response);
      if (mailchimpQueryresponse.message === 'First Step Completed') {
        cardErrors1rstTab.innerHTML = mailchimpQueryresponse.message;
        $('#express-Tab2').triggerHandler('click');
        window.location.href = "https://www.anandaspamiami.com/offers/free-facial-express#express-tab2";

        // Simulate click on drawer element
        setTimeout(function () {
          simulate(drawer, "click");
        }, 15000);


      } else {
        cardErrors1rstTab.innerHTML = mailchimpQueryresponse.message;
      }

      console.log(mailchimpQueryresponse);
    };

    xhr1.send(encodeURI('fname=' + fname.value + '&lname=' + lname.value + "&email=" + emailValue.value));


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