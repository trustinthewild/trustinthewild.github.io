import { 
    getAuth, 
    updatePassword, 
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js';
import { getCurrentUser, requireAuth, showNotification } from './auth.js';

const auth = getAuth();
const db = getDatabase();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for authentication state to be determined
        let user = getCurrentUser();
        
        if (!user) {
            // Wait for auth state change event
            user = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Authentication timeout'));
                }, 5000); // 5 second timeout
                
                const onAuth = (e) => {
                    clearTimeout(timeout);
                    window.removeEventListener('authStateChanged', onAuth);
                    if (!e.detail.user) {
                        reject(new Error('Not authenticated'));
                    } else {
                        resolve(e.detail.user);
                    }
                };
                
                window.addEventListener('authStateChanged', onAuth);
            });
        }

        // Load user profile
        await loadUserProfile(user);
        
        // Load user's purchases and comments
        await Promise.all([
            loadUserPurchases(user.uid),
            loadUserComments(user.uid)
        ]);

        // Setup form handlers
        setupProfileForm();
        setupPasswordForm();

    } catch (error) {
        console.error('Error initializing profile:', error);
        // Redirect to home if authentication failed
        if (error.message.includes('Authentication') || error.message.includes('Not authenticated')) {
            window.location.href = '/';
        }
    }
});

async function loadUserProfile(user) {
    // Set email and verification status
    const emailInput = document.getElementById('profileEmail');
    const emailStatus = document.getElementById('emailVerificationStatus');
    if (emailInput) emailInput.value = user.email;
    
    if (emailStatus) {
        if (user.emailVerified) {
            emailStatus.innerHTML = '<span class="text-success">✓ Email verified</span>';
        } else {
            emailStatus.innerHTML = `
                <span class="text-warning">⚠ Email not verified</span>
                <button class="btn btn-link p-0 ms-2" id="resendVerificationBtn">Resend verification</button>
            `;
            document.getElementById('resendVerificationBtn')?.addEventListener('click', async () => {
                try {
                    await sendEmailVerification(user);
                    showNotification('Verification Email Sent', 'Please check your inbox for the verification link.', 'success');
                } catch (error) {
                    showNotification('Error', 'Error sending verification email: ' + error.message, 'error');
                }
            });
        }
    }

    // Load and set username
    try {
        const snapshot = await get(ref(db, `users/${user.uid}`));
        const profile = snapshot.val();
        if (profile?.username) {
            document.getElementById('profileUsername').value = profile.username;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadUserPurchases(uid) {
    const purchasesDiv = document.getElementById('purchasesList');
    if (!purchasesDiv) return;

    try {
        const snapshot = await get(ref(db, `users/${uid}/purchases`));
        const purchases = snapshot.val();
        
        if (!purchases) {
            purchasesDiv.innerHTML = '<p class="text-muted">No purchases yet.</p>';
            return;
        }

        const purchasesHtml = Object.entries(purchases).map(([id, purchase]) => `
            <div class="card mb-2">
                <div class="card-body">
                    <h6 class="card-title">${purchase.productName}</h6>
                    <p class="card-text">
                        <small class="text-muted">
                            Purchased on ${new Date(purchase.timestamp).toLocaleDateString()}
                            for ${purchase.amount}
                        </small>
                    </p>
                </div>
            </div>
        `).join('');

        purchasesDiv.innerHTML = purchasesHtml;
    } catch (error) {
        console.error('Error loading purchases:', error);
        purchasesDiv.innerHTML = '<p class="text-danger">Error loading purchases.</p>';
    }
}

async function loadUserComments(uid) {
    const commentsDiv = document.getElementById('commentsList');
    if (!commentsDiv) return;

    try {
        const snapshot = await get(ref(db, `users/${uid}/comments`));
        const comments = snapshot.val();
        
        if (!comments) {
            commentsDiv.innerHTML = '<p class="text-muted">No comments yet.</p>';
            return;
        }

        const commentsHtml = Object.entries(comments).map(([id, comment]) => `
            <div class="card mb-2">
                <div class="card-body">
                    <p class="card-text">${comment.text}</p>
                    <p class="card-text">
                        <small class="text-muted">
                            Posted on ${new Date(comment.timestamp).toLocaleDateString()}
                            for ${comment.productName}
                        </small>
                    </p>
                </div>
            </div>
        `).join('');

        commentsDiv.innerHTML = commentsHtml;
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsDiv.innerHTML = '<p class="text-danger">Error loading comments.</p>';
    }
}

function setupProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) return;

        const username = document.getElementById('profileUsername').value.trim();
        
        try {
            await update(ref(db, `users/${user.uid}`), {
                username
            });
            showNotification('Success', 'Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Error', 'Error updating profile: ' + error.message, 'error');
        }
    });
}

function setupPasswordForm() {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) return;

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmPassword) {
            showNotification('Password Mismatch', 'New passwords do not match!', 'warning');
            return;
        }

        try {
            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            
            // Change password
            await updatePassword(user, newPassword);
            
            showNotification('Success', 'Password updated successfully!', 'success');
            form.reset();
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('Error', 'Error changing password: ' + error.message, 'error');
        }
    });
}