// PelletAnim.tsx
import type { FC } from 'react';
import type { Texture } from 'pixi.js';

type PelletAnimProps = {
  textures: Texture[];
  x: number;
  y: number;
  size: number;
  frameIndex: number; // <-- общий кадр приходит извне
  tint?: number;
};

export const PelletAnim: FC<PelletAnimProps> = ({ textures, x, y, size, frameIndex, tint }) => {
  const tex = textures[frameIndex % textures.length];
  return <pixiSprite texture={tex} x={x} y={y} width={size} height={size} tint={tint} />;
};
