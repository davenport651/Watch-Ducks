export type PlayerState = 'STANDING' | 'SITTING' | 'ASLEEP';

export type DuckType = 'basic' | 'copper' | 'silver' | 'gold';

export type DuckState = 'FLYING_IN' | 'SWIMMING' | 'FLYING_AWAY';

export interface Duck {
  id: string;
  type: DuckType;
  state: DuckState;
  baseColor: string;
  accentColor: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  direction: 1 | -1; // 1: moving right, -1: moving left
  lane: number;
  pondStayTimer: number; // Duration duck stays swimming on pond before flying away
  scoreIntervalTimer: number; // Tracks elapsed 5-second intervals on pond while sitting awake
  bobPhase: number;
  wingPhase: number;
  headDipTimer: number;
  isDipping: boolean;
  value: number;
  quackTimer: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
  isZZZ?: boolean;
}

export interface BreadCrumb {
  id: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface LeaderboardEntry {
  id: string;
  initials: string;
  score: number;
  sessionDuration: number;
  sittingDuration: number;
  basicDucksSeen: number;
  copperDucksSeen: number;
  silverDucksSeen: number;
  goldDucksSeen: number;
  date: string;
}

export interface GameStats {
  lifetimePlayTime: number; // in seconds
  lifetimeSittingTime: number;
  totalBasicSeen: number;
  totalCopperSeen: number;
  totalSilverSeen: number;
  totalGoldSeen: number;
  highScore: number;
}
