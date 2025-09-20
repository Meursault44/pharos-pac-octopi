// PacmanGame.tsx
import { Application, extend } from '@pixi/react';
import { Container, Graphics, Sprite, TilingSprite, DisplacementFilter } from 'pixi.js';
import { Background } from './Sprites/Background.tsx';
import { WaterOverlay } from './Sprites/WaterOverlay.tsx';
import { Map } from './Sprites/Map.tsx';
import { Pacman } from './Sprites/Pacman.tsx';
import { DisplacedContainer } from './DisplacedContainer.tsx';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from '../game/mapData.ts'

extend({ Container, Graphics, Sprite, TilingSprite, DisplacementFilter });

export const PacmanGame = () => {
    return (
        <Application width={MAP_COLS * TILE_SIZE} height={MAP_ROWS * TILE_SIZE} antialias>
            <DisplacedContainer scale={24}>
                <Background />
                <Map />
                <Pacman />
                <WaterOverlay />
            </DisplacedContainer>
        </Application>
    );
};
