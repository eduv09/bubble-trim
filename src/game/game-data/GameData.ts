import { Board } from "../Board";
import { IGameStats } from "../StatsCollector";
import { FirestoreService } from "../../data/FirestoreService.js";

export interface IGameData {
    playerName: string;
    startTime: number;
    endTime: number | undefined;
    hintsUsed: number;
    successfulIntersections: number;
    gameDifficulty: number; // max intersections until another metric
    boardName: string; // Before Id is created
}


export class GameDataManager {
    playerName: string;
    private gameData: Map<string, IGameData[]>; // Keyed by boardName
    private dataLock: Promise<void> = Promise.resolve();
    private firestoreService: FirestoreService;
    private onDataLoadedCallback?: () => void;
    private onUploadFailedCallback?: (message: string) => void;

    constructor(playerName: string, firestoreService: FirestoreService) {
        this.playerName = playerName;
        this.gameData = new Map<string, IGameData[]>();
        this.firestoreService = firestoreService;
    }

    /**
     * Loads all game data from Firestore
     * @returns Promise that resolves when data is loaded
     */
    async loadData(): Promise<void> {
        // Queue the operation to ensure thread-safety
        this.dataLock = this.dataLock.then(async () => {
            try {
                const allGameData = await this.firestoreService.loadPlayerGameData(this.playerName);

                // Organize data by board name
                allGameData.forEach((data) => {
                    const boardName = data.boardName;
                    if (!this.gameData.has(boardName)) {
                        this.gameData.set(boardName, []);
                    }
                    this.gameData.get(boardName)?.push(data);
                });

                console.log(`Loaded ${allGameData.length} total games for ${this.playerName}`);

                // Notify that data is loaded
                if (this.onDataLoadedCallback) {
                    this.onDataLoadedCallback();
                }
            } catch (error) {
                console.error('Failed to load game data:', error);
                // Continue with empty data if load fails
                if (this.onDataLoadedCallback) {
                    this.onDataLoadedCallback();
                }
            }
        });

        return this.dataLock;
    }

    /**
     * Sets callback to be called when data is loaded
     */
    setOnDataLoadedCallback(callback: () => void): void {
        this.onDataLoadedCallback = callback;
    }

    /**
     * Sets callback to be called when upload fails
     */
    setOnUploadFailedCallback(callback: (message: string) => void): void {
        this.onUploadFailedCallback = callback;
    }

    addGameData(data: IGameStats, board: Board): void {
        // Queue the operation to ensure thread-safety
        this.dataLock = this.dataLock.then(async () => {
            const boardName = data.boardName || 'Unknown Board';
            const gameDataEntry: IGameData = {
                playerName: data.playerName,
                startTime: data.startTime,
                endTime: data.endTime,
                hintsUsed: data.hintsUsed,
                successfulIntersections: data.successfulIntersections,
                gameDifficulty: board.totalCuts, // Placeholder, calculate as needed
                boardName: boardName,
            };
            if (!this.gameData.has(boardName)) {
                this.gameData.set(boardName, []);
            }
            this.gameData.get(boardName)?.push(gameDataEntry);
            await this.saveData(gameDataEntry);
        });
    }

    private async saveData(data: IGameData): Promise<void> {
        try {
            // Check if online before attempting to save
            if (!this.firestoreService.isOnline()) {
                console.warn('User is offline, skipping data upload');
                if (this.onUploadFailedCallback) {
                    this.onUploadFailedCallback('You are offline. Game data was not uploaded.');
                }
                return;
            }

            await this.firestoreService.saveGameData(data);
            console.log('Game data uploaded successfully');
        } catch (error) {
            console.error('Failed to upload game data:', error);
            if (this.onUploadFailedCallback) {
                this.onUploadFailedCallback('Failed to upload game data. You may be offline.');
            }
        }
    }

    getGameDataForBoard(boardName: string): IGameData[] {
        // Create a defensive copy to ensure thread-safety
        const data = this.gameData.get(boardName);
        return data ? [...data] : [];
    }

    getAllGameData(): Map<string, IGameData[]> {
        // Create a defensive copy to ensure thread-safety
        const copy = new Map<string, IGameData[]>();
        this.gameData.forEach((value, key) => {
            copy.set(key, [...value]);
        });
        return copy;
    }

    getWonGamesForBoard(boardName: string): IGameData[] {
        const allData = this.getGameDataForBoard(boardName);
        return allData.filter( (data) => data.successfulIntersections >= data.gameDifficulty );
    }

    getLostGamesForBoard(boardName: string): IGameData[] {
        const allData = this.getGameDataForBoard(boardName);
        return allData.filter( (data) => data.successfulIntersections < data.gameDifficulty );
    }


}
