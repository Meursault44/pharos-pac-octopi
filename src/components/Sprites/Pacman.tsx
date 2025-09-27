// Pacman.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Assets, Texture } from 'pixi.js';
import { useTick } from '@pixi/react';
import { isWallAt, MAP_COLS, MAP_ROWS } from '@/game/mapData';
import { useConfig } from '@/game/configStore';
import { useGameStore } from '@/game/gameStore';
import { useDialogsStore } from '@/store/dialogs.ts';
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

export const Pacman = () => {
  const TILE_SIZE = useConfig((s) => s.tileSize);
  const PACMAN_SPEED = useConfig((s) => s.pacmanSpeed);
  const PACMAN_HITBOX = useConfig((s) => s.pacmanHitbox);

  const SPRITE_SIZE = TILE_SIZE;
  const HITBOX_PAD = (SPRITE_SIZE - PACMAN_HITBOX) / 2;

  const [position, setPosition] = useState({ x: TILE_SIZE * 12, y: TILE_SIZE * 8 });
  const posRef = useRef(position);

  const [pressed, setPressed] = useState<Dir[]>([]);
  const [movingDir, setMovingDir] = useState<Dir>('right');
  const [frames, setFrames] = useState<Texture[] | null>(null);

  const { setDialogLoseGame } = useDialogsStore();
  const consume = useGameStore((s) => s.consume);
  const sharks = useGameStore((s) => s.sharks);
  const gameOver = useGameStore((s) => s.gameOver);
  const endGame = useGameStore((s) => s.endGame);

  // NEW:
  const isRunning = useGameStore((s) => s.isRunning);
  const startGame = useGameStore((s) => s.startGame);

  const [shouldEndGame, setShouldEndGame] = useState(false);

  const keyDownHandler = useCallback(
      (e: KeyboardEvent) => {
        const dir = keyMap[e.code];
        if (!dir || gameOver) return;

        if (dir === 'space') {
          if (!isRunning) startGame();
          return;
        }

        // разрешаем складывать направления даже в паузе — по желанию можно это ограничить
        setPressed((prev) => (prev.includes(dir) ? prev : [...prev, dir]));
      },
      [gameOver, isRunning, startGame],
  );

  const keyUpHandler = useCallback((e: KeyboardEvent) => {
    const dir = keyMap[e.code];
    if (!dir || dir === 'space') return;
    setPressed((prev) => prev.filter((d) => d !== dir));
  }, []);

  const checkSharkCollision = useCallback(
      (x: number, y: number) => {
        const hbX = x + HITBOX_PAD;
        const hbY = y + HITBOX_PAD;
        const hbR = hbX + PACMAN_HITBOX;
        const hbB = hbY + PACMAN_HITBOX;

        for (const sh of sharks) {
          const sx = sh.x, sy = sh.y;
          const sr = sx + TILE_SIZE, sb = sy + TILE_SIZE;
          if (hbX < sr && hbR > sx && hbY < sb && hbB > sy) return true;
        }
        return false;
      },
      [sharks, HITBOX_PAD, PACMAN_HITBOX, TILE_SIZE],
  );

  const canStep = useCallback(
      (x: number, y: number, dir: Dir) => {
        let nx = x, ny = y;
        if (dir === 'up') ny -= PACMAN_SPEED;
        else if (dir === 'down') ny += PACMAN_SPEED;
        else if (dir === 'left') nx -= PACMAN_SPEED;
        else nx += PACMAN_SPEED;

        const hbX = nx + HITBOX_PAD;
        const hbY = ny + HITBOX_PAD;
        const hbRight = hbX + PACMAN_HITBOX;
        const hbBottom = hbY + PACMAN_HITBOX;

        if (hbX < 0 || hbY < 0 || hbRight > MAP_COLS * TILE_SIZE || hbBottom > MAP_ROWS * TILE_SIZE) {
          return null;
        }
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

  const animate = useCallback(() => {
    // NEW: не двигаемся, если игра не запущена
    if (gameOver || !isRunning || pressed.length === 0) return;

    const { x, y } = posRef.current;

    let chosenDir: Dir | null = null;
    let nextPos: { x: number; y: number } | null = null;

    for (let i = pressed.length - 1; i >= 0; i--) {
      const d = pressed[i];
      const np = canStep(x, y, d);
      if (np) {
        chosenDir = d;
        nextPos = np;
        break;
      }
    }

    if (!nextPos || !chosenDir) return;

    if (checkSharkCollision(nextPos.x, nextPos.y)) {
      setShouldEndGame(true);
      return;
    }

    setPosition(nextPos);
    posRef.current = nextPos;
    setMovingDir(chosenDir);
  }, [pressed, gameOver, isRunning, canStep, checkSharkCollision]);

  useTick(animate);
  useEffect(() => { posRef.current = position; }, [position]);

  // Загрузка кадров — без изменений
  useEffect(() => {
    let alive = true;
    (async () => {
      const modules = import.meta.glob('../../assets/pacman_frames/*-removebg-preview.png', { eager: true });
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
    return () => { alive = false; };
  }, []);

  // поедание точек + проверка акул — как было
  const lastCellRef = useRef<string>('');
  useEffect(() => {
    if (gameOver) return;

    const centerX = position.x + SPRITE_SIZE / 2;
    const centerY = position.y + SPRITE_SIZE / 2;
    const col = Math.floor(centerX / TILE_SIZE);
    const row = Math.floor(centerY / TILE_SIZE);
    const k = `${col},${row}`;
    if (k !== lastCellRef.current) {
      lastCellRef.current = k;
      consume(col, row);
    }

    if (checkSharkCollision(position.x, position.y)) {
      setShouldEndGame(true);
    }
  }, [position.x, position.y, consume, gameOver, checkSharkCollision, TILE_SIZE, SPRITE_SIZE]);

  useEffect(() => {
    if (!shouldEndGame) return;
    endGame();
    setShouldEndGame(false);
    setDialogLoseGame(true);
  }, [shouldEndGame, endGame, setDialogLoseGame]);

  useEffect(() => {
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, [keyDownHandler, keyUpHandler]);

  if (!frames || frames.length === 0) return null;

  const rotation = !pressed.length
      ? 0
      : movingDir === 'right'
          ? Math.PI / 2
          : movingDir === 'down'
              ? Math.PI
              : movingDir === 'left'
                  ? -Math.PI / 2
                  : 0;

  const renderX = position.x + SPRITE_SIZE / 2;
  const renderY = position.y + SPRITE_SIZE / 2;

  return (
      <PacmanAnim
          textures={frames}
          x={renderX}
          y={renderY}
          size={SPRITE_SIZE}
          speed={!pressed.length ? 0.6 : 2}
          rotation={rotation}
      />
  );
};
