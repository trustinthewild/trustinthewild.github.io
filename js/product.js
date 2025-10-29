import { addComment, getComments } from './firebase-config.js';
import { handlePurchase } from './payment.js';

// Get product ID from URL
const productId = window.location.pathname.split('/').pop().replace('.html', '');

// Load existing comments
async function loadComments() {
    const comments = await getComments(productId);
    const commentSection = document.querySelector('.comment');
    commentSection.innerHTML = comments.map(comment => `
        <div class="mb-3 pb-3 border-bottom">
            <h5>${comment.name}</h5>
            <p class="text-muted">${new Date(comment.timestamp).toLocaleDateString()}</p>
            <p>${comment.comment}</p>
        </div>
    `).join('');
}

// Handle comment form submission
document.getElementById('commentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const name = this.querySelector('input[type="text"]').value;
    const comment = this.querySelector('textarea').value;
    
    try {
        const result = await addComment(productId, name, comment);
        if (result.success) {
            // Reload comments
            await loadComments();
            // Clear the form
            this.reset();
        } else {
            alert('There was an error posting your comment. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error posting your comment. Please try again.');
    }
});

// Initialize page: load comments and wire buy button
document.addEventListener('DOMContentLoaded', async () => {
    // Load existing comments
    await loadComments();

    // Wire buy button on product detail page
    const buyBtn = document.querySelector('.btn-buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            handlePurchase(productId);
        });
    }
});