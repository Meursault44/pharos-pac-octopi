import { useEffect, useMemo, useState } from 'react'
import { Assets, Texture } from 'pixi.js'
import wallSrc from '../../assets/wall.png'

/** Фиксированные размеры классической карты Pac-Man */
export const MAP_COLS = 28
export const MAP_ROWS = 31
export const TILE_SIZE = 26
export const MAP_WIDTH = MAP_COLS * TILE_SIZE     // 672
export const MAP_HEIGHT = MAP_ROWS * TILE_SIZE    // 744

/**
 * Символьная раскладка:
 * '#' — стена (рисуем СПРАЙТОМ)
 * '.' — обычная точка (нарисуем кружком)
 * 'o' — большая точка (кружок побольше)
 * ' ' — пусто/проход
 */
const RAW_LAYOUT: string[] = [
    '############################',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o####.#####.##.#####.####o#',
    '#.####.#####.##.#####.####.#',
    '#..........................#',
    '#.####.##.########.##.####.#',
    '#.####.##.########.##.####.#',
    '#......##....##....##......#',
    '######.##### ## #####.######',
    '#####..##### ## #####..#####',
    '#####.##            ##.#####',
    '#####.## ### GG ###.##.#####',
    '#     .   ###    ###   .   #',
    '#####.## ######## ##.#####.#',
    '#####.## ######## ##.#####.#',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o..##................##..o#',
    '###.##.##.########.##.##.###',
    '###....##....##....##....###',
    '#######.####.....#####.#####',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o####.#####.##.#####.####o#',
    '#...##................##...#',
    '###.##.##.########.##.##.###',
    '#......##....##....##......#',
    '#.##########.##.##########.#',
    '#..........................#',
    '############################',
]

export type MapProps = {
    /** цвета кружков-пеллетов (их можно потом заменить на спрайты при желании) */
    pelletColor?: number
    powerPelletColor?: number
    /** смещение слоя карты */
    x?: number
    y?: number
}

/** Быстрая проверка тайла на стену (можно использовать в коллизиях) */
export const isWallAt = (col: number, row: number) =>
    row >= 0 &&
    row < MAP_ROWS &&
    col >= 0 &&
    col < MAP_COLS &&
    RAW_LAYOUT[row][col] === '#'

export const Map = ({
                        pelletColor = 0xfff6b7,
                        powerPelletColor = 0xffd166,
                        x = 0,
                        y = 0,
                    }: MapProps) => {
    const [wallTexture, setWallTexture] = useState<Texture | null>(null)

    // грузим текстуру стены один раз
    useEffect(() => {
        let alive = true
        Assets.load(wallSrc).then((t) => alive && setWallTexture(t))
        return () => {
            alive = false
        }
    }, [wallSrc])

    // парсим раскладку в списки координат
    const { walls, pellets, powerPellets } = useMemo(() => {
        const walls: Array<{ x: number; y: number }> = []
        const pellets: Array<{ cx: number; cy: number }> = []
        const powerPellets: Array<{ cx: number; cy: number }> = []

        for (let r = 0; r < MAP_ROWS; r++) {
            const line = RAW_LAYOUT[r]
            for (let c = 0; c < MAP_COLS; c++) {
                const ch = line[c]
                const px = x + c * TILE_SIZE
                const py = y + r * TILE_SIZE
                if (ch === '#') walls.push({ x: px, y: py })
                else if (ch === '.') pellets.push({ cx: px + TILE_SIZE / 2, cy: py + TILE_SIZE / 2 })
                else if (ch === 'o') powerPellets.push({ cx: px + TILE_SIZE / 2, cy: py + TILE_SIZE / 2 })
            }
        }
        return { walls, pellets, powerPellets }
    }, [x, y])

    if (!wallTexture) return null

    const pelletR = 3 // обычные точки маленькие
    const powerPelletR = 6 // большие точки

    return (
        <>
            {/* Стены — КАЖДЫЙ тайл отдельным спрайтом с одной и той же текстурой */}
            {walls.map((p, i) => (
                <pixiSprite
                    key={`w-${i}`}
                    texture={wallTexture}
                    x={p.x}
                    y={p.y}
                    width={TILE_SIZE}
                    height={TILE_SIZE}
                />
            ))}

            {/* Обычные точки — графикой (кружочки). При желании заменишь на спрайты */}
            <pixiGraphics
                draw={(g: any) => {
                    g.clear()
                    g.beginFill(pelletColor)
                    for (const p of pellets) g.drawCircle(p.cx, p.cy, pelletR)
                    g.endFill()
                }}
            />

            {/* Пауэр-пеллеты */}
            <pixiGraphics
                draw={(g: any) => {
                    g.clear()
                    g.beginFill(powerPelletColor)
                    for (const p of powerPellets) g.drawCircle(p.cx, p.cy, powerPelletR)
                    g.endFill()
                }}
            />
        </>
    )
}
