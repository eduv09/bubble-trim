import { AuthProvider, AuthResult } from './AuthProvider.js';
import { auth } from '../firebase.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    signOut,
    User
} from 'firebase/auth';

/**
 * FirebaseAuthProvider - Authentication using Firebase Auth
 * Supports email/password authentication and anonymous sign-in
 */
export class FirebaseAuthProvider extends AuthProvider {
    private currentUser: User | null = null;

    /**
     * Converts username to email format
     * @param username - The username to convert
     * @returns Email in format username@bubbletrim.com
     */
    private usernameToEmail(username: string): string {
        return `${username.toLowerCase()}@bubbletrim.com`;
    }

    /**
     * Authenticates a user with username and password
     * @param credentials - Object with username, password, and isLogin properties
     * @returns Promise resolving to an AuthResult
     */
    async authenticate(credentials: { username: string; password: string; isLogin: boolean }): Promise<AuthResult> {
        if (!this.validateCredentials(credentials)) {
            return {
                success: false,
                userId: '',
                isGuest: false,
                error: 'Username and password are required',
            };
        }

        const email = this.usernameToEmail(credentials.username);

        try {
            let userCredential;

            if (credentials.isLogin) {
                // Login mode - only sign in
                userCredential = await signInWithEmailAndPassword(
                    auth,
                    email,
                    credentials.password
                );
            } else {
                // Register mode - create new account
                try {
                    userCredential = await createUserWithEmailAndPassword(
                        auth,
                        email,
                        credentials.password
                    );
                } catch (registerError: any) {
                    if (registerError.code === 'auth/email-already-in-use') {
                        return {
                            success: false,
                            userId: '',
                            isGuest: false,
                            error: 'Username already taken',
                        };
                    }
                    throw registerError;
                }
            }

            this.currentUser = userCredential.user;
            const token = await userCredential.user.getIdToken();

            return {
                success: true,
                userId: credentials.username, // Return the username, not the Firebase UID
                isGuest: false,
                authToken: token,
            };
        } catch (error: any) {
            console.error('Firebase authentication error:', error);
            return {
                success: false,
                userId: '',
                isGuest: false,
                error: this.formatFirebaseError(error),
            };
        }
    }

    /**
     * Authenticates as an anonymous guest user
     * @returns Promise resolving to an AuthResult with a guest user
     */
    async authenticateAsGuest(): Promise<AuthResult> {
        try {
            const userCredential = await signInAnonymously(auth);
            this.currentUser = userCredential.user;
            const token = await userCredential.user.getIdToken();

            return {
                success: true,
                userId: userCredential.user.uid,
                isGuest: true,
                authToken: token,
            };
        } catch (error: any) {
            console.error('Firebase anonymous authentication error:', error);
            return {
                success: false,
                userId: '',
                isGuest: true,
                error: this.formatFirebaseError(error),
            };
        }
    }

    /**
     * Validates username and password credentials
     * @param credentials - Object with username and password properties
     * @returns true if valid, false otherwise
     */
    validateCredentials(credentials: { username: string; password: string }): boolean {
        if (!credentials || !credentials.username || !credentials.password) {
            return false;
        }

        const username = credentials.username.trim();
        const password = credentials.password;

        // Username validation: only alphanumeric, dots, underscores, and hyphens
        // Must be 3-20 characters
        const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return false;
        }

        // Password must be at least 6 characters (Firebase requirement)
        if (password.length < 6) {
            return false;
        }

        return true;
    }

    /**
     * Logs out the current user
     * @returns Promise resolving when logout is complete
     */
    async logout(): Promise<void> {
        try {
            await signOut(auth);
            this.currentUser = null;
        } catch (error) {
            console.error('Firebase logout error:', error);
        }
    }

    /**
     * Formats Firebase error messages for user display
     * @param error - The Firebase error
     * @returns A user-friendly error message
     */
    private formatFirebaseError(error: any): string {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Invalid username format';
            case 'auth/user-disabled':
                return 'This account has been disabled';
            case 'auth/user-not-found':
                return 'Username not found';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/invalid-credential':
                return 'Invalid username or password';
            case 'auth/email-already-in-use':
                return 'Username already taken';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later';
            default:
                return error.message || 'Authentication failed';
        }
    }

    /**
     * Gets the current authenticated user
     * @returns The current Firebase user or null
     */
    getCurrentFirebaseUser(): User | null {
        return this.currentUser;
    }

    /**
     * Gets a fresh authentication token for the current user
     * @returns Promise resolving to the auth token or null
     */
    async getAuthToken(): Promise<string | null> {
        if (!this.currentUser) {
            return null;
        }

        try {
            return await this.currentUser.getIdToken(true);
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }
}
