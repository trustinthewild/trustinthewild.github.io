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
        // compute slug from detailsLink (e.g. products/dataguard-pro.html -> dataguard-pro)
        const slug = product.detailsLink.split('/').pop().replace('.html', '');

        const productCard = `
            <div class="col-md-6 col-lg-3">
                <div class="card product-card" data-product="${slug}">
                    <div class="card-img-top d-flex align-items-center justify-content-center">
                        <span class="text-white fw-bold">${product.name}</span>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <p class="text-primary fw-bold">${product.price}</p>
                        <div class="d-grid gap-2">
                            <a href="${product.detailsLink}" class="btn btn-outline-primary">Learn More</a>
                            <button type="button" class="btn btn-buy" data-product-id="${slug}">Buy Now</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        productsContainer.insertAdjacentHTML('beforeend', productCard);
    });

    // Attach click handlers for buy buttons (delegated)
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pid = e.currentTarget.dataset.productId;
            if (pid) {
                handlePurchase(pid);
            }
        });
    });
}

// Dynamic module placeholders (use dynamic import so site still works without config)
let submitContactForm = null;
let initializeStripe = (k) => { console.warn('Stripe not initialized'); };
let handlePurchase = (productId) => {
    console.log('Purchase requested for', productId);
    alert('Purchase flow not configured. This is a demo.');
};

// Handle contact form submission
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: this.querySelector('input[type="text"]').value,
        email: this.querySelector('input[type="email"]').value,
        message: this.querySelector('textarea').value
    };

    try {
        if (typeof submitContactForm === 'function') {
            const result = await submitContactForm(formData);
            if (result && result.success) {
                alert('Thank you for your message! We will get back to you soon.');
                this.reset();
            } else {
                alert('There was an error sending your message. Please try again.');
            }
        } else {
            // Graceful fallback when Firebase is not configured
            console.warn('submitContactForm not available; contact message:', formData);
            alert('Contact form backend not configured. Message logged to console.');
            this.reset();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error sending your message. Please try again.');
    }
});

// Load products and attempt to dynamically import optional modules when the page is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Render products immediately
    try {
        loadProducts();
    } catch (e) {
        console.error('Error rendering products:', e);
    }

    // Dynamically load payment module (optional)
    try {
        const payment = await import('./payment.js');
        if (payment.initializeStripe) initializeStripe = payment.initializeStripe;
        if (payment.handlePurchase) handlePurchase = payment.handlePurchase;
        try {
            initializeStripe('YOUR_STRIPE_PUBLISHABLE_KEY');
        } catch (err) {
            console.warn('Stripe initialization skipped or failed:', err);
        }
    } catch (err) {
        console.warn('Payment module not available:', err);
    }

    // Dynamically load firebase module (optional)
    try {
        const fb = await import('./firebase-config.js');
        if (fb.submitContactForm) submitContactForm = fb.submitContactForm;
    } catch (err) {
        console.warn('Firebase module not available:', err);
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});