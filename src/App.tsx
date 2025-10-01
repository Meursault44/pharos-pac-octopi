import { PacmanGame } from './components/PacmanGame.tsx';
import { HStack } from '@chakra-ui/react';
import { DialogLoseGame, DialogStartGame, DialogWinGame } from '@/components/Dialogs';
import OrientationGateChakra from '@/components/OrientationGateChakra';

export const App = () => {
  return (
    <HStack
      h={'100svh'}
      bg={
        'linear-gradient(135deg, rgb(245, 242, 237) 0%, rgb(232, 234, 246) 30%, rgb(227, 242, 253) 60%, rgb(187, 222, 251) 100%)'
      }
      justifyContent={'center'}
      alignItems={'center'}
    >
      <PacmanGame />
      <OrientationGateChakra />
      <DialogLoseGame />
      <DialogStartGame />
      <DialogWinGame />
    </HStack>
  );
};
