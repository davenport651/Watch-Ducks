import React, { useRef, useEffect } from 'react';
import { Duck, FloatingText, BreadCrumb, Particle, PlayerState, DuckType } from '../types/game';
import { atariAudio } from '../audio/atariAudio';

interface AtariScreenProps {
  score: number;
  highScore: number;
  playerState: PlayerState;
  sittingTime: number;
  sleepThreshold: number;
  totalSessionTime: number;
  isBlackAndWhite: boolean;
  scanlinesEnabled: boolean;
  onScoreIncrease: (pts: number, type: DuckType) => void;
  onSleepTriggered: () => void;
  onBreadcrumbThrown?: () => void;
}

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 220;

export const AtariScreen: React.FC<AtariScreenProps> = ({
  score,
  highScore,
  playerState,
  sittingTime,
  sleepThreshold,
  isBlackAndWhite,
  scanlinesEnabled,
  onScoreIncrease,
  onSleepTriggered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Entities state kept in refs for 60fps game loop without React re-render lag
  const ducksRef = useRef<Duck[]>([]);
  const floatingsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const crumbsRef = useRef<BreadCrumb[]>([]);
  const animFrameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const snoreTimerRef = useRef<number>(0);
  const duckSpawnTimerRef = useRef<number>(0);
  const rareDuckSpawnTimerRef = useRef<number>(0);

  // Synchronize playerState and sitting time into refs for access in RAF
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;
  const sittingTimeRef = useRef(sittingTime);
  sittingTimeRef.current = sittingTime;
  const sleepThresholdRef = useRef(sleepThreshold);
  sleepThresholdRef.current = sleepThreshold;

  // Initialize starting ducks
  useEffect(() => {
    ducksRef.current = [
      createDuck('basic', 40, 1, 1),
      createDuck('basic', 140, 2, -1),
      createDuck('basic', 240, 3, 1),
    ];
  }, []);

  function createDuck(type: DuckType, initialX?: number, initialLane?: number, initialDir?: 1 | -1): Duck {
    const lane = initialLane ?? Math.floor(Math.random() * 4) + 1; // Lanes 1 to 4
    const direction = initialDir ?? (Math.random() > 0.5 ? 1 : -1);
    const x = initialX ?? (direction === 1 ? -30 : CANVAS_WIDTH + 30);
    // Lanes y-coords in pond area (Y between 120 and 195)
    const y = 115 + lane * 18;

    let baseColor = '#E6DE00';
    let accentColor = '#D47200';
    let value = 5;
    let isFlying = false;

    if (type === 'basic') {
      const basicPalettes = [
        { base: '#FACC15', accent: '#EA580C' }, // Yellow duck
        { base: '#22C55E', accent: '#15803D' }, // Mallard Green
        { base: '#06B6D4', accent: '#0E7490' }, // Cyan
        { base: '#EC4899', accent: '#BE185D' }, // Magenta
        { base: '#F97316', accent: '#C2410C' }, // Orange
        { base: '#F1F5F9', accent: '#F97316' }, // White
      ];
      const pal = basicPalettes[Math.floor(Math.random() * basicPalettes.length)];
      baseColor = pal.base;
      accentColor = pal.accent;
      value = 5;
    } else if (type === 'copper') {
      baseColor = '#D97706'; // Metallic Copper
      accentColor = '#B45309';
      value = 100;
      isFlying = Math.random() > 0.4;
    } else if (type === 'silver') {
      baseColor = '#E2E8F0'; // Metallic Silver
      accentColor = '#94A3B8';
      value = 200;
      isFlying = Math.random() > 0.3;
    } else if (type === 'gold') {
      baseColor = '#FBBF24'; // Radiant Gold
      accentColor = '#D97706';
      value = 500;
      isFlying = Math.random() > 0.2;
    }

    const speed = type === 'basic' ? (0.35 + Math.random() * 0.35) : (isFlying ? 0.9 + Math.random() * 0.5 : 0.5 + Math.random() * 0.3);

    return {
      id: 'duck-' + Math.random().toString(36).substring(2, 9),
      type,
      baseColor,
      accentColor,
      x,
      y: isFlying ? y - 35 : y,
      speed,
      direction,
      lane,
      isFlying,
      flyAltitude: isFlying ? 15 + Math.random() * 10 : 0,
      bobPhase: Math.random() * Math.PI * 2,
      wingPhase: 0,
      headDipTimer: 2 + Math.random() * 8,
      isDipping: false,
      hasBeenScored: false,
      value,
      quackTimer: 4 + Math.random() * 12,
    };
  }

  // Handle throwing breadcrumb externally
  const throwBreadcrumb = () => {
    const crumb: BreadCrumb = {
      id: 'crumb-' + Date.now(),
      x: 80 + Math.random() * 160,
      y: 130 + Math.random() * 50,
      life: 0,
      maxLife: 300, // 5 seconds
    };
    crumbsRef.current.push(crumb);
    atariAudio.playBreadToss();

    // Spawn water splash particles
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        id: 'p-' + Math.random(),
        x: crumb.x,
        y: crumb.y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.8 - Math.random() * 1.2,
        color: '#60A5FA',
        life: 0,
        maxLife: 20,
        size: 2,
      });
    }

    // Ducks react to breadcrumb!
    ducksRef.current.forEach((duck) => {
      if (!duck.isFlying) {
        if ((duck.x < crumb.x && duck.direction === -1) || (duck.x > crumb.x && duck.direction === 1)) {
          // Gently turn toward crumb if close
          if (Math.abs(duck.x - crumb.x) < 100) {
            duck.direction = duck.x < crumb.x ? 1 : -1;
          }
        }
      }
    });
  };

  // Expose throwBreadcrumb on window for direct access
  useEffect(() => {
    (window as unknown as { triggerWatchDucksBreadcrumb?: () => void }).triggerWatchDucksBreadcrumb = throwBreadcrumb;
    return () => {
      delete (window as unknown as { triggerWatchDucksBreadcrumb?: () => void }).triggerWatchDucksBreadcrumb;
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const gameLoop = (now: number) => {
      if (!isMounted) return;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // 1. UPDATE LOGIC
      updateGame(dt);

      // 2. RENDER LOGIC
      renderAtariScene(ctx);

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  const updateGame = (dt: number) => {
    const isPlayerSitting = playerStateRef.current === 'SITTING';
    const isPlayerAsleep = playerStateRef.current === 'ASLEEP';

    // Sleep check: points accumulate only while sitting, and random falling asleep occurs after >= 2 minutes (or test threshold)
    if (isPlayerSitting && !isPlayerAsleep) {
      if (sittingTimeRef.current >= sleepThresholdRef.current) {
        onSleepTriggered();
        atariAudio.playFallAsleep();
      }
    }

    // Snore particles generator when asleep
    if (isPlayerAsleep) {
      snoreTimerRef.current += dt;
      if (snoreTimerRef.current > 1.2) {
        snoreTimerRef.current = 0;
        atariAudio.playSnoreTick();
        floatingsRef.current.push({
          id: 'snore-' + Math.random(),
          text: Math.random() > 0.4 ? 'Z' : 'z',
          x: 48 + Math.random() * 4,
          y: 88,
          color: '#93C5FD',
          life: 0,
          maxLife: 70,
          vy: -0.6,
          scale: 1,
          isZZZ: true,
        });
      }
    } else {
      snoreTimerRef.current = 0;
    }

    // Spawn basic ducks periodically
    duckSpawnTimerRef.current += dt;
    if (duckSpawnTimerRef.current > 3.5) {
      duckSpawnTimerRef.current = 0;
      if (ducksRef.current.length < 8) {
        ducksRef.current.push(createDuck('basic'));
      }
    }

    // Spawn rare metallic ducks periodically
    rareDuckSpawnTimerRef.current += dt;
    // Every 16-25s chance to spawn rare duck
    if (rareDuckSpawnTimerRef.current > 18) {
      rareDuckSpawnTimerRef.current = 0;
      const roll = Math.random();
      let rareType: DuckType | null = null;
      if (roll < 0.50) {
        rareType = 'copper'; // 50% of rare spawns
      } else if (roll < 0.85) {
        rareType = 'silver'; // 35% of rare spawns
      } else {
        rareType = 'gold'; // 15% of rare spawns (500 pts!)
      }

      if (rareType) {
        ducksRef.current.push(createDuck(rareType));
      }
    }

    // Update Ducks
    for (let i = ducksRef.current.length - 1; i >= 0; i--) {
      const duck = ducksRef.current[i];
      duck.bobPhase += dt * 3.5;
      duck.wingPhase += dt * (duck.isFlying ? 14 : 4);

      // Horizontal paddle or flight
      duck.x += duck.direction * duck.speed * 60 * dt;

      // Quack occasionally
      duck.quackTimer -= dt;
      if (duck.quackTimer <= 0) {
        duck.quackTimer = 6 + Math.random() * 15;
        if (Math.random() > 0.5 && duck.x > 30 && duck.x < CANVAS_WIDTH - 30) {
          atariAudio.playQuack();
        }
      }

      // Head dip into pond occasionally
      duck.headDipTimer -= dt;
      if (duck.headDipTimer <= 0) {
        duck.isDipping = true;
        if (duck.headDipTimer < -0.8) {
          duck.isDipping = false;
          duck.headDipTimer = 4 + Math.random() * 8;
        }
      }

      // Metallic sparkle particles
      if (duck.type !== 'basic' && Math.random() > 0.6) {
        particlesRef.current.push({
          id: 'sp-' + Math.random(),
          x: duck.x + 8,
          y: duck.y + 4,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.3 - Math.random() * 0.5,
          color: duck.type === 'gold' ? '#FDE047' : (duck.type === 'silver' ? '#F8FAFC' : '#FB923C'),
          life: 0,
          maxLife: 25,
          size: 2,
        });
      }

      // Scoring Condition:
      // "Players earn points only when they sit on the bench using the down arrow."
      // As ducks swim across the viewing zone (x: 50 to 270), if player is SITTING (and not asleep!), award points!
      if (!duck.hasBeenScored && isPlayerSitting && !isPlayerAsleep) {
        const viewingZoneStart = 70;
        const viewingZoneEnd = 240;
        const inZone = (duck.direction === 1 && duck.x >= viewingZoneStart) ||
                       (duck.direction === -1 && duck.x <= viewingZoneEnd);

        if (inZone) {
          duck.hasBeenScored = true;
          onScoreIncrease(duck.value, duck.type);

          // Audio feedback
          if (duck.type === 'basic') {
            atariAudio.playBasicDuckScore();
            floatingsRef.current.push({
              id: 'fl-' + Math.random(),
              text: '+5',
              x: duck.x,
              y: duck.y - 10,
              color: '#4ADE80',
              life: 0,
              maxLife: 45,
              vy: -0.7,
              scale: 1,
            });
          } else if (duck.type === 'copper') {
            atariAudio.playCopperDuck();
            floatingsRef.current.push({
              id: 'fl-' + Math.random(),
              text: '+100 COPPER!',
              x: duck.x - 10,
              y: duck.y - 14,
              color: '#FB923C',
              life: 0,
              maxLife: 65,
              vy: -0.8,
              scale: 1.2,
            });
          } else if (duck.type === 'silver') {
            atariAudio.playSilverDuck();
            floatingsRef.current.push({
              id: 'fl-' + Math.random(),
              text: '+200 SILVER!',
              x: duck.x - 10,
              y: duck.y - 14,
              color: '#E2E8F0',
              life: 0,
              maxLife: 70,
              vy: -0.8,
              scale: 1.3,
            });
          } else if (duck.type === 'gold') {
            atariAudio.playGoldDuck();
            floatingsRef.current.push({
              id: 'fl-' + Math.random(),
              text: '+500 GOLD!!',
              x: duck.x - 15,
              y: duck.y - 16,
              color: '#FACC15',
              life: 0,
              maxLife: 85,
              vy: -0.9,
              scale: 1.5,
            });
          }
        }
      }

      // Remove ducks that swim off screen
      if ((duck.direction === 1 && duck.x > CANVAS_WIDTH + 40) ||
          (duck.direction === -1 && duck.x < -40)) {
        ducksRef.current.splice(i, 1);
      }
    }

    // Update Floating Text
    for (let i = floatingsRef.current.length - 1; i >= 0; i--) {
      const fl = floatingsRef.current[i];
      fl.life += 1;
      fl.y += fl.vy;
      if (fl.isZZZ) {
        fl.x += Math.sin(fl.life * 0.15) * 0.5;
      }
      if (fl.life >= fl.maxLife) {
        floatingsRef.current.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life += 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      if (p.life >= p.maxLife) {
        particlesRef.current.splice(i, 1);
      }
    }

    // Update Breadcrumbs
    for (let i = crumbsRef.current.length - 1; i >= 0; i--) {
      const crumb = crumbsRef.current[i];
      crumb.life += 1;
      if (crumb.life >= crumb.maxLife) {
        crumbsRef.current.splice(i, 1);
      }
    }
  };

  // Rendering
  const renderAtariScene = (ctx: CanvasRenderingContext2D) => {
    ctx.imageSmoothingEnabled = false;

    // 1. SKY GRADIENT (Atari 2600 TIA scanline bands)
    const skyBands = [
      { y: 0, h: 18, color: '#1B3B6F' },
      { y: 18, h: 18, color: '#2E5B9A' },
      { y: 36, h: 18, color: '#4B7FB8' },
      { y: 54, h: 16, color: '#689FD4' },
      { y: 70, h: 14, color: '#88BEE8' },
      { y: 84, h: 12, color: '#A8D8F4' },
    ];
    skyBands.forEach((band) => {
      ctx.fillStyle = band.color;
      ctx.fillRect(0, band.y, CANVAS_WIDTH, band.h);
    });

    // 2. BLOCKY ATARI CLOUDS
    drawAtariCloud(ctx, 40, 24);
    drawAtariCloud(ctx, 180, 16);
    drawAtariCloud(ctx, 280, 32);

    // 3. DISTANT ATARI HORIZON & MOUNTAIN / TREELINE
    ctx.fillStyle = '#22543D'; // Dark forest green
    for (let x = 0; x < CANVAS_WIDTH; x += 16) {
      const h = ((x * 13) % 11) + 12;
      ctx.fillRect(x, 96 - h, 16, h);
    }
    ctx.fillStyle = '#2F855A'; // Mid forest green
    ctx.fillRect(0, 94, CANVAS_WIDTH, 8);

    // 4. GRASS RIVERBANK (Left and upper boundary)
    ctx.fillStyle = '#48BB78'; // Atari grass green
    ctx.fillRect(0, 102, CANVAS_WIDTH, 14);

    // Grass riverbank slope where bench sits (wider on left)
    ctx.fillStyle = '#38A169';
    ctx.fillRect(0, 116, 85, 90);
    ctx.fillStyle = '#2F855A';
    ctx.fillRect(0, 116, 75, 80);

    // Grass bank edge detail
    ctx.fillStyle = '#276749';
    for (let y = 116; y < 200; y += 8) {
      ctx.fillRect(72 + ((y % 16) === 0 ? 8 : 0), y, 8, 8);
    }

    // 5. PIXELATED POND
    // Layered blue water bands
    const waterLayers = [
      { y: 116, h: 22, color: '#2B6CB0' },
      { y: 138, h: 24, color: '#2B6CB0' },
      { y: 162, h: 26, color: '#2C5282' },
      { y: 188, h: 32, color: '#1A365D' },
    ];
    waterLayers.forEach((w) => {
      ctx.fillStyle = w.color;
      ctx.fillRect(75, w.y, CANVAS_WIDTH - 75, w.h);
    });

    // Animated water scanlines / ripples
    const timeSec = performance.now() / 1000;
    ctx.fillStyle = '#63B3ED';
    for (let y = 124; y < CANVAS_HEIGHT - 6; y += 12) {
      const offsetX = Math.floor((timeSec * 24 + y * 5) % 36);
      for (let x = 85 + offsetX; x < CANVAS_WIDTH; x += 44) {
        ctx.fillRect(x, y, 14, 2);
      }
    }

    // Reeds & Cattails at pond edge
    drawCattail(ctx, 76, 120);
    drawCattail(ctx, 80, 150);
    drawCattail(ctx, 74, 180);

    // Breadcrumbs on pond surface
    crumbsRef.current.forEach((crumb) => {
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(crumb.x - 2, crumb.y - 2, 4, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(crumb.x - 1, crumb.y - 1, 2, 2);
    });

    // 6. BENCH & PLAYER REFLECTION IN WATER
    drawReflection(ctx);

    // 7. WOODEN PARK BENCH
    drawAtariBench(ctx, 24, 124);

    // 8. PLAYER CHARACTER (Standing, Sitting, or Asleep)
    drawAtariPlayer(ctx, playerStateRef.current);

    // 9. DUCKS (Swimming or Flying)
    // Sort ducks by lane/y-order for correct depth overlap
    const sortedDucks = [...ducksRef.current].sort((a, b) => a.y - b.y);
    sortedDucks.forEach((duck) => {
      drawAtariDuck(ctx, duck);
    });

    // 10. PARTICLES (Splashes and Sparkles)
    particlesRef.current.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    });

    // 11. FLOATING TEXTS (+5, +100, Z Z Z)
    floatingsRef.current.forEach((fl) => {
      ctx.fillStyle = fl.color;
      ctx.font = fl.isZZZ ? 'bold 12px "Press Start 2P", monospace' : 'bold 9px "Press Start 2P", monospace';
      ctx.fillText(fl.text, Math.floor(fl.x), Math.floor(fl.y));
    });

    // 12. RETRO HUD OVERLAY
    drawAtariHUD(ctx);
  };

  // Helper drawing functions
  function drawAtariCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx + 8, cy, 24, 6);
    ctx.fillRect(cx, cy + 6, 40, 8);
    ctx.fillRect(cx + 6, cy + 14, 28, 4);
  }

  function drawCattail(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.fillStyle = '#1C4532'; // Stem
    ctx.fillRect(cx, cy - 14, 2, 16);
    ctx.fillStyle = '#744210'; // Brown top
    ctx.fillRect(cx - 1, cy - 20, 4, 8);
  }

  function drawAtariBench(ctx: CanvasRenderingContext2D, bx: number, by: number) {
    // Backrest slats (wood slats in 2600 brown)
    ctx.fillStyle = '#975A16';
    ctx.fillRect(bx, by - 22, 28, 4);
    ctx.fillRect(bx, by - 16, 28, 4);

    // Seat slats
    ctx.fillStyle = '#B7791F';
    ctx.fillRect(bx - 2, by - 9, 32, 5);

    // Cast iron frame / legs (dark charcoal/iron)
    ctx.fillStyle = '#1A202C';
    ctx.fillRect(bx, by - 24, 3, 28);
    ctx.fillRect(bx + 25, by - 24, 3, 28);
    ctx.fillRect(bx - 1, by + 4, 4, 6);
    ctx.fillRect(bx + 25, by + 4, 4, 6);
  }

  function drawReflection(ctx: CanvasRenderingContext2D) {
    // Subtle wavy blue reflection of player & bench on edge of water
    ctx.fillStyle = 'rgba(26, 44, 76, 0.45)';
    ctx.fillRect(75, 126, 12, 16);
    ctx.fillRect(78, 142, 8, 12);
  }

  function drawAtariPlayer(ctx: CanvasRenderingContext2D, state: PlayerState) {
    // Player pixel dimensions: blocky 2600 style
    // Colors: Red cap (#E53E3E), Skin peach (#FBD38D), Cyan shirt (#0BC5EA), Jeans (#2B6CB0), Boots (#744210)
    if (state === 'STANDING') {
      // Standing in front of/next to the bench (X: 54, Y: 110)
      const px = 54;
      const py = 100;

      // Red Cap
      ctx.fillStyle = '#E53E3E';
      ctx.fillRect(px + 2, py, 8, 4);
      ctx.fillRect(px + 6, py + 2, 6, 2); // Cap visor pointing right to pond

      // Face / Head
      ctx.fillStyle = '#FBD38D';
      ctx.fillRect(px + 2, py + 4, 7, 6);

      // Eye watching pond
      ctx.fillStyle = '#1A202C';
      ctx.fillRect(px + 6, py + 6, 2, 2);

      // Shirt / Jacket (cyan)
      ctx.fillStyle = '#0BC5EA';
      ctx.fillRect(px, py + 10, 10, 10);
      // White shirt collar
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 3, py + 10, 3, 3);

      // Blue jeans
      ctx.fillStyle = '#2B6CB0';
      ctx.fillRect(px + 1, py + 20, 4, 8);
      ctx.fillRect(px + 6, py + 20, 4, 8);

      // Brown Boots
      ctx.fillStyle = '#744210';
      ctx.fillRect(px + 1, py + 28, 5, 4);
      ctx.fillRect(px + 6, py + 28, 5, 4);
    } else if (state === 'SITTING') {
      // Sat on bench (X: 34, Y: 104)
      const px = 34;
      const py = 104;

      // Red Cap
      ctx.fillStyle = '#E53E3E';
      ctx.fillRect(px + 2, py - 4, 8, 4);
      ctx.fillRect(px + 6, py - 2, 6, 2); // Visor pointing right to ducks

      // Face
      ctx.fillStyle = '#FBD38D';
      ctx.fillRect(px + 2, py, 7, 6);

      // Eye watching the ducks intently
      ctx.fillStyle = '#1A202C';
      ctx.fillRect(px + 6, py + 2, 2, 2);

      // Shirt / Jacket
      ctx.fillStyle = '#0BC5EA';
      ctx.fillRect(px, py + 6, 9, 8);

      // Resting arm / hands on lap
      ctx.fillStyle = '#0BC5EA';
      ctx.fillRect(px + 7, py + 9, 5, 3);
      ctx.fillStyle = '#FBD38D';
      ctx.fillRect(px + 11, py + 9, 3, 3); // Hands

      // Sitting bent jeans
      ctx.fillStyle = '#2B6CB0';
      ctx.fillRect(px + 1, py + 14, 12, 4); // Thighs extended forward
      ctx.fillRect(px + 9, py + 18, 4, 6);  // Shins down

      // Boots
      ctx.fillStyle = '#744210';
      ctx.fillRect(px + 9, py + 24, 6, 3);
    } else if (state === 'ASLEEP') {
      // Slumped back asleep on bench (X: 32, Y: 106)
      const px = 32;
      const py = 106;

      // Red Cap tilted back/sideways
      ctx.fillStyle = '#E53E3E';
      ctx.fillRect(px - 1, py - 6, 8, 4);
      ctx.fillRect(px - 2, py - 4, 3, 3);

      // Face tilted back
      ctx.fillStyle = '#FBD38D';
      ctx.fillRect(px, py - 2, 8, 6);

      // Closed eyes (horizontal shut line '— —')
      ctx.fillStyle = '#1A202C';
      ctx.fillRect(px + 2, py, 2, 1);
      ctx.fillRect(px + 5, py, 2, 1);

      // Mouth hanging slightly open
      ctx.fillStyle = '#742A2A';
      ctx.fillRect(px + 4, py + 3, 2, 2);

      // Shirt slumped
      ctx.fillStyle = '#0BC5EA';
      ctx.fillRect(px - 1, py + 4, 9, 8);

      // Limp hands
      ctx.fillStyle = '#FBD38D';
      ctx.fillRect(px + 6, py + 11, 3, 3);

      // Sitting legs
      ctx.fillStyle = '#2B6CB0';
      ctx.fillRect(px, py + 12, 11, 4);
      ctx.fillRect(px + 8, py + 16, 4, 6);

      // Boots
      ctx.fillStyle = '#744210';
      ctx.fillRect(px + 8, py + 22, 6, 3);
    }
  }

  function drawAtariDuck(ctx: CanvasRenderingContext2D, duck: Duck) {
    const dx = Math.floor(duck.x);
    const dy = Math.floor(duck.y + Math.sin(duck.bobPhase) * 1.5);
    const dir = duck.direction;

    // Wake ripples behind duck in water (if not flying)
    if (!duck.isFlying) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const rippleX = dir === 1 ? dx - 4 : dx + 16;
      ctx.fillRect(rippleX, dy + 7, 4, 1);
      ctx.fillRect(dir === 1 ? rippleX - 4 : rippleX + 4, dy + 8, 5, 1);
    }

    // Save for directional flipping
    ctx.save();
    if (dir === -1) {
      ctx.translate(dx + 14, dy);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(dx, dy);
    }

    // Duck body colors
    ctx.fillStyle = duck.baseColor;

    if (duck.isFlying) {
      // Flying Duck Sprite (Wings up/down animation)
      const wingUp = Math.sin(duck.wingPhase) > 0;

      // Head & Neck
      ctx.fillRect(10, -2, 4, 4);
      // Orange Beak
      ctx.fillStyle = '#F97316';
      ctx.fillRect(14, -1, 3, 2);

      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, -2, 1, 1);

      // Body
      ctx.fillStyle = duck.baseColor;
      ctx.fillRect(2, 0, 10, 5);

      // Tail
      ctx.fillRect(0, 0, 2, 3);

      // Wing
      ctx.fillStyle = duck.accentColor;
      if (wingUp) {
        ctx.fillRect(4, -6, 5, 6);
        ctx.fillRect(5, -9, 3, 4);
      } else {
        ctx.fillRect(4, 3, 5, 5);
        ctx.fillRect(5, 7, 3, 4);
      }

      // Trailing feet in flight
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(-2, 2, 3, 2);
    } else {
      // Swimming Duck Sprite
      const isDipping = duck.isDipping;

      if (isDipping) {
        // Head dipping into pond
        ctx.fillRect(4, 2, 10, 6); // Body tilted
        ctx.fillRect(12, 5, 4, 4); // Head down into water
        ctx.fillStyle = '#F97316';
        ctx.fillRect(14, 8, 3, 2);  // Beak touching water
      } else {
        // Normal Swimming Pose
        // Head & Neck
        ctx.fillRect(10, -2, 4, 5);

        // Orange Beak
        ctx.fillStyle = '#F97316';
        ctx.fillRect(14, 0, 3, 2);

        // Black eye
        ctx.fillStyle = '#000000';
        ctx.fillRect(12, -1, 1, 1);

        // Body
        ctx.fillStyle = duck.baseColor;
        ctx.fillRect(2, 2, 10, 6);

        // Tail feather
        ctx.fillRect(0, 0, 3, 3);

        // Wing highlight / feather
        ctx.fillStyle = duck.accentColor;
        ctx.fillRect(4, 3, 5, 3);
      }
    }

    // Sparkle star for Gold & Silver ducks
    if (duck.type === 'gold' || duck.type === 'silver') {
      const glintFrame = Math.floor(performance.now() / 150) % 4;
      if (glintFrame === 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, -2, 2, 2);
        ctx.fillRect(5, -1, 4, 1);
      }
    }

    ctx.restore();
  }

  function drawAtariHUD(ctx: CanvasRenderingContext2D) {
    // Classic Atari 2600 chunky score header banner
    // Score Bar Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 20);

    // Score in bright Atari yellow
    ctx.fillStyle = '#FACC15';
    ctx.font = '10px "Press Start 2P", monospace';
    const scoreStr = score.toString().padStart(6, '0');
    ctx.fillText(`${scoreStr}`, 8, 14);

    // High Score on top right
    ctx.fillStyle = '#94A3B8';
    ctx.font = '7px "Press Start 2P", monospace';
    const highStr = highScore.toString().padStart(6, '0');
    ctx.fillText(`HI ${highStr}`, 215, 14);

    // Status / Sleep Warning Banner at bottom of canvas
    if (playerStateRef.current === 'ASLEEP') {
      // Flashing Red Alert Bar
      const flash = Math.floor(performance.now() / 250) % 2 === 0;
      ctx.fillStyle = flash ? '#DC2626' : '#7F1D1D';
      ctx.fillRect(0, CANVAS_HEIGHT - 22, CANVAS_WIDTH, 22);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText('*** ASLEEP! PUSH UP ARROW (▲) TO STAND! ***', 12, CANVAS_HEIGHT - 8);
    } else if (playerStateRef.current === 'SITTING') {
      // Earning points indicator
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.fillRect(0, CANVAS_HEIGHT - 16, CANVAS_WIDTH, 16);

      ctx.fillStyle = '#022C22';
      ctx.font = '7px "Press Start 2P", monospace';

      const timeLeft = Math.max(0, sleepThresholdRef.current - sittingTimeRef.current);
      if (timeLeft <= 20) {
        // Drowsy warning!
        ctx.fillStyle = '#FEF08A';
        ctx.fillText(`DROWSY! SLEEP IN ${Math.ceil(timeLeft)}s`, 12, CANVAS_HEIGHT - 5);
      } else {
        ctx.fillText('WATCHING DUCKS · EARNING POINTS', 12, CANVAS_HEIGHT - 5);
      }
    } else {
      // Standing
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, CANVAS_HEIGHT - 16, CANVAS_WIDTH, 16);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText('STANDING · PRESS DOWN ARROW (▼) TO SIT', 12, CANVAS_HEIGHT - 5);
    }
  }

  return (
    <div className={`relative w-full aspect-[4/3] max-w-[720px] mx-auto select-none overflow-hidden crt-screen-curved ${isBlackAndWhite ? 'atari-bw' : ''}`}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full pixelated block bg-black"
      />
      {/* Scanline CRT overlay */}
      {scanlinesEnabled && (
        <div className="absolute inset-0 crt-overlay pointer-events-none crt-flicker" />
      )}
      {/* Phosphor glass reflection vignette */}
      <div className="absolute inset-0 crt-glow pointer-events-none" />
    </div>
  );
};
