import { useEffect, useState, type FC, memo } from "react";
import { Assets, Texture } from "pixi.js";
import bg from "../../assets/shark.png";
import { TILE_SIZE } from "../../game/mapData";

type SharkType = { x: number; y: number };

export const Shark: FC<SharkType> = memo(({ x, y }) => {
    const [texture, setTexture] = useState(Texture.EMPTY);

    useEffect(() => {
        if (texture === Texture.EMPTY) Assets.load(bg).then(setTexture);
    }, [texture]);

    if (texture === Texture.EMPTY) return null;
    return <pixiSprite texture={texture} x={x} y={y} width={TILE_SIZE} height={TILE_SIZE} />;
});
