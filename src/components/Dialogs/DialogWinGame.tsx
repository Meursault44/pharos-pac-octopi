import { CloseButton, Dialog, Portal, VStack, Button } from '@chakra-ui/react';
import { useCallback, useEffect, useRef } from 'react';
import { useDialogsStore } from '@/store/dialogs';
import bg from '@/assets/bgWin.jpg';
import { OctopiWithText } from '@/components/OctopiWithText.tsx';
import winOctopi from '@/assets/winOctopi.png';
import { useGameStore } from '@/game/gameStore.ts';
import useSound from 'use-sound';
import vikaSfx from '@/sounds/vika.mp3';
import confetti from 'canvas-confetti';

export const DialogWinGame = () => {
  const { dialogWinGame, setDialogWinGame } = useDialogsStore();
  const startGame = useGameStore((s) => s.startGame);

  const [playWin, { stop: stopWin }] = useSound(vikaSfx, {
    volume: 0.2,
    interrupt: true,
  });

  // refs для очистки
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRAFRef = useRef<number | null>(null);
  const confettiEndTimeRef = useRef<number | null>(null);
  const confettiInstanceRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  const onStartGameHandler = useCallback(() => {
    setDialogWinGame(false);
    startGame();
  }, [startGame, setDialogWinGame]);

  // === ЭФФЕКТ ПОБЕДЫ ===
  useEffect(() => {
    if (dialogWinGame) {
      // запускаем звук
      playWin();

      // создаём canvas поверх всего
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
      confettiCanvasRef.current = canvas;

      const myConfetti = confetti.create(canvas, { resize: true });
      confettiInstanceRef.current = myConfetti;

      const end = Date.now() + 19 * 1000;
      confettiEndTimeRef.current = end;

      const colors = ['#bb0000', '#ffffff'];

      const frame = () => {
        if (!myConfetti) return;
        myConfetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        myConfetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          confettiRAFRef.current = requestAnimationFrame(frame);
        } else {
          cleanupConfetti();
        }
      };

      frame();
    } else {
      // если окно закрывается — чистим всё
      stopWin();
      cleanupConfetti();
    }

    // при размонтировании
    return () => {
      stopWin();
      cleanupConfetti();
    };
  }, [dialogWinGame, playWin, stopWin]);

  // === очистка ===
  const cleanupConfetti = () => {
    if (confettiRAFRef.current) {
      cancelAnimationFrame(confettiRAFRef.current);
      confettiRAFRef.current = null;
    }
    if (confettiCanvasRef.current && document.body.contains(confettiCanvasRef.current)) {
      document.body.removeChild(confettiCanvasRef.current);
      confettiCanvasRef.current = null;
    }
    confettiInstanceRef.current = null;
  };

  return (
    <Dialog.Root open={dialogWinGame} onOpenChange={(e) => setDialogWinGame(e?.open)}>
      <Portal>
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content
            w="45vw"
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
              justifyContent={["center", "center", "flex-start"]}
              alignItems={["center", "center", "flex-end"]}
              flex="1"
              px="10px"
            >
              <VStack alignItems={'flex-start'} mb={'10%'} gap={['1.2rem', '1.2rem', '0.6rem', '0.6rem']}>
                <OctopiWithText
                  imgSrc={winOctopi}
                  text={
                    'You really managed to collect all the coins while 6 sharks were chasing you. Congratulations!'
                  }
                />
                <VStack w={'100%'} alignItems={'center'}>
                  <Button
                    onClick={onStartGameHandler}
                    p={['28px, 28px, 28px, 32px']}
                    fontSize={'28px, 28px, 28px, 32px'}
                  >
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
