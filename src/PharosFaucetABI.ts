// PharosFaucetABI.ts
export const PHAROS_FAUCET_ABI = [
    { type: 'function', name: 'claim', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }], outputs: [] },
    { type: 'function', name: 'deposit', stateMutability: 'payable', inputs: [], outputs: [] },
    { type: 'function', name: 'getBalance', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [] },
    { type: 'function', name: 'owner', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
] as const
