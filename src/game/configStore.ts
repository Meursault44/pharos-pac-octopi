import { create } from 'zustand';
import { MAP_COLS, MAP_ROWS } from './mapData';

// === БАЗОВЫЕ ЗНАЧЕНИЯ ===
const BASE_TILE = 60;
const BASE_DISPLACEMENT_SCALE = 30;
const BASE_PACMAN_SPEED = 2.8;
const BASE_SHARK_SPEED = 2.8;
const BASE_PACMAN_HITBOX = 60;
const BASE_SHARK_HITBOX = 52; // <-- добавь: чуть меньше тайла

export type ConfigState = {
  tileSize: number;
  pacmanSpeed: number;
  sharkSpeed: number;
  pacmanHitbox: number;
  sharkHitbox: number; // <-- добавь
  displacementScale: number;
  setByCanvasSize: (canvasWidthPx: number, canvasHeightPx: number) => void;
};

export const useConfig = create<ConfigState>()((set) => ({
  tileSize: BASE_TILE,
  pacmanSpeed: BASE_PACMAN_SPEED,
  sharkSpeed: BASE_SHARK_SPEED,
  pacmanHitbox: BASE_PACMAN_HITBOX,
  sharkHitbox: BASE_SHARK_HITBOX, // <-- добавь
  displacementScale: BASE_DISPLACEMENT_SCALE,
  setByCanvasSize: (canvasWidthPx, canvasHeightPx) => {
    const byWidth = Math.floor(canvasWidthPx / MAP_COLS);
    const byHeight = Math.floor(canvasHeightPx / MAP_ROWS);
    let tileSize = Math.min(byWidth, byHeight);
    tileSize = Math.max(16, Math.min(90, tileSize));
    const scale = tileSize / BASE_TILE;

    set({
      tileSize,
      pacmanSpeed: BASE_PACMAN_SPEED * scale,
      sharkSpeed: Math.ceil(BASE_SHARK_SPEED * scale * 10) / 10,
      pacmanHitbox: Math.round(BASE_PACMAN_HITBOX * scale),
      sharkHitbox: Math.round(BASE_SHARK_HITBOX * scale), // <-- добавь
      displacementScale: BASE_DISPLACEMENT_SCALE * scale,
    });
  },
}));
