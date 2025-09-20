import { useEffect, useRef, type FC } from 'react';
import type { AnimatedSprite as PixiAnimatedSprite, Texture } from 'pixi.js';

type PelletAnimProps = {
    textures: Texture[];   // массив кадров (НЕ пустой)
    x: number;
    y: number;
    size: number;
    speed?: number;        // animationSpeed
    tint?: number;
};

export const PelletAnim: FC<PelletAnimProps> = ({ textures, x, y, size, speed = 0.25, tint }) => {
    const ref = useRef<PixiAnimatedSprite | null>(null);

    useEffect(() => {
        const spr = ref.current;
        if (!spr || textures.length === 0) return;
        // скорость и старт проигрывания, как в примере Pixi
        spr.animationSpeed = speed;
        spr.loop = true;
        spr.gotoAndPlay(0);
        return () => spr.stop();
    }, [textures, speed]);

    return (
        <pixiAnimatedSprite
            ref={ref}
            textures={textures}
            x={x}
            y={y}
            width={size}
            height={size}
            tint={tint}
            loop
        />
    );
};
