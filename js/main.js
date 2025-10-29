// Sample product data - Replace with your actual products
const products = [
    {
        id: 1,
        name: "DataGuard Pro",
        description: "Advanced data backup and encryption solution for businesses and individuals",
        image: "images/dataguard-pro.jpg",
        price: "$49.99",
        detailsLink: "products/dataguard-pro.html"
    },
    {
        id: 2,
        name: "CloudSync Manager",
        description: "Seamless cloud storage synchronization and management tool",
        image: "images/cloudsync.jpg",
        price: "$39.99",
        detailsLink: "products/cloudsync.html"
    },
    {
        id: 3,
        name: "DevTools Suite",
        description: "Complete development toolkit for modern web applications",
        image: "images/devtools.jpg",
        price: "$79.99",
        detailsLink: "products/devtools.html"
    },
    {
        id: 4,
        name: "SecureChat Enterprise",
        description: "End-to-end encrypted communication platform for businesses",
        image: "images/securechat.jpg",
        price: "$99.99",
        detailsLink: "products/securechat.html"
    }
];

// Load products into the products section
function loadProducts() {
    const productsContainer = document.querySelector('#products .row');
    
    products.forEach(product => {
        const productCard = `
            <div class="col-md-6 col-lg-3">
                <div class="card product-card" data-product="${product.id}">
                    <div class="card-img-top d-flex align-items-center justify-content-center">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <p class="text-primary fw-bold">${product.price}</p>
                        <div class="d-grid gap-2">
                            <a href="${product.detailsLink}" class="btn btn-outline-primary">Learn More</a>
                            <button class="btn btn-buy" onclick="initiatePurchase(${product.id})">Buy Now</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productsContainer.innerHTML += productCard;
    });
}

// Import Firebase and Payment functions
import { submitContactForm } from './firebase-config.js';
import { initializeStripe, handlePurchase, handlePurchaseSuccess } from './payment.js';

// Initialize Stripe
initializeStripe('YOUR_STRIPE_PUBLISHABLE_KEY');

// Handle purchase button click
function initiatePayment(productId) {
    handlePurchase(productId);
}

// Handle contact form submission
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: this.querySelector('input[type="text"]').value,
        email: this.querySelector('input[type="email"]').value,
        message: this.querySelector('textarea').value
    };

    try {
        const result = await submitContactForm(formData);
        if (result.success) {
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        } else {
            alert('There was an error sending your message. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error sending your message. Please try again.');
    }
});

// Load products when the page is ready
document.addEventListener('DOMContentLoaded', loadProducts);

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});