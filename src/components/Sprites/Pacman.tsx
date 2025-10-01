// Pacman.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Assets, Texture } from 'pixi.js';
import { useTick } from '@pixi/react';
import { isWallAt, MAP_COLS, MAP_ROWS } from '@/game/mapData';
import { useConfig } from '@/game/configStore';
import { useGameStore } from '@/game/gameStore';
import { useDialogsStore } from '@/store/dialogs';
import { PacmanAnim } from './PacmanAnim';

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
const SWIPE_MIN_PX = 24; // минимальная длина свайпа
const SWIPE_TIME_MS = 600; // максимальная длительность свайпа

export const Pacman = () => {
  const TILE_SIZE = useConfig((s) => s.tileSize);
  const PACMAN_SPEED = useConfig((s) => s.pacmanSpeed);
  const PACMAN_HITBOX = useConfig((s) => s.pacmanHitbox);

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

  // Кадры спрайта
  const [frames, setFrames] = useState<Texture[] | null>(null);
  // Флаг завершения
  const [shouldEndGame, setShouldEndGame] = useState(false);
  // Заготовленный поворот (одно направление максимум)
  const queuedDirRef = useRef<Dir | null>(null);

  // Актуальная позиция/направление
  const posRef = useRef(pacman);
  useEffect(() => {
    posRef.current = pacman;
  }, [pacman]);

  // --- Применение направления (общее для клавиш и свайпа)
  const applyDirection = useCallback(
    (d: Dir) => {
      const curr = posRef.current.dir as Dir;
      if (isOpposite(d, curr)) {
        // Мгновенный разворот
        queuedDirRef.current = null;
        setPacmanDir(d);
        return;
      }
      if (d === curr) return;
      // Иначе — сохранить единственную заготовку (заменяя предыдущую)
      queuedDirRef.current = d;
    },
    [setPacmanDir],
  );

  // --- Управление клавишами
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

  const keyUpHandler = useCallback(() => {}, []);

  useEffect(() => {
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, [keyDownHandler, keyUpHandler]);

  // --- Управление свайпами (тач)
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (gameOver) return;
      const t = e.touches[0];
      if (!t) return;

      touchStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };

      // Первый тап — запуск игры (аналог пробела)
      if (!isRunning) startGame();

      // чтобы страница не скроллилась/зумалась
      e.preventDefault();
    },
    [gameOver, isRunning, startGame],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (gameOver) return;
      const st = touchStartRef.current;
      touchStartRef.current = null;
      if (!st) return;

      const t = e.changedTouches[0];
      if (!t) return;

      const dt = Date.now() - st.t;
      if (dt > SWIPE_TIME_MS) return; // слишком долгий жест — игнор

      const dx = t.clientX - st.x;
      const dy = t.clientY - st.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (adx < SWIPE_MIN_PX && ady < SWIPE_MIN_PX) {
        // короткий тап — уже запустили игру на touchstart (если нужно)
        e.preventDefault();
        return;
      }

      let d: Dir;
      if (adx > ady) d = dx > 0 ? 'right' : 'left';
      else d = dy > 0 ? 'down' : 'up';

      applyDirection(d);
      e.preventDefault();
    },
    [applyDirection, gameOver],
  );

  useEffect(() => {
    // Вешаем на window, чтобы накрыть всю область
    // ВАЖНО: passive: false — чтобы работал preventDefault()
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

  // --- Проверка шага
  const canStep = useCallback(
    (x: number, y: number, dir: Dir) => {
      let nx = x,
        ny = y;
      if (dir === 'up') ny -= PACMAN_SPEED;
      else if (dir === 'down') ny += PACMAN_SPEED;
      else if (dir === 'left') nx -= PACMAN_SPEED;
      else nx += PACMAN_SPEED;

      const hbX = nx + HITBOX_PAD;
      const hbY = ny + HITBOX_PAD;
      const hbRight = hbX + PACMAN_HITBOX;
      const hbBottom = hbY + PACMAN_HITBOX;

      if (hbX < 0 || hbY < 0 || hbRight > MAP_COLS * TILE_SIZE || hbBottom > MAP_ROWS * TILE_SIZE)
        return null;

      const c0 = Math.floor(hbX / TILE_SIZE);
      const r0 = Math.floor(hbY / TILE_SIZE);
      const c1 = Math.floor((hbRight - 1) / TILE_SIZE);
      const r1 = Math.floor((hbBottom - 1) / TILE_SIZE);

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (isWallAt(c, r)) return null;
        }
      }
      return { x: nx, y: ny };
    },
    [PACMAN_SPEED, HITBOX_PAD, PACMAN_HITBOX, TILE_SIZE],
  );

  // --- Анимация и движение: всегда плывём
  const animate = useCallback(() => {
    if (gameOver || !isRunning) return;

    const { x, y, dir } = posRef.current;

    // Пробуем выполнить заготовленный поворот, если он возможен из текущей клетки
    let activeDir: Dir = dir;
    const q = queuedDirRef.current;
    if (q) {
      const tryTurn = canStep(x, y, q);
      if (tryTurn) {
        activeDir = q;
        queuedDirRef.current = null; // поворот выполнен
        setPacmanDir(activeDir);
      }
    }

    // Двигаемся по активному направлению
    const step = canStep(x, y, activeDir);
    if (!step) {
      // Уперлись в стену: не двигаемся (ждём, пока игрок задаст допустимый поворот)
      return;
    }

    if (checkSharkCollision(step.x, step.y)) {
      setShouldEndGame(true);
      return;
    }

    setPacmanPos(step.x, step.y);
    posRef.current = { ...step, dir: activeDir };
  }, [gameOver, isRunning, canStep, checkSharkCollision, setPacmanPos, setPacmanDir]);

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
  useEffect(() => {
    if (gameOver) return;

    const centerX = pacman.x + SPRITE_SIZE / 2;
    const centerY = pacman.y + SPRITE_SIZE / 2;
    const col = Math.floor(centerX / TILE_SIZE);
    const row = Math.floor(centerY / TILE_SIZE);
    const k = `${col},${row}`;

    if (k !== lastCellRef.current) {
      lastCellRef.current = k;
      consume(col, row);
    }

    if (checkSharkCollision(pacman.x, pacman.y)) {
      setShouldEndGame(true);
    }
  }, [pacman.x, pacman.y, consume, gameOver, checkSharkCollision, TILE_SIZE, SPRITE_SIZE]);

  // --- Завершение игры
  useEffect(() => {
    if (!shouldEndGame) return;
    endGame();
    setShouldEndGame(false);
    setDialogLoseGame(true);
  }, [shouldEndGame, endGame, setDialogLoseGame]);

  if (!frames || frames.length === 0) return null;

  // Вращение и скорость анимации теперь не зависят от зажатых клавиш
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
      speed={isRunning ? 2 : 0.6} // всегда «плывём» в игре
      rotation={rotation}
    />
  );
};
