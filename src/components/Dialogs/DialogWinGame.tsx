import { CloseButton, Dialog, Portal, VStack, Button } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useDialogsStore } from '@/store/dialogs';
import bg from '@/assets/bgWin.jpg';
import { OctopiWithText } from '@/components/OctopiWithText.tsx';
import winOctopi from '@/assets/winOctopi.png';
import { useGameStore } from '@/game/gameStore.ts';

export const DialogWinGame = () => {
  const { dialogWinGame, setDialogWinGame } = useDialogsStore();
  const startGame = useGameStore((s) => s.startGame);

  const onStartGameHandler = useCallback(() => {
    setDialogWinGame(false);
    startGame();
  }, [startGame, setDialogWinGame]);

  return (
    <Dialog.Root open={dialogWinGame} onOpenChange={(e) => setDialogWinGame(e?.open)}>
      <Portal>
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content
            w="50vw"
            maxW="1536px"
            aspectRatio="3 / 2"
            position="relative"
            overflow="hidden"
            bgImage={`url(${bg})`}
            bgSize="contain"
            bgPos="center"
            bgRepeat="no-repeat"
            bgColor="black"
            color="white"
            boxShadow="xl"
            borderRadius="lg"
            display="flex"
            flexDir="column"
          >
            <Dialog.Header>
              <Dialog.Title>you won</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body
              display="flex"
              justifyContent="flex-start"
              alignItems="flex-end"
              flex="1"
              px="10px"
            >
              <VStack alignItems={'flex-start'} mb={'10%'}>
                <OctopiWithText
                  imgSrc={winOctopi}
                  text={
                    'You really managed to collect all the coins while five sharks were chasing you. Congratulations!'
                  }
                />
                <VStack w={'100%'} alignItems={'flex-end'}>
                  <Button onClick={onStartGameHandler} p={'2rem'} fontSize={'2rem'}>
                    Play again
                  </Button>
                </VStack>
              </VStack>
            </Dialog.Body>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
