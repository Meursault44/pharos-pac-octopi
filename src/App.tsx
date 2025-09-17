import {PacmanGame} from "./components/PacmanGame.tsx";
import { useGameStore } from './game/gameStore.ts'

export const App = () => {
    const score = useGameStore((s) => s.score);
    return (
        <div className={'flex flex-col w-full h-[100vh] justify-center items-center'}>
            <div className={'text-[24px]'}>Score: {score}</div>
            <PacmanGame />
        </div>
    );
}