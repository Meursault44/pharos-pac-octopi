import type { FC } from 'react';
import { Box, VStack, Text, Image } from '@chakra-ui/react';

type OctopiWithTextType = {
  imgSrc: string;
  text: string;
};

export const OctopiWithText: FC<OctopiWithTextType> = ({ imgSrc, text }) => {
  // % по высоте изображения, где находится рот (подбери под свой спрайт)
  const MOUTH_Y = 58; // например, рот на ~58% высоты картинки
  // отступ пузыря от правого края картинки
  const GAP = 12; // px

  return (
    <Box
      position="relative"
      w={['38%', '32%', '28%', '25%']} // немного адаптивно
    >
      <Image src={imgSrc} alt="" w="100%" h="auto" draggable={false} />

      {/* Пузырь речи — привязан к уровню рта и вынесен вправо от картинки */}
      <Box
        position="absolute"
        top={`${MOUTH_Y}%`}
        left={`calc(100% + ${GAP}px)`}
        transform="translateY(-50%)"
        bg="white"
        color="black"
        px="12px"
        py="10px"
        borderRadius="10px"
        boxShadow="md"
        minW={['46vw', '38vw', '32vw', '26vw']} // чтобы текст не ломался на узких экранах
        maxW="48ch"
      >
        <VStack align="start" spacing="6px">
          <Text lineHeight="1.4" fontSize={['14px', '14px', '14px, 16px']} fontWeight={500}>
            {text}
          </Text>
        </VStack>

        {/* Хвостик, направленный к рту (слева, по центру пузыря) */}
        <Box
          as="svg"
          w="15px"
          h="22px"
          position="absolute"
          top="50%"
          left="-15px"
          transform="translateY(-50%)"
          color="white"
          pointerEvents="none"
          style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.06))' }}
          aria-hidden
        >
          <path d="M0 14C8.4 14 12.8333 4.66667 15 0V22C15 22 3.5 22 0 14Z" fill="currentColor" />
        </Box>
      </Box>
    </Box>
  );
};
