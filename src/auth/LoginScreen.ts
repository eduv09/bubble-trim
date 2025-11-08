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

                    <div class="login-form">
                        <input
                            type="text"
                            id="username-input"
                            class="username-input"
                            placeholder="Enter your username"
                            maxlength="20"
                        />
                        <div class="error-message" id="login-error"></div>

                        <button id="login-button" class="btn btn-primary">
                            Login
                        </button>

                        <div class="divider">
                            <span>OR</span>
                        </div>

                        <button id="guest-button" class="btn btn-secondary">
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
        const loginButton = document.getElementById('login-button');
        const guestButton = document.getElementById('guest-button');
        const usernameInput = document.getElementById('username-input') as HTMLInputElement;
        const errorMessage = document.getElementById('login-error');

        // Login button click
        loginButton?.addEventListener('click', async () => {
            const username = usernameInput?.value || '';
            await this.handleLogin(username, errorMessage);
        });

        // Guest button click
        guestButton?.addEventListener('click', async () => {
            await this.handleGuestLogin();
        });

        // Enter key in username input
        usernameInput?.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const username = usernameInput.value;
                await this.handleLogin(username, errorMessage);
            }
        });

        // Clear error on input
        usernameInput?.addEventListener('input', () => {
            if (errorMessage) {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }
        });
    }

    /**
     * Handles login attempt with username
     */
    private async handleLogin(username: string, errorElement: HTMLElement | null): Promise<void> {
        const result = await this.authManager.login({ username });

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
