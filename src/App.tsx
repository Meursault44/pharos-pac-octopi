import { PacmanGame } from './components/PacmanGame.tsx';
import { useGameStore } from './game/gameStore.ts';
import { VStack, Text } from '@chakra-ui/react';
import { DialogLoseGame, DialogStartGame, DialogWinGame } from '@/components/Dialogs';

export const App = () => {
  const score = useGameStore((s) => s.score);
  return (
    <VStack
      h={'100vh'}
      bg={
        'linear-gradient(135deg, rgb(245, 242, 237) 0%, rgb(232, 234, 246) 30%, rgb(227, 242, 253) 60%, rgb(187, 222, 251) 100%)'
      }
      justifyContent={'center'}
    >
      <Text fontSize={'2rem'}>Score: {score}</Text>
      <PacmanGame />
      <DialogLoseGame />
      <DialogStartGame />
      <DialogWinGame />
    </VStack>
  );
};
