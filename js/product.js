import { addComment, getComments } from './firebase-config.js';
import { handlePurchase } from './payment.js';
import { getCurrentUser, requireAuth } from './auth.js';

// Get product ID from URL
const productId = window.location.pathname.split('/').pop().replace('.html', '');

// Safe renderer for comments (avoids innerHTML with unescaped user input)
function renderCommentsTo(container, comments) {
    container.innerHTML = '';
    if (!comments || comments.length === 0) {
        const p = document.createElement('p');
        p.className = 'text-muted';
        p.textContent = 'No comments yet.';
        container.appendChild(p);
        return;
    }

    const frag = document.createDocumentFragment();
    comments.forEach(comment => {
        const wrap = document.createElement('div');
        wrap.className = 'mb-3 pb-3 border-bottom';

        const h = document.createElement('h5');
        h.textContent = comment.name || 'Anonymous';

        const date = document.createElement('p');
        date.className = 'text-muted';
        // Show date plus hour and minute (locale-aware)
        if (comment.timestamp) {
            const d = new Date(comment.timestamp);
            const opts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
            date.textContent = d.toLocaleString(undefined, opts);
        } else {
            date.textContent = '';
        }

        const body = document.createElement('p');
        body.textContent = comment.comment || '';

        wrap.appendChild(h);
        wrap.appendChild(date);
        wrap.appendChild(body);
        frag.appendChild(wrap);
    });

    container.appendChild(frag);
}

// Load existing comments
async function loadComments() {
    const commentSection = document.querySelector('.comment');
    if (!commentSection) return; // nothing to do

    // show loading state
    commentSection.innerHTML = '<p class="text-muted">Loading comments...</p>';

    try {
        const comments = await getComments(productId) || [];
        renderCommentsTo(commentSection, comments);
    } catch (err) {
        console.error('Error loading comments:', err);
        commentSection.innerHTML = '<p class="text-muted text-danger">Unable to load comments.</p>';
    }
}

// Handle authentication state changes
function updateAuthUI() {
    const user = getCurrentUser();
    const commentForm = document.getElementById('commentForm');
    const buyBtn = document.querySelector('.btn-buy');
    const authMessage = document.querySelector('.auth-message');

    if (user) {
        if (commentForm) commentForm.style.display = 'block';
        if (buyBtn) buyBtn.disabled = false;
        if (authMessage) authMessage.style.display = 'none';
    } else {
        if (commentForm) commentForm.style.display = 'none';
        if (buyBtn) buyBtn.disabled = true;
        if (authMessage) authMessage.innerHTML = '<div class="alert alert-info">Please <a href="#" data-bs-toggle="modal" data-bs-target="#authModal">sign in</a> to leave comments or make purchases.</div>';
    }
}

// Initialize page: wire handlers and load comments
document.addEventListener('DOMContentLoaded', async () => {
    // Listen for auth state changes
    window.addEventListener('authStateChanged', updateAuthUI);

    // Attach comment form handler if present
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            try {
                // Ensure user is authenticated
                const user = requireAuth();
                
                const textEl = this.querySelector('textarea');
                const comment = textEl ? textEl.value.trim() : '';

                if (!comment) {
                    alert('Please enter your comment.');
                    return;
                }

                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;

                const result = await addComment(productId, user.email, comment);
                if (result && result.success) {
                    await loadComments();
                    this.reset();
                } else {
                    alert('There was an error posting your comment. Please try again.');
                }
            } catch (error) {
                console.error('Error posting comment:', error);
                if (error.message === 'Authentication required') {
                    alert('Please sign in to post comments.');
                } else {
                    alert('There was an error posting your comment. Please try again.');
                }
            } finally {
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Load existing comments
    await loadComments();

    // Wire buy button on product detail page
    const buyBtn = document.querySelector('.btn-buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', async () => {
            try {
                // Ensure user is authenticated
                const user = requireAuth();
                await handlePurchase(productId, user.uid);
            } catch (error) {
                console.error('Error triggering purchase handler', error);
                if (error.message === 'Authentication required') {
                    alert('Please sign in to make purchases.');
                } else {
                    alert('There was an error processing your purchase. Please try again.');
                }
            }
        });
    }

    // Initial UI update
    updateAuthUI();
});