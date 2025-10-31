// Firebase imports
import { getDatabase, ref, push, set } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js';
import { requireAuth } from './auth.js';

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

// Store purchase in Firebase
async function recordPurchase(userId, productId, priceId, amount) {
    const db = getDatabase();
    const purchaseRef = ref(db, `users/${userId}/purchases`);
    const newPurchaseRef = push(purchaseRef);
    
    await set(newPurchaseRef, {
        productId,
        priceId,
        amount,
        timestamp: new Date().toISOString(),
        status: 'initiated'
    });
    
    return newPurchaseRef.key;
}

// Handle purchase button click
export async function handlePurchase(productId) {
    try {
        // Check authentication
        const user = requireAuth();
        
        const product = PRODUCT_PRICES[productId];
        if (!product) {
            throw new Error('Product not found');
        }

        // Record purchase attempt
        const purchaseId = await recordPurchase(
            user.uid,
            productId,
            product.priceId,
            product.amount
        );

        // Create a Stripe Checkout Session
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: product.priceId,
                productId: productId,
                type: product.type,
                userId: user.uid,
                purchaseId: purchaseId
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
        if (error.message === 'Authentication required') {
            alert('Please sign in to make a purchase.');
        } else {
            alert('There was an error processing your purchase. Please try again.');
        }
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