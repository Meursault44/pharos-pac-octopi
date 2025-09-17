import { useEffect, useState } from 'react';
import {
    Assets,
    Texture,
} from 'pixi.js';
import bg from '../../assets/pond_background.jpg'

export const Background = () => {
    const [texture, setTexture] = useState(Texture.EMPTY)

    useEffect(() => {
        if (texture === Texture.EMPTY) {
            Assets
                .load(bg)
                .then((result) => {
                    setTexture(result)
                });
        }
    }, [texture]);

    return <pixiSprite
            texture={texture}
            width={texture?.source.width}
            height={texture?.source.height}
            x={0}
            y={0}
    />
}