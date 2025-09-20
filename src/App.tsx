import {PacmanGame} from "./components/PacmanGame.tsx";
import { useGameStore } from './game/gameStore.ts'
import { VStack, Text } from '@chakra-ui/react';
import { DialogLoseGame } from "./components/Dialogs/DialogLoseGame.tsx";

export const App = () => {
    const score = useGameStore((s) => s.score);
    return (
        <VStack h={'100vh'} justifyContent={'center'}>
            <Text fontSize={'30px'}>Score: {score}</Text>
            <PacmanGame />
            <DialogLoseGame />
        </VStack>
    );
}