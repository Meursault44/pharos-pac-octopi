import {useEffect, useState, type FC} from "react";
import {Assets, Texture} from "pixi.js";
import bg from "../../assets/shark.png";
import { TILE_SIZE } from '../../game/mapData';

type SharkType = {
    x: number,
    y: number
}

export const Shark: FC<SharkType> = ({x, y}) => {
    const [texture, setTexture] = useState(Texture.EMPTY);
    const [position] = useState({ x, y });

    useEffect(() => {
        if (texture === Texture.EMPTY) Assets.load(bg).then(setTexture);
    }, [texture]);

    return <pixiSprite texture={texture} x={position.x} y={position.y} width={TILE_SIZE} height={TILE_SIZE} />;
};
