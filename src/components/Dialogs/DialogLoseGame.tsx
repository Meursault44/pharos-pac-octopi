import { CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useDialogsStore } from '../../store/dialogs';

export const DialogLoseGame = () => {
    const { dialogLoseGame, setDialogLoseGame } = useDialogsStore();

    return (
        <>
            <Dialog.Root open={dialogLoseGame} onOpenChange={(e) => setDialogLoseGame(e?.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content maxW="450px">
                            <Dialog.Header>
                                <Dialog.Title>You lose!!!</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body display={'flex'} justifyContent={'center'}>
                                GG
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
