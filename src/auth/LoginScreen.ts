import { AuthManager } from './AuthManager.js';

/**
 * LoginScreen - Manages the login UI and user interactions
 */
export class LoginScreen {
    private authManager: AuthManager;
    private onLoginSuccess: () => void;
    private loginPanel: HTMLElement | null = null;

    constructor(authManager: AuthManager, onLoginSuccess: () => void) {
        this.authManager = authManager;
        this.onLoginSuccess = onLoginSuccess;
    }

    /**
     * Shows the login screen
     */
    show(): void {
        this.createLoginPanel();
        this.loginPanel!.style.display = 'flex';
    }

    /**
     * Hides the login screen
     */
    hide(): void {
        if (this.loginPanel) {
            this.loginPanel.style.display = 'none';
        }
    }

    /**
     * Creates the login panel HTML structure
     */
    private createLoginPanel(): void {
        // Check if panel already exists
        let panel = document.getElementById('login-panel');

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'login-panel';
            panel.className = 'login-panel';

            panel.innerHTML = `
                <div class="login-container">
                    <h1 class="login-title">Bubble Trim</h1>
                    <p class="login-subtitle">Cut the overlapping circles!</p>

                    <!-- Login Form -->
                    <div class="login-form" id="login-form">
                        <input
                            type="text"
                            id="login-username-input"
                            class="username-input"
                            placeholder="Enter your username"
                            autocomplete="username"
                        />
                        <input
                            type="password"
                            id="login-password-input"
                            class="username-input"
                            placeholder="Enter your password"
                            autocomplete="current-password"
                        />
                        <div class="error-message" id="login-error"></div>

                        <button id="login-button" class="btn btn-primary">
                            Login
                        </button>

                        <div class="login-switch">
                            Don't have an account? <a href="#" id="show-register">Register</a>
                        </div>

                        <div class="divider">
                            <span>OR</span>
                        </div>

                        <button id="guest-button" class="btn btn-secondary">
                            Continue as Guest
                        </button>
                    </div>

                    <!-- Register Form -->
                    <div class="login-form" id="register-form" style="display: none;">
                        <input
                            type="text"
                            id="register-username-input"
                            class="username-input"
                            placeholder="Choose a username"
                            autocomplete="off"
                        />
                        <input
                            type="password"
                            id="register-password-input"
                            class="username-input"
                            placeholder="Choose a password (min 6 characters)"
                            autocomplete="new-password"
                        />
                        <input
                            type="password"
                            id="register-confirm-password-input"
                            class="username-input"
                            placeholder="Confirm password"
                            autocomplete="new-password"
                        />
                        <div class="error-message" id="register-error"></div>

                        <button id="register-button" class="btn btn-primary">
                            Register
                        </button>

                        <div class="login-switch">
                            Already have an account? <a href="#" id="show-login">Login</a>
                        </div>

                        <div class="divider">
                            <span>OR</span>
                        </div>

                        <button id="guest-button-register" class="btn btn-secondary">
                            Continue as Guest
                        </button>
                    </div>

                    <div class="login-info">
                        Your progress will be tracked for statistics
                    </div>
                </div>
            `;

            document.body.appendChild(panel);
        }

        this.loginPanel = panel;
        this.setupEventListeners();
    }

    /**
     * Sets up event listeners for login interactions
     */
    private setupEventListeners(): void {
        // Get form elements
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegisterLink = document.getElementById('show-register');
        const showLoginLink = document.getElementById('show-login');

        // Toggle between login and register forms
        showRegisterLink?.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm!.style.display = 'none';
            registerForm!.style.display = 'block';
            this.clearErrors();
        });

        showLoginLink?.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm!.style.display = 'none';
            loginForm!.style.display = 'block';
            this.clearErrors();
        });

        // Setup login form
        this.setupLoginForm();

        // Setup register form
        this.setupRegisterForm();

        // Guest buttons
        const guestButton = document.getElementById('guest-button');
        const guestButtonRegister = document.getElementById('guest-button-register');

        guestButton?.addEventListener('click', async () => {
            await this.handleGuestLogin();
        });

        guestButtonRegister?.addEventListener('click', async () => {
            await this.handleGuestLogin();
        });
    }

    /**
     * Sets up login form event listeners
     */
    private setupLoginForm(): void {
        const loginButton = document.getElementById('login-button');
        const usernameInput = document.getElementById('login-username-input') as HTMLInputElement;
        const passwordInput = document.getElementById('login-password-input') as HTMLInputElement;
        const errorMessage = document.getElementById('login-error');

        // Login button click
        loginButton?.addEventListener('click', async () => {
            const username = usernameInput?.value || '';
            const password = passwordInput?.value || '';
            await this.handleLogin(username, password, errorMessage);
        });

        // Enter key in password input
        passwordInput?.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const username = usernameInput?.value || '';
                const password = passwordInput.value;
                await this.handleLogin(username, password, errorMessage);
            }
        });

        // Clear error on input
        usernameInput?.addEventListener('input', () => this.clearError('login-error'));
        passwordInput?.addEventListener('input', () => this.clearError('login-error'));
    }

    /**
     * Sets up register form event listeners
     */
    private setupRegisterForm(): void {
        const registerButton = document.getElementById('register-button');
        const usernameInput = document.getElementById('register-username-input') as HTMLInputElement;
        const passwordInput = document.getElementById('register-password-input') as HTMLInputElement;
        const confirmPasswordInput = document.getElementById('register-confirm-password-input') as HTMLInputElement;
        const errorMessage = document.getElementById('register-error');

        // Register button click
        registerButton?.addEventListener('click', async () => {
            const username = usernameInput?.value || '';
            const password = passwordInput?.value || '';
            const confirmPassword = confirmPasswordInput?.value || '';
            await this.handleRegister(username, password, confirmPassword, errorMessage);
        });

        // Enter key in confirm password input
        confirmPasswordInput?.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const username = usernameInput?.value || '';
                const password = passwordInput?.value || '';
                const confirmPassword = confirmPasswordInput.value;
                await this.handleRegister(username, password, confirmPassword, errorMessage);
            }
        });

        // Clear error on input
        usernameInput?.addEventListener('input', () => this.clearError('register-error'));
        passwordInput?.addEventListener('input', () => this.clearError('register-error'));
        confirmPasswordInput?.addEventListener('input', () => this.clearError('register-error'));
    }

    /**
     * Clears error message for a specific element
     */
    private clearError(errorId: string): void {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    /**
     * Clears all error messages
     */
    private clearErrors(): void {
        this.clearError('login-error');
        this.clearError('register-error');
    }

    /**
     * Handles login attempt with username and password
     */
    private async handleLogin(username: string, password: string, errorElement: HTMLElement | null): Promise<void> {
        const result = await this.authManager.login({ username, password, isLogin: true });

        if (result.success) {
            console.log(`Logged in as: ${result.userId}`);
            this.hide();
            this.onLoginSuccess();
        } else {
            // Show error message
            if (errorElement) {
                errorElement.textContent = result.error || 'Login failed';
                errorElement.style.display = 'block';
            }
        }
    }

    /**
     * Handles registration attempt with username and password
     */
    private async handleRegister(username: string, password: string, confirmPassword: string, errorElement: HTMLElement | null): Promise<void> {
        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
        if (!username || !usernameRegex.test(username.trim())) {
            if (errorElement) {
                errorElement.textContent = 'Username must be 3-20 characters and contain only letters, numbers, dots, underscores, or hyphens';
                errorElement.style.display = 'block';
            }
            return;
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            if (errorElement) {
                errorElement.textContent = 'Passwords do not match';
                errorElement.style.display = 'block';
            }
            return;
        }

        // Validate password length
        if (password.length < 6) {
            if (errorElement) {
                errorElement.textContent = 'Password must be at least 6 characters';
                errorElement.style.display = 'block';
            }
            return;
        }

        const result = await this.authManager.login({ username, password, isLogin: false });

        if (result.success) {
            console.log(`Registered and logged in as: ${result.userId}`);
            this.hide();
            this.onLoginSuccess();
        } else {
            // Show error message
            if (errorElement) {
                errorElement.textContent = result.error || 'Registration failed';
                errorElement.style.display = 'block';
            }
        }
    }

    /**
     * Handles guest login
     */
    private async handleGuestLogin(): Promise<void> {
        const result = await this.authManager.continueAsGuest();

        if (result.success) {
            console.log(`Continuing as guest: ${result.userId}`);
            this.hide();
            this.onLoginSuccess();
        }
    }

    /**
     * Removes the login panel from the DOM
     */
    destroy(): void {
        if (this.loginPanel && this.loginPanel.parentNode) {
            this.loginPanel.parentNode.removeChild(this.loginPanel);
            this.loginPanel = null;
        }
    }
}
