/**
 * AuthResult - Result of an authentication attempt
 */
export interface AuthResult {
    success: boolean;
    userId: string;
    isGuest: boolean;
    authToken?: string;  // Firebase authentication token for database access
    error?: string;
}

/**
 * AuthProvider - Abstract base class for authentication providers
 * This allows for different authentication methods (simple username, OAuth, etc.)
 */
export abstract class AuthProvider {
    /**
     * Authenticates a user with the provided credentials
     * @param credentials - The credentials to authenticate with
     * @returns Promise resolving to an AuthResult
     */
    abstract authenticate(credentials: any): Promise<AuthResult>;

    /**
     * Authenticates as a guest user
     * @returns Promise resolving to an AuthResult with a guest user
     */
    abstract authenticateAsGuest(): Promise<AuthResult>;

    /**
     * Validates credentials before attempting authentication
     * @param credentials - The credentials to validate
     * @returns true if valid, false otherwise
     */
    abstract validateCredentials(credentials: any): boolean;

    /**
     * Logs out the current user
     * @returns Promise resolving when logout is complete
     */
    async logout(): Promise<void> {
        // Default implementation - can be overridden
        return Promise.resolve();
    }
}
