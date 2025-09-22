// src/components/Pacman.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Assets, Texture } from 'pixi.js';
import { useTick } from '@pixi/react';
import pacmanRight from '../../assets/pacmanRight.png';
import pacmanLeft from '../../assets/pacmanLeft.png';
import { isWallAt, TILE_SIZE, MAP_COLS, MAP_ROWS } from '../../game/mapData';
import { useGameStore } from '../../game/gameStore';
import {useDialogsStore} from "../../store/dialogs.ts";

const keyMap: Record<string, 'up' | 'down' | 'left' | 'right' | 'space' | undefined> = {
    Space: 'space',
    KeyW: 'up', ArrowUp: 'up',
    KeyA: 'left', ArrowLeft: 'left',
    KeyS: 'down', ArrowDown: 'down',
    KeyD: 'right', ArrowRight: 'right',
};

const SPEED = 2.8;
const SPRITE_SIZE = TILE_SIZE;
const HITBOX = 44;
const HITBOX_PAD = (SPRITE_SIZE - HITBOX) / 2;

export const Pacman = () => {
    const [textureRight, setTextureRight] = useState(Texture.EMPTY);
    const [textureLeft, setTextureLeft] = useState(Texture.EMPTY);
    const [isMoving, setIsMoving] = useState<null | 'up' | 'down' | 'left' | 'right'>(null);
    const [facing, setFacing] = useState<'left' | 'right'>('right');
    const [position, setPosition] = useState({ x: TILE_SIZE * 12, y: TILE_SIZE * 8 });
    const { setDialogLoseGame } = useDialogsStore();

    const consume = useGameStore((s) => s.consume);
    const sharks = useGameStore((s) => s.sharks);
    const gameOver = useGameStore((s) => s.gameOver);
    const endGame = useGameStore((s) => s.endGame);

    // ⬇️ добавим локальный флаг, который безопасно дернёт endGame в useEffect
    const [shouldEndGame, setShouldEndGame] = useState(false);

    const keyDownHandler = useCallback((e: KeyboardEvent) => {
        const dir = keyMap[e.code];
        if (!dir || dir === 'space' || gameOver) return;
        setIsMoving(dir);
        if (dir === 'left') setFacing('left');
        else if (dir === 'right') setFacing('right');
    }, [gameOver]);

    const keyUpHandler = useCallback((e: KeyboardEvent) => {
        const dir = keyMap[e.code];
        if (!dir || dir === 'space') return;
        setIsMoving((prev) => (prev === dir ? null : prev));
    }, []);

    const checkSharkCollision = useCallback((x: number, y: number) => {
        // хитбокс пакмана
        const hbX = x + HITBOX_PAD;
        const hbY = y + HITBOX_PAD;
        const hbR = hbX + HITBOX;
        const hbB = hbY + HITBOX;

        for (const sh of sharks) {
            const sx = sh.x;
            const sy = sh.y;
            const sr = sx + TILE_SIZE;
            const sb = sy + TILE_SIZE;

            const overlap =
                hbX < sr && hbR > sx &&
                hbY < sb && hbB > sy;

            if (overlap) return true;
        }
        return false;
    }, [sharks]);

    const animate = useCallback(() => {
        if (gameOver || !isMoving) return;

        setPosition((prev) => {
            let nx = prev.x, ny = prev.y;
            if (isMoving === 'up') ny -= SPEED;
            else if (isMoving === 'down') ny += SPEED;
            else if (isMoving === 'left') nx -= SPEED;
            else if (isMoving === 'right') nx += SPEED;

            // границы и стены
            const hbX = nx + HITBOX_PAD;
            const hbY = ny + HITBOX_PAD;
            const hbRight = hbX + HITBOX;
            const hbBottom = hbY + HITBOX;
            if (hbX < 0 || hbY < 0 || hbRight > MAP_COLS * TILE_SIZE || hbBottom > MAP_ROWS * TILE_SIZE) return prev;

            const c0 = Math.floor(hbX / TILE_SIZE);
            const r0 = Math.floor(hbY / TILE_SIZE);
            const c1 = Math.floor((hbRight - 1) / TILE_SIZE);
            const r1 = Math.floor((hbBottom - 1) / TILE_SIZE);
            for (let r = r0; r <= r1; r++) {
                for (let c = c0; c <= c1; c++) {
                    if (isWallAt(c, r)) return prev;
                }
            }

            if (checkSharkCollision(nx, ny)) {
                setShouldEndGame(true);
                return prev;
            }

            return { x: nx, y: ny };
        });
    }, [isMoving, gameOver, checkSharkCollision]);
    useTick(animate);

    const lastCellRef = useRef<string>('');

    useEffect(() => {
        if (gameOver) return;

        const centerX = position.x + SPRITE_SIZE / 2;
        const centerY = position.y + SPRITE_SIZE / 2;
        const col = Math.floor(centerX / TILE_SIZE);
        const row = Math.floor(centerY / TILE_SIZE);
        const k = `${col},${row}`;
        if (k !== lastCellRef.current) {
            lastCellRef.current = k;
            consume(col, row);
        }

        // Доп.проверка на текущей позиции (без немедленного endGame)
        if (checkSharkCollision(position.x, position.y)) {
            setShouldEndGame(true);
        }
    }, [position.x, position.y, consume, gameOver, checkSharkCollision]);

    // единая точка завершения игры — безопасна для React
    useEffect(() => {
        if (!shouldEndGame) return;
        endGame();
        setShouldEndGame(false);
        setDialogLoseGame(true);
    }, [shouldEndGame, endGame]);

    useEffect(() => {
        let alive = true;
        Promise.all([Assets.load(pacmanRight), Assets.load(pacmanLeft)]).then(([r, l]) => {
            if (!alive) return;
            setTextureRight(r);
            setTextureLeft(l);
        });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('keyup', keyUpHandler);
        return () => {
            window.removeEventListener('keydown', keyDownHandler);
            window.removeEventListener('keyup', keyUpHandler);
        };
    }, [keyDownHandler, keyUpHandler]);

    const currentTexture = facing === 'left' ? textureLeft : textureRight;
    if (currentTexture === Texture.EMPTY) return null;

    return <pixiSprite texture={currentTexture} x={position.x} y={position.y} width={SPRITE_SIZE} height={SPRITE_SIZE} />;
};
