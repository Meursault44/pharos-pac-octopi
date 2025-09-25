import { useEffect, useRef, useState, type FC } from "react";
import type { AnimatedSprite as PixiAnimatedSprite, Texture } from "pixi.js";

type PacmanAnimProps = {
    textures: Texture[];
    x: number;
    y: number;
    size: number;
    speed?: number;
    rotation?: number; // целевой угол
    tint?: number;
    rotationDuration?: number; // время анимации (мс)
};

export const PacmanAnim: FC<PacmanAnimProps> = ({
                                                    textures,
                                                    x,
                                                    y,
                                                    size,
                                                    speed = 0.35,
                                                    rotation = 0,
                                                    tint,
                                                    rotationDuration = 150,
                                                }) => {
    const ref = useRef<PixiAnimatedSprite | null>(null);
    const [currentRotation, setCurrentRotation] = useState(rotation);

    // запуск анимации вращения при смене rotation
    useEffect(() => {
        let frame: number;
        let start: number | null = null;
        const spr = ref.current;
        if (!spr) return;

        const startRot = currentRotation;
        // чтобы крутилось кратчайшим путём
        let delta = rotation - startRot;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;

        const animate = (t: number) => {
            if (start == null) start = t;
            const progress = Math.min((t - start) / rotationDuration, 1);
            const newRot = startRot + delta * progress;
            setCurrentRotation(newRot);
            spr.rotation = newRot;
            if (progress < 1) frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [rotation, rotationDuration]);

    // настройка спрайта
    useEffect(() => {
        const spr = ref.current;
        if (!spr || textures.length === 0) return;
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
            anchor={0.5}
            tint={tint}
            loop
        />
    );
};
