// src/game/gameStore.ts
import { create } from 'zustand';
import { RAW_LAYOUT, MAP_COLS, MAP_ROWS, cellKey } from './mapData';

type Eaten = 'pellet' | 'power' | null;

type GameState = {
    pellets: Set<string>;       // '.'  (ключ — "c,r")
    powerPellets: Set<string>;  // 'o'
    score: number;

    initFromLayout: () => void;
    consume: (c: number, r: number) => Eaten;
    reset: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
    pellets: new Set(),
    powerPellets: new Set(),
    score: 0,

    initFromLayout: () => {
        const pellets = new Set<string>();
        const powerPellets = new Set<string>();
        for (let r = 0; r < MAP_ROWS; r++) {
            const line = RAW_LAYOUT[r];
            for (let c = 0; c < MAP_COLS; c++) {
                const ch = line[c];
                if (ch === '.') pellets.add(cellKey(c, r));
                else if (ch === 'o') powerPellets.add(cellKey(c, r));
            }
        }
        set({ pellets, powerPellets, score: 0 });
    },

    consume: (c, r) => {
        const k = cellKey(c, r);
        const { pellets, powerPellets } = get();
        if (pellets.has(k)) {
            pellets.delete(k);
            set((s) => {
                const next = s.score + 10;
                console.log('score:', next);
                return { pellets: new Set(pellets), score: next };
            });
            return 'pellet';
        }
        if (powerPellets.has(k)) {
            powerPellets.delete(k);
            set((s) => {
                const next = s.score + 50;
                console.log('score:', next);
                return { powerPellets: new Set(powerPellets), score: next };
            });
            return 'power';
        }
        return null;
    },

    reset: () => get().initFromLayout(),
}));
