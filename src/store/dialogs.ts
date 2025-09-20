import { create } from 'zustand';

type DialogsState = {
    dialogLoseGame: boolean;
};

type DialogsActions = {
    setDialogLoseGame: (val: boolean) => void;
};

type DialogsStore = DialogsState & DialogsActions;

export const useDialogsStore = create<DialogsStore>()((set) => ({
    dialogLoseGame: false,
    setDialogLoseGame: (val) => set({ dialogLoseGame: val }),
}));
