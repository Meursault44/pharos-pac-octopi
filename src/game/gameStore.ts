import { create } from 'zustand';
import { RAW_LAYOUT, MAP_COLS, MAP_ROWS, cellKey } from './mapData';

type Eaten = 'pellet' | null;

type GameState = {
    pellets: Set<string>;   // '.'
    sharks: Set<string>;    // 'o'
    score: number;
    gameOver: boolean;

    initFromLayout: () => void;
    consume: (c: number, r: number) => Eaten; // поедаем только обычные пеллеты
    endGame: () => void;
    reset: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
    pellets: new Set(),
    sharks: new Set(),
    score: 0,
    gameOver: false,

    initFromLayout: () => {
        const pellets = new Set<string>();
        const sharks = new Set<string>();
        for (let r = 0; r < MAP_ROWS; r++) {
            const line = RAW_LAYOUT[r];
            for (let c = 0; c < MAP_COLS; c++) {
                const ch = line[c];
                if (ch === '.') pellets.add(cellKey(c, r));
                else if (ch === 'o') sharks.add(cellKey(c, r));
            }
        }
        set({ pellets, sharks, score: 0, gameOver: false });
    },

    // Едим только обычные точки
    consume: (c, r) => {
        const k = cellKey(c, r);
        const { pellets } = get();
        if (pellets.has(k)) {
            pellets.delete(k);
            set((s) => {
                const next = s.score + 10;
                console.log('score:', next);
                return { pellets: new Set(pellets), score: next };
            });
            return 'pellet';
        }
        return null;
    },

    endGame: () => set({ gameOver: true }),

    reset: () => get().initFromLayout(),
}));
