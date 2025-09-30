/*
  Token Registry - Quản lý tất cả token contracts
*/

export interface TokenInfo {
  symbol: string;
  name: string;
  abiPath: string;
  addressesPath: string;
  decimals: number;
  icon: string;
  color: string;
}

export const TOKEN_REGISTRY: Record<string, TokenInfo> = {
  'zUSD': {
    symbol: 'zUSD',
    name: 'Zama Confidential USD',
    abiPath: './MyConfidentialToken-zUSDABI',
    addressesPath: './MyConfidentialToken-zUSDAddresses',
    decimals: 0,
    icon: '/usdc.svg',
    color: 'bg-green-500'
  },
  'zBTC': {
    symbol: 'zBTC',
    name: 'Zama Confidential Bitcoin',
    abiPath: './MyConfidentialToken-zBTCABI',
    addressesPath: './MyConfidentialToken-zBTCAddresses',
    decimals: 0,
    icon: '/btc.svg',
    color: 'bg-orange-500'
  },
  'zETH': {
    symbol: 'zETH',
    name: 'Zama Confidential Ethereum',
    abiPath: './MyConfidentialToken-zETHABI',
    addressesPath: './MyConfidentialToken-zETHAddresses',
    decimals: 0,
    icon: '/eth.svg',
    color: 'bg-blue-500'
  }
};

// Helper functions
export const getTokenInfo = (symbol: string): TokenInfo | undefined => {
  return TOKEN_REGISTRY[symbol];
};

export const getAllTokens = (): TokenInfo[] => {
  return Object.values(TOKEN_REGISTRY);
};

// Dynamic import functions
export const getTokenABI = async (symbol: string) => {
  const token = getTokenInfo(symbol);
  if (!token) {
    // Try to get ABI for deployed token (fallback to zUSD ABI)
    const module = await import('./MyConfidentialToken-zUSDABI');
    return module.MyConfidentialTokenzUSDABI;
  }
  
  const module = await import(token.abiPath);
  return module[`MyConfidentialToken${symbol}ABI`];
};

export const getTokenAddresses = async (symbol: string) => {
  const token = getTokenInfo(symbol);
  if (!token) {
    // For deployed tokens, return null (address comes from localStorage)
    return null;
  }
  
  const module = await import(token.addressesPath);
  return module[`MyConfidentialToken${symbol}Addresses`];
};