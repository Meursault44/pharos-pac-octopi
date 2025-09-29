import { Box, Grid, IconButton } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';

type Dir = 'up' | 'left' | 'down' | 'right';

const KEY_BY_DIR: Record<Dir, { code: string; key: string }> = {
  up: { code: 'KeyW', key: 'w' },
  left: { code: 'KeyA', key: 'a' },
  down: { code: 'KeyS', key: 's' },
  right: { code: 'KeyD', key: 'd' },
};

function isLandscape() {
  if (window.screen?.orientation?.type)
    return window.screen.orientation.type.startsWith('landscape');
  return (
    window.matchMedia?.('(orientation: landscape)')?.matches ??
    window.innerWidth > window.innerHeight
  );
}
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// шлём такие же события, какие ловит Pacman.tsx
function fireKey(code: string, key: string, type: 'keydown' | 'keyup') {
  const ev = new KeyboardEvent(type, {
    code,
    key,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(ev);
}

export default function MobileTouchpadChakra() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(isMobile() && isLandscape());
    update();
    const mq = window.matchMedia('(orientation: landscape)');
    mq.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      mq.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const handlers = useMemo(() => {
    const start = (dir: Dir) => (e: any) => {
      e.preventDefault();
      const { code, key } = KEY_BY_DIR[dir];
      // удержание = движение: держим keydown, отпустим на end
      fireKey(code, key, 'keydown');
    };
    const end = (dir: Dir) => (e: any) => {
      e.preventDefault();
      const { code, key } = KEY_BY_DIR[dir];
      fireKey(code, key, 'keyup');
    };
    return { start, end };
  }, []);

  if (!visible) return null;

  return (
    <Box
      position="fixed"
      left={4}
      top="50%"
      transform="translateY(-50%)"
      zIndex={9998}
      touchAction="none"
    >
      <Grid
        templateAreas={`". up ."
                        "left . right"
                        ". down ."`}
        gap={2}
      >
        <IconButton
          aria-label="Up"
          gridArea="up"
          onTouchStart={handlers.start('up')}
          onTouchEnd={handlers.end('up')}
          onTouchCancel={handlers.end('up')}
          onMouseDown={handlers.start('up')}
          onMouseUp={handlers.end('up')}
          onMouseLeave={handlers.end('up')}
          width={'80px'}
          height={'80px'}
          rounded="2xl"
          bg="blackAlpha.500"
          color="white"
          _hover={{ bg: 'blackAlpha.500' }}
          _active={{ transform: 'scale(0.98)' }}
          border="1px solid"
          borderColor="whiteAlpha.500"
          sx={{
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            touchAction: 'none',
            backdropFilter: 'blur(6px)',
          }}
        />
        <IconButton
          aria-label="Left"
          gridArea="left"
          onTouchStart={handlers.start('left')}
          onTouchEnd={handlers.end('left')}
          onTouchCancel={handlers.end('left')}
          onMouseDown={handlers.start('left')}
          onMouseUp={handlers.end('left')}
          onMouseLeave={handlers.end('left')}
          width={'80px'}
          height={'80px'}
          rounded="2xl"
          bg="blackAlpha.500"
          color="white"
          _hover={{ bg: 'blackAlpha.500' }}
          _active={{ transform: 'scale(0.98)' }}
          border="1px solid"
          borderColor="whiteAlpha.500"
          sx={{
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            touchAction: 'none',
            backdropFilter: 'blur(6px)',
          }}
        />
        <IconButton
          aria-label="Down"
          gridArea="down"
          onTouchStart={handlers.start('down')}
          onTouchEnd={handlers.end('down')}
          onTouchCancel={handlers.end('down')}
          onMouseDown={handlers.start('down')}
          onMouseUp={handlers.end('down')}
          onMouseLeave={handlers.end('down')}
          width={'80px'}
          height={'80px'}
          rounded="2xl"
          bg="blackAlpha.500"
          color="white"
          _hover={{ bg: 'blackAlpha.500' }}
          _active={{ transform: 'scale(0.98)' }}
          border="1px solid"
          borderColor="whiteAlpha.500"
          sx={{
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            touchAction: 'none',
            backdropFilter: 'blur(6px)',
          }}
        />
        <Box
          aria-label="Right"
          gridArea="right"
          onTouchStart={handlers.start('right')}
          onTouchEnd={handlers.end('right')}
          onTouchCancel={handlers.end('right')}
          onMouseDown={handlers.start('right')}
          onMouseUp={handlers.end('right')}
          onMouseLeave={handlers.end('right')}
          width={'80px'}
          height={'80px'}
          rounded="2xl"
          bg="blackAlpha.500"
          color="white"
          _hover={{ bg: 'blackAlpha.500' }}
          _active={{ transform: 'scale(0.98)' }}
          border="1px solid"
          borderColor="whiteAlpha.500"
          sx={{
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            touchAction: 'none',
            backdropFilter: 'blur(6px)',
          }}
        />
      </Grid>
    </Box>
  );
}
