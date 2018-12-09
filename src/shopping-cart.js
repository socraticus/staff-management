

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
            showEmail: true
        },
        computed: {
            cartTotal: function() {
               return mainVue.cartTotal;
            }
        }
    });


};

