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
  Text as PixiText, // <- импортируем класс Text (для extend)
} from 'pixi.js';
import { Background } from './Sprites/Background';
import { WaterOverlay } from './Sprites/WaterOverlay';
import { Map } from './Sprites/Map';
import { Pacman } from './Sprites/Pacman';
import { Button, HStack } from '@chakra-ui/react'; // <-- убрал Chakra Text, чтобы не путать
import { DisplacedContainer } from './DisplacedContainer';
import { SharkAI } from './SharkAI';
import { MAP_COLS, MAP_ROWS } from '@/game/mapData';
import { useConfig } from '@/game/configStore';
import { useGameStore } from '@/game/gameStore';
import { useDialogsStore } from '@/store/dialogs';

// регистрируем Pixi-компоненты, чтобы можно было использовать <pixiText/>
extend({
  Container,
  Graphics,
  Sprite,
  TilingSprite,
  DisplacementFilter,
  AnimatedSprite,
  Text: PixiText,
});

export const PacmanGame = () => {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const score = useGameStore((s) => s.score);
  const tileSize = useConfig((s) => s.tileSize);
  const displacementScale = useConfig((s) => s.displacementScale);
  const setByCanvasSize = useConfig((s) => s.setByCanvasSize);

  const isRunning = useGameStore((s) => s.isRunning);
  const initFromLayout = useGameStore((s) => s.initFromLayout);
  const setDialogStartGame = useDialogsStore((s) => s.setDialogStartGame);

  const aspect = MAP_COLS / MAP_ROWS;

  const setDialogStartGameHandler = useCallback(
    (e) => {
      e.preventDefault();
      setDialogStartGame(true);
    },
    [setDialogStartGame],
  );

  useEffect(() => {
    initFromLayout();
  }, [initFromLayout, tileSize]);

  useLayoutEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight - 20;
      let width, height;

      if (vw / vh > aspect) {
        height = vh;
        width = vh * aspect;
      } else {
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

  const hudWidth = Math.ceil(tileSize * (String(score).length / 2 + 2.6)); // ширина таблички — несколько клеток стены
  const hudHeight = tileSize - tileSize / 5;

  return (
    <div
      style={{
        width: '100vw',
        height: '100svh',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        margin: '0 20px',
      }}
    >
      <HStack
        ref={holderRef}
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          position: 'relative',
        }}
      >
        <Application
          antialias
          resizeTo={holderRef}
          resolution={window.devicePixelRatio || 1}
          autoDensity
        >
          {/* СЦЕНА С ЭФФЕКТОМ */}
          <DisplacedContainer scale={displacementScale}>
            <Background />
            <Map />
            <Pacman />
            <SharkAI />
            <WaterOverlay />
          </DisplacedContainer>

          {/* HUD — поверх, без воды */}
          <pixiContainer sortableChildren={true}>
            <pixiGraphics
              // тёмный фон слева сверху
              draw={(graphics) => {
                graphics.clear();
                graphics.setFillStyle({ color: '#231F20' });
                graphics
                  .roundRect(tileSize / 10, tileSize / 10, hudWidth, hudHeight, 20)
                  .stroke({ width: tileSize / 5, color: 'gray' });
                graphics.fill();
              }}
            />
            <pixiText
              x={Math.round(tileSize * 0.35)}
              y={Math.round(tileSize * 0.1)}
              text={`Score: ${score}`}
              anchor={{ x: 0, y: 0 }}
              style={{
                fill: 0xffffff,
                fontSize: Math.floor(tileSize * 0.7), // визуально ~высота клетки
                fontFamily: 'Open Sans, system-ui, sans-serif',
                fontWeight: '700',
              }}
            />
          </pixiContainer>
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
      </HStack>
    </div>
  );
};
