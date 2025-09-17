import {
    Application,
    extend
} from '@pixi/react'
import {
    Container,
    Graphics,
    Sprite,
    TilingSprite,
    DisplacementFilter,
} from 'pixi.js'
import {Background} from "./Sprites/Background.tsx";
import { WaterOverlay } from './Sprites/WaterOverlay.tsx'
import { Map } from './Sprites/Map.tsx'
import { Pacman } from './Sprites/Pacman.tsx'

extend({
    Container,
    Graphics,
    Sprite,
    TilingSprite,
    DisplacementFilter
})

export const PacmanGame = () => {
    return (
        <Application width={1200} height={800}>
            <Background />
            <Map />
            <Pacman />
            <WaterOverlay />
        </Application>
    )
}