// Pacman.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Assets, Texture } from 'pixi.js';
import { useTick } from '@pixi/react';
import { isWallAt, MAP_COLS, MAP_ROWS } from '@/game/mapData';
import { useConfig } from '@/game/configStore';
import { useGameStore } from '@/game/gameStore';
import { useDialogsStore } from '@/store/dialogs';
import { PacmanAnim } from './PacmanAnim';
import useSound from 'use-sound';
import pelletSfx from '@/sounds/slurping-is-short.mp3';

type Dir = 'up' | 'down' | 'left' | 'right';

const keyMap: Record<string, Dir | 'space' | undefined> = {
  Space: 'space',
  KeyW: 'up',
  ArrowUp: 'up',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyD: 'right',
  ArrowRight: 'right',
};

const isOpposite = (a: Dir, b: Dir) =>
  (a === 'up' && b === 'down') ||
  (a === 'down' && b === 'up') ||
  (a === 'left' && b === 'right') ||
  (a === 'right' && b === 'left');

// --- Настройки свайпа
const SWIPE_MIN_PX = 24;
const SWIPE_TIME_MS = 600;

export const Pacman = () => {
  const TILE_SIZE = useConfig((s) => s.tileSize);
  const PACMAN_SPEED = useConfig((s) => s.pacmanSpeed);
  const PACMAN_HITBOX = useConfig((s) => s.pacmanHitbox);
  const [playPellet] = useSound(pelletSfx, {
    volume: 0.1, // подстрой по вкусу
    interrupt: true, // обрывает предыдущий звук, если новый стартует
  });

  const SPRITE_SIZE = TILE_SIZE;
  const HITBOX_PAD = (SPRITE_SIZE - PACMAN_HITBOX) / 2;

  const pacman = useGameStore((s) => s.pacman);
  const setPacmanPos = useGameStore((s) => s.setPacmanPos);
  const setPacmanDir = useGameStore((s) => s.setPacmanDir);
  const consume = useGameStore((s) => s.consume);
  const sharks = useGameStore((s) => s.sharks);
  const gameOver = useGameStore((s) => s.gameOver);
  const endGame = useGameStore((s) => s.endGame);
  const isRunning = useGameStore((s) => s.isRunning);
  const startGame = useGameStore((s) => s.startGame);

  const { setDialogLoseGame } = useDialogsStore();

  const [frames, setFrames] = useState<Texture[] | null>(null);
  const [shouldEndGame, setShouldEndGame] = useState(false);
  const queuedDirRef = useRef<Dir | null>(null);

  const posRef = useRef(pacman);
  useEffect(() => {
    posRef.current = pacman;
  }, [pacman]);

  // --- Геометрические пороги
  // поперечный допуск к центру коридора (узкий, чтобы не цеплять стенку)
  const PERP_EPS = Math.min(TILE_SIZE * 0.35, Math.max(0.5, PACMAN_SPEED * 0.6));
  // продольный допуск (шире, фактически не критичен благодаря "пересечению центра")
  const LONG_EPS = Math.min(TILE_SIZE * 0.45, Math.max(0.5, PACMAN_SPEED * 1.2));

  const cellCenter = (x: number, y: number) => {
    const cc = Math.floor((x + TILE_SIZE / 2) / TILE_SIZE);
    const rr = Math.floor((y + TILE_SIZE / 2) / TILE_SIZE);
    return { cx: cc * TILE_SIZE, cy: rr * TILE_SIZE };
  };

  // --- Детектор: пройдём ли мы центр клетки за этот кадр по текущему направлению
  const willCrossCenter = (x: number, y: number, dir: Dir, speed: number) => {
    const { cx, cy } = cellCenter(x, y);
    const nx = dir === 'left' ? x - speed : dir === 'right' ? x + speed : x;
    const ny = dir === 'up' ? y - speed : dir === 'down' ? y + speed : y;
    const crossX = (x - cx) * (nx - cx) <= 0; // поменяли знак или стали 0
    const crossY = (y - cy) * (ny - cy) <= 0;
    if (dir === 'left' || dir === 'right') return crossX;
    return crossY;
  };

  // --- Управление/очередь разворота
  const applyDirection = useCallback(
    (d: Dir) => {
      const curr = posRef.current.dir as Dir;
      if (isOpposite(d, curr)) {
        queuedDirRef.current = null;
        setPacmanDir(d);
        return;
      }
      if (d === curr) return;
      queuedDirRef.current = d;
    },
    [setPacmanDir],
  );

  const keyDownHandler = useCallback(
    (e: KeyboardEvent) => {
      const d = keyMap[e.code];
      if (!d || gameOver) return;
      if (d === 'space') {
        if (!isRunning) startGame();
        return;
      }
      applyDirection(d);
    },
    [gameOver, isRunning, startGame, applyDirection],
  );

  useEffect(() => {
    const keyUpHandler = () => {};
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, [keyDownHandler]);

  // --- Тач-свайпы
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (gameOver || !isRunning) return;
      const t = e.touches[0];
      if (!t) return;
      touchStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
      e.preventDefault();
    },
    [gameOver, isRunning, startGame],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (gameOver || !isRunning) return;
      const st = touchStartRef.current;
      touchStartRef.current = null;
      if (!st) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dt = Date.now() - st.t;
      if (dt > SWIPE_TIME_MS) return;
      const dx = t.clientX - st.x;
      const dy = t.clientY - st.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (adx < SWIPE_MIN_PX && ady < SWIPE_MIN_PX) {
        e.preventDefault();
        return;
      }
      let d: Dir;
      if (adx > ady) d = dx > 0 ? 'right' : 'left';
      else d = dy > 0 ? 'down' : 'up';
      applyDirection(d);
      e.preventDefault();
    },
    [applyDirection, gameOver, isRunning],
  );

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false });
    window.addEventListener('touchend', handleTouchEnd as EventListener, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart as EventListener);
      window.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchEnd]);

  // --- Коллизия с акулами
  const checkSharkCollision = useCallback(
    (x: number, y: number) => {
      const hbX = x + HITBOX_PAD;
      const hbY = y + HITBOX_PAD;
      const hbR = hbX + PACMAN_HITBOX;
      const hbB = hbY + PACMAN_HITBOX;
      for (const sh of sharks) {
        const sx = sh.x,
          sy = sh.y;
        const sr = sx + TILE_SIZE,
          sb = sy + TILE_SIZE;
        if (hbX < sr && hbR > sx && hbY < sb && hbB > sy) return true;
      }
      return false;
    },
    [sharks, HITBOX_PAD, PACMAN_HITBOX, TILE_SIZE],
  );

  // --- Проверка шага (с микрозазором)
  const canStep = useCallback(
    (x: number, y: number, dir: Dir) => {
      let nx = x,
        ny = y;
      if (dir === 'up') ny -= PACMAN_SPEED;
      else if (dir === 'down') ny += PACMAN_SPEED;
      else if (dir === 'left') nx -= PACMAN_SPEED;
      else nx += PACMAN_SPEED;

      const GEO_EPS = 0.001;
      const hbX = nx + HITBOX_PAD;
      const hbY = ny + HITBOX_PAD;
      const hbRight = hbX + PACMAN_HITBOX - GEO_EPS;
      const hbBottom = hbY + PACMAN_HITBOX - GEO_EPS;

      if (hbX < 0 || hbY < 0 || hbRight > MAP_COLS * TILE_SIZE || hbBottom > MAP_ROWS * TILE_SIZE)
        return null;

      const c0 = Math.floor(hbX / TILE_SIZE);
      const r0 = Math.floor(hbY / TILE_SIZE);
      const c1 = Math.floor(hbRight / TILE_SIZE);
      const r1 = Math.floor(hbBottom / TILE_SIZE);

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (isWallAt(c, r)) return null;
        }
      }
      return { x: nx, y: ny };
    },
    [PACMAN_SPEED, HITBOX_PAD, PACMAN_HITBOX, TILE_SIZE],
  );

  // --- Магнит к центру по поперечной оси (без продвижения вперёд)
  const applyPerpMagnet = (x: number, y: number, dir: Dir) => {
    const { cx, cy } = cellCenter(x, y);
    if (dir === 'up' || dir === 'down') {
      const dy = 0; // не трогаем продольную ось
      const ax = Math.min(PACMAN_SPEED, Math.abs(cx - x));
      const dx = Math.sign(cx - x) * ax;
      if (Math.abs(cx - x) <= PERP_EPS) return { x, y };
      return { x: x + dx, y: y + dy };
    } else {
      const dx = 0;
      const ay = Math.min(PACMAN_SPEED, Math.abs(cy - y));
      const dy = Math.sign(cy - y) * ay;
      if (Math.abs(cy - y) <= PERP_EPS) return { x, y };
      return { x: x + dx, y: y + dy };
    }
  };

  // --- Основная анимация
  const animate = useCallback(() => {
    if (gameOver || !isRunning) return;

    let { x, y, dir } = posRef.current;

    // 1) Подтягиваем к центру по поперечной оси (чтобы поворот «влез»)
    const afterMagnet = applyPerpMagnet(x, y, dir);
    x = afterMagnet.x;
    y = afterMagnet.y;

    const { cx, cy } = cellCenter(x, y);
    const perpOk =
      dir === 'left' || dir === 'right'
        ? Math.abs(y - cy) <= PERP_EPS
        : Math.abs(x - cx) <= PERP_EPS;

    // 2) Поворот: если в очереди есть направление и (мы близко к центру продольно или пролетим центр на этом шаге)
    const q = queuedDirRef.current;
    if (q && perpOk) {
      const willCross = willCrossCenter(x, y, dir, PACMAN_SPEED);
      const longOk =
        dir === 'left' || dir === 'right'
          ? Math.abs(x - cx) <= LONG_EPS || willCross
          : Math.abs(y - cy) <= LONG_EPS || willCross;

      if (longOk) {
        // снап к центру и пробуем повернуть
        const snappedX = cx;
        const snappedY = cy;
        const tryTurn = canStep(snappedX, snappedY, q);
        if (tryTurn) {
          setPacmanDir(q);
          queuedDirRef.current = null;
          dir = q;
          x = tryTurn.x;
          y = tryTurn.y;
        }
        // если нельзя — держим очередь и поедем дальше прямо
      }
    }

    // 3) Шаг вперёд по активному направлению
    const step = canStep(x, y, dir);
    if (!step) {
      // В стену: стоим, пока не окажемся у центра для валидного поворота
      return;
    }

    if (checkSharkCollision(step.x, step.y)) {
      setShouldEndGame(true);
      return;
    }

    setPacmanPos(step.x, step.y);
    posRef.current = { x: step.x, y: step.y, dir };
  }, [
    gameOver,
    isRunning,
    setPacmanDir,
    canStep,
    checkSharkCollision,
    setPacmanPos,
    PACMAN_SPEED,
    PERP_EPS,
    LONG_EPS,
  ]);

  useTick(animate);

  // --- Загрузка кадров
  useEffect(() => {
    let alive = true;
    (async () => {
      const modules = import.meta.glob('../../assets/pacman_frames/*-removebg-preview.png', {
        eager: true,
      });
      const entries = Object.entries(modules)
        .map(([path, mod]) => {
          const url = (mod as any).default as string;
          const m = path.match(/(\d+)-removebg-preview\.png$/);
          const idx = m ? parseInt(m[1], 10) : 0;
          return { idx, url };
        })
        .sort((a, b) => a.idx - b.idx);

      const urls = entries.map((e) => e.url);
      if (urls.length === 0) {
        console.warn('Нет кадров для пакмана');
        if (!alive) return;
        setFrames([]);
        return;
      }

      await Assets.load(urls);
      if (!alive) return;
      const fr = urls.map((u) => Texture.from(u));
      setFrames(fr);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // --- Еда + проверка акул по позиции
  const lastCellRef = useRef<string>('');
  // --- Еда + проверка акул по позиции
  useEffect(() => {
    if (gameOver) return;

    const centerX = pacman.x + SPRITE_SIZE / 2;
    const centerY = pacman.y + SPRITE_SIZE / 2;
    const col = Math.floor(centerX / TILE_SIZE);
    const row = Math.floor(centerY / TILE_SIZE);
    const k = `${col},${row}`;

    if (k !== lastCellRef.current) {
      lastCellRef.current = k;
      const eaten = consume(col, row); // <— получаем результат
      if (eaten === 'pellet') {
        playPellet(); // <— звук «съедено»
      }
    }

    if (checkSharkCollision(pacman.x, pacman.y)) {
      setShouldEndGame(true);
    }
  }, [
    pacman.x,
    pacman.y,
    consume,
    gameOver,
    checkSharkCollision,
    TILE_SIZE,
    SPRITE_SIZE,
    playPellet,
  ]);

  // --- Завершение игры
  useEffect(() => {
    if (!shouldEndGame) return;
    endGame();
    setShouldEndGame(false);
    setDialogLoseGame(true);
  }, [shouldEndGame, endGame, setDialogLoseGame]);

  if (!frames || frames.length === 0) return null;

  const rotation =
    pacman.dir === 'right'
      ? Math.PI / 2
      : pacman.dir === 'down'
        ? Math.PI
        : pacman.dir === 'left'
          ? -Math.PI / 2
          : 0;

  const renderX = pacman.x + SPRITE_SIZE / 2;
  const renderY = pacman.y + SPRITE_SIZE / 2;

  return (
    <PacmanAnim
      textures={frames}
      x={renderX}
      y={renderY}
      size={SPRITE_SIZE}
      speed={isRunning ? 2 : 0.6}
      rotation={rotation}
    />
  );
};
