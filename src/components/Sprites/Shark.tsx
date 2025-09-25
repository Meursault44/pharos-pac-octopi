import { useEffect, useState, type FC, memo } from 'react';
import { Assets, Texture } from 'pixi.js';
import sharkRight from '@/assets/shark_right.png';
import sharkLeft from '@/assets/shark_left.png';
import { useConfig } from '@/game/configStore.ts';

type Dir = 'up' | 'down' | 'left' | 'right';

type SharkProps = {
  x: number; // левый верхний угол тайла (как и раньше)
  y: number;
  dir: Dir; // направление движения
};

export const Shark: FC<SharkProps> = memo(({ x, y, dir }) => {
  const [leftTex, setLeftTex] = useState<Texture | null>(null);
  const [rightTex, setRightTex] = useState<Texture | null>(null);
  const TILE_SIZE = useConfig((s) => s.tileSize);

  useEffect(() => {
    let alive = true;
    Promise.all([Assets.load(sharkLeft), Assets.load(sharkRight)]).then(([l, r]) => {
      if (!alive) return;
      setLeftTex(l);
      setRightTex(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!leftTex || !rightTex) return null;

  // Для "left" берём левую текстуру, для остальных — правую.
  const texture = dir === 'left' ? leftTex : rightTex;

  return (
    <pixiSprite
      texture={texture}
      x={x}
      y={y}
      width={TILE_SIZE}
      height={TILE_SIZE}
      // anchor по умолчанию (0,0) — оставляем верхний левый угол
    />
  );
});
