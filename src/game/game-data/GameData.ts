import { Board } from "../Board";
import { IGameStats } from "../StatsCollector";

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

    constructor(playerName: string) {
        this.playerName = playerName;
        this.gameData = new Map<string, IGameData[]>();
        this.loadData();
    }

    private async loadData(): Promise<void> {
        // Queue the operation to ensure thread-safety
        this.dataLock = this.dataLock.then(async () => {
            // Load data implementation here
            // Nothing for now
        });
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
        // Nothing will set data to DB remotely later
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
