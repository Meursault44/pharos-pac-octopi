import { CloseButton, Dialog, Portal, VStack, Button } from '@chakra-ui/react';
import { useCallback, useEffect } from 'react';
import { useDialogsStore } from '@/store/dialogs';
import bg from '@/assets/bgLose.jpg';
import { OctopiWithText } from '@/components/OctopiWithText.tsx';
import OctopiLost from '@/assets/OctopiLost.png';
import { useGameStore } from '@/game/gameStore.ts';
import useSound from 'use-sound';
import lostSfx from '@/sounds/lost.mp3';

export const DialogLoseGame = () => {
  const { dialogLoseGame, setDialogLoseGame } = useDialogsStore();
  const startGame = useGameStore((s) => s.startGame);

  const [playLost] = useSound(lostSfx, {
    volume: 0.1, // подстрой по вкусу
    interrupt: true, // обрывает предыдущий звук, если новый стартует
  });

  const onStartGameHandler = useCallback(() => {
    setDialogLoseGame(false);
    startGame();
  }, [startGame, setDialogLoseGame]);

  useEffect(() => {
    if (dialogLoseGame) {
      console.log('play lost');
      playLost();
    }
  }, [playLost, dialogLoseGame]);

  return (
    <Dialog.Root open={dialogLoseGame} onOpenChange={(e) => setDialogLoseGame(e?.open)}>
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
              <Dialog.Title>you lost</Dialog.Title>
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
                  imgSrc={OctopiLost}
                  text={
                    'It seems you lost, but everything is fine, because there are 6 sharks and you are 1'
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
