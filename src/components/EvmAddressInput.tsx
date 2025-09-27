import { useState, useMemo, useCallback } from 'react';
import { Field, Input, HStack, Button, Box } from '@chakra-ui/react';
import { useUserInfoStore } from '@/store/userInfo.ts';
import { isAddress } from 'viem';

export const EvmAddressInput = () => {
  const [value, setValue] = useState('');
  const setAddress = useUserInfoStore((s) => s.setAddress);

  const isValid = useMemo(() => {
    if (!value) return false;
    return isAddress(value);
  }, [value]);

  const handleButtonClick = useCallback(() => {
    setAddress(value);
  }, [setAddress, value]);

  console.log(isValid);
  return (
    <HStack alignItems={'flex-end'}>
      <Field.Root invalid={!!value.length && !isValid}>
        <Field.Label>EVM address</Field.Label>
        <Input
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          placeholder="0x..."
        />
        {!!value.length && !isValid ? (
          <Field.ErrorText>Please enter a valid address.</Field.ErrorText>
        ) : (
          <Box h={'1rem'} w={0}></Box>
        )}
      </Field.Root>
      <Button disabled={!isValid} mb={'1.35rem'} onClick={handleButtonClick}>
        Apply
      </Button>
    </HStack>
  );
};
