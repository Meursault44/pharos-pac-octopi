// gameStore.ts
import { create } from 'zustand';
import { RAW_LAYOUT, MAP_COLS, MAP_ROWS, cellKey, isWallAt } from './mapData';
import { useConfig } from './configStore';
import { useDialogsStore } from '@/store/dialogs.ts';
import { sendEvent } from '@/analytics/ga';

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

// helpers над moveSharks (можно добавить рядом с opposite/canPlaceRect)
function isWalkableCell(c: number, r: number) {
  // Проходима, если не стена и в пределах карты
  return c >= 0 && r >= 0 && c < MAP_COLS && r < MAP_ROWS && !isWallAt(c, r);
}

function pickWeighted<T>(items: Array<{ v: T; w: number }>): T {
  let sum = 0;
  for (const it of items) sum += it.w;
  const r = Math.random() * (sum || 1);
  let acc = 0;
  for (const it of items) {
    acc += it.w;
    if (r <= acc) return it.v;
  }
  return items[items.length - 1]!.v;
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

  startGame: () => {
    get().reset();
    set({ isRunning: true });
  },
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
      if (get().score > 1740) {
        set({ isWin: true, gameOver: true, isRunning: false });
        useDialogsStore.getState().setDialogWinGame(true);
      }
      try {
        const { score } = get();
        sendEvent('game_win', {
          score,
          pellets_left: pellets.size, // сколько осталось
        });
      } catch {}
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

      // текущая клетка по ближайшему центру
      const cc = Math.floor((x + tileSize / 2) / tileSize);
      const rr = Math.floor((y + tileSize / 2) / tileSize);
      const cx = cc * tileSize;
      const cy = rr * tileSize;

      // порог: не меньше половины шага, не больше 40% тайла
      const CENTER_EPS = Math.min(tileSize * 0.4, Math.max(0.5, sharkSpeed * 0.6));
      // если мы «пересекли» центр — считаем, что у центра
      const nearCenter = Math.abs(x - cx) <= CENTER_EPS && Math.abs(y - cy) <= CENTER_EPS;

      if (nearCenter) {
        x = cx;
        y = cy;

        // доступные направления по клеткам
        const options: Dir[] = [];
        const neigh: Array<{ d: Dir; c: number; r: number }> = [
          { d: 'up', c: cc, r: rr - 1 },
          { d: 'down', c: cc, r: rr + 1 },
          { d: 'left', c: cc - 1, r: rr },
          { d: 'right', c: cc + 1, r: rr },
        ];

        for (const n of neigh) {
          if (isWalkableCell(n.c, n.r)) options.push(n.d);
        }

        // исключаем мгновенный разворот, если есть другие варианты
        let candidates = options.filter((d0) => d0 !== opposite(dir));
        if (candidates.length === 0) candidates = options.slice(); // тупик — можно назад

        // выбираем случайное направление из доступных
        const forward = dir;
        const leftRight: Dir[] =
          dir === 'up' || dir === 'down' ? ['left', 'right'] : ['up', 'down'];

        const weighted: Array<{ v: Dir; w: number }> = [];
        for (const d0 of options) {
          if (d0 === opposite(dir)) continue; // не разворачиваемся, если есть альтернатива
          if (d0 === forward) weighted.push({ v: d0, w: 0.6 });
          else if (leftRight.includes(d0)) weighted.push({ v: d0, w: 0.2 });
        }
        // если вообще не осталось — значит тупик, можно назад
        if (weighted.length === 0 && options.length > 0) {
          weighted.push({ v: opposite(dir), w: 1 });
        }

        // простой взвешенный выбор
        let sum = 0,
          r = Math.random();
        for (const it of weighted) sum += it.w;
        let acc = 0;
        for (const it of weighted) {
          acc += it.w / sum;
          if (r <= acc) {
            dir = it.v;
            break;
          }
        }
      }

      // шаг по выбранному направлению
      let nx = x,
        ny = y;
      if (dir === 'up') ny -= sharkSpeed;
      else if (dir === 'down') ny += sharkSpeed;
      else if (dir === 'left') nx -= sharkSpeed;
      else nx += sharkSpeed;

      // если упёрлись в стену (могли повернуть слишком поздно) — попробуем
      // альтернативы в приоритете: поворот -> вперёд -> назад
      if (!canPlaceRect(nx, ny)) {
        const alternatives: Dir[] = [];
        if (dir === 'up' || dir === 'down') {
          alternatives.push('left', 'right', dir, opposite(dir));
        } else {
          alternatives.push('up', 'down', dir, opposite(dir));
        }

        let turned = false;

        // слегка «прилипнем» к центру клетки перед попытками повернуть,
        // чтобы габарит прямоугольника не цеплял стену
        const snapX =
          Math.abs(x - cx) <= sharkSpeed
            ? cx
            : x + Math.sign(cx - x) * Math.min(sharkSpeed, Math.abs(cx - x));
        const snapY =
          Math.abs(y - cy) <= sharkSpeed
            ? cy
            : y + Math.sign(cy - y) * Math.min(sharkSpeed, Math.abs(cy - y));

        for (const d2 of alternatives) {
          const tryX =
            d2 === 'left' ? snapX - sharkSpeed : d2 === 'right' ? snapX + sharkSpeed : snapX;
          const tryY =
            d2 === 'up' ? snapY - sharkSpeed : d2 === 'down' ? snapY + sharkSpeed : snapY;
          if (canPlaceRect(tryX, tryY)) {
            dir = d2;
            nx = tryX;
            ny = tryY;
            turned = true;
            break;
          }
        }

        if (!turned) {
          nx = x;
          ny = y;
        }
      }

      return { ...s, x: nx, y: ny, dir };
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
        dir: 'up',
      },
    });
  },
}));
