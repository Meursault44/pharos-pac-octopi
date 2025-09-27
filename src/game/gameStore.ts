// gameStore.ts
import { create } from 'zustand';
import { RAW_LAYOUT, MAP_COLS, MAP_ROWS, cellKey, isWallAt } from './mapData';
import { useConfig } from './configStore';

type Eaten = 'pellet' | null;
type Dir = 'up' | 'down' | 'left' | 'right';
export type Shark = { id: number; x: number; y: number; dir: Dir };

// координаты стартовой позиции пакмана
const START_COL = 12;
const START_ROW = 8;

function opposite(d: Dir): Dir {
  if (d === 'up') return 'down';
  if (d === 'down') return 'up';
  if (d === 'left') return 'right';
  return 'left';
}

function canPlaceRect(nx: number, ny: number) {
  const { tileSize } = useConfig.getState();
  const right = nx + tileSize;
  const bottom = ny + tileSize;
  if (nx < 0 || ny < 0 || right > MAP_COLS * tileSize || bottom > MAP_ROWS * tileSize) return false;

  const c0 = Math.floor(nx / tileSize);
  const r0 = Math.floor(ny / tileSize);
  const c1 = Math.floor((right - 1) / tileSize);
  const r1 = Math.floor((bottom - 1) / tileSize);

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (isWallAt(c, r)) return false;
    }
  }
  return true;
}

export type GameState = {
  pellets: Set<string>;
  sharks: Shark[];
  score: number;
  gameOver: boolean;
  isWin: boolean;
  isRunning: boolean;

  // 🟡 Позиция пакмана:
  pacman: { x: number; y: number; dir: Dir };

  // Методы
  startGame: () => void;
  initFromLayout: () => void;
  consume: (c: number, r: number) => Eaten;
  moveSharks: () => void;
  endGame: () => void;
  setIsWin: (val: boolean) => void;
  reset: () => void;

  // 🟡 Методы пакмана:
  setPacmanPos: (x: number, y: number) => void;
  setPacmanDir: (dir: Dir) => void;
  resetPacman: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  pellets: new Set(),
  sharks: [],
  score: 0,
  isWin: false,
  gameOver: false,
  isRunning: false,

  // стартовая позиция пакмана
  pacman: { x: 0, y: 0, dir: 'right' },

  startGame: () => set({ isRunning: true }),
  setIsWin: (val) => set({ isWin: val }),

  initFromLayout: () => {
    const pellets = new Set<string>();
    const sharks: Shark[] = [];
    let id = 1;
    const { tileSize } = useConfig.getState();

    for (let r = 0; r < MAP_ROWS; r++) {
      const line = RAW_LAYOUT[r];
      for (let c = 0; c < MAP_COLS; c++) {
        const ch = line[c];
        if (ch === '.') pellets.add(cellKey(c, r));
        else if (ch === 'o') {
          sharks.push({
            id: id++,
            x: c * tileSize,
            y: r * tileSize,
            dir: 'left',
          });
        }
      }
    }

    // сбрасываем всё и пакмана
    set({
      pellets,
      sharks,
      score: 0,
      gameOver: false,
      isRunning: false,
    });
    get().resetPacman();
  },

  consume: (c, r) => {
    const k = cellKey(c, r);
    const { pellets } = get();
    if (pellets.has(k)) {
      pellets.delete(k);
      set((s) => ({ pellets: new Set(pellets), score: s.score + 10 }));
      if (get().score > 3000) {
        set({ isWin: true, gameOver: true, isRunning: false });
      }
      return 'pellet';
    }
    return null;
  },

  moveSharks: () => {
    const { sharks, gameOver, isRunning } = get();
    if (gameOver || !isRunning || sharks.length === 0) return;

    const { tileSize, sharkSpeed } = useConfig.getState();

    const next = sharks.map((s) => {
      let { x, y, dir } = s;
      const inCenter = x % tileSize === 0 && y % tileSize === 0;

      if (inCenter) {
        const options: { dir: Dir; nx: number; ny: number }[] = [];
        const tryDir = (d: Dir, dx: number, dy: number) => {
          const nx = x + dx;
          const ny = y + dy;
          if (canPlaceRect(nx, ny)) options.push({ dir: d, nx, ny });
        };

        tryDir('up', 0, -sharkSpeed);
        tryDir('down', 0, sharkSpeed);
        tryDir('left', -sharkSpeed, 0);
        tryDir('right', sharkSpeed, 0);

        const filtered = options.filter((o) => o.dir !== opposite(dir));
        const pickFrom = filtered.length ? filtered : options;

        if (pickFrom.length) {
          const keepCurrent = pickFrom.some((o) => o.dir === dir) && Math.random() < 0.6;
          if (!keepCurrent) {
            const choice = pickFrom[Math.floor(Math.random() * pickFrom.length)];
            dir = choice.dir;
          }
        }
      }

      let nx = x,
        ny = y;
      if (dir === 'up') ny -= sharkSpeed;
      else if (dir === 'down') ny += sharkSpeed;
      else if (dir === 'left') nx -= sharkSpeed;
      else nx += sharkSpeed;

      if (!canPlaceRect(nx, ny)) {
        dir = opposite(dir);
      } else {
        x = nx;
        y = ny;
      }

      return { ...s, x, y, dir };
    });

    set({ sharks: next });
  },

  endGame: () => set({ gameOver: true, isRunning: false }),

  reset: () => {
    get().initFromLayout();
    get().resetPacman();
  },

  // === 🟡 Методы пакмана ===
  setPacmanPos: (x, y) => set((s) => ({ pacman: { ...s.pacman, x, y } })),
  setPacmanDir: (dir) => set((s) => ({ pacman: { ...s.pacman, dir } })),
  resetPacman: () => {
    const { tileSize } = useConfig.getState();
    set({
      pacman: {
        x: START_COL * tileSize,
        y: START_ROW * tileSize,
        dir: 'right',
      },
    });
  },
}));
