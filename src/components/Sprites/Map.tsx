import { useEffect, useMemo, useState, useRef } from 'react';
import { Assets, Texture } from 'pixi.js';
import { PelletAnim } from '../PelletAnim.tsx';
import { useTick } from '@pixi/react';
import wallSrc from '@/assets/wall.png';
import { MAP_COLS, MAP_ROWS, RAW_LAYOUT } from '@/game/mapData';
import { useConfig } from '@/game/configStore';
import { useGameStore } from '@/game/gameStore';
import { Shark } from './Shark';

export type MapProps = {
  pelletColor?: number; // можно использовать как tint
  x?: number;
  y?: number;
};

export const Map = ({
  pelletColor = 0xffffff, // если хочешь подкрашивать гиф/кадры
  x = 0,
  y = 0,
}: MapProps) => {
  const [wallTexture, setWallTexture] = useState<Texture | null>(null);
  const [pelletFrames, setPelletFrames] = useState<Texture[] | null>(null);
  const TILE_SIZE = useConfig((s) => s.tileSize);

  const frameRef = useRef(0);
  const [, force] = useState(0); // простой триггер на перерисовку

  const initFromLayout = useGameStore((s) => s.initFromLayout);
  useEffect(() => {
    initFromLayout();
  }, [initFromLayout]);

  useEffect(() => {
    let alive = true;

    (async () => {
      // стены
      const wall = await Assets.load(wallSrc);
      if (!alive) return;
      setWallTexture(wall);

      // кадры пеллетов (pellet_0001.png, pellet_0002.png, ...)
      const modules = import.meta.glob('../../assets/pellet_frames/pellet_*.png', { eager: true });
      const entries = Object.entries(modules)
        .map(([path, mod]) => {
          const url = (mod as any).default as string;
          const m = path.match(/pellet_(\d+)\.png$/); // достаём индекс кадра
          const idx = m ? parseInt(m[1], 10) : 0;
          return { idx, url };
        })
        .sort((a, b) => a.idx - b.idx);

      const urls = entries.map((e) => e.url);
      if (urls.length === 0) {
        console.warn('Нет кадров в assets/pellet_frames/pellet_*.png');
        if (!alive) return;
        setPelletFrames([]);
        return;
      }

      await Assets.load(urls);
      if (!alive) return;

      const frames = urls.map((u) => Texture.from(u));
      setPelletFrames(frames);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const walls = useMemo(() => {
    const w: Array<{ x: number; y: number }> = [];
    for (let r = 0; r < MAP_ROWS; r++) {
      const line = RAW_LAYOUT[r];
      for (let c = 0; c < MAP_COLS; c++) {
        if (line[c] === '#') w.push({ x: x + c * TILE_SIZE, y: y + r * TILE_SIZE });
      }
    }
    return w;
  }, [x, y]);

  const pellets = useGameStore((s) => s.pellets);
  const sharks = useGameStore((s) => s.sharks);

  const PELLET_FPS = 12; // частота кадров
  const SPEED = 1.5; // множитель скорости

  useTick(({ deltaTime }) => {
    if (!pelletFrames || pelletFrames.length === 0) return;
    // delta ~ кол-во кадров от прошлого тика; 60fps -> delta≈1
    // переводим в кадры пеллет
    frameRef.current =
      (frameRef.current + deltaTime * (PELLET_FPS / 60) * SPEED) % pelletFrames.length;
    // лёгкий триггер перерисовки (раз в тик нормально для мелкой сцены)
    force((n) => (n + 1) % 1000000);
  });

  if (!wallTexture) return null;

  const pelletSize = TILE_SIZE * 0.6; // 60% клетки
  const pelletOffset = (TILE_SIZE - pelletSize) / 2;

  return (
    <>
      {/* стены */}
      {walls.map((p, i) => (
        <pixiSprite
          key={`w-${i}`}
          texture={wallTexture}
          x={p.x}
          y={p.y}
          width={TILE_SIZE}
          height={TILE_SIZE}
        />
      ))}

      {/* пеллеты как AnimatedSprite: как в доке, только кадры из локальной папки */}
      {pelletFrames &&
        pelletFrames.length > 0 &&
        [...pellets].map((k) => {
          const [c, r] = k.split(',').map(Number);
          const px = x + c * TILE_SIZE + pelletOffset;
          const py = y + r * TILE_SIZE + pelletOffset;
          return (
            <PelletAnim
              key={`p-${k}`}
              textures={pelletFrames}
              x={px}
              y={py}
              size={pelletSize}
              frameIndex={Math.floor(frameRef.current)} // <-- общий кадр
              tint={pelletColor}
            />
          );
        })}

      {/* акулы */}
      {sharks.map((s) => (
        <Shark key={`sh-${s.id}`} x={x + s.x} y={y + s.y} dir={s.dir} />
      ))}
    </>
  );
};
