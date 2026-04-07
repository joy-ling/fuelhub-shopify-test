
document.querySelectorAll('.product-card').forEach(card => {

const input = card.querySelector('.quantity-input-card');
const button = card.querySelector('.add-to-cart');

function updateButton() {
    const quantity = parseInt(input.value) || 1;
    button.textContent = `Add ${quantity}`;
}

// Initialize button text
updateButton();

// Update when quantity changes
input.addEventListener('input', updateButton);

});

document.addEventListener('DOMContentLoaded', function() {
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartToggle = document.getElementById('cart-toggle');
const cartClose = document.getElementById('cart-close');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCheckout = document.getElementById('cart-checkout');
const mealCount = document.getElementById('meal-count');
const cartClear = document.getElementById('cart-clear');
const cartShipping = document.getElementById('cart-shipping');
const cartSavings = document.getElementById('cart-savings');
const discountMessage = document.getElementById('discount-message');
const discountMessageText = document.getElementById('discount-message-text');
const discountMessageClose = document.getElementById('discount-message-close');
const bottomQuantityMessage = document.getElementById('bottom-quantity-message');
const currencyCode = cartSidebar.getAttribute('data-currency') || 'USD';
const currencyFormatter = new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: currencyCode
});
const defaultShipping = parseFloat(cartSidebar.getAttribute('data-default-shipping')) || 10.00;

let cart = {};
let totalMeals = 0;
let lastShownMessage = null;
let lastAppliedDiscount = null;

// Load existing cart
fetch('/cart.js')
    .then(response => response.json())
    .then(data => {
    data.items.forEach(item => {
        cart[item.variant_id] = {
        title: item.title,
        price: item.price / 100,
        quantity: item.quantity
        };
        totalMeals += item.quantity;
    });
    updateCart();
    updateMealCount();
    updateProductMessages();
    updateBottomQuantityMessage();
    });

// Toggle cart
function toggleCart() {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('open');
}

cartToggle.addEventListener('click', toggleCart);
cartClose.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);

// Add to cart and toggle cart from bottom message
document.addEventListener('click', function(e) {
    if (e.target.closest('.click-to-view-cart')) {
    e.preventDefault();
    toggleCart();
    return;
    }

    if (e.target.classList.contains('add-to-cart')) {
    e.preventDefault();
    const variantId = e.target.getAttribute('data-variant-id');
    const quantityInput = document.querySelector(`.quantity-input-card[data-variant-id="${variantId}"]`);
    const quantity = parseInt(quantityInput.value) || 1;

    const productCard = e.target.closest('.product-card');
    const productTitle = productCard.querySelector('.product-card__header').textContent.trim();
    const productPriceText = productCard.querySelector('.product-card__price').textContent.trim();
    const productPrice = parseFloat(productPriceText.replace(/[^\d.-]/g, ''));

    if (totalMeals + quantity > 10) {
        alert('Maximum 10 meals allowed');
        return;
    }

    // Update local cart immediately
    if (!cart[variantId]) {
        cart[variantId] = {
        title: productTitle,
        price: productPrice,
        quantity: 0
        };
    }
    cart[variantId].quantity += quantity;
    totalMeals += quantity;
    updateCart();
    updateMealCount();
    updateProductMessages();
    showDiscountMessage();
    updateBottomQuantityMessage();

    // Add to Shopify cart asynchronously
    fetch('/cart/add.js', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        items: [{
            id: variantId,
            quantity: quantity
        }]
        })
    }).then(response => response.json())
    .then(data => {
        // Success, no need to do anything
    }).catch(error => {
        // Revert local changes on failure
        cart[variantId].quantity -= quantity;
        totalMeals -= quantity;
        if (cart[variantId].quantity <= 0) {
        delete cart[variantId];
        }
        updateCart();
        updateMealCount();
        updateProductMessages();
        showDiscountMessage();
        updateBottomQuantityMessage();
        alert('Failed to add item to cart. Please try again.');
    });
    }
});

// Update quantity
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('quantity-input')) {
    const variantId = e.target.getAttribute('data-variant-id');
    const newQuantity = parseInt(e.target.value) || 0;

    if (newQuantity < 0) return;

    const oldQuantity = cart[variantId].quantity;
    const diff = newQuantity - oldQuantity;

    if (totalMeals + diff > 10) {
        alert('Maximum 10 meals allowed');
        e.target.value = oldQuantity;
        return;
    }

    // Update local cart immediately
    if (newQuantity === 0) {
        delete cart[variantId];
    } else {
        cart[variantId].quantity = newQuantity;
    }
    totalMeals += diff;
    updateCart();
    updateMealCount();
    updateProductMessages();
    showDiscountMessage();
    updateBottomQuantityMessage();

    // Update Shopify cart asynchronously
    const formData = new FormData();
    formData.append('updates[' + variantId + ']', newQuantity);

    fetch('/cart/update.js', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
    .then(data => {
        // Success
    }).catch(error => {
        // Revert on failure
        if (oldQuantity === 0) {
        delete cart[variantId];
        } else {
        cart[variantId].quantity = oldQuantity;
        }
        totalMeals -= diff;
        updateCart();
        updateMealCount();
        updateProductMessages();
        showDiscountMessage();
        updateBottomQuantityMessage();
        e.target.value = oldQuantity;
        alert('Failed to update quantity. Please try again.');
    });
    }
});

// Remove item
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-item')) {
    const variantId = e.target.getAttribute('data-variant-id');
    const quantity = cart[variantId].quantity;

    // Update local cart immediately
    delete cart[variantId];
    totalMeals -= quantity;
    updateCart();
    updateMealCount();
    updateProductMessages();
    showDiscountMessage();
    updateBottomQuantityMessage();

    // Update Shopify cart asynchronously
    const formData = new FormData();
    formData.append('updates[' + variantId + ']', 0);

    fetch('/cart/update.js', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
    .then(data => {
        // Success
    }).catch(error => {
        // Revert on failure - but since we deleted, maybe just alert
        alert('Failed to remove item. Please refresh the page.');
    });
    }
});

// Update cart display
function updateCart() {
    cartItems.innerHTML = '';

    let subtotal = 0;
    let itemCount = 0;

    for (const variantId in cart) {
    const item = cart[variantId];
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    itemCount += item.quantity;

    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
        <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        </div>
        <div class="cart-item-quantity">
        <input type="number" class="quantity-input" data-variant-id="${variantId}" value="${item.quantity}" min="0" max="10">
        <button class="remove-item" data-variant-id="${variantId}">×</button>
        </div>
    `;
    cartItems.appendChild(itemElement);
    }

    // Calculate discount and shipping
    let discount = 0;
    let discountPercent = 0;
    let shipping = defaultShipping; // Default shipping

    if (totalMeals >= 5 && totalMeals <= 6) {
    discountPercent = 10;
    } else if (totalMeals >= 7 && totalMeals <= 8) {
    discountPercent = 15;
    } else if (totalMeals >= 9 && totalMeals <= 10) {
    discountPercent = 15;
    shipping = 0; // Free shipping
    }

    discount = subtotal * (discountPercent / 100);
    const total = subtotal - discount + shipping;

    cartShipping.textContent = `Shipping: ${currencyFormatter.format(shipping)}`;
    cartSavings.textContent = `Savings: -${currencyFormatter.format(discount)}`;
    cartTotal.textContent = `Total: ${currencyFormatter.format(total)}`;
    cartCheckout.disabled = totalMeals < 5 || totalMeals > 10;

    // Auto-apply discount based on meal count
    autoApplyDiscount(totalMeals);
}

// Update meal count display
function updateMealCount() {
    mealCount.textContent = `Meals selected: ${totalMeals} (Min: 5, Max: 10)`;
    mealCount.classList.remove('warning', 'error');

    if (totalMeals < 5) {
    mealCount.classList.add('error');
    } else if (totalMeals > 10) {
    mealCount.classList.add('warning');
    }
}

// Apply discount code
function applyDiscountCode(code) {
    fetch('/cart/update.js', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        discount: code
    })
    })
    .then(response => response.json())
    .then(data => {
    console.log('Discount applied:', code);
    })
    .catch(error => {
    console.error('Failed to apply discount:', error);
    });
}

// Auto-apply discount based on meal count
function autoApplyDiscount(mealCount) {
    let discountCode = '';

    if (mealCount >= 5 && mealCount <= 6) {
    discountCode = 'MEALS_10OFF';
    } else if (mealCount >= 7 && mealCount <= 8) {
    discountCode = 'MEALS_15OFF';
    } else if (mealCount >= 9 && mealCount <= 10) {
    discountCode = 'MEALS_15OFF_FREESHIPPING';
    }

    // Only apply if it's different from the last applied code
    if (discountCode && discountCode !== lastAppliedDiscount) {
    lastAppliedDiscount = discountCode;
    applyDiscountCode(discountCode);
    } else if (!discountCode && lastAppliedDiscount) {
    // Clear discount if meal count drops below threshold
    lastAppliedDiscount = null;
    }
}

// Update product added messages
function updateProductMessages() {
    document.querySelectorAll('.product-card').forEach(card => {
    const variantId = card.getAttribute('data-variant-id');
    const message = card.querySelector('.product-added-message');
    if (cart[variantId] && cart[variantId].quantity > 0) {
        const quantity = cart[variantId].quantity;
        const productText = quantity === 1 ? 'product' : 'products';
        message.textContent = `${quantity} ${productText} added to cart`;
        message.style.display = 'block';
    } else {
        message.style.display = 'none';
    }
    });
}

// Show discount message
function showDiscountMessage() {
    let message = '';

    if (totalMeals < 5) {
    message = 'Add at least 5 meals to get a 10% discount';
    } else if (totalMeals === 5) {
    message = 'Add 2 more meals to unlock a 15% discount';
    } else if (totalMeals === 6) {
    message = 'Add 1 more meal to unlock a 15% discount';
    } else if (totalMeals >= 7 && totalMeals <= 8) {
    message = 'You\'ve unlocked a 15% discount! 🎉';
    } else if (totalMeals >= 9 && totalMeals <= 10) {
    message = 'Free shipping unlocked 🚚';
    }

    // Only show if message changed
    if (message !== lastShownMessage) {
    lastShownMessage = message;
    discountMessageText.textContent = message;
    discountMessage.classList.add('show');
    setTimeout(() => {
        discountMessage.classList.remove('show');
    }, 3000);
    }
}

// Update bottom quantity message
function updateBottomQuantityMessage() {
    bottomQuantityMessage.innerHTML = `<p>You have selected ${totalMeals} meals</p><p class='click-to-view-cart' id='click-to-view-cart'>Click to view cart</p>`;
}

// Close discount message
discountMessageClose.addEventListener('click', function() {
    discountMessage.classList.remove('show');
});

// Checkout
cartCheckout.addEventListener('click', function() {
if (totalMeals >= 5 && totalMeals <= 10) {
    if (lastAppliedDiscount) {
    window.location.href = '/checkout?discount=' + lastAppliedDiscount;
    } else {
    window.location.href = '/checkout';
    }
}
});

// Clear cart
cartClear.addEventListener('click', function() {
    // Clear local cart
    cart = {};
    totalMeals = 0;
    lastShownMessage = null;
    lastAppliedDiscount = null;
    updateCart();
    updateMealCount();
    updateProductMessages();
    updateBottomQuantityMessage();

    // Clear Shopify cart
    fetch('/cart/clear.js', {
    method: 'POST'
    }).then(response => response.json())
    .then(data => {
    // Success
    }).catch(error => {
    alert('Failed to clear cart. Please refresh the page.');
    });
});
});