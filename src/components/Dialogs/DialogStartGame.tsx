import { CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useDialogsStore } from '@/store/dialogs';
import {useGameStore} from "@/game/gameStore.ts";
import { Button, VStack, Text, Separator  } from "@chakra-ui/react";
import { EvmAddressInput } from '@/components/EvmAddressInput.tsx'
import {useCallback} from "react";

export const DialogStartGame = () => {
    const { dialogStartGame, setDialogStartGame } = useDialogsStore();
    const startGame = useGameStore((s) => s.startGame);
    const reset = useGameStore((s) => s.reset);

    const startGameHandler = useCallback(() => {
        reset();
        startGame();
        setDialogStartGame(false);
    }, [startGame, setDialogStartGame])

    return (
        <>
            <Dialog.Root open={dialogStartGame} onOpenChange={(e) => setDialogStartGame(e?.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content maxW="450px">
                            <Dialog.Header>
                                <Dialog.Title>START GAME</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body display={'flex'} justifyContent={'center'}>
                                <VStack>
                                    <EvmAddressInput />
                                    <Separator w={'100%'} size={'lg'} />
                                    <VStack>
                                        <Text>OR JUST PLAY FOR FUN</Text>
                                        <Button onClick={startGameHandler}>PLAY FOR FUN</Button>
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
        </>
    );
};
