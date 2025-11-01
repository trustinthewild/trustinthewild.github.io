import { addComment, getComments } from './firebase-config.js';
import { handlePurchase } from './payment.js';
import { getCurrentUser, canPerformAction, saveComment, savePurchase, handleVerificationPrompt } from './auth.js';

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
async function updateAuthUI() {
    const user = getCurrentUser();
    const commentForm = document.getElementById('commentForm');
    const buyBtn = document.querySelector('.btn-buy');
    const authMessage = document.querySelector('.auth-message');

    const [commentCheck, purchaseCheck] = await Promise.all([
        canPerformAction('comment'),
        canPerformAction('purchase')
    ]);

    if (user) {
        // Show comment form if user can comment
        if (commentForm) {
            commentForm.style.display = 'block';
            if (commentCheck.allowed) {
                commentForm.querySelector('button[type="submit"]').disabled = false;
            } else {
                commentForm.querySelector('button[type="submit"]').disabled = true;
                if (authMessage && commentCheck.requiresVerification) {
                    authMessage.innerHTML = `<div class="alert alert-warning">${commentCheck.reason} <a href="#" class="verify-email-link">Send verification email</a></div>`;
                    authMessage.querySelector('.verify-email-link')?.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await handleVerificationPrompt();
                    });
                } else if (authMessage) {
                    authMessage.innerHTML = `<div class="alert alert-warning">${commentCheck.reason}</div>`;
                }
            }
        }

        // Enable buy button if user can make purchases
        if (buyBtn) {
            if (purchaseCheck.allowed) {
                buyBtn.disabled = false;
            } else {
                buyBtn.disabled = true;
                if (!purchaseCheck.requiresVerification) {
                    alert(purchaseCheck.reason);
                }
            }
        }
    } else {
        // Hide comment form and disable buy button for non-authenticated users
        if (commentForm) commentForm.style.display = 'none';
        if (buyBtn) buyBtn.disabled = true;
        if (authMessage) {
            authMessage.innerHTML = '<div class="alert alert-info">Please <a href="#" data-bs-toggle="modal" data-bs-target="#signInModal">sign in</a> to leave comments or make purchases.</div>';
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Listen for auth state changes
    window.addEventListener('authStateChanged', updateAuthUI);

    // Attach comment form handler
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const textEl = this.querySelector('textarea');
            const comment = textEl ? textEl.value.trim() : '';

            if (!comment) {
                alert('Please enter your comment.');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                await saveComment(productId, comment);
                await loadComments();
                this.reset();
                alert('Comment posted successfully!');
            } catch (error) {
                console.error('Error posting comment:', error);
                alert(error.message || 'Error posting comment. Please try again.');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Wire buy button
    const buyBtn = document.querySelector('.btn-buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', async () => {
            try {
                const check = await canPerformAction('purchase');
                if (!check.allowed) {
                    if (check.requiresVerification) {
                        await handleVerificationPrompt();
                    } else {
                        alert(check.reason);
                    }
                    return;
                }

                // Get product price from button's data attribute or page
                const priceEl = document.querySelector('.pricing-box .text-primary');
                const price = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;

                await handlePurchase(productId);
                
                // Save purchase record after successful payment
                await savePurchase(productId, price * 100, {
                    status: 'completed',
                    method: 'card'
                });

            } catch (error) {
                console.error('Error processing purchase:', error);
                alert(error.message || 'Error processing purchase. Please try again.');
            }
        });
    }

    // Load existing comments
    await loadComments();

    // Initial UI update
    updateAuthUI();
});