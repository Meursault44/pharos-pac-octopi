// src/components/Sprites/Background.tsx
import { useEffect, useState } from 'react';
import { Assets, Texture } from 'pixi.js';
import { useConfig } from '../../game/configStore';
import { MAP_COLS, MAP_ROWS } from '../../game/mapData';
import bg from '../../assets/pond_background.png';

export const Background = () => {
    const tileSize = useConfig(s => s.tileSize);
    const stageW = tileSize * MAP_COLS;
    const stageH = tileSize * MAP_ROWS;

    const [tex, setTex] = useState<Texture | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            const t = await Assets.load(bg);
            if (!alive) return;
            setTex(t);
        })();
        return () => { alive = false; };
    }, []);

    if (!tex) return null;

    return (
        <pixiTilingSprite
            texture={tex}
            x={0}
            y={0}
            width={stageW}
            height={stageH}
        />
    );
};
