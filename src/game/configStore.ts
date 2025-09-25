import { create } from "zustand";
import { MAP_COLS } from "./mapData";

// Базовые значения при "историческом" TILE_SIZE = 60
const BASE_TILE = 60;
const BASE_PACMAN_SPEED = 2.8; // px/tick
const BASE_SHARK_SPEED  = 2.8; // px/tick
const BASE_HITBOX       = 46;  // px
const BASE_DISPLACEMENT_SCALE = 30;

type ConfigState = {
    tileSize: number;        // текущая ширина клетки в px
    pacmanSpeed: number;     // масштабируется вместе с tileSize
    sharkSpeed: number;      // "
    pacmanHitbox: number;    // "
    displacementScale: number;
    setByCanvasWidth: (canvasWidthPx: number) => void;
};

export const useConfig = create<ConfigState>()((set) => ({
    tileSize: BASE_TILE,
    pacmanSpeed: BASE_PACMAN_SPEED,
    sharkSpeed: BASE_SHARK_SPEED,
    pacmanHitbox: BASE_HITBOX,
    displacementScale: BASE_DISPLACEMENT_SCALE,
    setByCanvasWidth: (canvasWidthPx: number) => {
        const raw = Math.floor(canvasWidthPx / MAP_COLS);
        // не даём клетке стать слишком маленькой/огромной
        const tileSize = Math.min(90, raw);
        const scale = tileSize / BASE_TILE;

        set({
            tileSize,
            pacmanSpeed: BASE_PACMAN_SPEED * scale,
            sharkSpeed:  BASE_SHARK_SPEED  * scale,
            pacmanHitbox: Math.round(BASE_HITBOX * scale),
            displacementScale: BASE_DISPLACEMENT_SCALE * scale,
        });
    },
}));
