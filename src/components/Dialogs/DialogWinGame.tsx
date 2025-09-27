import { CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useDialogsStore } from '@/store/dialogs';
import { useGameStore } from '@/game/gameStore.ts';
import { useUserInfoStore } from '@/store/userInfo.ts';
import { useWriteContract, useSwitchChain, useAccount } from 'wagmi';
import { PHAROS_FAUCET_ABI } from '@/PharosFaucetABI.ts';
import { PHAROS_FAUCET_ADDRESS, pharosTestnet } from '@/wagmi.ts';
import { useEffect } from 'react';
import { parseEther } from 'viem';

export const DialogWinGame = () => {
  const { dialogWinGame, setDialogWinGame } = useDialogsStore();
  const address = useUserInfoStore((s) => s.address);

  const { data: data, isPending, writeContract } = useWriteContract();
  const { chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  async function ensurePharos() {
    if (chain?.id !== pharosTestnet.id) {
      await switchChain({ chainId: pharosTestnet.id }); // MetaMask предложит добавить сеть, если её нет
    }
  }
  console.log(chain);
  console.log(data);
  console.log(address);

  const isWin = useGameStore((s) => s.isWin);
  const setIsWin = useGameStore((s) => s.setIsWin);

  useEffect(() => {
    if (isWin) {
      setDialogWinGame(true);
      setIsWin(false);
    }
  }, [isWin, setDialogWinGame, setIsWin]);

  return (
    <>
      <Dialog.Root open={dialogWinGame} onOpenChange={(e) => setDialogWinGame(e?.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="450px">
              <Dialog.Header>
                <Dialog.Title>You win!!!</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body display={'flex'} justifyContent={'center'}>
                GG
                <button
                  onClick={async () => {
                    await ensurePharos();
                    writeContract({
                      address: PHAROS_FAUCET_ADDRESS,
                      abi: PHAROS_FAUCET_ABI,
                      functionName: 'claim',
                      chainId: pharosTestnet.id,
                      args: [address],
                    });
                  }}
                >
                  Claim
                </button>
                <button
                  onClick={async () => {
                    await ensurePharos();
                    writeContract({
                      address: PHAROS_FAUCET_ADDRESS,
                      abi: PHAROS_FAUCET_ABI,
                      functionName: 'deposit',
                      chainId: pharosTestnet.id,
                      value: parseEther('1'),
                    });
                  }}
                >
                  Deposit
                </button>
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
