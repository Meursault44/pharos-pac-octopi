// PacmanGame.tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Application, extend } from '@pixi/react';
import {
  Container,
  Graphics,
  Sprite,
  TilingSprite,
  DisplacementFilter,
  AnimatedSprite,
} from 'pixi.js';
import { Background } from './Sprites/Background';
import { WaterOverlay } from './Sprites/WaterOverlay';
import { Map } from './Sprites/Map';
import { Pacman } from './Sprites/Pacman';
import { Button } from '@chakra-ui/react';
import { DisplacedContainer } from './DisplacedContainer';
import { SharkAI } from './SharkAI';
import { MAP_COLS, MAP_ROWS } from '@/game/mapData';
import { useConfig } from '@/game/configStore';
import { useGameStore } from '@/game/gameStore';
import { useDialogsStore } from '@/store/dialogs';

extend({ Container, Graphics, Sprite, TilingSprite, DisplacementFilter, AnimatedSprite });

export const PacmanGame = () => {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const tileSize = useConfig((s) => s.tileSize);
  const displacementScale = useConfig((s) => s.displacementScale);
  const setByCanvasSize = useConfig((s) => s.setByCanvasSize);

  const isRunning = useGameStore((s) => s.isRunning);
  const initFromLayout = useGameStore((s) => s.initFromLayout);
  const setDialogStartGame = useDialogsStore((s) => s.setDialogStartGame);

  const aspect = MAP_COLS / MAP_ROWS;

  const setDialogStartGameHandler = useCallback(
    () => setDialogStartGame(true),
    [setDialogStartGame],
  );

  useEffect(() => {
    initFromLayout();
  }, [initFromLayout]);

  // наблюдаем за экраном и вписываем канвас в окно
  useLayoutEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight - 56; // отнимаем ~3rem под UI
      let width, height;

      // вписываем карту целиком в экран, сохраняя пропорции
      if (vw / vh > aspect) {
        // экран шире — ограничиваем по высоте
        height = vh;
        width = vh * aspect;
      } else {
        // экран уже — ограничиваем по ширине
        width = vw;
        height = vw / aspect;
      }

      setContainerSize({ width, height });
      setByCanvasSize(width, height);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [aspect, setByCanvasSize]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        marginBottom: '1rem',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        ref={holderRef}
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          position: 'relative',
        }}
      >
        <Application antialias resizeTo={holderRef}>
          <DisplacedContainer scale={displacementScale}>
            <Background />
            <Map />
            <Pacman />
            <SharkAI />
            <WaterOverlay />
          </DisplacedContainer>
        </Application>

        {!isRunning && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <Button
              onClick={setDialogStartGameHandler}
              cursor="pointer"
              fontSize="2rem"
              p="2rem"
              _hover={{ bg: 'gray.800' }}
            >
              Начать игру
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
