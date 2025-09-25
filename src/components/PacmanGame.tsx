import { Application, extend } from '@pixi/react';
import {
  Container,
  Graphics,
  Sprite,
  TilingSprite,
  DisplacementFilter,
  AnimatedSprite,
} from 'pixi.js';
import { useLayoutEffect, useRef } from 'react';
import { Background } from './Sprites/Background';
import { WaterOverlay } from './Sprites/WaterOverlay';
import { Map } from './Sprites/Map';
import { Pacman } from './Sprites/Pacman';
import { DisplacedContainer } from './DisplacedContainer';
import { SharkAI } from './SharkAI';
import { MAP_COLS, MAP_ROWS } from '@/game/mapData';
import { useConfig } from '@/game/configStore';

extend({ Container, Graphics, Sprite, TilingSprite, DisplacementFilter, AnimatedSprite });

export const PacmanGame = () => {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const tileSize = useConfig((s) => s.tileSize);
  const displacementScale = useConfig((s) => s.displacementScale);
  const setByWidth = useConfig((s) => s.setByCanvasWidth);

  // первичный расчёт до первого кадра + наблюдение за контейнером
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

  const height = tileSize * MAP_ROWS;

  return (
    <div ref={holderRef} style={{ width: 'calc(86%)', height: height, overflow: 'hidden' }}>
      <Application antialias resizeTo={holderRef}>
        <DisplacedContainer scale={displacementScale}>
          <Background />
          <Map />
          <Pacman />
          <SharkAI />
          <WaterOverlay />
        </DisplacedContainer>
      </Application>
    </div>
  );
};
