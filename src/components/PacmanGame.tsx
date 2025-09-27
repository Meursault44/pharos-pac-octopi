// PacmanGame.tsx
import { Application, extend } from '@pixi/react';
import {
  Container,
  Graphics,
  Sprite,
  TilingSprite,
  DisplacementFilter,
  AnimatedSprite,
} from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Background } from './Sprites/Background';
import { WaterOverlay } from './Sprites/WaterOverlay';
import { Map } from './Sprites/Map';
import { Pacman } from './Sprites/Pacman';
import { Button } from '@chakra-ui/react';
import { DisplacedContainer } from './DisplacedContainer';
import { SharkAI } from './SharkAI';
import { MAP_ROWS } from '@/game/mapData';
import { useConfig } from '@/game/configStore';
import { useGameStore } from '@/game/gameStore';
import { useDialogsStore } from '@/store/dialogs.ts';

extend({ Container, Graphics, Sprite, TilingSprite, DisplacementFilter, AnimatedSprite });

export const PacmanGame = () => {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const tileSize = useConfig((s) => s.tileSize);
  const displacementScale = useConfig((s) => s.displacementScale);
  const setByWidth = useConfig((s) => s.setByCanvasWidth);
  const setDialogStartGame = useDialogsStore((s) => s.setDialogStartGame);

  // NEW: доступ к состоянию игры
  const isRunning = useGameStore((s) => s.isRunning);
  const initFromLayout = useGameStore((s) => s.initFromLayout);

  const setDialogStartGameHandler = useCallback(() => {
    setDialogStartGame(true);
  }, [setDialogStartGame]);

  // первичный расчёт + наблюдение
  useLayoutEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    setByWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? el.clientWidth;
      setByWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [setByWidth]);

  // NEW: один раз инициализируем карту/пеллеты/акул и остаёмся в паузе
  useEffect(() => {
    initFromLayout();
  }, [initFromLayout]);

  const height = tileSize * MAP_ROWS;

  return (
    <div
      ref={holderRef}
      style={{
        width: 'calc(86%)',
        height,
        overflow: 'hidden',
        position: 'relative', // важно для оверлея
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

      {/* NEW: стартовый оверлей */}
      {!isRunning && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)', // полупрозрачный серый
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <Button
            onClick={setDialogStartGameHandler}
            cursor={'pointer'}
            fontSize={'2rem'}
            p={'2rem'}
            _hover={{ bg: 'gray.800' }}
          >
            Начать игру
          </Button>
        </div>
      )}
    </div>
  );
};
