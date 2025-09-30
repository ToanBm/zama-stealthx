/*
  Token Registry - Quản lý tất cả token contracts
*/

// Import all ABIs and addresses directly
import { MyConfidentialTokenzUSDABI } from './MyConfidentialToken-zUSDABI';
import { MyConfidentialTokenzBTCABI } from './MyConfidentialToken-zBTCABI';
import { MyConfidentialTokenzETHABI } from './MyConfidentialToken-zETHABI';
import { MyConfidentialTokenzUSDAddresses } from './MyConfidentialToken-zUSDAddresses';
import { MyConfidentialTokenzBTCAddresses } from './MyConfidentialToken-zBTCAddresses';
import { MyConfidentialTokenzETHAddresses } from './MyConfidentialToken-zETHAddresses';

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

// Static mapping for ABIs
const ABI_MAP: Record<string, any> = {
  'zUSD': MyConfidentialTokenzUSDABI,
  'zBTC': MyConfidentialTokenzBTCABI,
  'zETH': MyConfidentialTokenzETHABI,
};

// Static mapping for addresses
const ADDRESSES_MAP: Record<string, any> = {
  'zUSD': MyConfidentialTokenzUSDAddresses,
  'zBTC': MyConfidentialTokenzBTCAddresses,
  'zETH': MyConfidentialTokenzETHAddresses,
};

// Static functions
export const getTokenABI = (symbol: string) => {
  const token = getTokenInfo(symbol);
  if (!token) {
    // Try to get ABI for deployed token (fallback to zUSD ABI)
    return MyConfidentialTokenzUSDABI;
  }
  
  return ABI_MAP[symbol] || MyConfidentialTokenzUSDABI;
};

export const getTokenAddresses = (symbol: string) => {
  const token = getTokenInfo(symbol);
  if (!token) {
    // For deployed tokens, return null (address comes from localStorage)
    return null;
  }
  
  return ADDRESSES_MAP[symbol] || null;
};