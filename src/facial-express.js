//Shopping Cart

//Adjust Total
var addUpgrade = function() {
  $('#express-row-upgrade').css('display', 'flex');
  $('#express-row-total').text('$42.00')
  $('#express-cart-upgrade').prop('checked', true);
  $('#express-checkbox-first').prop('checked', true);
  $('#express-checkbox-second').prop('checked', true)
};

var removeUpgrade = function() {
  $('#express-row-upgrade').hide();
  $('#express-row-total').text('$10.00')
  $('#express-cart-free').prop('checked', true);
  $('#express-checkbox-first').prop('checked', false);
  $('#express-checkbox-second').prop('checked', false)
}

$('#express-cart-free').on('click', removeUpgrade)

$('#express-cart-upgrade').on('click', addUpgrade)

$('input[name=checkbox], input[name=checkbox-2]').change(function(){
  if($(this).is(':checked')) {
      addUpgrade()
  } else {
      removeUpgrade()
  }
});

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
var form = document.getElementById('wf-form-shopping-cart-tab2');
form.addEventListener('submit', function(event) {
  event.preventDefault();

  var nameInput = document.getElementById('express-card-name-2').value;
  var addressInput = document.getElementById('Express-Street-Address-2').value
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
  // Insert the token ID into the form so it gets submitted to the server
  var form = document.getElementById('wf-form-shopping-cart-tab2');
  var hiddenInput = document.createElement('input');
  hiddenInput.setAttribute('type', 'hidden');
  hiddenInput.setAttribute('name', 'stripeToken');
  hiddenInput.setAttribute('value', token.id);
  form.appendChild(hiddenInput);
  var emailValue = document.getElementById('express-email').value
  var emailInput = document.createElement('input'); 
  emailInput.setAttribute('type', 'hidden');
  emailInput.setAttribute('name', 'email');
  emailInput.setAttribute('value', emailValue);
  form.appendChild(emailInput);

  // Submit the form
  // form.submit();

  var postURL = form.getAttribute('action')
  var xhr = new XMLHttpRequest();
    xhr.open('POST', postURL, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
      var reply = JSON.parse(this.response)
      console.log(reply.message)
      var message = document.getElementById('express-card-errors');
      message.innerHTML = reply.message
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
    xhr.send(encodeURI('stripeToken=' + token.id + "&" + "email=" + emailValue));
}


// Fix problem with G in Google Reviews
$('#review-container').find('.romw .romw-source-logo img').css("width", "25px")


// Link to Tab2 from Button in Tab1
$( '#express-Tab2' ).addClass('inactiveLink');


$('#express-golden-button1').on('click', function (evt) {
  $('#express-Tab2').triggerHandler('click');
  evt.preventDefault();
    
});


// Get Google Reviews
/* https://github.com/peledies/google-places */
(function($) {

    $.googlePlaces = function(element, options) {

        var defaults = {
              placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' // placeId provided by google api documentation
            , render: ['reviews']
            , min_rating: 0
            , max_rows: 0
            , rotateTime: false
        };

        var plugin = this;

        plugin.settings = {}

        var $element = $(element),
             element = element;

        plugin.init = function() {
          plugin.settings = $.extend({}, defaults, options);
          $element.html("<div id='map-plug'></div>"); // create a plug for google to load data into
          initialize_place(function(place){
            plugin.place_data = place;
            // render specified sections
            if(plugin.settings.render.indexOf('reviews') > -1){
              renderReviews(plugin.place_data.reviews);
              if(!!plugin.settings.rotateTime) {
                  initRotation();
              }
            }
          });
        }

        var initialize_place = function(c){
          var map = new google.maps.Map(document.getElementById('map-plug'));

          var request = {
            placeId: plugin.settings.placeId
          };

          var service = new google.maps.places.PlacesService(map);

          service.getDetails(request, function(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
              c(place);
            }
          });
        }

        var sort_by_date = function(ray) {
          ray.sort(function(a, b){
            var keyA = new Date(a.time),
            keyB = new Date(b.time);
            // Compare the 2 dates
            if(keyA < keyB) return -1;
            if(keyA > keyB) return 1;
            return 0;
          });
          return ray;
        }

        var filter_minimum_rating = function(reviews){
          for (var i = reviews.length -1; i >= 0; i--) {
            if(reviews[i].rating < plugin.settings.min_rating){
              reviews.splice(i,1);
            }
          }
          return reviews;
        }

        var renderReviews = function(reviews){
          reviews = sort_by_date(reviews);
          reviews = filter_minimum_rating(reviews);
          var html = "";
          var row_count = (plugin.settings.max_rows > 0)? plugin.settings.max_rows - 1 : reviews.length - 1;
          // make sure the row_count is not greater than available records
          row_count = (row_count > reviews.length-1)? reviews.length -1 : row_count;
          for (var i = row_count; i >= 0; i--) {
            var stars = renderStars(reviews[i].rating);
            var date = convertTime(reviews[i].time);
            html = html+"<div class='review-item'><div class='review-meta'><span class='review-author'>"+reviews[i].author_name+"</span><span class='review-sep'>, </span><span class='review-date'>"+date+"</span></div>"+stars+"<p class='review-text'>"+reviews[i].text+"</p></div>"
          };
          $element.append(html);
        }
        
        var initRotation = function() {
            var $reviewEls = $element.children('.review-item');
            var currentIdx = $reviewEls.length > 0 ? 0 : false;
            $reviewEls.hide();
            if(currentIdx !== false) {
                $($reviewEls[currentIdx]).show();
                setInterval(function(){ 
                    if(++currentIdx >= $reviewEls.length) {
                        currentIdx = 0;
                    }
                    $reviewEls.hide();
                    $($reviewEls[currentIdx]).fadeIn('slow');
                }, plugin.settings.rotateTime);
            }
        }

        var renderStars = function(rating){
          var stars = "<div class='review-stars'><ul>";
                            
          // fill in gold stars
          for (var i = 0; i < rating; i++) {
            stars = stars+"<li><i class='star'></i></li>";
          };

          // fill in empty stars
          if(rating < 5){
            for (var i = 0; i < (5 - rating); i++) {
              stars = stars+"<li><i class='star inactive'></i></li>";
            };
          }
          stars = stars+"</ul></div>";
          return stars;
        }

        var convertTime = function(UNIX_timestamp){
          var a = new Date(UNIX_timestamp * 1000);
          var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          var time = months[a.getMonth()] + ' ' + a.getDate() + ', ' + a.getFullYear();
          return time;
        }

        plugin.init();

    }

    $.fn.googlePlaces = function(options) {

        return this.each(function() {
            if (undefined == $(this).data('googlePlaces')) {
                var plugin = new $.googlePlaces(this, options);
                $(this).data('googlePlaces', plugin);
            }
        });

    }

})(jQuery);