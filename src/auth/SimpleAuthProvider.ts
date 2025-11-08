import { AuthProvider, AuthResult } from './AuthProvider.js';

/**
 * SimpleAuthProvider - Basic authentication using just a username
 * No password required, suitable for casual games
 */
export class SimpleAuthProvider extends AuthProvider {
    private minUsernameLength: number = 5;
    private maxUsernameLength: number = 20;

    constructor(minLength: number = 5, maxLength: number = 20) {
        super();
        this.minUsernameLength = minLength;
        this.maxUsernameLength = maxLength;
    }

    /**
     * Authenticates a user with a username
     * @param credentials - Object with username property
     * @returns Promise resolving to an AuthResult
     */
    async authenticate(credentials: { username: string }): Promise<AuthResult> {
        if (!this.validateCredentials(credentials)) {
            return {
                success: false,
                userId: '',
                isGuest: false,
                error: `Username must be between ${this.minUsernameLength} and ${this.maxUsernameLength} characters`,
            };
        }

        // Sanitize username (remove special characters, trim)
        const sanitizedUsername = credentials.username.trim().replace(/[^a-zA-Z0-9_-]/g, '');

        return {
            success: true,
            userId: sanitizedUsername,
            isGuest: false,
        };
    }

    /**
     * Authenticates as a guest user with a random name
     * @returns Promise resolving to an AuthResult with a guest user
     */
    async authenticateAsGuest(): Promise<AuthResult> {
        const randomNum = Math.floor(Math.random() * 10000);
        const guestName = `Guest${randomNum}`;

        return {
            success: true,
            userId: guestName,
            isGuest: true,
        };
    }

    /**
     * Validates username credentials
     * @param credentials - Object with username property
     * @returns true if valid, false otherwise
     */
    validateCredentials(credentials: { username: string }): boolean {
        if (!credentials || !credentials.username) {
            return false;
        }

        const username = credentials.username.trim();
        return username.length >= this.minUsernameLength &&
               username.length <= this.maxUsernameLength;
    }
}
