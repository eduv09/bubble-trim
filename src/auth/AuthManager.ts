import { AuthProvider, AuthResult } from './AuthProvider.js';
import { PlayerIdentity } from '../game/PlayerIdentity.js';

/**
 * AuthManager - Manages the authentication flow
 * Acts as a facade for the authentication system
 */
export class AuthManager {
    private authProvider: AuthProvider;
    private isAuthenticated: boolean = false;
    private currentUser: string | null = null;
    private isGuest: boolean = false;
    private authToken: string | null = null;

    constructor(authProvider: AuthProvider) {
        this.authProvider = authProvider;
    }

    /**
     * Sets a new authentication provider
     * @param provider - The new AuthProvider to use
     */
    setAuthProvider(provider: AuthProvider): void {
        this.authProvider = provider;
    }

    /**
     * Attempts to log in with the provided credentials
     * @param credentials - The credentials to authenticate with
     * @returns Promise resolving to an AuthResult
     */
    async login(credentials: any): Promise<AuthResult> {
        const result = await this.authProvider.authenticate(credentials);

        if (result.success) {
            this.isAuthenticated = true;
            this.currentUser = result.userId;
            this.isGuest = result.isGuest;
            this.authToken = result.authToken || null;
            PlayerIdentity.setUserId(result.userId);
        }

        return result;
    }

    /**
     * Continues as a guest user
     * @returns Promise resolving to an AuthResult
     */
    async continueAsGuest(): Promise<AuthResult> {
        const result = await this.authProvider.authenticateAsGuest();

        if (result.success) {
            this.isAuthenticated = true;
            this.currentUser = result.userId;
            this.isGuest = true;
            this.authToken = result.authToken || null;
            PlayerIdentity.setUserId(result.userId);
        }

        return result;
    }

    /**
     * Logs out the current user
     */
    async logout(): Promise<void> {
        await this.authProvider.logout();
        this.isAuthenticated = false;
        this.currentUser = null;
        this.isGuest = false;
        this.authToken = null;
        PlayerIdentity.clearUserId();
    }

    /**
     * Checks if a user is currently authenticated
     * @returns true if authenticated, false otherwise
     */
    getIsAuthenticated(): boolean {
        return this.isAuthenticated;
    }

    /**
     * Gets the current user's ID
     * @returns The user ID or null if not authenticated
     */
    getCurrentUser(): string | null {
        return this.currentUser;
    }

    /**
     * Checks if the current user is a guest
     * @returns true if guest, false otherwise
     */
    getIsGuest(): boolean {
        return this.isGuest;
    }

    /**
     * Gets the current user's authentication token
     * @returns The auth token or null if not authenticated
     */
    getAuthToken(): string | null {
        return this.authToken;
    }
}
