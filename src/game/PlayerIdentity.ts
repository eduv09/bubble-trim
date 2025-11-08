/**
 * PlayerIdentity - Manages player identification
 */
export class PlayerIdentity {
    private static userId: string | null = null;

    /**
     * Sets the user ID for the current player
     * @param id - The user ID to set
     */
    static setUserId(id: string): void {
        PlayerIdentity.userId = id;
    }

    /**
     * Gets the current player name
     * If no user ID is set, returns "anonymous-{randomNumber}"
     * @returns The player name
     */
    static getPlayerName(): string {
        if (PlayerIdentity.userId) {
            return PlayerIdentity.userId;
        }
        
        // Generate anonymous name with random number
        const randomNum = Math.floor(Math.random() * 10000);
        return `anonymous-${randomNum}`;
    }

    /**
     * Checks if a user ID has been set
     * @returns true if user ID is set, false otherwise
     */
    static hasUserId(): boolean {
        return PlayerIdentity.userId !== null;
    }

    /**
     * Clears the user ID
     */
    static clearUserId(): void {
        PlayerIdentity.userId = null;
    }
}
