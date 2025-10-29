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

// Function to add a new comment to the page
function addComment(name, text) {
    const commentSection = document.querySelector('.comment');
    const newComment = `
        <div class="mb-3 pb-3 border-bottom">
            <h5>${name}</h5>
            <p class="text-muted">${new Date().toLocaleDateString()}</p>
            <p>${text}</p>
        </div>
    `;
    commentSection.innerHTML = newComment + commentSection.innerHTML;
}

// Function to handle purchase
function initiatePurchase() {
    // Implement your payment platform integration here
    console.log('Purchase initiated');
}