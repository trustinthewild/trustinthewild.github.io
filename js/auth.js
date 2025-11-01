import app from './firebase-init.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js';

const auth = getAuth(app);
const db = getDatabase(app);

// Current user state
let currentUser = null;

// Show notification toast
export function showNotification(title, message, type = 'info') {
    const toastElement = document.getElementById('notificationToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toastElement?.querySelector('.toast-header');
    
    if (!toastElement || !toastTitle || !toastMessage || !toastHeader) return;
    
    // Set content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Remove previous type classes
    toastHeader.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-white');
    
    // Add type-specific styling
    if (type === 'success') {
        toastHeader.classList.add('bg-success', 'text-white');
    } else if (type === 'error') {
        toastHeader.classList.add('bg-danger', 'text-white');
    } else if (type === 'warning') {
        toastHeader.classList.add('bg-warning', 'text-white');
    } else {
        toastHeader.classList.add('bg-info', 'text-white');
    }
    
    // Show toast
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    toast.show();
}

// Initialize authentication state
export function initAuth() {
    // Update UI based on authentication state
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
            if (user) {
                // Check if email was just verified
                if (user.emailVerified) {
                    const profile = await getUserProfile(user.uid);
                    if (profile && !profile.emailVerified) {
                        // Update the profile to mark email as verified
                        await saveUserProfile(user.uid, {
                            ...profile,
                            emailVerified: true
                        });
                    }
                }
            }
            updateAuthUI(user);
        
        // Dispatch event for other parts of the app
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user } 
        }));
    });

    // Wire up form handlers
    setupAuthForms();
}

// Update UI elements based on auth state
function updateAuthUI(user) {
    try {
        const guestButtons = document.getElementById('auth-guest-buttons');
        const userButtons = document.getElementById('auth-user-buttons');
        const userDisplayName = document.getElementById('userDisplayName');

        // Only show user buttons if signed in AND email is verified
        if (user && user.emailVerified) {
            guestButtons?.classList.add('d-none');
            userButtons?.classList.remove('d-none');
            if (userDisplayName) {
                // Try to get custom username from database
                getUserProfile(user.uid).then(profile => {
                    userDisplayName.textContent = profile?.username || user.email;
                }).catch(err => console.error('Error loading profile for UI:', err));
            }
        } else {
            guestButtons?.classList.remove('d-none');
            userButtons?.classList.add('d-none');
        }
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Get user profile from database
async function getUserProfile(uid) {
    try {
        const snapshot = await get(ref(db, `users/${uid}`));
        return snapshot.val();
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

// Save user profile to database
async function saveUserProfile(uid, profile) {
    try {
        await set(ref(db, `users/${uid}`), profile);
    } catch (error) {
        console.error('Error saving user profile:', error);
        throw error;
    }
}

// Set up authentication form handlers
function setupAuthForms() {
    // Sign In Form
    const signInForm = document.getElementById('signInForm');
    signInForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
        const errorDiv = document.getElementById('signInError');
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                // Sign out immediately
                await signOut(auth);
                errorDiv.textContent = 'Please verify your email before signing in. Check your inbox for the verification link.';
                errorDiv.classList.remove('d-none');
                return;
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('signInModal'));
            modal?.hide();
            signInForm.reset();
            errorDiv.classList.add('d-none');
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    });

    // Sign Up Form
    const signUpForm = document.getElementById('signUpForm');
    signUpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
        const passwordConfirm = document.getElementById('signUpPasswordConfirm').value;
        const username = document.getElementById('signUpUsername').value;
        const errorDiv = document.getElementById('signUpError');

        if (password !== passwordConfirm) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.remove('d-none');
            return;
        }

        try {
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send verification email
            await sendEmailVerification(user);
            
            // Sign out immediately after sending verification
            await signOut(auth);
            
            // Save initial user profile
            await saveUserProfile(user.uid, {
                username,
                email,
                emailVerified: false,
                createdAt: new Date().toISOString(),
                comments: {},
                purchases: {}
            });
            
            // Close modal and show message
            const modal = bootstrap.Modal.getInstance(document.getElementById('signUpModal'));
            modal?.hide();
            signUpForm.reset();
            errorDiv.classList.add('d-none');

            // Show success notification
            showNotification(
                'Account Created!',
                'Please check your email to verify your account. You will need to verify your email before you can sign in.',
                'success'
            );
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    });

    // Forgot Password Form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    forgotPasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        const errorDiv = document.getElementById('forgotPasswordError');
        const successDiv = document.getElementById('forgotPasswordSuccess');

        try {
            await sendPasswordResetEmail(auth, email);
            errorDiv.classList.add('d-none');
            successDiv.textContent = 'Password reset link sent! Please check your email.';
            successDiv.classList.remove('d-none');
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                modal?.hide();
                forgotPasswordForm.reset();
                successDiv.classList.add('d-none');
            }, 3000);
        } catch (error) {
            successDiv.classList.add('d-none');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    });

    // Forgot Password Button
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    forgotPasswordBtn?.addEventListener('click', () => {
        const signInModal = bootstrap.Modal.getInstance(document.getElementById('signInModal'));
        signInModal?.hide();
        const forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
        forgotPasswordModal.show();
    });

    // Sign Out Button
    const signOutBtn = document.getElementById('signOutBtn');
    signOutBtn?.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });

    // User Profile Button
    const userProfileBtn = document.getElementById('userProfileBtn');
    userProfileBtn?.addEventListener('click', () => {
        window.location.href = '/profile.html';
    });
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Require authentication
export function requireAuth() {
    if (!currentUser) {
        throw new Error('Authentication required');
    }
    return currentUser;
}

// Check if user can perform restricted actions (comment/purchase)
export async function canPerformAction(actionType = 'any') {
    if (!currentUser) {
        return {
            allowed: false,
            reason: 'Please sign in to continue.'
        };
    }

    if (!currentUser.emailVerified) {
        return {
            allowed: false,
            reason: 'Please verify your email address to perform this action.',
            requiresVerification: true
        };
    }

    return { allowed: true };
}

// Save comment to Firebase
export async function saveComment(productId, comment) {
    const check = canPerformAction('comment');
    if (!check.allowed) {
        throw new Error(check.reason);
    }

    const commentData = {
        userId: currentUser.uid,
        productId,
        text: comment,
        timestamp: new Date().toISOString()
    };

    // Get product info for the comment
    const productSnapshot = await get(ref(db, `products/${productId}`));
    const productName = productSnapshot.val()?.name || 'Unknown Product';

    // Save to comments collection
    const commentRef = push(ref(db, `comments/${productId}`));
    await set(commentRef, commentData);

    // Save to user's comments
    await set(ref(db, `users/${currentUser.uid}/comments/${commentRef.key}`), {
        ...commentData,
        productName
    });

    return commentRef.key;
}

// Save purchase to Firebase
export async function savePurchase(productId, amount, details) {
    const check = canPerformAction('purchase');
    if (!check.allowed) {
        throw new Error(check.reason);
    }

    const purchaseData = {
        userId: currentUser.uid,
        productId,
        amount,
        ...details,
        timestamp: new Date().toISOString()
    };

    // Get product info for the purchase record
    const productSnapshot = await get(ref(db, `products/${productId}`));
    const productName = productSnapshot.val()?.name || 'Unknown Product';

    // Save to purchases collection
    const purchaseRef = push(ref(db, `purchases/${productId}`));
    await set(purchaseRef, purchaseData);

    // Save to user's purchases
    await set(ref(db, `users/${currentUser.uid}/purchases/${purchaseRef.key}`), {
        ...purchaseData,
        productName
    });

    return purchaseRef.key;
}

// Handle email verification prompt
export async function handleVerificationPrompt() {
    if (!currentUser) return false;
    
    const lastPromptTime = localStorage.getItem('lastVerificationPrompt');
    const now = Date.now();
    
    if (!lastPromptTime || (now - parseInt(lastPromptTime)) > 300000) { // 5 minutes
        // Show a notification asking if they want to send verification email
        showNotification(
            'Email Verification Required',
            'This action requires email verification. Click "Resend Verification" in your profile to verify your email.',
            'warning'
        );
        
        // Auto-send verification email (removing the confirm dialog)
        try {
            await sendEmailVerification(currentUser);
            localStorage.setItem('lastVerificationPrompt', now.toString());
            showNotification(
                'Verification Email Sent',
                'Please check your inbox for the verification link.',
                'success'
            );
            return true;
        } catch (error) {
            console.error('Error sending verification email:', error);
            showNotification(
                'Error',
                'Error sending verification email. Please try again later.',
                'error'
            );
        }
    }
    return false;
}

// Make the existing getUserProfile function available externally
export { getUserProfile };

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuth);