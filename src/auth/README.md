# Authentication Module

A modular authentication system for the Bubble Trim game.

## Architecture

The authentication system is designed with extensibility in mind, using the Strategy pattern to allow different authentication methods.

### Core Components

1. **AuthProvider** (Abstract)
   - Base class for all authentication providers
   - Defines the contract for authentication methods
   - Methods: `authenticate()`, `authenticateAsGuest()`, `validateCredentials()`, `logout()`

2. **FirebaseAuthProvider** (Concrete) ⭐ **CURRENT**
   - Firebase Authentication integration
   - Email/password authentication with auto-registration
   - Anonymous authentication for guest users
   - Provides Firebase auth tokens for database access
   - Comprehensive error handling with user-friendly messages

3. **SimpleAuthProvider** (Concrete)
   - Basic username-only authentication
   - No password required
   - Validates username length (5-20 characters)
   - Sanitizes usernames (removes special characters)

4. **AuthManager**
   - Facade for the authentication system
   - Manages authentication state
   - Stores Firebase auth tokens for database operations
   - Coordinates between AuthProvider and PlayerIdentity
   - Can switch between different providers

5. **LoginScreen**
   - UI component for login interface
   - Handles user interactions
   - Shows login form with email and password inputs
   - Provides "Continue as Guest" option (anonymous auth)

## Current Implementation

The system now uses **Firebase Authentication** via `FirebaseAuthProvider`:

```typescript
const authProvider = new FirebaseAuthProvider();
const authManager = new AuthManager(authProvider);
const loginScreen = new LoginScreen(authManager, onLoginSuccess);
loginScreen.show();
```

### Firebase Authentication Features

- **Email/Password Login**: Users can register and log in with email/password
- **Auto-Registration**: If user doesn't exist, automatically creates new account
- **Anonymous Authentication**: Guest users get Firebase anonymous auth
- **Auth Tokens**: Each login provides a Firebase ID token for database access
- **Token Management**: Tokens are stored in `AuthManager` and available via `getAuthToken()`

### Accessing Auth Tokens

```typescript
// Get the current user's auth token for database operations
const token = authManager.getAuthToken();

// Use token for authenticated database writes
if (token) {
    // Include token in database requests
    await saveUserData(userId, data, token);
}
```

## Extending the System

### Creating a Custom Auth Provider

To add a new authentication method (e.g., OAuth, email/password), create a new class that extends `AuthProvider`:

```typescript
import { AuthProvider, AuthResult } from './AuthProvider.js';

export class EmailPasswordAuthProvider extends AuthProvider {
    async authenticate(credentials: { email: string; password: string }): Promise<AuthResult> {
        // Implement your authentication logic
        // e.g., call an API endpoint
        const response = await fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                userId: data.userId,
                isGuest: false
            };
        }

        return {
            success: false,
            userId: '',
            isGuest: false,
            error: 'Invalid credentials'
        };
    }

    async authenticateAsGuest(): Promise<AuthResult> {
        // Guest authentication logic
    }

    validateCredentials(credentials: any): boolean {
        // Validation logic
        return credentials.email && credentials.password;
    }
}
```

### Using a Custom Provider

Replace the provider in `App.ts`:

```typescript
// Instead of:
const authProvider = new SimpleAuthProvider();

// Use:
const authProvider = new EmailPasswordAuthProvider();
const authManager = new AuthManager(authProvider);
```

### Switching Providers at Runtime

You can switch authentication providers dynamically:

```typescript
authManager.setAuthProvider(new OAuthProvider());
```

### Customizing the Login UI

To customize the login screen, extend or modify `LoginScreen.ts`:

```typescript
export class CustomLoginScreen extends LoginScreen {
    private createLoginPanel(): void {
        // Custom UI implementation
    }
}
```

## Features

- ✅ Email/password authentication with Firebase
- ✅ Anonymous authentication for guest users
- ✅ Automatic user registration
- ✅ Firebase auth token management
- ✅ Input validation (email format, password length)
- ✅ Comprehensive error handling
- ✅ Modular architecture for easy extension
- ✅ Integration with PlayerIdentity system
- ✅ Beautiful gradient UI

## Future Extensions

Potential additions:
- OAuth providers (Google, GitHub, etc.)
- Session persistence (localStorage/cookies)
- Multi-factor authentication
- Social login integration
- Password recovery flow
- Email verification
