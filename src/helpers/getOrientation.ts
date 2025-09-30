export const isPortrait = () => {
  if (window.screen?.orientation?.type)
    return window.screen.orientation.type.startsWith('portrait');
  return (
    window.matchMedia?.('(orientation: portrait)')?.matches ??
    window.innerHeight > window.innerWidth
  );
};

export const isLandscape = () => {
  if (window.screen?.orientation?.type)
    return window.screen.orientation.type.startsWith('landscape');
  return (
    window.matchMedia?.('(orientation: landscape)')?.matches ??
    window.innerWidth > window.innerHeight
  );
};
