import { addComment, getComments } from './firebase-config.js';
import { handlePurchase } from './payment.js';

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

// Initialize page: wire handlers and load comments
document.addEventListener('DOMContentLoaded', async () => {
    // Attach comment form handler if present
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const nameEl = this.querySelector('input[type="text"]');
            const textEl = this.querySelector('textarea');
            const name = nameEl ? nameEl.value.trim() : '';
            const comment = textEl ? textEl.value.trim() : '';

            if (!name || !comment) {
                alert('Please enter your name and comment.');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const result = await addComment(productId, name, comment);
                if (result && result.success) {
                    await loadComments();
                    this.reset();
                } else {
                    alert('There was an error posting your comment. Please try again.');
                }
            } catch (error) {
                console.error('Error posting comment:', error);
                alert('There was an error posting your comment. Please try again.');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Load existing comments
    await loadComments();

    // Wire buy button on product detail page
    const buyBtn = document.querySelector('.btn-buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            try {
                handlePurchase(productId);
            } catch (err) {
                console.error('Error triggering purchase handler', err);
            }
        });
    }
});