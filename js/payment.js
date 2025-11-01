// Initialize Stripe
let stripe;

// Product prices mapping
const PRODUCT_PRICES = {
    'dataguard-pro': {
        priceId: 'YOUR_STRIPE_PRICE_ID',
        amount: 4999, // $49.99
        type: 'one-time'
    },
    'cloudsync': {
        priceId: 'YOUR_STRIPE_PRICE_ID',
        amount: 3999, // $39.99
        type: 'one-time'
    },
    'devtools': {
        priceId: 'YOUR_STRIPE_PRICE_ID',
        amount: 7999, // $79.99
        type: 'one-time'
    },
    'securechat': {
        priceId: 'YOUR_STRIPE_PRICE_ID',
        amount: 9999, // $99.99
        type: 'subscription'
    }
};

// Initialize Stripe with your publishable key
export function initializeStripe(publishableKey) {
    stripe = Stripe(publishableKey);
}

// Handle purchase button click
export async function handlePurchase(productId) {
    try {
        const product = PRODUCT_PRICES[productId];
        if (!product) {
            throw new Error('Product not found');
        }

        // Create a Stripe Checkout Session
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: product.priceId,
                productId: productId,
                type: product.type
            }),
        });

        const session = await response.json();

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.id,
        });

        if (result.error) {
            throw new Error(result.error.message);
        }
    } catch (error) {
        console.error('Purchase error:', error);
        alert('There was an error processing your purchase. Please try again.');
    }
}

// Handle successful purchase
export function handlePurchaseSuccess() {
    // Show success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
        alert('Thank you for your purchase! You will receive an email with further instructions.');
    }
}

// Initialize purchase buttons
export function initializePurchaseButtons() {
    document.querySelectorAll('.btn-buy').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            handlePurchase(productId);
        });
    });
}