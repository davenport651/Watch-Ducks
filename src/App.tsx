/**
 * Watch Ducks - Atari 2600 Parody Game
 * @license Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AtariScreen } from './components/AtariScreen';
import { AtariConsoleControls } from './components/AtariConsoleControls';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CartridgeManualModal } from './components/CartridgeManualModal';
import { PlayerState, DuckType, LeaderboardEntry, GameStats } from './types/game';
import { atariAudio } from './audio/atariAudio';
import {
  getLeaderboard,
  getGameStats,
  updateGameStats,
  formatTime,
  formatHoursMins,
} from './utils/storage';
import { Trophy, BookOpen, Volume2, VolumeX, Sparkles, Feather } from 'lucide-react';

export default function App() {
  // Game Play State
  const [playerState, setPlayerState] = useState<PlayerState>('STANDING');
  const [score, setScore] = useState<number>(0);
  const [sittingTime, setSittingTime] = useState<number>(0);
  const [totalSessionTime, setTotalSessionTime] = useState<number>(0);
  const [totalSittingTime, setTotalSittingTime] = useState<number>(0);

  // Difficulty & Sleep Settings
  // PRO mode: >= 120s (2 minutes), strictly compliant with prompt!
  // Fast Demo mode: 12 seconds for instantaneous testing
  const [isQuickDemoSleep, setIsQuickDemoSleep] = useState<boolean>(false);
  const [sleepThreshold, setSleepThreshold] = useState<number>(() => generateSleepThreshold(false));

  // TV and Console Options
  const [isBlackAndWhite, setIsBlackAndWhite] = useState<boolean>(false);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);

  // Statistics & Records
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getLeaderboard());
  const [stats, setStats] = useState<GameStats>(() => getGameStats());
  const [ducksSeen, setDucksSeen] = useState<{
    basic: number;
    copper: number;
    silver: number;
    gold: number;
  }>({
    basic: 0,
    copper: 0,
    silver: 0,
    gold: 0,
  });

  // Calculate new sleep threshold
  function generateSleepThreshold(quickDemo: boolean): number {
    if (quickDemo) {
      // 10 to 14 seconds for quick demonstration
      return 10 + Math.floor(Math.random() * 5);
    }
    // Strictly at least 120 seconds (2 minutes) + random 10-40 seconds
    return 120 + Math.floor(Math.random() * 35);
  }

  // Handle Standing action (Up Arrow)
  const handleStand = useCallback(() => {
    if (playerState === 'ASLEEP') {
      // Wake up from sleep!
      atariAudio.playWakeUp();
      setPlayerState('STANDING');
      setSittingTime(0);
      setSleepThreshold(generateSleepThreshold(isQuickDemoSleep));
    } else if (playerState === 'SITTING') {
      // Stand up from sitting -> points pause
      atariAudio.playStand();
      setPlayerState('STANDING');
      setSittingTime(0);
    }
  }, [playerState, isQuickDemoSleep]);

  // Handle Sitting action (Down Arrow)
  const handleSit = useCallback(() => {
    if (playerState === 'STANDING') {
      // Sit down on bench -> points begin accumulating!
      atariAudio.playSit();
      setPlayerState('SITTING');
      setSittingTime(0);
      setSleepThreshold(generateSleepThreshold(isQuickDemoSleep));
    }
  }, [playerState, isQuickDemoSleep]);

  // Handle Sleep Trigger
  const handleSleepTriggered = useCallback(() => {
    if (playerState === 'SITTING') {
      setPlayerState('ASLEEP');
    }
  }, [playerState]);

  // Handle Throwing Breadcrumb
  const handleThrowBread = useCallback(() => {
    const fn = (window as unknown as { triggerWatchDucksBreadcrumb?: () => void }).triggerWatchDucksBreadcrumb;
    if (fn) {
      fn();
    }
  }, []);

  // Handle Scoring
  const handleScoreIncrease = useCallback((pts: number, type: DuckType) => {
    setScore((prev) => {
      const next = prev + pts;
      if (next > stats.highScore) {
        setStats((s) => ({ ...s, highScore: next }));
      }
      return next;
    });

    setDucksSeen((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));

    // Update global persistent counts
    if (type === 'basic') updateGameStats({ totalBasicSeen: 1 });
    else if (type === 'copper') updateGameStats({ totalCopperSeen: 1 });
    else if (type === 'silver') updateGameStats({ totalSilverSeen: 1 });
    else if (type === 'gold') updateGameStats({ totalGoldSeen: 1 });
  }, [stats.highScore]);

  // Reset Game
  const handleResetGame = useCallback(() => {
    atariAudio.playSwitchClick();
    setScore(0);
    setPlayerState('STANDING');
    setSittingTime(0);
    setTotalSessionTime(0);
    setTotalSittingTime(0);
    setDucksSeen({ basic: 0, copper: 0, silver: 0, gold: 0 });
    setSleepThreshold(generateSleepThreshold(isQuickDemoSleep));
  }, [isQuickDemoSleep]);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = atariAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  // Toggle Quick Demo Sleep
  const handleToggleQuickDemo = useCallback(() => {
    atariAudio.playSwitchClick();
    setIsQuickDemoSleep((prev) => {
      const next = !prev;
      setSleepThreshold(generateSleepThreshold(next));
      return next;
    });
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowDown') {
        handleSit();
      } else if (e.code === 'ArrowUp') {
        handleStand();
      } else if (e.code === 'Space') {
        handleThrowBread();
      } else if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'KeyR') {
        handleResetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSit, handleStand, handleThrowBread, handleToggleMute, handleResetGame]);

  // Timer Tick (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalSessionTime((t) => t + 1);

      if (playerState === 'SITTING') {
        setSittingTime((t) => t + 1);
        setTotalSittingTime((t) => t + 1);
        // Persist sitting time
        updateGameStats({ lifetimePlayTime: 1, lifetimeSittingTime: 1 });
      } else {
        // Just playing time
        updateGameStats({ lifetimePlayTime: 1 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playerState]);

  // Refresh stats when leaderboard or storage changes
  useEffect(() => {
    const s = getGameStats();
    setStats(s);
  }, [score]);

  return (
    <div className="min-h-screen bg-[#08090b] text-zinc-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* 3-Zone Top Bar conforming to Section 2 Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-zinc-800 bg-[#0f1014]/90 backdrop-blur-md shrink-0">
        {/* Zone 1: Brand wordmark in single text element */}
        <a href="/" className="text-base sm:text-lg font-atari tracking-tight text-amber-400 whitespace-nowrap shrink-0 flex items-center gap-2.5">
          <span className="text-xl">🦆</span>
          <span>WATCH DUCKS</span>
        </a>

        {/* Zone 2: 4 nav links, single-line text with hover underlines */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-medium text-zinc-400">
          <button
            onClick={() => {
              setIsManualOpen(false);
              setIsLeaderboardOpen(false);
            }}
            className="hover:text-amber-400 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Play Game
          </button>
          <button
            onClick={() => setIsManualOpen(true)}
            className="hover:text-amber-400 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Manual & Box Art
          </button>
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="hover:text-amber-400 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Local High Scores
          </button>
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="hover:text-amber-400 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Duck Bestiary
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="px-3.5 py-1.5 text-xs font-atari text-black bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">HIGH SCORES</span>
            <span className="sm:hidden">SCORES</span>
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-5xl mx-auto">
        {/* Real-time Session Status Ticker */}
        <div className="w-full max-w-[720px] mb-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
          <div className="flex items-center gap-3">
            <span>
              SCORE: <strong className="text-yellow-400 font-atari text-xs">{score}</strong>
            </span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>
              SESSION: <strong className="text-zinc-200">{formatTime(totalSessionTime)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {playerState === 'SITTING' && (
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                BENCH: {formatTime(sittingTime)}
              </span>
            )}
            {playerState === 'STANDING' && (
              <span className="text-zinc-500 font-mono">
                [STANDING · PRESS ▼]
              </span>
            )}
            {playerState === 'ASLEEP' && (
              <span className="text-red-400 font-mono animate-bounce font-bold">
                [ASLEEP · PRESS ▲]
              </span>
            )}
          </div>
        </div>

        {/* Atari 2600 CRT Screen */}
        <AtariScreen
          score={score}
          highScore={stats.highScore}
          playerState={playerState}
          sittingTime={sittingTime}
          sleepThreshold={sleepThreshold}
          totalSessionTime={totalSessionTime}
          isBlackAndWhite={isBlackAndWhite}
          scanlinesEnabled={scanlinesEnabled}
          onScoreIncrease={handleScoreIncrease}
          onSleepTriggered={handleSleepTriggered}
        />

        {/* Atari 2600 Console Housing & Switches */}
        <AtariConsoleControls
          playerState={playerState}
          onStand={handleStand}
          onSit={handleSit}
          onThrowBread={handleThrowBread}
          isBlackAndWhite={isBlackAndWhite}
          onToggleBW={() => {
            atariAudio.playSwitchClick();
            setIsBlackAndWhite((v) => !v);
          }}
          scanlinesEnabled={scanlinesEnabled}
          onToggleScanlines={() => {
            atariAudio.playSwitchClick();
            setScanlinesEnabled((v) => !v);
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isQuickDemoSleep={isQuickDemoSleep}
          onToggleQuickDemo={handleToggleQuickDemo}
          onResetGame={handleResetGame}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenManual={() => setIsManualOpen(true)}
        />

        {/* Tactical Game Information Row */}
        <div className="w-full max-w-[720px] mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-mono gap-2 px-2">
          <div className="flex items-center gap-2">
            <span>LIFETIME TIME PLAYED:</span>
            <span className="text-zinc-300 font-bold">{formatHoursMins(stats.lifetimePlayTime)}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Basic (+5/5s)</span>
            <span className="text-orange-400">Copper (+100/5s)</span>
            <span className="text-slate-300">Silver (+200/5s)</span>
            <span className="text-amber-400 font-bold">Gold (+500/5s)</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 bg-[#090a0d] py-3 px-4 text-center text-zinc-600 text-[11px] font-mono">
        <span>WATCH DUCKS · Model CX-2699 · Parody Atari 2600 Video Computer System cartridge</span>
      </footer>

      {/* Modals */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboard}
        stats={stats}
        currentScore={score}
        currentSessionDuration={totalSessionTime}
        currentSittingDuration={totalSittingTime}
        ducksSeenCounts={ducksSeen}
        onEntryAdded={(updated) => {
          setLeaderboard(updated);
          setStats(getGameStats());
        }}
      />

      <CartridgeManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />
    </div>
  );
}
