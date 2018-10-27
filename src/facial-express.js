var form = document.getElementById('wf-form-shopping-cart-tab2');
var cardErrors = document.getElementById('express-card-errors');

//Shopping Cart

//Adjust Total
var addUpgrade = function() {
  $('#express-row-upgrade').css('display', 'flex');
  $('#express-row-total').text('$42.00')
  $('input[name=expressCart][value="4200"]').prop('checked', true);
  $('#express-checkbox-first').prop('checked', true);
  $('#express-checkbox-second').prop('checked', true)
};

var removeUpgrade = function() {
  $('#express-row-upgrade').hide();
  $('#express-row-total').text('$10.00')
  $('input[name=expressCart][value="1000"]').prop('checked', true);
  $('#express-checkbox-first').prop('checked', false);
  $('#express-checkbox-second').prop('checked', false)
}

$('input[name=expressCart][value="1000"]').on('click', removeUpgrade)

$('input[name=expressCart][value="4200"]').on('click', addUpgrade)

$('input[name=checkbox], input[name=checkbox-2]').change(function(){
  if($(this).is(':checked')) {
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
    voucherxhr.onload = function(event) {
      updateVoucherCount(event);
    }
    voucherxhr.send();

// Process Response from AJAX

var updateVoucherCount = function(event) {
  console.log(event);
  var reply = JSON.parse(event.currentTarget.response)
  console.log(reply.message, reply.customerCount)
  cardErrors.innerHTML = reply.message;

  // Update Voucher counter in DOM
  var firstDigit = document.getElementById('express-digit1');
  var secondDigit = document.getElementById('express-digit2');

  // Calculate remainder on base 50
  var finalCount = 50 - reply.customerCount % 50;

  if(finalCount < 10) {
    firstDigit.innerText = 0;
    secondDigit.innerText = finalCount;
  } else {
    firstDigit.innerText = JSON.stringify(finalCount).slice(0,1);
    secondDigit.innerHTML = JSON.stringify(finalCount).slice(1);
  }
   

};

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
var card = elements.create('card', {style: style});

// Add an instance of the card Element into the `card-element` <div>.
card.mount('#card-element');

/*Elements validates user input as it is typed. To help your customers catch mistakes, 
you should listen to change events on the card Element and display any errors*/
card.addEventListener('change', function(event) {
  var displayError = document.getElementById('express-card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

// Create a token or display an error when the form is submitted.
form.addEventListener('submit', function(event) {
  event.preventDefault();

  

  stripe.createToken(card, {
    name:document.getElementById('express-card-name-2').value,
    address_line1:document.getElementById('Express-Street-Address-2').value,
    address_city:document.getElementById('express-city').value,
    address_state:document.getElementById('express-state').value,
    address_zip:document.getElementById('express-Zip-Code').value
  }).then(function(result) {
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
  
  cardErrors.innerHTML = "PROCESSING... Please do not reload"
  var postURL = form.getAttribute('action')
  var xhr = new XMLHttpRequest();
    xhr.open('POST', postURL, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function(event) {
      updateVoucherCount(event);
    };


//     xhr.onload = function() {
//     if (xhr.status === 200) {
//       var resp = JSON.parse(xhr.responseText);
//       console.log(resp);
//       alert(resp.form.token);
//     }
//     else if (xhr.status !== 200) {
//       alert('Request failed.  Returned status of ' + xhr.status);
//     }
// };

  //Gather Form Data
  var emailValue = document.getElementById('express-email').value;
  var amount = form.expressCart.value;
  var nameInput = document.getElementById('express-card-name-2').value;
  var addressInput = document.getElementById('Express-Street-Address-2').value;
  var cityInput = document.getElementById('express-city').value;
  var stateInput = document.getElementById('express-state').value;
  var zipInput = document.getElementById('express-Zip-Code').value
  var createdAt = Date.now();

  console.log(createdAt)

  xhr.send(encodeURI('stripeToken=' + token.id + "&" + "email=" + emailValue + "&" + "amount=" + amount
  + "&" + "name=" + nameInput + "&street=" + addressInput + "&city=" + cityInput + "&state=" + stateInput
  + "&zip_code=" + zipInput + "&createdAt=" + createdAt));
  
}


// Fix problem with G in Google Reviews
$('#review-container').find('.romw .romw-source-logo img').css("width", "25px")


// Link to Tab2 from Button in Tab1
// $( '#express-Tab2' ).addClass('inactiveLink');


$('#express-golden-button1').on('click', function (evt) {
   $('#express-Tab2').triggerHandler('click');
  
//   //evt.preventDefault();
    
});
