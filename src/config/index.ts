import { networks } from './networks.js';

export const config = {
  networks,
  defaultNetwork: process.env.SUI_NETWORK || 'testnet'
};
