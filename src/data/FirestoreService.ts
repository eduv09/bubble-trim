import { db } from '../firebase.js';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { IGameData } from '../game/game-data/GameData.js';

/**
 * FirestoreService - Handles all Firestore operations
 */
export class FirestoreService {
    private collectionName = 'games';

    /**
     * Loads all game data for a specific player from Firestore
     * @param playerName - The player's username
     * @returns Promise with array of game data
     */
    async loadPlayerGameData(playerName: string): Promise<IGameData[]> {
        try {
            const gamesCollection = collection(db, this.collectionName);
            const q = query(gamesCollection, where('playerName', '==', playerName));
            const querySnapshot = await getDocs(q);

            const gameData: IGameData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                gameData.push({
                    playerName: data.playerName,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    hintsUsed: data.hintsUsed,
                    successfulIntersections: data.successfulIntersections,
                    gameDifficulty: data.gameDifficulty,
                    boardName: data.boardName,
                });
            });

            console.log(`Loaded ${gameData.length} games for player: ${playerName}`);
            return gameData;
        } catch (error) {
            console.error('Error loading game data from Firestore:', error);
            throw error;
        }
    }

    /**
     * Saves a game data entry to Firestore
     * @param gameData - The game data to save
     * @returns Promise that resolves when save is complete
     */
    async saveGameData(gameData: IGameData): Promise<void> {
        try {
            const gamesCollection = collection(db, this.collectionName);
            await addDoc(gamesCollection, {
                playerName: gameData.playerName,
                startTime: gameData.startTime,
                endTime: gameData.endTime,
                hintsUsed: gameData.hintsUsed,
                successfulIntersections: gameData.successfulIntersections,
                gameDifficulty: gameData.gameDifficulty,
                boardName: gameData.boardName,
                timestamp: Timestamp.now(), // Add server timestamp
            });

            console.log(`Saved game data for ${gameData.playerName} - ${gameData.boardName}`);
        } catch (error) {
            console.error('Error saving game data to Firestore:', error);
            throw error;
        }
    }

    /**
     * Checks if the user is online
     * @returns true if online, false if offline
     */
    isOnline(): boolean {
        return navigator.onLine;
    }
}
