import { create } from "zustand";
import { MAP_COLS, MAP_ROWS } from "./mapData";

// === БАЗОВЫЕ ЗНАЧЕНИЯ ===
// Эти значения заданы для базового размера клетки 60px
const BASE_TILE = 60;
const BASE_PACMAN_SPEED = 2.8; // px/tick
const BASE_SHARK_SPEED = 2.8;  // px/tick
const BASE_HITBOX = 46;        // px
const BASE_DISPLACEMENT_SCALE = 30;

export type ConfigState = {
  // === Текущие параметры ===
  tileSize: number;          // ширина клетки (px)
  pacmanSpeed: number;       // скорость пакмана
  sharkSpeed: number;        // скорость акул
  pacmanHitbox: number;      // размер хитбокса пакмана
  displacementScale: number; // сила эффекта воды

  // === Методы ===
  setByCanvasSize: (canvasWidthPx: number, canvasHeightPx: number) => void;
};

/**
 * Zustand store конфигурации игры.
 * Масштабирует всё относительно размера доступного окна,
 * чтобы карта всегда полностью влезала на экран.
 */
export const useConfig = create<ConfigState>()((set) => ({
  tileSize: BASE_TILE,
  pacmanSpeed: BASE_PACMAN_SPEED,
  sharkSpeed: BASE_SHARK_SPEED,
  pacmanHitbox: BASE_HITBOX,
  displacementScale: BASE_DISPLACEMENT_SCALE,

  /**
   * Вычисляет tileSize так, чтобы карта 27x14 клеток
   * полностью помещалась в доступный прямоугольник (canvas).
   */
  setByCanvasSize: (canvasWidthPx: number, canvasHeightPx: number) => {
    // Определяем возможный размер клетки по ширине и высоте
    const byWidth = Math.floor(canvasWidthPx / MAP_COLS);
    const byHeight = Math.floor(canvasHeightPx / MAP_ROWS);

    // Берём минимальное, чтобы гарантированно всё влезло
    let tileSize = Math.min(byWidth, byHeight);

    // Подрезаем, чтобы клетка не была слишком маленькой или огромной
    tileSize = Math.max(20, Math.min(90, tileSize));

    // Масштаб для связанных параметров
    const scale = tileSize / BASE_TILE;

    set({
      tileSize,
      pacmanSpeed: BASE_PACMAN_SPEED * scale,
      sharkSpeed: BASE_SHARK_SPEED * scale,
      pacmanHitbox: Math.round(BASE_HITBOX * scale),
      displacementScale: BASE_DISPLACEMENT_SCALE * scale,
    });
  },
}));
