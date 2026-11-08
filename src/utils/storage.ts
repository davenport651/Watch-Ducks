import { LeaderboardEntry, GameStats } from '../types/game';

const LEADERBOARD_KEY = 'watch_ducks_leaderboard_v1';
const STATS_KEY = 'watch_ducks_stats_v1';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'entry-1',
    initials: 'DUK',
    score: 1850,
    sessionDuration: 340,
    sittingDuration: 290,
    basicDucksSeen: 70,
    copperDucksSeen: 5,
    silverDucksSeen: 2,
    goldDucksSeen: 1,
    date: '1982-10-14',
  },
  {
    id: 'entry-2',
    initials: 'AT8',
    score: 1220,
    sessionDuration: 280,
    sittingDuration: 240,
    basicDucksSeen: 64,
    copperDucksSeen: 4,
    silverDucksSeen: 1,
    goldDucksSeen: 1,
    date: '1982-11-03',
  },
  {
    id: 'entry-3',
    initials: 'SLP',
    score: 875,
    sessionDuration: 210,
    sittingDuration: 175,
    basicDucksSeen: 55,
    copperDucksSeen: 3,
    silverDucksSeen: 1,
    goldDucksSeen: 0,
    date: '1983-02-18',
  },
  {
    id: 'entry-4',
    initials: 'QAK',
    score: 520,
    sessionDuration: 180,
    sittingDuration: 140,
    basicDucksSeen: 44,
    copperDucksSeen: 1,
    silverDucksSeen: 1,
    goldDucksSeen: 0,
    date: '1983-05-22',
  },
  {
    id: 'entry-5',
    initials: 'BNC',
    score: 340,
    sessionDuration: 150,
    sittingDuration: 120,
    basicDucksSeen: 28,
    copperDucksSeen: 2,
    silverDucksSeen: 0,
    goldDucksSeen: 0,
    date: '1983-08-09',
  },
];

const DEFAULT_STATS: GameStats = {
  lifetimePlayTime: 0,
  lifetimeSittingTime: 0,
  totalBasicSeen: 0,
  totalCopperSeen: 0,
  totalSilverSeen: 0,
  totalGoldSeen: 0,
  highScore: 1850,
};

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (!data) return DEFAULT_LEADERBOARD;
    return JSON.parse(data);
  } catch {
    return DEFAULT_LEADERBOARD;
  }
}

export function saveLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id'>): LeaderboardEntry[] {
  const current = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: 'entry-' + Date.now(),
  };
  const updated = [...current, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Keep top 10

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save leaderboard', e);
  }
  return updated;
}

export function getGameStats(): GameStats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (!data) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function updateGameStats(delta: Partial<GameStats>): GameStats {
  const current = getGameStats();
  const updated: GameStats = {
    lifetimePlayTime: current.lifetimePlayTime + (delta.lifetimePlayTime || 0),
    lifetimeSittingTime: current.lifetimeSittingTime + (delta.lifetimeSittingTime || 0),
    totalBasicSeen: current.totalBasicSeen + (delta.totalBasicSeen || 0),
    totalCopperSeen: current.totalCopperSeen + (delta.totalCopperSeen || 0),
    totalSilverSeen: current.totalSilverSeen + (delta.totalSilverSeen || 0),
    totalGoldSeen: current.totalGoldSeen + (delta.totalGoldSeen || 0),
    highScore: Math.max(current.highScore, delta.highScore || 0),
  };

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
  return updated;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatHoursMins(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}
