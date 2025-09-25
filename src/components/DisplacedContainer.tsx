// DisplacedContainer.tsx
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Container as PixiContainer,
  Sprite as PixiSprite,
  DisplacementFilter,
  Assets,
  Texture,
} from 'pixi.js';
import { useTick } from '@pixi/react';

type DisplacedContainerProps = {
  children: ReactNode;
  /** сила искажения (как в примере — 40) */
  scale?: number;
  /** текстура displacement-карты; можно поменять на локальный файл */
  mapUrl?: string;
};

export const DisplacedContainer = ({
  children,
  scale = 40,
  mapUrl = 'https://pixijs.com/assets/pond/displacement_map.png',
}: DisplacedContainerProps) => {
  const [mapTex, setMapTex] = useState<Texture | null>(null);
  const spriteRef = useRef<PixiSprite>(null);
  const containerRef = useRef<PixiContainer>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // грузим карту смещения и включаем повторение
  useEffect(() => {
    let mounted = true;
    Assets.load<Texture>(mapUrl).then((t) => {
      if (!mounted) return;
      t.source.wrapMode = 'repeat';
      setMapTex(t);
    });
    return () => {
      mounted = false;
    };
  }, [mapUrl]);

  // создаём фильтр один раз, когда появился spriteRef
  const filter = useMemo(() => {
    if (!spriteRef.current) return null;
    const f = new DisplacementFilter(spriteRef.current, scale);
    f.padding = 0;
    return f;
  }, [spriteRef.current, scale]); // не вешаем scale сюда, чтобы не пересоздавать фильтр

  // обновляем силу фильтра без пересоздания
  useEffect(() => {
    if (filter) {
      filter.scale.set(scale);
    }
  }, [filter, scale]);

  // двигаем карту смещения каждый кадр (как в примере)
  useTick(() => {
    setOffset((o) => ({ x: o.x + 0.5, y: o.y + 0.5 }));
  });

  return (
    <pixiContainer ref={containerRef} filters={filter ? [filter] : undefined}>
      {/* Спрайт displacement-карты должен быть в сцене, видимость не обязательна */}
      {mapTex && (
        <pixiSprite
          ref={spriteRef}
          texture={mapTex}
          x={offset.x}
          y={offset.y}
          visible={false} // можно заменить на renderable={false}
        />
      )}
      {children}
    </pixiContainer>
  );
};
