
// DOM Variable Declarations
var form = document.getElementById('wf-form-shopping-cart-tab2');
var cardErrors = document.getElementById('express-card-errors');
var postURL = form.getAttribute('action');
var fname = document.getElementById('express-first-name');
var lname = document.getElementById('express-last-name');
var emailValue = document.getElementById('express-email');

//Shopping Cart

//Adjust Total
var addUpgrade = function () {
  $('#express-row-upgrade').css('display', 'flex');
  $('#express-row-total').text('$42.00')
  $('input[name=expressCart][value="4200"]').prop('checked', true);
  $('#express-checkbox-first').prop('checked', true);
  $('#express-checkbox-second').prop('checked', true)
};

var removeUpgrade = function () {
  $('#express-row-upgrade').hide();
  $('#express-row-total').text('$10.00')
  $('input[name=expressCart][value="1000"]').prop('checked', true);
  $('#express-checkbox-first').prop('checked', false);
  $('#express-checkbox-second').prop('checked', false)
}

$('input[name=expressCart][value="1000"]').on('click', removeUpgrade)

$('input[name=expressCart][value="4200"]').on('click', addUpgrade)

$('input[name=checkbox], input[name=checkbox-2]').change(function () {
  if ($(this).is(':checked')) {
    addUpgrade()
  } else {
    removeUpgrade()
  }
});

// AJAX request to Get Vouchers Left
var getURL = form.getAttribute('action') + "/vouchers"
var voucherxhr = new XMLHttpRequest();
voucherxhr.open('GET', getURL, true);
//voucherxhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
voucherxhr.onload = function (event) {
  updateVoucherCount(event);
}
voucherxhr.send();

// Process Response from AJAX

var updateVoucherCount = function (event) {
  console.log(event);
  var reply = JSON.parse(event.currentTarget.response)
  console.log(reply.message, reply.customerCount)
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
    return
  }
});

$bubble2.on("click", function () {
  if ($bubble2.attr('clicked') == 'false') {
    $bubble2.attr('clicked', true);
    quizClickCount += 1
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
    quizClickCount += 1
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
  xhr.open('POST', postURL + '/charge', true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function (event) {
    updateVoucherCount(event);
  };


  //Gather Form Data
  // var emailValue = document.getElementById('express-email').value;
  var amount = form.expressCart.value;
  var nameInput = document.getElementById('express-card-name-2').value;
  // var fname = document.getElementById('express-first-name').value;
  // var lname = document.getElementById('express-last-name').value;
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

  xhr.send(encodeURI('stripeToken=' + token.id + "&" + "email=" + emailValue + "&" + "amount=" + amount +
    "&" + "name=" + nameInput + "&fname=" + fname + "&lname=" + lname + "&street=" + addressInput + "&city=" + cityInput + 
    "&state=" + stateInput + "&zip_code=" + zipInput + "&createdAt=" + createdAt + "&voucher=" + voucher));

}


// Fix problem with G in Google Reviews
$('#review-container').find('.romw .romw-source-logo img').css("width", "25px")


// Link to Tab2 from Button in Tab1
// $( '#express-Tab2' ).addClass('inactiveLink');


$('#express-golden-button1').on('click', function (evt) {
  evt.preventDefault();

  // Send Form Tab 1 to Server
  
  var xhr1 = new XMLHttpRequest();
  xhr1.open('POST', postURL + '/mailchimp', true);
  xhr1.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr1.onload = function (event) {
    console.log('First Tab Form sent to Server');
  };

  xhr1.send(encodeURI('fname=' + fname.value + '&lname=' + lname.value + "&email=" + emailValue.value));


  
  $('#express-Tab2').triggerHandler('click');

  

});