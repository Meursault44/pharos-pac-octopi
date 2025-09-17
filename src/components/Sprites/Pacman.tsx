import {useEffect, useState, useCallback} from "react";
import {Assets, Texture} from "pixi.js";
import bg from "../../assets/pacmanRight.png";
import {useTick} from "@pixi/react";

const keyMap = {
    Space: 'space',
    KeyW: 'up',
    ArrowUp: 'up',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyD: 'right',
    ArrowRight: 'right',
};

const CELL_SIZE = 26;

export const Pacman = () => {
    const [texture, setTexture] = useState(Texture.EMPTY)
    const [isMoving, setIsMoving] = useState(null)
    const [position, setPosition] = useState({x: CELL_SIZE * 8, y: CELL_SIZE * 13})

    const keyDownHandler = useCallback((e) => {
        setIsMoving(keyMap[e?.code])
    }, [])

    const keyUpHandler = useCallback((e) => {
        setIsMoving(prev => prev === keyMap[e?.code] ? null : prev)
    }, [])

    const animateTilePosition = useCallback(() => setPosition(previousState => {
        if (!isMoving) return previousState
        if (isMoving === 'up') return {
            x: previousState.x,
            y: previousState.y - 1
        }
        if (isMoving === 'left') return {
            x: previousState.x - 1,
            y: previousState.y
        }
        if (isMoving === 'right') return {
            x: previousState.x + 1,
            y: previousState.y
        }
        if (isMoving === 'down') return {
            x: previousState.x,
            y: previousState.y + 1
        }
    }), [isMoving]);

    useTick(animateTilePosition);

    useEffect(() => {
        if (texture === Texture.EMPTY) {
            Assets
                .load(bg)
                .then((result) => {
                    setTexture(result)
                });
        }
    }, [texture]);

    useEffect(() => {
        window.addEventListener('keydown', keyDownHandler)
        window.addEventListener('keyup', keyUpHandler)
        return () => {
            window.removeEventListener('keydown', keyDownHandler)
            window.removeEventListener('keyup', keyUpHandler)
        }
    }, []);

    console.log(isMoving)

    return <pixiSprite texture={texture} position={position} width={26} height={26} />
}