import { create } from 'zustand';

type UserInfoState = {
  address: string | null;
};

type UserInfoActions = {
  setAddress: (val: string | null) => void;
};

type UserInfoStore = UserInfoState & UserInfoActions;

export const useUserInfoStore = create<UserInfoStore>()((set) => ({
  address: null,
  setAddress: (val) => set({ address: val }),
}));
