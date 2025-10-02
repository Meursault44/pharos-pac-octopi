import { Box, Card, Heading, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { isPortrait } from '@/helpers/getOrientation.ts';

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default function OrientationGateChakra() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => setShow(isMobile() && isPortrait());
    update();
    const mq = window.matchMedia('(orientation: portrait)');
    mq.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      mq.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  if (!show) return null;

  return (
    <Box
      position="fixed"
      inset="0"
      zIndex={9999}
      bg={'blackAlpha.700'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={6}
    >
      <Card.Root
        bg="whiteAlpha.200"
        border="1px solid"
        borderColor="whiteAlpha.400"
        backdropFilter="blur(6px)"
        rounded="2xl"
        maxW="sm"
      >
        <Card.Body textAlign="center" color="white">
          <Heading size="md" mb={2}>
            Turn the device
          </Heading>
          <Text opacity={0.9}>To play, turn your phone to landscape mode.</Text>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
