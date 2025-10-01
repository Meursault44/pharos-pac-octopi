import { create } from 'zustand';

type DialogsState = {
  dialogLoseGame: boolean;
  dialogWinGame: boolean;
};

type DialogsActions = {
  setDialogLoseGame: (val: boolean) => void;
  setDialogWinGame: (val: boolean) => void;
};

type DialogsStore = DialogsState & DialogsActions;

export const useDialogsStore = create<DialogsStore>()((set) => ({
  dialogLoseGame: false,
  dialogWinGame: false,
  dialogStartGame: false,
  setDialogLoseGame: (val) => set({ dialogLoseGame: val }),
  setDialogWinGame: (val) => set({ dialogWinGame: val }),
}));
