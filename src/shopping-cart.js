// DOM Variable Declarations
var cartIconTotal = document.getElementById('shopping-cart-total-items');
var addCartDeepCleansing = document.getElementById('add-cart-deep-cleansing');

// Initialize Vue instance

window.onload = function () {
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
                this.cart.items.push({
                    product: product,
                    quantity: 1
                });
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

    // DOM Interactions with Vue Instance
    cartIconTotal.innerHTML = mainVue.cartTotal;

    addCartDeepCleansing.addEventListener('click', function (event) {
        event.preventDefault();

        mainVue.addProductsToCart(mainVue.products[0]);
    });

};

