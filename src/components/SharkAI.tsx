import { useTick } from '@pixi/react';
import { useGameStore } from '@/game/gameStore';

export const SharkAI = () => {
  const moveSharks = useGameStore((s) => s.moveSharks);
  useTick(() => {
    moveSharks();
  });
  return null;
};
