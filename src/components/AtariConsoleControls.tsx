import React from 'react';
import { PlayerState } from '../types/game';
import { Volume2, VolumeX, Tv, Sparkles, BookOpen, Trophy } from 'lucide-react';

interface AtariConsoleControlsProps {
  playerState: PlayerState;
  onStand: () => void;
  onSit: () => void;
  onThrowBread: () => void;
  isBlackAndWhite: boolean;
  onToggleBW: () => void;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isQuickDemoSleep: boolean;
  onToggleQuickDemo: () => void;
  onResetGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenManual: () => void;
}

export const AtariConsoleControls: React.FC<AtariConsoleControlsProps> = ({
  playerState,
  onStand,
  onSit,
  onThrowBread,
  isBlackAndWhite,
  onToggleBW,
  scanlinesEnabled,
  onToggleScanlines,
  isMuted,
  onToggleMute,
  isQuickDemoSleep,
  onToggleQuickDemo,
  onResetGame,
  onOpenLeaderboard,
  onOpenManual,
}) => {
  return (
    <div className="w-full max-w-[720px] mx-auto mt-3">
      {/* Atari 2600 Wooden & Brushed Metal Console Fascia */}
      <div className="wood-trim rounded-xl bg-gradient-to-b from-[#3a2211] via-[#241308] to-[#170a04] p-3 md:p-5 border-2 border-[#542d12] shadow-2xl">
        {/* Metal Switch Deck Header */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 bg-[#1e1e24] p-3 rounded-lg border border-[#3b3b42] shadow-inner mb-4">
          {/* Switch 1: TV Type */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a1a1aa] font-mono tracking-wider mb-1.5 uppercase font-bold text-center">
              TV TYPE
            </span>
            <button
              onClick={onToggleBW}
              className={`w-11 h-8 rounded switch-plate flex items-center justify-center transition-all ${
                isBlackAndWhite ? 'border-amber-500 shadow-amber-500/30' : 'border-[#4a4a52]'
              }`}
              title="Toggle Color / Black & White TV"
            >
              <div
                className={`w-3.5 h-6 rounded-sm bg-gradient-to-b from-[#d4d4d8] to-[#71717a] shadow transition-transform ${
                  isBlackAndWhite ? 'translate-y-1' : '-translate-y-1'
                }`}
              />
            </button>
            <span className="text-[8px] text-amber-400 mt-1 font-mono">
              {isBlackAndWhite ? 'B&W' : 'COLOR'}
            </span>
          </div>

          {/* Switch 2: Difficulty / Sleep Timer Mode */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a1a1aa] font-mono tracking-wider mb-1.5 uppercase font-bold text-center">
              DIFFICULTY
            </span>
            <button
              onClick={onToggleQuickDemo}
              className={`w-11 h-8 rounded switch-plate flex items-center justify-center transition-all ${
                isQuickDemoSleep ? 'border-amber-500' : 'border-[#4a4a52]'
              }`}
              title="Toggle between Pro 2+ min sleep timer and Fast Demo 12s sleep timer"
            >
              <div
                className={`w-3.5 h-6 rounded-sm bg-gradient-to-b from-[#d4d4d8] to-[#71717a] shadow transition-transform ${
                  isQuickDemoSleep ? 'translate-y-1' : '-translate-y-1'
                }`}
              />
            </button>
            <span className="text-[8px] text-amber-400 mt-1 font-mono text-center">
              {isQuickDemoSleep ? 'FAST 12s' : 'PRO 2m+'}
            </span>
          </div>

          {/* Switch 3: CRT Scanlines */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a1a1aa] font-mono tracking-wider mb-1.5 uppercase font-bold text-center">
              CRT SCAN
            </span>
            <button
              onClick={onToggleScanlines}
              className="w-11 h-8 rounded switch-plate flex items-center justify-center"
              title="Toggle CRT scanline raster effect"
            >
              <div
                className={`w-3.5 h-6 rounded-sm bg-gradient-to-b from-[#d4d4d8] to-[#71717a] shadow transition-transform ${
                  scanlinesEnabled ? '-translate-y-1' : 'translate-y-1'
                }`}
              />
            </button>
            <span className="text-[8px] text-amber-400 mt-1 font-mono">
              {scanlinesEnabled ? 'CRT ON' : 'CLEAN'}
            </span>
          </div>

          {/* Switch 4: Audio */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a1a1aa] font-mono tracking-wider mb-1.5 uppercase font-bold text-center">
              SOUND
            </span>
            <button
              onClick={onToggleMute}
              className="w-11 h-8 rounded switch-plate flex items-center justify-center"
              title="Toggle retro audio"
            >
              <div
                className={`w-3.5 h-6 rounded-sm bg-gradient-to-b from-[#d4d4d8] to-[#71717a] shadow transition-transform ${
                  !isMuted ? '-translate-y-1' : 'translate-y-1'
                }`}
              />
            </button>
            <span className="text-[8px] text-amber-400 mt-1 font-mono">
              {isMuted ? 'MUTE' : 'AUDIO ON'}
            </span>
          </div>

          {/* Switch 5: Game Reset */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a1a1aa] font-mono tracking-wider mb-1.5 uppercase font-bold text-center">
              RESET
            </span>
            <button
              onClick={onResetGame}
              className="w-11 h-8 rounded switch-plate flex items-center justify-center active:scale-95 transition-transform"
              title="Reset current session score"
            >
              <div className="w-3.5 h-6 rounded-sm bg-gradient-to-b from-[#f87171] to-[#b91c1c] shadow" />
            </button>
            <span className="text-[8px] text-red-400 mt-1 font-mono">RESTART</span>
          </div>

          {/* Switch 6: Manual & Records */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[#a1a1aa] font-mono tracking-wider mb-1.5 uppercase font-bold text-center">
              BOX & INFO
            </span>
            <button
              onClick={onOpenManual}
              className="w-11 h-8 rounded switch-plate flex items-center justify-center active:scale-95 transition-transform bg-[#27272a]"
              title="Open Atari 2600 Game Manual & Cartridge Box Art"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
            </button>
            <span className="text-[8px] text-amber-400 mt-1 font-mono">MANUAL</span>
          </div>
        </div>

        {/* Primary Interactive Controller Deck */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141416] p-4 rounded-xl border border-[#2e2e34]">
          {/* Arcade Action Controls (Up / Down / Toss) */}
          <div className="w-full flex-1 flex flex-col gap-2">
            <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
              <span>PLAYER ACTIONS:</span>
              <span className="text-zinc-500 hidden sm:inline">KEYBOARD: ▲ UP / ▼ DOWN / SPACE</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Stand Action Button (Up Arrow) */}
              <button
                onClick={onStand}
                className={`py-3 px-3 rounded-lg flex flex-col items-center justify-center gap-1 font-atari transition-all active:scale-95 ${
                  playerState === 'STANDING'
                    ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                    : playerState === 'ASLEEP'
                    ? 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 animate-bounce'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                }`}
              >
                <span className="text-base">▲</span>
                <span className="text-[9px]">STAND</span>
                <span className="text-[7px] text-zinc-400 font-mono">
                  {playerState === 'ASLEEP' ? 'WAKE UP!' : 'PAUSE PTS'}
                </span>
              </button>

              {/* Sit Action Button (Down Arrow) */}
              <button
                onClick={onSit}
                className={`py-3 px-3 rounded-lg flex flex-col items-center justify-center gap-1 font-atari transition-all active:scale-95 ${
                  playerState === 'SITTING'
                    ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : playerState === 'ASLEEP'
                    ? 'opacity-40 cursor-not-allowed bg-zinc-900 text-zinc-600 border border-zinc-800'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-emerald-100 border border-emerald-500'
                }`}
                disabled={playerState === 'ASLEEP'}
              >
                <span className="text-base">▼</span>
                <span className="text-[9px]">SIT BENCH</span>
                <span className="text-[7px] text-emerald-300 font-mono">
                  {playerState === 'SITTING' ? 'WATCHING!' : 'EARN PTS'}
                </span>
              </button>

              {/* Toss Breadcrumb Button (Space) */}
              <button
                onClick={onThrowBread}
                className="py-3 px-3 rounded-lg flex flex-col items-center justify-center gap-1 font-atari bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 border border-amber-700/60 active:scale-95 transition-all"
              >
                <span className="text-base">🍞</span>
                <span className="text-[9px]">TOSS CRUMB</span>
                <span className="text-[7px] text-amber-400/80 font-mono">LURE DUCKS</span>
              </button>
            </div>
          </div>

          {/* Quick Leaderboard Button & Status Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-zinc-800 sm:pl-4">
            <button
              onClick={onOpenLeaderboard}
              className="flex items-center gap-2 py-2 px-3 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-atari text-[9px] active:scale-95 transition-all"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>HIGH SCORES</span>
            </button>

            <div className="text-[9px] font-mono text-zinc-400 text-right">
              {playerState === 'SITTING' && (
                <span className="text-emerald-400 font-bold">● BENCH OCCUPIED</span>
              )}
              {playerState === 'STANDING' && (
                <span className="text-amber-400 font-bold">○ STANDING IDLE</span>
              )}
              {playerState === 'ASLEEP' && (
                <span className="text-red-400 font-bold animate-pulse">▲ PLAYER ASLEEP!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
