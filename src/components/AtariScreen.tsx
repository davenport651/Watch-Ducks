import React, { useRef, useEffect } from 'react';
import { Duck, FloatingText, BreadCrumb, Particle, PlayerState, DuckType, DuckState } from '../types/game';
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
const POND_MIN_X = 94; // Left water boundary where riverbank meets pond
const POND_MAX_X = 296; // Right pond boundary before screen edge

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

  // Synchronize all dynamic props into refs for access in RAF gameLoop
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;
  const sittingTimeRef = useRef(sittingTime);
  sittingTimeRef.current = sittingTime;
  const sleepThresholdRef = useRef(sleepThreshold);
  sleepThresholdRef.current = sleepThreshold;
  const onScoreIncreaseRef = useRef(onScoreIncrease);
  onScoreIncreaseRef.current = onScoreIncrease;
  const onSleepTriggeredRef = useRef(onSleepTriggered);
  onSleepTriggeredRef.current = onSleepTriggered;

  // Initialize starting ducks:
  // "the game started with a random 2 to 4 ducks already on the pond"
  useEffect(() => {
    const initialCount = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4 ducks
    const initialDucks: Duck[] = [];

    for (let i = 0; i < initialCount; i++) {
      const lane = (i % 4) + 1;
      const x = POND_MIN_X + 25 + ((POND_MAX_X - POND_MIN_X - 50) / initialCount) * i + (Math.random() - 0.5) * 20;
      const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
      initialDucks.push(createDuck('basic', 'SWIMMING', x, lane, dir));
    }

    ducksRef.current = initialDucks;
  }, []);

  function createDuck(
    type: DuckType,
    initialState: DuckState = 'FLYING_IN',
    initialX?: number,
    initialLane?: number,
    initialDir?: 1 | -1
  ): Duck {
    const lane = initialLane ?? (Math.floor(Math.random() * 4) + 1); // Lanes 1 to 4
    const targetY = 115 + lane * 18;
    const direction: 1 | -1 = initialDir ?? (Math.random() > 0.5 ? 1 : -1);

    let baseColor = '#FACC15';
    let accentColor = '#EA580C';
    let value = 5;

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
    } else if (type === 'silver') {
      baseColor = '#E2E8F0'; // Metallic Silver
      accentColor = '#94A3B8';
      value = 200;
    } else if (type === 'gold') {
      baseColor = '#FBBF24'; // Radiant Gold
      accentColor = '#D97706';
      value = 500;
    }

    // Counters:
    // "all ducks swim side to side within the boundary of the pond for a random period of time...
    // The metallic ducks have significantly shorter counters."
    let pondStayTimer: number;
    if (type === 'basic') {
      pondStayTimer = 25 + Math.random() * 25; // 25 to 50 seconds
    } else if (type === 'copper') {
      pondStayTimer = 12 + Math.random() * 6; // 12 to 18 seconds
    } else if (type === 'silver') {
      pondStayTimer = 10 + Math.random() * 4; // 10 to 14 seconds
    } else {
      // gold
      pondStayTimer = 7 + Math.random() * 4; // 7 to 11 seconds
    }

    const speed = type === 'basic' ? (0.35 + Math.random() * 0.25) : (0.45 + Math.random() * 0.3);

    let x = initialX;
    let y = targetY;
    let targetX = 120 + Math.random() * 140;

    if (initialState === 'FLYING_IN') {
      // Start in the sky off-screen
      const fromLeft = Math.random() > 0.5;
      x = fromLeft ? -30 : CANVAS_WIDTH + 30;
      y = 10 + Math.random() * 35; // high in sky
      targetX = 110 + Math.random() * 150; // Landing location on pond
    } else {
      // Starting directly on pond
      x = initialX ?? (POND_MIN_X + 15 + Math.random() * (POND_MAX_X - POND_MIN_X - 30));
      y = targetY;
      targetX = x;
    }

    return {
      id: 'duck-' + Math.random().toString(36).substring(2, 9),
      type,
      state: initialState,
      baseColor,
      accentColor,
      x: x!,
      y,
      targetX,
      targetY,
      speed,
      direction,
      lane,
      pondStayTimer,
      // Stagger initial scoring interval if already swimming on pond
      scoreIntervalTimer: initialState === 'SWIMMING' ? Math.random() * 4.0 : 0,
      bobPhase: Math.random() * Math.PI * 2,
      wingPhase: 0,
      headDipTimer: 2 + Math.random() * 8,
      isDipping: false,
      value,
      quackTimer: 4 + Math.random() * 12,
    };
  }

  // Handle throwing breadcrumb externally
  const throwBreadcrumb = () => {
    const crumb: BreadCrumb = {
      id: 'crumb-' + Date.now(),
      x: 105 + Math.random() * 150,
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
      if (duck.state === 'SWIMMING') {
        if ((duck.x < crumb.x && duck.direction === -1) || (duck.x > crumb.x && duck.direction === 1)) {
          // Gently turn toward crumb if close
          if (Math.abs(duck.x - crumb.x) < 120) {
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
        // Immediately set local ref so next frame doesn't re-trigger and ducks immediately stop scoring!
        playerStateRef.current = 'ASLEEP';
        onSleepTriggeredRef.current();
        atariAudio.playFallAsleep();

        // Immediately spawn an initial prominent floating 'Z Z Z'
        floatingsRef.current.push({
          id: 'snore-init-' + Date.now(),
          text: 'Z Z Z',
          x: 42,
          y: 90,
          color: '#FFFFFF',
          life: 0,
          maxLife: 120,
          vy: -0.35,
          scale: 1,
          isZZZ: true,
        });
      }
    }

    // Snore particles generator when asleep:
    // "The pulses that generate the noise needs to slow down and be lower in volume.
    // Without such a harsh noise, please add little 'Z Z Z' floating above the player and turn his eyes from squares to slits or dashes."
    if (playerStateRef.current === 'ASLEEP') {
      snoreTimerRef.current += dt;
      // Slowed down to ~2.8s intervals with gentle tone
      if (snoreTimerRef.current > 2.8) {
        snoreTimerRef.current = 0;
        atariAudio.playSnoreTick();
        floatingsRef.current.push({
          id: 'snore-' + Math.random(),
          text: Math.random() > 0.4 ? 'Z Z Z' : 'z z z',
          x: 40 + (Math.random() - 0.5) * 8,
          y: 92,
          color: '#FFFFFF',
          life: 0,
          maxLife: 110,
          vy: -0.35,
          scale: 1,
          isZZZ: true,
        });
      }
    } else {
      snoreTimerRef.current = 0;
    }

    // Spawn new ducks flying in:
    // "new ducks should fly in randomly, land on the pond"
    duckSpawnTimerRef.current += dt;
    if (duckSpawnTimerRef.current > 5.5) {
      duckSpawnTimerRef.current = 0;
      // Maximum 7 ducks on screen at once
      if (ducksRef.current.length < 7) {
        const roll = Math.random();
        let duckType: DuckType = 'basic';
        if (roll < 0.12) {
          duckType = 'copper';
        } else if (roll < 0.18) {
          duckType = 'silver';
        } else if (roll < 0.22) {
          duckType = 'gold';
        }
        ducksRef.current.push(createDuck(duckType, 'FLYING_IN'));
      }
    }

    // Update Ducks
    for (let i = ducksRef.current.length - 1; i >= 0; i--) {
      const duck = ducksRef.current[i];
      duck.bobPhase += dt * 3.5;
      duck.wingPhase += dt * 14;

      if (duck.state === 'FLYING_IN') {
        // Fly towards landing spot on the pond
        const dx = duck.targetX - duck.x;
        const dy = duck.targetY - duck.y;
        const dist = Math.hypot(dx, dy);

        const flySpeed = 70 * dt;
        if (dist <= flySpeed || duck.y >= duck.targetY - 2) {
          // Touch down on pond!
          duck.x = duck.targetX;
          duck.y = duck.targetY;
          duck.state = 'SWIMMING';
          duck.direction = Math.random() > 0.5 ? 1 : -1;
          duck.scoreIntervalTimer = 0;
          atariAudio.playDuckLand();

          // Water splash on landing
          for (let p = 0; p < 6; p++) {
            particlesRef.current.push({
              id: 'sp-' + Math.random(),
              x: duck.x + 8,
              y: duck.y + 6,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -0.6 - Math.random() * 0.8,
              color: '#60A5FA',
              life: 0,
              maxLife: 18,
              size: 2,
            });
          }
        } else {
          duck.x += (dx / dist) * flySpeed;
          duck.y += (dy / dist) * flySpeed;
          duck.direction = dx >= 0 ? 1 : -1;
        }
      } else if (duck.state === 'SWIMMING') {
        // "all ducks swim side to side within the boundary of the pond for a random period of time"
        duck.x += duck.direction * duck.speed * 60 * dt;

        // Pond boundary checks
        if (duck.direction === -1 && duck.x <= POND_MIN_X) {
          duck.x = POND_MIN_X;
          duck.direction = 1;
        } else if (duck.direction === 1 && duck.x >= POND_MAX_X) {
          duck.x = POND_MAX_X;
          duck.direction = -1;
        }

        // Quack occasionally
        duck.quackTimer -= dt;
        if (duck.quackTimer <= 0) {
          duck.quackTimer = 6 + Math.random() * 15;
          if (Math.random() > 0.5) {
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

        // SCORING:
        // "each duck is worth it's number of points for every 5 seconds it is on the pond and the user is sitting on the bench awake."
        // STRICT CHECK: ONLY score when the player is SITTING on the bench and NOT ASLEEP!
        if (playerStateRef.current === 'SITTING') {
          duck.scoreIntervalTimer += dt;
          if (duck.scoreIntervalTimer >= 5.0) {
            duck.scoreIntervalTimer -= 5.0; // Advance interval
            scoreRef.current += duck.value; // Instant synchronous HUD update!
            onScoreIncreaseRef.current(duck.value, duck.type);

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
                vy: -0.6,
                scale: 1,
              });
            } else if (duck.type === 'copper') {
              atariAudio.playCopperDuck();
              floatingsRef.current.push({
                id: 'fl-' + Math.random(),
                text: '+100 COPPER!',
                x: duck.x - 12,
                y: duck.y - 14,
                color: '#FB923C',
                life: 0,
                maxLife: 60,
                vy: -0.7,
                scale: 1.2,
              });
            } else if (duck.type === 'silver') {
              atariAudio.playSilverDuck();
              floatingsRef.current.push({
                id: 'fl-' + Math.random(),
                text: '+200 SILVER!',
                x: duck.x - 12,
                y: duck.y - 14,
                color: '#E2E8F0',
                life: 0,
                maxLife: 65,
                vy: -0.7,
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
                maxLife: 80,
                vy: -0.8,
                scale: 1.5,
              });
            }
          }
        }

        // Stay counter countdown:
        // "then each flies away when it's counter finishes. The metallic ducks have significantly shorter counters."
        duck.pondStayTimer -= dt;
        if (duck.pondStayTimer <= 0) {
          duck.state = 'FLYING_AWAY';
          atariAudio.playDuckTakeoff();

          // Takeoff splash
          for (let p = 0; p < 5; p++) {
            particlesRef.current.push({
              id: 'sp-' + Math.random(),
              x: duck.x + 8,
              y: duck.y + 6,
              vx: (Math.random() - 0.5) * 1.0,
              vy: -0.5 - Math.random() * 0.7,
              color: '#93C5FD',
              life: 0,
              maxLife: 15,
              size: 2,
            });
          }
        }
      } else if (duck.state === 'FLYING_AWAY') {
        // Fly upward into the sky and away off-screen
        duck.y -= 1.1 * 60 * dt;
        duck.x += duck.direction * 1.3 * 60 * dt;

        // Remove once off-screen
        if (duck.y < -35 || duck.x < -40 || duck.x > CANVAS_WIDTH + 40) {
          ducksRef.current.splice(i, 1);
        }
      }
    }

    // Update Floating Text
    for (let i = floatingsRef.current.length - 1; i >= 0; i--) {
      const fl = floatingsRef.current[i];
      fl.life += 1;
      fl.y += fl.vy;
      if (fl.isZZZ) {
        fl.x += Math.sin(fl.life * 0.12) * 0.35;
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
      if (fl.isZZZ) {
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        // Black outline for crisp 8-bit contrast against sky
        ctx.fillStyle = '#000000';
        ctx.fillText(fl.text, Math.floor(fl.x) - 1, Math.floor(fl.y));
        ctx.fillText(fl.text, Math.floor(fl.x) + 1, Math.floor(fl.y));
        ctx.fillText(fl.text, Math.floor(fl.x), Math.floor(fl.y) - 1);
        ctx.fillText(fl.text, Math.floor(fl.x), Math.floor(fl.y) + 1);
        // Bright text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(fl.text, Math.floor(fl.x), Math.floor(fl.y));
      } else {
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.fillStyle = fl.color;
        ctx.fillText(fl.text, Math.floor(fl.x), Math.floor(fl.y));
      }
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

      // Open eye watching pond (square 2x2 with white glint)
      ctx.fillStyle = '#1A202C';
      ctx.fillRect(px + 6, py + 6, 2, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 6, py + 6, 1, 1);

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

      // Open eye watching the ducks intently (square 2x2 with white glint)
      ctx.fillStyle = '#1A202C';
      ctx.fillRect(px + 6, py + 2, 2, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 6, py + 2, 1, 1);

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
      // Slumped asleep on bench (X: 34, Y: 104)
      const px = 34;
      const py = 104;

      // Red Cap tilted back slightly
      ctx.fillStyle = '#E53E3E';
      ctx.fillRect(px + 1, py - 3, 8, 4);
      ctx.fillRect(px + 5, py - 1, 6, 2); // Visor

      // Face in relaxed profile
      ctx.fillStyle = '#FBD38D';
      ctx.fillRect(px + 2, py + 1, 8, 6);

      // Nose curve
      ctx.fillStyle = '#E2B870';
      ctx.fillRect(px + 9, py + 2, 1, 2);

      // "turn his eyes from squares to slits or dashes"
      // Replace open square eye with clear horizontal slit dash (—):
      // Eyelid crease above slit:
      ctx.fillStyle = '#D4A373';
      ctx.fillRect(px + 5, py + 2, 4, 1);
      // Dark closed eyelid slit dash (4x1 pixels):
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 5, py + 3, 4, 1);

      // Relaxed sleeping mouth
      ctx.fillStyle = '#833838';
      ctx.fillRect(px + 6, py + 5, 2, 1);

      // Shirt slumped
      ctx.fillStyle = '#0BC5EA';
      ctx.fillRect(px, py + 7, 9, 8);

      // Limp hands resting on lap
      ctx.fillStyle = '#FBD38D';
      ctx.fillRect(px + 7, py + 11, 4, 3);

      // Sitting bent legs
      ctx.fillStyle = '#2B6CB0';
      ctx.fillRect(px + 1, py + 15, 12, 4);
      ctx.fillRect(px + 9, py + 19, 4, 6);

      // Boots
      ctx.fillStyle = '#744210';
      ctx.fillRect(px + 9, py + 25, 6, 3);

      // Stationary sleeping 'Z' directly above cap for instant visual recognition
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 7px "Press Start 2P", monospace';
      ctx.fillText('Z', px + 7, py - 6);
    }
  }

  function drawAtariDuck(ctx: CanvasRenderingContext2D, duck: Duck) {
    const dx = Math.floor(duck.x);
    const dy = Math.floor(duck.y + (duck.state === 'SWIMMING' ? Math.sin(duck.bobPhase) * 1.5 : 0));
    const dir = duck.direction;
    const isFlying = duck.state === 'FLYING_IN' || duck.state === 'FLYING_AWAY';

    // Wake ripples behind duck in water (only when swimming on pond)
    if (duck.state === 'SWIMMING') {
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

    if (isFlying) {
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 20);

    // Score in bright Atari yellow - Read directly from scoreRef.current!
    ctx.fillStyle = '#FACC15';
    ctx.font = '10px "Press Start 2P", monospace';
    const scoreStr = scoreRef.current.toString().padStart(6, '0');
    ctx.fillText(`${scoreStr}`, 8, 14);

    // High Score on top right - Read directly from highScoreRef.current!
    ctx.fillStyle = '#94A3B8';
    ctx.font = '7px "Press Start 2P", monospace';
    const highStr = highScoreRef.current.toString().padStart(6, '0');
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
        ctx.fillText('BENCH OCCUPIED · SCORING EVERY 5s', 12, CANVAS_HEIGHT - 5);
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
