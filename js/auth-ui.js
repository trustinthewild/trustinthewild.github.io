import { signUp, signIn, logOut, getCurrentUser } from './auth.js';

// Create and append auth modal to body
function createAuthModal() {
    const modalHTML = `
    <div class="modal fade" id="authModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Sign In / Sign Up</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="nav-item">
                            <a class="nav-link active" data-bs-toggle="tab" href="#signin">Sign In</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-bs-toggle="tab" href="#signup">Sign Up</a>
                        </li>
                    </ul>
                    <div class="tab-content mt-3">
                        <div class="tab-pane active" id="signin">
                            <form id="signinForm">
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Password</label>
                                    <input type="password" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-primary">Sign In</button>
                            </form>
                        </div>
                        <div class="tab-pane" id="signup">
                            <form id="signupForm">
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Password</label>
                                    <input type="password" class="form-control" required minlength="6">
                                </div>
                                <button type="submit" class="btn btn-primary">Sign Up</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Update navigation based on auth state
function updateNavAuth() {
    const user = getCurrentUser();
    const navAuth = document.querySelector('#navAuth');
    
    if (!navAuth) return;
    
    if (user) {
        navAuth.innerHTML = `
            <span class="navbar-text me-3">
                ${user.email}
            </span>
            <button class="btn btn-outline-light" id="logoutBtn">Sign Out</button>
        `;
        
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await logOut();
            window.location.reload();
        });
    } else {
        navAuth.innerHTML = `
            <button class="btn btn-outline-light" data-bs-toggle="modal" data-bs-target="#authModal">
                Sign In / Sign Up
            </button>
        `;
    }
}

// Initialize authentication UI
export function initAuthUI() {
    createAuthModal();
    
    // Add auth section to navbar
    const navbarNav = document.querySelector('#navbarNav');
    if (navbarNav) {
        navbarNav.insertAdjacentHTML('beforeend', '<div id="navAuth" class="d-flex align-items-center ms-3"></div>');
    }
    
    // Wire up form handlers
    document.getElementById('signinForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        
        try {
            const { user, error } = await signIn(email, password);
            if (user) {
                bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
                window.location.reload();
            } else {
                alert(error || 'Sign in failed. Please try again.');
            }
        } catch (err) {
            alert('Sign in failed. Please try again.');
        }
    });

    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        
        try {
            const { user, error } = await signUp(email, password);
            if (user) {
                bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
                window.location.reload();
            } else {
                alert(error || 'Sign up failed. Please try again.');
            }
        } catch (err) {
            alert('Sign up failed. Please try again.');
        }
    });

    // Listen for auth state changes
    window.addEventListener('authStateChanged', updateNavAuth);
    
    // Initial UI update
    updateNavAuth();
}