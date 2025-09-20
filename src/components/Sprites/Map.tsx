import { useEffect, useMemo, useState } from 'react';
import { Assets, Texture } from 'pixi.js';
import wallSrc from '../../assets/wall.png';
import { MAP_COLS, MAP_ROWS, TILE_SIZE, RAW_LAYOUT } from '../../game/mapData';
import { useGameStore } from '../../game/gameStore';
import { Shark } from './Shark'; // <— добавили импорт

export type MapProps = {
    pelletColor?: number;
    x?: number;
    y?: number;
};

export const Map = ({
                        pelletColor = 0xfff6b7,
                        x = 0,
                        y = 0,
                    }: MapProps) => {
    const [wallTexture, setWallTexture] = useState<Texture | null>(null);

    const initFromLayout = useGameStore((s) => s.initFromLayout);
    useEffect(() => { initFromLayout(); }, [initFromLayout]);

    useEffect(() => {
        let alive = true;
        Assets.load(wallSrc).then((t) => alive && setWallTexture(t));
        return () => { alive = false; };
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

    if (!wallTexture) return null;

    const pelletR = 3;

    return (
        <>
            {walls.map((p, i) => (
                <pixiSprite key={`w-${i}`} texture={wallTexture} x={p.x} y={p.y} width={TILE_SIZE} height={TILE_SIZE} />
            ))}

            {/* обычные пеллеты */}
            <pixiGraphics
                draw={(g: any) => {
                    g.clear();
                    for (const k of pellets) {
                        const [c, r] = k.split(',').map(Number);
                        const cx = x + c * TILE_SIZE + TILE_SIZE / 2;
                        const cy = y + r * TILE_SIZE + TILE_SIZE / 2;
                        g.circle(cx, cy, pelletR);
                    }
                    g.fill(pelletColor);
                }}
            />

            {/* акулы на местах 'o' */}
            {sharks.map((s) => (
                <Shark key={`sh-${s.id}`} x={x + s.x} y={y + s.y} />
            ))}
        </>
    );
};
