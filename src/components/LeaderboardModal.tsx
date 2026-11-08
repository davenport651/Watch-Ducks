import React, { useState } from 'react';
import { LeaderboardEntry, GameStats } from '../types/game';
import { formatTime, formatHoursMins, saveLeaderboardEntry } from '../utils/storage';
import { Trophy, Clock, X, Award, Check } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  stats: GameStats;
  currentScore: number;
  currentSessionDuration: number;
  currentSittingDuration: number;
  ducksSeenCounts: { basic: number; copper: number; silver: number; gold: number };
  onEntryAdded: (newEntries: LeaderboardEntry[]) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  entries,
  stats,
  currentScore,
  currentSessionDuration,
  currentSittingDuration,
  ducksSeenCounts,
  onEntryAdded,
}) => {
  const [initials, setInitials] = useState('DUK');
  const [hasSavedCurrent, setHasSavedCurrent] = useState(false);

  if (!isOpen) return null;

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasSavedCurrent || currentScore <= 0) return;

    const trimmed = initials.trim().toUpperCase().substring(0, 3) || 'AAA';
    const updated = saveLeaderboardEntry({
      initials: trimmed,
      score: currentScore,
      sessionDuration: Math.round(currentSessionDuration),
      sittingDuration: Math.round(currentSittingDuration),
      basicDucksSeen: ducksSeenCounts.basic,
      copperDucksSeen: ducksSeenCounts.copper,
      silverDucksSeen: ducksSeenCounts.silver,
      goldDucksSeen: ducksSeenCounts.gold,
      date: new Date().toISOString().split('T')[0],
    });

    setHasSavedCurrent(true);
    onEntryAdded(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#131418] border-2 border-[#d97706] rounded-xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-sm sm:text-base font-atari text-amber-400 tracking-wide">
              WATCH DUCKS HALL OF FAME
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-1 py-4 space-y-6 flex-1">
          {/* Lifetime Statistics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono block">TOTAL PLAY TIME</span>
              <span className="text-sm font-atari text-emerald-400 mt-1 block">
                {formatHoursMins(stats.lifetimePlayTime)}
              </span>
            </div>
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono block">TOTAL BENCH TIME</span>
              <span className="text-sm font-atari text-amber-400 mt-1 block">
                {formatHoursMins(stats.lifetimeSittingTime)}
              </span>
            </div>
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono block">ALL-TIME HIGH</span>
              <span className="text-sm font-atari text-yellow-400 mt-1 block">
                {stats.highScore.toLocaleString()}
              </span>
            </div>
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono block">GOLD DUCKS SPOTTED</span>
              <span className="text-sm font-atari text-amber-300 mt-1 block">
                {stats.totalGoldSeen}
              </span>
            </div>
          </div>

          {/* Current Session Save Prompt */}
          {currentScore > 0 && !hasSavedCurrent && (
            <form
              onSubmit={handleSaveScore}
              className="p-4 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/30 rounded-lg border border-amber-600/40 flex flex-col sm:flex-row items-center justify-between gap-3"
            >
              <div>
                <span className="text-[10px] text-amber-300 font-mono font-bold block">
                  SUBMIT CURRENT RUN ({currentScore} PTS)
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Sat for {formatTime(currentSittingDuration)} · {ducksSeenCounts.basic + ducksSeenCounts.copper + ducksSeenCounts.silver + ducksSeenCounts.gold} Ducks Watched
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  className="w-16 h-9 text-center bg-black border-2 border-amber-400 text-amber-300 font-atari text-sm rounded outline-none uppercase"
                  placeholder="AAA"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-atari text-[10px] rounded transition-colors font-bold whitespace-nowrap"
                >
                  SAVE SCORE
                </button>
              </div>
            </form>
          )}

          {hasSavedCurrent && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-mono">
              <Check className="w-4 h-4" />
              <span>Score recorded to local high scores!</span>
            </div>
          )}

          {/* High Scores Table */}
          <div>
            <h3 className="text-xs font-atari text-zinc-400 mb-3 uppercase tracking-wider">
              TOP 10 LOCAL SCORES
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] font-atari">
                    <th className="py-2 px-3">RANK</th>
                    <th className="py-2 px-3">NAME</th>
                    <th className="py-2 px-3">SCORE</th>
                    <th className="py-2 px-3">BENCH TIME</th>
                    <th className="py-2 px-3">DUCKS (B/C/S/G)</th>
                    <th className="py-2 px-3">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {entries.map((entry, idx) => (
                    <tr
                      key={entry.id || idx}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        idx === 0 ? 'text-amber-300 bg-amber-950/20' : 'text-zinc-300'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-atari text-[10px]">
                        {idx === 0 ? '🥇 1ST' : idx === 1 ? '🥈 2ND' : idx === 2 ? '🥉 3RD' : `${idx + 1}TH`}
                      </td>
                      <td className="py-2.5 px-3 font-atari text-[11px] font-bold text-amber-400">
                        {entry.initials}
                      </td>
                      <td className="py-2.5 px-3 font-bold font-atari text-[11px] text-yellow-400">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono">
                        {formatTime(entry.sittingDuration)}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono">
                        <span className="text-zinc-300">{entry.basicDucksSeen}</span>
                        <span className="text-zinc-600"> / </span>
                        <span className="text-orange-400">{entry.copperDucksSeen}</span>
                        <span className="text-zinc-600"> / </span>
                        <span className="text-slate-200">{entry.silverDucksSeen}</span>
                        <span className="text-zinc-600"> / </span>
                        <span className="text-amber-400 font-bold">{entry.goldDucksSeen}</span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                        {entry.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Duck Species Point Reference */}
          <div className="pt-2 border-t border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono block mb-2 font-bold uppercase">
              SPECIES VALUE GUIDE:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                <div>
                  <span className="text-zinc-300 font-bold block text-[11px]">Basic Ducks</span>
                  <span className="text-emerald-400 font-atari text-[9px]">+5 PTS</span>
                </div>
              </div>
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" />
                <div>
                  <span className="text-orange-400 font-bold block text-[11px]">Copper Duck</span>
                  <span className="text-orange-400 font-atari text-[9px]">+100 PTS</span>
                </div>
              </div>
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                <div>
                  <span className="text-slate-200 font-bold block text-[11px]">Silver Duck</span>
                  <span className="text-slate-200 font-atari text-[9px]">+200 PTS</span>
                </div>
              </div>
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block animate-pulse" />
                <div>
                  <span className="text-amber-300 font-bold block text-[11px]">Gold Duck</span>
                  <span className="text-yellow-400 font-atari text-[9px]">+500 PTS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-atari text-[10px] transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
