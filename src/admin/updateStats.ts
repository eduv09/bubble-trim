import type { IGameData } from "../game/game-data/GameData.js";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "bubble-trim-pk.json"), "utf-8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bubble-trim-491e1-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = admin.firestore();

/**
 * Reads all game documents from Firestore
 * @returns Promise with array of all game data
 */
async function readAllGameData(): Promise<IGameData[]> {
    try {
        console.log('Reading all game documents from Firestore...');

        const gamesCollection = db.collection('games');
        const snapshot = await gamesCollection.get();

        const allGames: IGameData[] = [];

        snapshot.forEach((doc: any) => {
            const data = doc.data();
            allGames.push({
                playerName: data.playerName,
                startTime: data.startTime,
                endTime: data.endTime,
                hintsUsed: data.hintsUsed,
                successfulIntersections: data.successfulIntersections,
                gameDifficulty: data.gameDifficulty,
                boardName: data.boardName,
            });
        });

        console.log(`Successfully read ${allGames.length} game documents`);
        return allGames;
    } catch (error) {
        console.error('Error reading game data:', error);
        throw error;
    }
}

/**
 * Writes a document to the 'summary' collection with a custom document ID
 * @param documentId - The custom document ID
 * @param data - The data object to write
 * @returns Promise that resolves when write is complete
 */
async function writeToSummary(documentId: string, data: any): Promise<void> {
    try {
        console.log(`Writing to summary collection with ID: ${documentId}`);

        const summaryRef = db.collection('summary').doc(documentId);
        await summaryRef.set(data, { merge: false });

        console.log(`Successfully wrote document: ${documentId}`);
    } catch (error) {
        console.error(`Error writing to summary/${documentId}:`, error);
        throw error;
    }
}

export interface GameStats {
    gameName: string;
    totalPlays: number;
    averageDuration: number; // in milliseconds
    averageHints: number; // in milliseconds
    numberWins: number;
    bestScores: IGameData[];
}

export interface LeaderboardEntry {
    playerName: string;
    totalGamesPlayed: number; // in milliseconds
    totalIntersections: number;
    totalGamesWon: number;
    averageDifficulty: number;
    topPerformances: IGameData[]; // If he is in the top of some game
}

export interface LeaderboardData {
    [playerName: string]: LeaderboardEntry;
}

async function writeLeaderboard(leaderboardData: LeaderboardData): Promise<void> {
    await writeToSummary('leaderboard', leaderboardData);
}

async function writeGameStats(stats: { [gameName: string]: GameStats }): Promise<void> {
    await writeToSummary('game-stats', stats);
}

function computeGameStats(allGames: IGameData[]) {
    const gameStatsMap: { [gameName: string]: GameStats } = {};

    for (const game of allGames) {
        if (!gameStatsMap[game.boardName]) {
            gameStatsMap[game.boardName] = {
                gameName: game.boardName,
                totalPlays: 0,
                averageDuration: 0,
                averageHints: 0,
                numberWins: 0,
                bestScores: [],
            };
        }

        const stats = gameStatsMap[game.boardName];
        stats.totalPlays += 1;

        if (game.gameDifficulty <= game.successfulIntersections) {
            stats.numberWins += 1;
        }
        else continue; // was a loss

        // Game is better than others in the array of best
        if (game.endTime && game.startTime) {
            const duration = game.endTime - game.startTime;
            stats.averageDuration += duration;
            stats.averageHints += game.hintsUsed;
            let best: any = {startTime: 0, endTime: 1000000000000}; // Dummy high value
            for (const others of stats.bestScores) {
                if (others.endTime && others.startTime) {
                    const otherDuration = others.endTime - others.startTime;
                    const bestDuration = best.endTime - best.startTime;
                    if (otherDuration < bestDuration ) {
                        best = others;
                    }
                }
            }
            if (best.endTime - best.startTime > duration) {
                // Replace best
                if (stats.bestScores.length < 5) {
                    stats.bestScores.push(game);
                } else {
                    const index = stats.bestScores.indexOf(best);
                    stats.bestScores[index] = game;
                }
            }
        }


    }
    for (const game of Object.keys(gameStatsMap)) {
        const stats = gameStatsMap[game];
        stats.averageDuration = stats.totalPlays > 0 ? Math.floor(stats.averageDuration / stats.totalPlays) : 0;
        stats.averageHints = stats.totalPlays > 0 ? Math.floor(stats.averageHints / stats.totalPlays) : 0;
    }
    return gameStatsMap;
}

function computeLeaderboard(allGames: IGameData[], gameStatsMap: { [gameName: string]: GameStats }) {
    const leaderboardMap: LeaderboardData = {};

    for (const game of allGames) {
        if (!leaderboardMap[game.playerName]) {
            leaderboardMap[game.playerName] = {
                playerName: game.playerName,
                totalGamesPlayed: 0,
                totalGamesWon: 0,
                totalIntersections: 0,
                averageDifficulty: 0,
                topPerformances: [],
            };
        }

        const entry = leaderboardMap[game.playerName];
        entry.totalGamesPlayed += 1;
        entry.totalIntersections += game.successfulIntersections;

        if (game.gameDifficulty <= game.successfulIntersections) {
            entry.totalGamesWon += 1;
            entry.averageDifficulty += game.gameDifficulty;
        }

        if (gameStatsMap[game.boardName]) {
            if (gameStatsMap[game.boardName].bestScores.includes(game)) {
                entry.topPerformances.push(game);
            }
        }
    }

    for (const playerName of Object.keys(leaderboardMap)) {
        const entry = leaderboardMap[playerName];
        entry.averageDifficulty = entry.totalGamesWon > 0 ? Math.floor(entry.averageDifficulty / entry.totalGamesWon) : 0;
    }

    return leaderboardMap;
}

function computeStats(allGames: IGameData[]) {
    const gameStatsMap: { [gameName: string]: GameStats } = computeGameStats(allGames);
    const leaderboardMap: LeaderboardData = computeLeaderboard(allGames, gameStatsMap);

    return {gameStatsMap, leaderboardMap};
}

/**
 * Main function to demonstrate usage
 */
async function main() {
    try {
        // Read all game data
        const allGames = await readAllGameData();

        const {gameStatsMap, leaderboardMap} = computeStats(allGames);

        await writeGameStats(gameStatsMap);
        await writeLeaderboard(leaderboardMap);

        // Example: Write statistics to summary collection
        // await writeToSummary('game-stats', stats);

        // Example: Upload statistics to storage
        // await uploadToStorage(stats, 'stats/game-statistics.json');

        // Example: Upload all raw game data
        // await uploadToStorage(allGames, 'data/all-games.json');

        console.log('\nScript completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

// Run main function if this script is executed directly
// In ES modules, check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}


