import {PacmanGame} from "./components/PacmanGame.tsx";

export const App = () => {
    return (
        <div className={'flex w-full h-[100vh] justify-center items-center'}>
            <PacmanGame />
        </div>
    );
}