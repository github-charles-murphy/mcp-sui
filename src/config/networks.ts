export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  faucetUrl?: string;
}

export const networks: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Sui Mainnet',
    rpcUrl: process.env.SUI_MAINNET_RPC || 'https://fullnode.mainnet.sui.io:443'
  },
  testnet: {
    name: 'Sui Testnet',
    rpcUrl: process.env.SUI_TESTNET_RPC || 'https://fullnode.testnet.sui.io:443',
    faucetUrl: 'https://faucet.testnet.sui.io/v2/gas'
  },
  devnet: {
    name: 'Sui Devnet',
    rpcUrl: process.env.SUI_DEVNET_RPC || 'https://fullnode.devnet.sui.io:443',
    faucetUrl: 'https://faucet.devnet.sui.io/gas'
  },
  local: {
    name: 'Localhost',
    rpcUrl: process.env.SUI_LOCAL_RPC || 'http://127.0.0.1:9000'
  }
};
