import { useEffect, useState, useCallback } from 'react';
import { Assets, Texture } from 'pixi.js';
import bg from '@/assets/wave_overlay.png';
import { useApplication, useTick } from '@pixi/react';

export const WaterOverlay = () => {
  const { app } = useApplication();

  const [texture, setTexture] = useState(Texture.EMPTY);
  const [tilePosition, setTilePosition] = useState({
    x: 0,
    y: 0,
  });

  const animateTilePosition = useCallback(
    () =>
      setTilePosition((previousState) => ({
        x: previousState.x - 1,
        y: previousState.y - 1,
      })),
    [],
  );

  useTick(animateTilePosition);

  useEffect(() => {
    if (texture === Texture.EMPTY) {
      Assets.load(bg).then((result) => {
        setTexture(result);
      });
    }
  }, [texture]);

  return (
    <pixiTilingSprite
      texture={texture}
      width={app?.width}
      height={app?.height}
      tilePosition={tilePosition}
    />
  );
};
