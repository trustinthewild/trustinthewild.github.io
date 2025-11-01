// Function to inject auth modals into any page
export function injectAuthModals() {
    const modalsHtml = `
    <!-- Sign In Modal -->
    <div class="modal fade" id="signInModal" tabindex="-1" aria-labelledby="signInModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="signInModalLabel">Sign In</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="signInForm">
                        <div class="mb-3">
                            <label for="signInEmail" class="form-label">Email address</label>
                            <input type="email" class="form-control" id="signInEmail" required>
                        </div>
                        <div class="mb-3">
                            <label for="signInPassword" class="form-label">Password</label>
                            <input type="password" class="form-control" id="signInPassword" required>
                        </div>
                        <div class="mb-3 d-flex justify-content-between align-items-center">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="rememberMe">
                                <label class="form-check-label" for="rememberMe">Remember me</label>
                            </div>
                            <button type="button" class="btn btn-link p-0" id="forgotPasswordBtn">Forgot password?</button>
                        </div>
                        <div class="alert alert-danger d-none" id="signInError"></div>
                        <button type="submit" class="btn btn-primary w-100">Sign In</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Sign Up Modal -->
    <div class="modal fade" id="signUpModal" tabindex="-1" aria-labelledby="signUpModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="signUpModalLabel">Create Account</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="signUpForm">
                        <div class="mb-3">
                            <label for="signUpUsername" class="form-label">Username</label>
                            <input type="text" class="form-control" id="signUpUsername" required>
                        </div>
                        <div class="mb-3">
                            <label for="signUpEmail" class="form-label">Email address</label>
                            <input type="email" class="form-control" id="signUpEmail" required>
                            <div class="form-text">We'll send you a verification link to this email.</div>
                        </div>
                        <div class="mb-3">
                            <label for="signUpPassword" class="form-label">Password</label>
                            <input type="password" class="form-control" id="signUpPassword" required>
                            <div class="form-text">Password must be at least 8 characters long.</div>
                        </div>
                        <div class="mb-3">
                            <label for="signUpPasswordConfirm" class="form-label">Confirm Password</label>
                            <input type="password" class="form-control" id="signUpPasswordConfirm" required>
                        </div>
                        <div class="alert alert-danger d-none" id="signUpError"></div>
                        <button type="submit" class="btn btn-primary w-100">Create Account</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Forgot Password Modal -->
    <div class="modal fade" id="forgotPasswordModal" tabindex="-1" aria-labelledby="forgotPasswordModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="forgotPasswordModalLabel">Reset Password</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="forgotPasswordForm">
                        <div class="mb-3">
                            <label for="resetEmail" class="form-label">Email address</label>
                            <input type="email" class="form-control" id="resetEmail" required>
                            <div class="form-text">We'll send you a password reset link.</div>
                        </div>
                        <div class="alert alert-danger d-none" id="forgotPasswordError"></div>
                        <div class="alert alert-success d-none" id="forgotPasswordSuccess"></div>
                        <button type="submit" class="btn btn-primary w-100">Send Reset Link</button>
                    </form>
                </div>
            </div>
        </div>
    </div>`;

    // Create a container for the modals
    const modalsContainer = document.createElement('div');
    modalsContainer.innerHTML = modalsHtml;
    document.body.appendChild(modalsContainer);
}

// Function to initialize auth UI on any page
export function initAuthUI() {
    // Inject auth modals
    injectAuthModals();
    
    // Initialize auth functionality
    import('./auth.js').then(({ initAuth }) => {
        initAuth();
    }).catch(err => {
        console.error('Error initializing auth:', err);
    });
}