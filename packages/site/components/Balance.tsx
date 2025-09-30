"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useFhevmContext } from '@/contexts/FhevmContext';
import { getTokenABI, getTokenAddresses, getAllTokens } from '../abi/TokenRegistry';
import { useToast } from '../hooks/useToast';
import Image from 'next/image';

interface BalanceProps {
  isLoading?: boolean;
}

export const Balance: React.FC<BalanceProps> = ({ isLoading }) => {
  const { address } = useAccount();
  const { ethersReadonlyProvider, instance: fhevmInstance, ethersSigner } = useFhevmContext();
  const { success, error } = useToast();

  // Available tokens list
  const [availableTokens, setAvailableTokens] = useState<Array<{
    symbol: string;
    name: string;
    icon: string;
    color: string;
    isReal: boolean;
    address?: string;
    decimals?: string;
  }>>([]);

  // Balance states
  const [selectedBalanceToken, setSelectedBalanceToken] = useState('zBTC');
  const [isBalanceTokenDropdownOpen, setIsBalanceTokenDropdownOpen] = useState(false);
  const balanceTokenDropdownRef = useRef<HTMLDivElement>(null);
  const [confidentialBalance, setConfidentialBalance] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [hasBalance, setHasBalance] = useState<boolean>(false);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState<boolean>(false);
  const [isDecryptAllowed, setIsDecryptAllowed] = useState<boolean>(false);

  // Helper function to load all tokens (registry + deployed)
  const loadAllTokens = async () => {
    // Load registry tokens (hardcoded)
    const registryTokens = getAllTokens();
    
    const registryTokenOptions = await Promise.all(
      registryTokens.map(async (token) => {
        const addresses = await getTokenAddresses(token.symbol);
        
        return {
          symbol: token.symbol,
          name: token.name,
          icon: token.icon,
          color: token.color,
          isReal: true,
          address: addresses?.["11155111"]?.address,
          decimals: token.decimals.toString(),
        };
      })
    );
    
    // Load deployed contracts từ localStorage
    let deployedTokenOptions: typeof registryTokenOptions = [];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('deployedContracts');
        if (saved) {
          const deployedContracts = JSON.parse(saved);
            deployedTokenOptions = deployedContracts.map((contract: any) => ({
              symbol: contract.symbol,
              name: contract.name,
              icon: '🪙', // Default icon for deployed tokens
              color: '#8B5CF6', // Default color for deployed tokens
              isReal: true,
              address: contract.address,
              decimals: contract.decimals,
            }));
        }
      } catch (error) {
        // Error loading deployed contracts
        console.error('Error loading deployed contracts:', error);
      }
    }
    
    // Merge registry tokens với deployed tokens
    const allTokens = [...registryTokenOptions, ...deployedTokenOptions];
    console.log('Loading tokens:', { registry: registryTokenOptions.length, deployed: deployedTokenOptions.length, total: allTokens.length });
    setAvailableTokens(allTokens);
  };

  // Load tokens từ TokenRegistry + deployed contracts từ localStorage
  useEffect(() => {
    loadAllTokens();
  }, []);

  // Listen for localStorage changes to reload tokens when new contracts are deployed
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'deployedContracts') {
        loadAllTokens();
      }
    };

    // Listen for custom event when contracts are deployed in same tab
    const handleContractDeployed = () => {
      loadAllTokens();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('contractDeployed', handleContractDeployed);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('contractDeployed', handleContractDeployed);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (balanceTokenDropdownRef.current && !balanceTokenDropdownRef.current.contains(event.target as Node)) {
        setIsBalanceTokenDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to check balance
  const handleCheckBalance = async () => {
    if (!address) {
      error('🔌 Please connect your wallet');
      return;
    }
    
    setIsFetchingBalance(true);
    setIsDecryptAllowed(false);
    
    try {
      let contractAddress: string;
      let abi: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Chọn contract và ABI dựa trên token được chọn
      const selectedToken = availableTokens.find(t => t.symbol === selectedBalanceToken);
      
      if (selectedToken && selectedToken.isReal && selectedToken.address) {
        // Real token từ deployed contract
        contractAddress = selectedToken.address;
        const MyConfidentialTokenABI = getTokenABI(selectedToken.symbol);
        abi = MyConfidentialTokenABI.abi;
      } else if (selectedBalanceToken === 'zUSD' || selectedBalanceToken === 'zBTC') {
        // Real token từ TokenRegistry
        if (!selectedToken) {
          throw new Error('Selected token not found');
        }
        const addresses = await getTokenAddresses(selectedToken.symbol);
        contractAddress = addresses?.["11155111"]?.address;
        const MyConfidentialTokenABI = getTokenABI(selectedToken.symbol);
        abi = MyConfidentialTokenABI.abi;
      } else {
        // Mock tokens - không có contract thật
        error(`🚫 ${selectedBalanceToken} is a mock token`);
        return;
      }
      
      // Tạo contract instance
      const contract = new ethers.Contract(contractAddress, abi, ethersReadonlyProvider);
      
      // Lấy encrypted balance từ wallet đã kết nối
      const balance = await contract.confidentialBalanceOf(address);
      
      // Set current balance để hiển thị
      setConfidentialBalance(balance);
      setHasBalance(balance && balance.toString() !== '0x0000000000000000000000000000000000000000000000000000000000000000');
      
      // Tự động allow decrypt
      const contractWithSigner = new ethers.Contract(contractAddress, abi, ethersSigner);
      
      const allowTx = await contractWithSigner.discloseEncryptedAmount(balance);
      await allowTx.wait();
      
      // Enable decrypt button sau khi transaction hoàn thành
      setIsDecryptAllowed(true);
      
      success(`${selectedBalanceToken} balance retrieved and decrypt allowed!`);
      
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      error(`❌ Failed to fetch ${selectedBalanceToken} balance`);
      setIsDecryptAllowed(false);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  // Function to decrypt balance
  const handleDecryptBalance = async () => {
    if (!fhevmInstance || !ethersSigner || !confidentialBalance) return;
    
    try {
      // Tìm contract address từ availableTokens (bao gồm cả deployed tokens)
      const selectedToken = availableTokens.find(t => t.symbol === selectedBalanceToken);
      
      if (!selectedToken || !selectedToken.address) {
        throw new Error('Contract address not found');
      }
      const contractAddress = selectedToken.address;
      const userAddr = await ethersSigner.getAddress();
      
      // Lấy handle từ ciphertext
      const handle = confidentialBalance?.handle || confidentialBalance;
      if (!handle) {
        error('🔒 Cannot retrieve encrypted balance');
        return;
      }

      // Tạo keypair để ký yêu cầu decrypt
      const { privateKey, publicKey } = fhevmInstance.generateKeypair();
      
      // Chuẩn bị EIP-712 và ký
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [contractAddress];
      
      const eip712 = fhevmInstance.createEIP712(
        publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );
      
      const signature = await (ethersSigner as any).signTypedData( // eslint-disable-line @typescript-eslint/no-explicit-any
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );
      
      // Gọi userDecrypt
      const result = await fhevmInstance.userDecrypt(
        [{ handle, contractAddress }],
        privateKey,
        publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        userAddr,
        startTimeStamp,
        durationDays
      );
      
      const weiBn = result[handle];
      if (typeof weiBn === 'boolean') {
        error('⚠️ Invalid balance value');
        return;
      }
      
      const formattedBalance = ethers.formatUnits(weiBn, 0); // 0 decimals
      setDecryptedBalance(formattedBalance);
      success(`🔓 Decrypted: ${formattedBalance} ${selectedBalanceToken}`);
      
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      error(`❌ Decryption failed`);
    }
  };

  return (
    <div className="rounded-xl p-4 bg-primary border border-custom">
      <h3 className="text-lg font-semibold mb-3 text-white">Check Balance</h3>
      
      {/* Token Selection */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2 items-center">
          {/* Token Selection */}
          <div className="w-[30%] relative" ref={balanceTokenDropdownRef}>
            <button
              onClick={() => setIsBalanceTokenDropdownOpen(!isBalanceTokenDropdownOpen)}
              className="w-full p-2 rounded flex items-center justify-between bg-tertiary hover:bg-[#12949D] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                  {availableTokens.find(t => t.symbol === selectedBalanceToken)?.icon?.startsWith('/') || availableTokens.find(t => t.symbol === selectedBalanceToken)?.icon?.startsWith('http') ? (
                    <Image 
                      src={availableTokens.find(t => t.symbol === selectedBalanceToken)?.icon || '/usdc.svg'} 
                      alt={selectedBalanceToken}
                      width={24} 
                      height={24} 
                    />
                  ) : (
                    <span className="text-lg">
                      {availableTokens.find(t => t.symbol === selectedBalanceToken)?.icon || '🪙'}
                    </span>
                  )}
                </div>
                <span className="font-bold text-white">{selectedBalanceToken}</span>
              </div>
            <svg
              className={`w-4 h-4 text-white transition-transform ml-2 ${isBalanceTokenDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isBalanceTokenDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-[240%] bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                {availableTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => {
                      setSelectedBalanceToken(token.symbol);
                      setIsBalanceTokenDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                      selectedBalanceToken === token.symbol ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                      {token.icon.startsWith('/') || token.icon.startsWith('http') ? (
                        <Image src={token.icon} alt={token.symbol} width={24} height={24} />
                      ) : (
                        <span className="text-lg">{token.icon}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-500">{token.name}</div>
                      {token.isReal && token.address && (
                        <div className="text-xs text-gray-400 font-mono">
                          {token.address.slice(0, 6)}...{token.address.slice(-4)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Balance Display */}
          <div className="flex-1 text-right">
            <div className="w-full p-2 text-right">
              <span className="font-bold text-white text-base">
                {decryptedBalance ? `${decryptedBalance}` : (hasBalance ? 'Encrypted' : '--')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={handleCheckBalance}
            disabled={isLoading || isFetchingBalance}
            className="flex-1 btn-primary text-white py-2 px-4 rounded disabled:opacity-50 text-sm font-bold"
          >
            {isFetchingBalance ? 'Fetching...' : 'Fetch Balance'}
          </button>
          <button
            onClick={handleDecryptBalance}
            disabled={isLoading || !hasBalance || !isDecryptAllowed}
            className="flex-1 btn-primary text-white py-2 px-4 rounded disabled:opacity-50 text-sm font-bold"
          >
            Decrypt Balance
          </button>
        </div>
      </div>
    </div>
  );
};
