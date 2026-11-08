import React from 'react';
import { X, Feather, AlertTriangle, ShieldCheck, Gamepad2 } from 'lucide-react';

interface CartridgeManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartridgeManualModal: React.FC<CartridgeManualModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#121316] border-2 border-[#ea580c] rounded-xl shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-600 text-white font-atari text-[9px] rounded-sm">
              ATARI 2600
            </span>
            <h2 className="text-sm sm:text-base font-atari text-amber-400 tracking-wide">
              WATCH DUCKS™ · INSTRUCTION MANUAL
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
        <div className="overflow-y-auto pr-2 py-4 space-y-6 flex-1 text-zinc-300 font-mono text-xs leading-relaxed">
          {/* Box Art Feature Banner */}
          <div className="flex flex-col md:flex-row gap-5 bg-gradient-to-r from-zinc-900 via-[#1c140e] to-zinc-900 p-4 rounded-xl border border-amber-900/40">
            <div className="w-full md:w-48 shrink-0 overflow-hidden rounded-lg border-2 border-amber-500/40 shadow-xl bg-black">
              <img
                src="/src/assets/images/watch_ducks_box_art_1793649046706.jpg"
                alt="Watch Ducks Atari 2600 Game Box Art"
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <span className="text-[10px] text-amber-500 font-atari font-bold block mb-1">
                MODEL CX-2699 · FOR 1 PLAYER
              </span>
              <h3 className="text-base sm:text-lg font-atari text-white mb-2 leading-snug">
                THE ULTIMATE SIMULATION OF LEISURE
              </h3>
              <p className="text-zinc-400 text-xs mb-3">
                Grab your favorite beverage, take a deep breath, and prepare yourself for the most leisurely video challenge ever designed for the Atari Video Computer System.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-amber-400">
                <span className="bg-amber-950/60 px-2 py-1 rounded border border-amber-700/40">
                  ⚡ 100% Genuine 8-Bit TIA Sound
                </span>
                <span className="bg-amber-950/60 px-2 py-1 rounded border border-amber-700/40">
                  🦆 4 Rare Metallic Species
                </span>
                <span className="bg-amber-950/60 px-2 py-1 rounded border border-amber-700/40">
                  💤 High-Stakes Sleep Hazard
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Objective & Rules */}
          <div className="space-y-2">
            <h4 className="text-xs font-atari text-amber-400 flex items-center gap-2">
              <Feather className="w-4 h-4 text-amber-500" />
              1. THE BENCH RULE (HOW TO SCORE)
            </h4>
            <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-800 space-y-2">
              <p>
                • <strong className="text-emerald-400">SIT TO EARN POINTS:</strong> Push the <span className="text-white font-atari text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">▼ DOWN ARROW</span> to sit on the park bench. As you observe ducks swimming across the pond, your score will accumulate automatically!
              </p>
              <p>
                • <strong className="text-amber-400">STAND TO PAUSE:</strong> Push the <span className="text-white font-atari text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">▲ UP ARROW</span> at any time to stand up. While standing, points will halt accumulating.
              </p>
            </div>
          </div>

          {/* Section 2: Falling Asleep Hazard */}
          <div className="space-y-2">
            <h4 className="text-xs font-atari text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              2. THE 2-MINUTE SLEEP HAZARD (THE SANDMAN!)
            </h4>
            <div className="bg-red-950/20 p-3.5 rounded-lg border border-red-900/40 space-y-2 text-red-200">
              <p>
                Watching ducks is so tranquil that after <strong className="text-white">no less than 2 minutes of continuous sitting</strong> (random interval between 120 and 160 seconds), your character will succumb to exhaustion and fall fast asleep!
              </p>
              <p>
                • When asleep, blocky <strong className="text-sky-300 font-atari">‘Z Z Z’</strong>s will float into the sky and <strong className="text-white">POINTS WILL CEASE ACCUMULATING!</strong>
              </p>
              <p>
                • <strong className="text-amber-300">WAKING UP:</strong> You must push the <span className="text-white font-atari text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">▲ UP ARROW</span> to stand up and wake yourself. Then push the <span className="text-white font-atari text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">▼ DOWN ARROW</span> to sit back down and resume earning points!
              </p>
              <p className="text-[11px] text-zinc-400 italic">
                (Tip: Use the console's "DIFFICULTY" switch to toggle between PRO 2+ minute mode and a quick 12s fast demo mode for instant testing!)
              </p>
            </div>
          </div>

          {/* Section 3: Duck Value Guide */}
          <div className="space-y-2">
            <h4 className="text-xs font-atari text-yellow-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-500" />
              3. DUCK SPECIES & POINT VALUES
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-xs font-bold text-yellow-400 block mb-1">
                  BASIC POND DUCKS: 5 POINTS
                </span>
                <p className="text-[11px] text-zinc-400">
                  Yellow, Mallard Green, Cyan, Magenta, Orange, and White ducks regularly paddling through the water. Award 5 points each when observed from the bench.
                </p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-lg border border-orange-900/50">
                <span className="text-xs font-bold text-orange-400 block mb-1">
                  COPPER DUCK: 100 POINTS
                </span>
                <p className="text-[11px] text-zinc-400">
                  A rare burnished metallic copper duck that occasionally flies overhead or swims across the middle ripples.
                </p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-lg border border-slate-700/50">
                <span className="text-xs font-bold text-slate-200 block mb-1">
                  SILVER DUCK: 200 POINTS
                </span>
                <p className="text-[11px] text-zinc-400">
                  An elusive chrome-feathered duck that glistens under the pixelated sun.
                </p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-lg border border-yellow-700/50">
                <span className="text-xs font-bold text-amber-300 block mb-1">
                  LEGENDARY GOLD DUCK: 500 POINTS
                </span>
                <p className="text-[11px] text-zinc-400">
                  The mythical 24K gold waterfowl! Shimmers with bright sparkles and triggers an Atari victory fanfare.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Controls Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-atari text-cyan-400 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-cyan-500" />
              4. CONTROLS CHEAT SHEET
            </h4>
            <div className="bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-white font-bold block">DOWN ARROW (▼)</span>
                <span className="text-zinc-400">Sit on bench / Earn points</span>
              </div>
              <div>
                <span className="text-white font-bold block">UP ARROW (▲)</span>
                <span className="text-zinc-400">Stand up / Wake from sleep</span>
              </div>
              <div>
                <span className="text-white font-bold block">SPACEBAR</span>
                <span className="text-zinc-400">Toss breadcrumb to lure ducks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-atari text-[10px] transition-colors"
          >
            I AM READY TO WATCH DUCKS
          </button>
        </div>
      </div>
    </div>
  );
};
