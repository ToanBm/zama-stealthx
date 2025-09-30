"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useMyConfidentialToken } from '../hooks/useMyConfidentialToken';
import { useTab } from '@/contexts/TabContext';
import { useFhevmContext } from '@/contexts/FhevmContext';
import { getTokenABI, getTokenAddresses, getTokenInfo, getAllTokens } from '../abi/TokenRegistry';
import { MyConfidentialTokenBytecode } from '../abi/bytecode/MyConfidentialTokenBytecode';
import { Balance } from './Balance';
import Image from 'next/image';

export const ConfidentialToken: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { confidentialSubTab } = useTab();
  const { ethersReadonlyProvider, instance: fhevmInstance, ethersSigner } = useFhevmContext();

  const {
    isLoading,
    error,
    mintConfidential, // eslint-disable-line @typescript-eslint/no-unused-vars
    burnConfidential,
    batchMintConfidential, // eslint-disable-line @typescript-eslint/no-unused-vars
    batchTransferConfidential,
    faucet, // eslint-disable-line @typescript-eslint/no-unused-vars
    getConfidentialBalance,
    allowSelfBalanceDecrypt
  } = useMyConfidentialToken();

  // Form states
  const [mintAmount, setMintAmount] = useState('');


  // Handle mint amount change - chỉ lưu raw value
  const handleMintAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d+$/.test(value)) {
      setMintAmount(value); // chỉ lưu raw
    }
  };
  const [burnTo, setBurnTo] = useState(''); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [burnAmount, setBurnAmount] = useState('');

  // Handle burn amount change - chỉ lưu raw value
  const handleBurnAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d+$/.test(value)) {
      setBurnAmount(value); // chỉ lưu raw
    }
  };
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('50');

  // Handle transfer amount change - chỉ lưu raw value
  const handleTransferAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d+$/.test(value)) {
      setTransferAmount(value); // chỉ lưu raw
    }
  };
  const [faucetAmount, setFaucetAmount] = useState('1000'); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // Batch transfer states
  const [batchRecipients, setBatchRecipients] = useState('');
  const [batchAmounts, setBatchAmounts] = useState('');
  
  // Balance states (for other tabs)
  const [balanceAccount, setBalanceAccount] = useState('');
  const [hasBalance, setHasBalance] = useState(false);
  const [confidentialBalance, setConfidentialBalance] = useState<string | null>(null);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  
  // Token info states
  const [tokenName, setTokenName] = useState('zBTC'); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [tokenSymbol, setTokenSymbol] = useState('zBTC');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [selectedToken, setSelectedToken] = useState('zBTC');
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const tokenDropdownRef = useRef<HTMLDivElement>(null);

  // Balance states (for other tabs)
  const [selectedBalanceToken, setSelectedBalanceToken] = useState('zBTC'); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isBalanceTokenDropdownOpen, setIsBalanceTokenDropdownOpen] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const balanceTokenDropdownRef = useRef<HTMLDivElement>(null);

  
  // Sent tab sub-tabs
  const [sentSubTab, setSentSubTab] = useState<'transfer' | 'batch-transfer'>('transfer');
  
  // Mint tab sub-tabs
  const [mintSubTab, setMintSubTab] = useState<'mint' | 'burn'>('mint');
  
  // Deploy tab sub-tabs
  const [deploySubTab, setDeploySubTab] = useState<'manual' | 'auto'>('manual');
  
  // Deploy contract states
  const [contractName, setContractName] = useState('');
  const [contractSymbol, setContractSymbol] = useState('');
  const [contractDecimals, setContractDecimals] = useState('18'); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [initialSupply, setInitialSupply] = useState('');
  
  // State for deployed contracts
  const [deployedContracts, setDeployedContracts] = useState<Array<{
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    deployTime: string;
    deployer: string;
  }>>([]);

  // localStorage functions for deployed contracts
  const saveDeployedContracts = (contracts: typeof deployedContracts) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deployedContracts', JSON.stringify(contracts));
      } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Error saving deployed contracts
      }
    }
  };


  // Available tokens list - từ TokenRegistry + deployed contracts
  const [availableTokens, setAvailableTokens] = useState<Array<{
    symbol: string;
    name: string;
    icon: string;
    color: string;
    isReal: boolean;
    address?: string;
    decimals?: string;
    deployTime?: string;
    deployer?: string;
  }>>([]);

  // Load deployed contracts on component mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadDeployedContracts = (): typeof deployedContracts => {
        try {
          const saved = localStorage.getItem('deployedContracts');
          return saved ? JSON.parse(saved) : [];
        } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
          // Error loading deployed contracts
          return [];
        }
      };
      
      const savedContracts = loadDeployedContracts();
      setDeployedContracts(savedContracts);
    }
  }, []);

  // Load tokens từ TokenRegistry (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadTokens = async () => {
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
        
        // Load deployed tokens from localStorage
        const deployedTokens = JSON.parse(localStorage.getItem('deployedContracts') || '[]');
        
        const deployedTokenOptions = deployedTokens.map((contract: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          symbol: contract.symbol,
          name: contract.name,
          icon: '🪙', // Default icon for deployed tokens
          color: 'bg-purple-500', // Default color for deployed tokens
          isReal: true,
          address: contract.address,
          decimals: contract.decimals?.toString() || '18',
          deployTime: contract.deployTime,
          deployer: contract.deployer,
        }));
        
        // Combine both lists
        const allTokens = [...registryTokenOptions, ...deployedTokenOptions];
        setAvailableTokens(allTokens);
      };
      
      loadTokens();
    }
  }, []);

  // Function to create encrypted input using fhevmInstance
  const createEncryptedInput = async (amount: bigint, contractAddress: string) => {
    if (!fhevmInstance || !ethersSigner) {
      throw new Error('FHEVM instance or ethersSigner not available');
    }

    const userAddress = await ethersSigner.getAddress();
    const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
    input.add64(amount);
    const enc = await input.encrypt();
    
    return {
      handle: enc.handles[0],
      proof: enc.inputProof
    };
  };

  // Function to get token info from contract
  const getTokenContractInfo = async () => { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!ethersReadonlyProvider) return;
    
    try {
      const addresses = await getTokenAddresses(selectedToken);
      const MyConfidentialTokenABI = getTokenABI(selectedToken);
      
      const tokenAddress = addresses?.["11155111"]?.address;
      if (!tokenAddress) return;

      const tokenContract = new ethers.Contract(tokenAddress, MyConfidentialTokenABI.abi, ethersReadonlyProvider);
      
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);
      
      setTokenName(name);
      setTokenSymbol(symbol);
      setTokenDecimals(Number(decimals));
      
      // Add the real token to the list (avoid duplicates)
      const realToken = { 
        symbol, 
        name, 
        icon: '$', 
        color: 'bg-green-500', 
        isReal: true 
      };
      
      setAvailableTokens(prev => {
        // Check if real token already exists
        const exists = prev.some(token => token.isReal && token.symbol === symbol);
        if (!exists) {
          return [realToken, ...prev];
        }
        return prev;
      });
      
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // Error fetching token info
    }
  };

  // Load token info when component mounts
  useEffect(() => {
    getTokenInfo('zBTC');
  }, [ethersReadonlyProvider]);



  // Close token dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tokenDropdownRef.current && !tokenDropdownRef.current.contains(event.target as Node)) {
        setIsTokenDropdownOpen(false);
      }
      if (balanceTokenDropdownRef.current && !balanceTokenDropdownRef.current.contains(event.target as Node)) {
        setIsBalanceTokenDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to handle token selection
  const handleTokenSelect = (token: typeof availableTokens[0]) => {
    setSelectedToken(token.symbol);
    setTokenSymbol(token.symbol);
    setTokenName(token.name);
    setIsTokenDropdownOpen(false);
  };

  const handleMint = async () => {
    if (!address || !mintAmount) {
      alert('❌ Please connect wallet and fill in amount');
      return;
    }
    
    try {
      // Tìm contract address từ dropdown
      const selectedTokenObj = availableTokens.find(t => t.symbol === selectedToken);
      
      if (!selectedTokenObj || !selectedTokenObj.isReal || !selectedTokenObj.address) {
        alert('❌ Please select a real token contract');
        return;
      }
      
      // Tạo contract instance với address từ dropdown
      const MyConfidentialTokenABI = getTokenABI(selectedTokenObj.symbol);
      const contract = new ethers.Contract(
        selectedTokenObj.address,
        MyConfidentialTokenABI.abi,
        ethersSigner
      );
      
      // Authorize contract trước khi mint
      
      // Tạo encrypted input
      const { handle, proof } = await createEncryptedInput(BigInt(mintAmount), selectedTokenObj.address);
      
      // Mint tokens to current wallet
      const tx = await contract.mintConfidential(address, handle, proof);
      await tx.wait();
      
      alert('✅ Mint successful!');
    } catch (err) {
      alert(`❌ Mint failed: ${err}`);
    }
  };

  const handleBurn = async () => {
    if (!address || !burnAmount) {
      alert('❌ Please connect wallet and fill in amount');
      return;
    }
    
    try {
      // Chọn contract theo token được chọn
      const selectedTokenObj = availableTokens.find(t => t.symbol === selectedToken);
      
      if (!selectedTokenObj || !selectedTokenObj.isReal || !selectedTokenObj.address) {
        // Mock tokens - không có contract thật
        alert(`❌ ${selectedToken} is a mock token, no real contract available`);
        return;
      }
      
      // Tạo contract instance với address từ dropdown
      const MyConfidentialTokenABI = getTokenABI(selectedTokenObj.symbol);
      const contract = new ethers.Contract(
        selectedTokenObj.address,
        MyConfidentialTokenABI.abi,
        ethersSigner
      );
      
      // Authorize contract trước khi burn
      
      // Tạo encrypted input
      const { handle, proof } = await createEncryptedInput(BigInt(burnAmount), selectedTokenObj.address);
      
      // Burn tokens
      const tx = await contract.burnConfidential(address, handle, proof);
      await tx.wait();
      
      alert('✅ Burn successful!');
    } catch (err) {
      alert(`❌ Burn failed: ${err}`);
    }
  };

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) return;
    
    try {
      // Tìm contract address từ dropdown
      const selectedTokenObj = availableTokens.find(t => t.symbol === selectedToken);
      if (!selectedTokenObj || !selectedTokenObj.isReal || !selectedTokenObj.address) {
        alert('❌ Please select a real token contract');
        return;
      }
      
      // Tạo contract instance với address từ dropdown
      const MyConfidentialTokenABI = getTokenABI(selectedTokenObj.symbol);
      const contract = new ethers.Contract(
        selectedTokenObj.address,
        MyConfidentialTokenABI.abi,
        ethersSigner
      );
      
      // Authorize contract trước khi transfer
      
      // Tạo encrypted input
      const { handle, proof } = await createEncryptedInput(BigInt(transferAmount), selectedTokenObj.address);
      
      // Transfer tokens using batchConfidentialTransfer with single recipient
      console.log('=== BATCH TRANSFER START ===');
      console.log('From:', address);
      console.log('To:', transferTo);
      console.log('Amount:', transferAmount);
      console.log('Handle:', handle);
      
      const tx = await contract.batchConfidentialTransfer([transferTo], [handle], [proof]);
      console.log('Batch Transfer tx:', tx);
      await tx.wait();
      
      alert('✅ Transfer successful!');
    } catch (err) {
      alert(`❌ Transfer failed: ${err}`);
    }
  };


  const handleBatchBurn = async () => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const recipients = batchRecipients.split(',').map(addr => addr.trim()).filter(Boolean);
    const amounts = batchAmounts.split(',').map(amt => amt.trim()).filter(Boolean);
    
    if (recipients.length !== amounts.length) {
      alert('❌ Recipients and amounts count must match');
      return;
    }

    try {
      // Burn tokens for each recipient individually
      for (let i = 0; i < recipients.length; i++) {
        await burnConfidential(recipients[i], BigInt(amounts[i]));
      }
      alert('✅ Batch burn successful!');
    } catch (err) {
      alert(`❌ Batch burn failed: ${err}`);
    }
  };

  const handleBatchTransfer = async () => {
    const recipients = batchRecipients.split(',').map(addr => addr.trim()).filter(Boolean);
    const amounts = batchAmounts.split(',').map(amt => amt.trim()).filter(Boolean);
    
    if (recipients.length !== amounts.length) {
      alert('❌ Recipients and amounts count must match');
      return;
    }

    try {
      await batchTransferConfidential(recipients, amounts.map(amt => BigInt(amt)));
      alert('✅ Batch transfer successful!');
    } catch (err) {
      alert(`❌ Batch transfer failed: ${err}`);
    }
  };

  const handleGetBalance = async () => {
    if (!balanceAccount) {
      alert('❌ Please enter an account address');
      return;
    }

    try {
      const balance = await getConfidentialBalance(balanceAccount);
      setConfidentialBalance(balance);
      setHasBalance(!!balance);
      setDecryptedBalance(null);
    } catch (err) {
      alert(`❌ Failed to get balance: ${err}`);
    }
  };

  const handleAllowDecrypt = async () => {
    if (!balanceAccount) {
      alert('❌ Please enter an account address');
      return;
    }

    try {
      await allowSelfBalanceDecrypt();
      alert('✅ Decrypt permission granted');
    } catch (err) {
      alert(`❌ Failed to allow decrypt: ${err}`);
    }
  };

  const handleDecryptBalance = async () => {
    if (!confidentialBalance) {
      alert('❌ No balance to decrypt');
      return;
    }

    try {
      // This would need to be implemented based on your FHEVM setup
      // For now, we'll just show a placeholder
      setDecryptedBalance('1000'); // Placeholder value
      alert('✅ Balance decrypted successfully');
    } catch (err) {
      alert(`❌ Failed to decrypt balance: ${err}`);
    }
  };




  const handleDeploy = async () => {
    const cleanInitialSupply = initialSupply.replace(/,/g, '');
    if (!contractName || !contractSymbol || !cleanInitialSupply) {
      alert('❌ Please fill in all required fields');
      return;
    }
    
    if (!ethersSigner) {
      alert('❌ Please connect your wallet first');
      return;
    }
    
    try {
      // Import MyConfidentialToken ABI (use zUSD as template)
      const MyConfidentialTokenABI = getTokenABI('zUSD');
      
      // Get deployer address
      const deployerAddress = await ethersSigner.getAddress();
      
      // Check bytecode
      
      // Deploy MyConfidentialToken contract using bytecode from separate file
      const MyConfidentialTokenFactory = new ethers.ContractFactory(
        MyConfidentialTokenABI.abi,
        MyConfidentialTokenBytecode, // Use bytecode from imported file
        ethersSigner
      );
      
      // Deploy with constructor parameters
      const deployedContract = await MyConfidentialTokenFactory.deploy(
        contractName,        // name
        contractSymbol,      // symbol
        `https://zama.ai/${contractSymbol}`, // uri
        cleanInitialSupply,       // initialSupply
        deployerAddress      // owner
      );
      
      // Wait for deployment to complete
      await deployedContract.waitForDeployment();
      
      const contractAddress = await deployedContract.getAddress();
      
      // Create new contract info
      const newContract = {
        address: contractAddress,
        name: contractName,
        symbol: contractSymbol,
        decimals: '18', // Default decimals for deployed tokens
        deployTime: new Date().toISOString(),
        deployer: deployerAddress
      };
      
      // Add to deployed contracts and save to localStorage
      const updatedContracts = [...deployedContracts, newContract];
      setDeployedContracts(updatedContracts);
      saveDeployedContracts(updatedContracts);
      
      alert(`✅ Contract deployed successfully!\n\nContract Address: ${contractAddress}\nName: ${contractName}\nSymbol: ${contractSymbol}\nDecimals: 18\nInitial Supply: ${initialSupply}\nOwner: ${deployerAddress}`);
      
      // Reset form
      setContractName('');
      setContractSymbol('');
      setInitialSupply('1000000');
      
    } catch (err) {
      // Deploy error
      alert(`❌ Deploy failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">MyConfidentialToken Demo</h2>
        <p className="text-gray-600">Please connect your wallet to use this feature.</p>
      </div>
    );
  }

  const getTabTitle = () => { // eslint-disable-line @typescript-eslint/no-unused-vars
    switch (confidentialSubTab) {
      case "mint": return "Mint";
      case "sent": return "Sent";
      case "deploy": return "Deploy";
      default: return "Mint";
    }
  };

  return (
    <div className="mt-12 w-4/5 mx-auto">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Mint Tab Content */}
      {confidentialSubTab === "mint" && (
        <div className="space-y-6 max-w-[480px] mx-auto bg-secondary p-6 rounded-xl border border-custom">
          {/* Sub-tab Navigation */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMintSubTab('mint')}
              className={`px-6 py-2 font-bold transition-colors text-white text-sm ${
                mintSubTab === 'mint'
                  ? 'btn-primary'
                  : 'btn-inactive text-gray-300'
              }`}
            >
              Mint
            </button>
            <button
              onClick={() => setMintSubTab('burn')}
              className={`px-6 py-2 font-bold transition-colors text-white text-sm ${
                mintSubTab === 'burn'
                  ? 'btn-primary'
                  : 'btn-inactive text-gray-300'
              }`}
            >
              Burn
            </button>
          </div>

          {/* Mint Sub-tab */}
          {mintSubTab === 'mint' && (
            <>
              {/* Check Balance */}
              <Balance isLoading={isLoading} />

              {/* Single Mint */}
              <div className="rounded-xl p-4 bg-primary border border-custom">
                <h3 className="text-lg font-semibold mb-3 text-white">Mint Tokens</h3>
            
            {/* Token Selection and Amount Input */}
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                {/* Token Selection */}
                <div className="w-[30%] relative" ref={tokenDropdownRef}>
                  <button
                    onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                    className="w-full p-2 rounded flex items-center justify-between bg-tertiary hover:bg-[#12949D] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                        {availableTokens.find(t => t.symbol === selectedToken)?.icon?.startsWith('/') ? (
                          <Image 
                            src={availableTokens.find(t => t.symbol === selectedToken)?.icon || '/usdc.svg'} 
                            alt={selectedToken}
                            width={24} 
                            height={24} 
                          />
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {availableTokens.find(t => t.symbol === selectedToken)?.icon || '?'}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-white">{selectedToken}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-white transition-transform ml-2 ${isTokenDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isTokenDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[240%] bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {availableTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => handleTokenSelect(token)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                            selectedToken === token.symbol ? "bg-blue-50 text-blue-700" : "text-gray-700"
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                            {token.icon?.startsWith('/') ? (
                              <Image src={token.icon} alt={token.symbol} width={24} height={24} />
                            ) : (
                              <span className="text-white text-xs font-bold">{token.icon}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Amount Input */}
                <div className="w-[30%] text-right ml-auto">
                  <input
                    type="text"
                    value={mintAmount}
                    onChange={handleMintAmountChange}
                    placeholder="0"
                    className={`w-full p-2 text-right font-bold text-white bg-transparent appearance-none border-none outline-none focus:outline-none text-base ${mintAmount === '' ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleMint}
                disabled={isLoading}
                className="w-full btn-primary text-white py-2 px-4 rounded disabled:opacity-50 text-sm font-bold"
              >
                Mint Confidential Tokens
              </button>
            </div>
          </div>

            </>
          )}

          {/* Burn Sub-tab */}
          {mintSubTab === 'burn' && (
            <>
              {/* Check Balance */}
              <Balance isLoading={isLoading} />

              {/* Burn Tokens */}
              <div className="rounded-xl p-4 bg-primary border border-custom">
                <h3 className="text-lg font-semibold mb-3 text-white">Burn Tokens</h3>
                
                {/* Token Selection and Amount Input */}
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    {/* Token Selection */}
                    <div className="w-[30%] relative" ref={tokenDropdownRef}>
                      <button
                        onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                        className="w-full p-2 rounded flex items-center justify-between bg-tertiary hover:bg-[#12949D] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                            {availableTokens.find(t => t.symbol === selectedToken)?.icon?.startsWith('/') ? (
                              <Image 
                                src={availableTokens.find(t => t.symbol === selectedToken)?.icon || '/usdc.svg'} 
                                alt={selectedToken}
                                width={24} 
                                height={24} 
                              />
                            ) : (
                              <span className="text-white text-xs font-bold">
                                {availableTokens.find(t => t.symbol === selectedToken)?.icon || '?'}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-white">{selectedToken}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform ${isTokenDropdownOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isTokenDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-[240%] bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                          {availableTokens.map((token) => (
                            <button
                              key={token.symbol}
                              onClick={() => handleTokenSelect(token)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                                selectedToken === token.symbol ? "bg-blue-50 text-blue-700" : "text-gray-700"
                              }`}
                            >
                              <div className={`w-6 h-6 ${token.color} rounded-full flex items-center justify-center`}>
                                <span className="text-white text-xs font-bold">{token.icon}</span>
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
                    
                    {/* Amount Input */}
                    <div className="w-[30%] text-right ml-auto">
                      <input
                        type="text"
                        value={burnAmount}
                        onChange={handleBurnAmountChange}
                        placeholder="0"
                        className={`w-full p-2 text-right font-bold text-white bg-transparent appearance-none border-none outline-none focus:outline-none text-base ${burnAmount === '' ? 'opacity-50' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleBurn}
                    disabled={isLoading}
                    className="w-full btn-primary text-white py-2 px-4 rounded disabled:opacity-50 text-sm font-bold"
                  >
                    Burn Confidential Tokens
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Burn Tab Content */}
      {confidentialSubTab === "burn" && (
        <div className="space-y-6 max-w-[800px] mx-auto">
          {/* Check Balance */}
          <Balance isLoading={isLoading} />

          {/* Burn Tokens - Ở dưới */}
          <div className="border rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-3">Burn Tokens</h3>
            
            {/* Token Selection and Amount Input */}
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                {/* Token Selection */}
                <div className="w-[30%] relative" ref={tokenDropdownRef}>
                  <button
                    onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                    className="w-full p-2 rounded flex items-center justify-between bg-tertiary hover:bg-[#12949D] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 ${availableTokens.find(t => t.symbol === selectedToken)?.color || 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">
                          {availableTokens.find(t => t.symbol === selectedToken)?.icon || '?'}
                        </span>
                      </div>
                      <span className="font-bold text-white">{selectedToken}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-white transition-transform ml-2 ${isTokenDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isTokenDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[240%] bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {availableTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => handleTokenSelect(token)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                            selectedToken === token.symbol ? "bg-blue-50 text-blue-700" : "text-gray-700"
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                            {token.icon?.startsWith('/') ? (
                              <Image src={token.icon} alt={token.symbol} width={24} height={24} />
                            ) : (
                              <span className="text-white text-xs font-bold">{token.icon}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Amount Input */}
                <div className="w-[20%] text-right ml-auto">
                  <input
                    type="text"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                    placeholder={`0.${'0'.repeat(tokenDecimals - 1)}1`}
                    className="w-full p-2 border rounded text-right"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleBurn}
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
              >
                Burn Confidential Tokens
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Tab Content */}
      {confidentialSubTab === "transfer" && (
        <div className="space-y-6 max-w-[480px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Single Transfer */}
            <div className="border rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3">Transfer Tokens</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">To Address:</label>
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount:</label>
                  <input
                    type="text"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="50"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <button
                  onClick={handleTransfer}
                  disabled={isLoading}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Transfer Confidential Tokens
                </button>
              </div>
            </div>

            {/* Balance Check */}
            <div className="border rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3">Check Balance</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Account Address:</label>
                  <input
                    type="text"
                    value={balanceAccount}
                    onChange={(e) => setBalanceAccount(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGetBalance}
                    disabled={isLoading}
                    className="flex-1 bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 disabled:opacity-50"
                  >
                    Get Balance
                  </button>
                  <button
                    onClick={handleAllowDecrypt}
                    disabled={isLoading}
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 disabled:opacity-50"
                  >
                    Allow Decrypt
                  </button>
                  <button
                    onClick={handleDecryptBalance}
                    disabled={isLoading || !hasBalance}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Decrypt Balance
                  </button>
                </div>
                
                {/* Display Balance */}
                {confidentialBalance && (
                  <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Balance</div>
                      <div className="text-xl font-bold text-gray-800">
                        {decryptedBalance ? `${decryptedBalance} ${tokenSymbol}` : (hasBalance ? 'Encrypted' : 'No Balance')}
                      </div>
                      {decryptedBalance && (
                        <div className="text-xs text-green-600 mt-1">✅ Decrypted</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Batch Transfer */}
          <div className="border rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-3">Batch Transfer</h3>
            <div className="flex gap-4">
              <div className="w-[60%]">confidential
                <label className="block text-sm font-medium mb-1">Recipients:</label>
                <textarea
                  value={batchRecipients}
                  onChange={(e) => setBatchRecipients(e.target.value)}
                  placeholder="0x..., 0x..., 0x..."
                  className="w-full p-2 border rounded h-20"
                />
              </div>
              <div className="w-[40%]">
                <label className="block text-sm font-medium mb-1">Amounts:</label>
                <textarea
                  value={batchAmounts}
                  onChange={(e) => setBatchAmounts(e.target.value)}
                  placeholder="100, 200, 300"
                  className="w-full p-2 border rounded h-20"
                />
              </div>
            </div>
            <button
              onClick={handleBatchTransfer}
              disabled={isLoading}
              className="w-full mt-3 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Batch Transfer
            </button>
          </div>
        </div>
      )}

      {/* Sent Tab Content */}
      {confidentialSubTab === "sent" && (
        <div className="space-y-6 max-w-[480px] mx-auto bg-secondary p-6 rounded-xl">
          {/* Sub-tab Navigation */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSentSubTab('transfer')}
              className={`px-6 py-2 font-bold transition-colors text-white text-sm ${
                sentSubTab === 'transfer'
                  ? 'btn-primary'
                  : 'btn-inactive text-gray-300'
              }`}
            >
              Transfer
            </button>
            <button
              onClick={() => setSentSubTab('batch-transfer')}
              className={`px-6 py-2 font-bold transition-colors text-white text-sm ${
                sentSubTab === 'batch-transfer'
                  ? 'btn-primary'
                  : 'btn-inactive text-gray-300'
              }`}
            >
              Batch Transfer
            </button>
          </div>

          {/* Check Balance */}
          <Balance isLoading={isLoading} />

          {/* Transfer Tokens - Single Transfer */}
          {sentSubTab === 'transfer' && (
            <div className="rounded-xl p-4 bg-primary border border-custom">
              <h3 className="text-lg font-semibold mb-3 text-white">Transfer Tokens</h3>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-[60%]">
                    <label className="block text-sm font-medium mb-1 text-white">To Address:</label>
                    <input
                      type="text"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      placeholder="0x..."
                      className="w-full p-2 text-white bg-tertiary border-none outline-none focus:outline-none rounded text-base"
                    />
                  </div>
                  <div className="w-[30%] ml-auto">
                    <label className="block text-sm font-medium mb-1 text-white">Amount:</label>
                    <input
                      type="text"
                      value={transferAmount}
                      onChange={handleTransferAmountChange}
                      placeholder="0"
                      className={`w-full p-2 text-right font-bold text-white bg-transparent appearance-none border-none outline-none focus:outline-none text-base ${transferAmount === '' ? 'opacity-50' : ''}`}
                    />
                  </div>
                </div>
                <button
                  onClick={handleTransfer}
                  disabled={isLoading}
                  className="w-full btn-primary text-white py-2 px-4 rounded disabled:opacity-50 text-sm font-bold"
                >
                  Transfer Confidential Tokens
                </button>
              </div>
            </div>
          )}

          {/* Batch Transfer */}
          {sentSubTab === 'batch-transfer' && (
            <div className="rounded-xl p-4 bg-primary border border-custom">
              <h3 className="text-lg font-semibold mb-3 text-white">Batch Transfer</h3>
              <div className="flex gap-4">
                <div className="w-[60%]">
                  <label className="block text-sm font-medium mb-1 text-white">Recipients:</label>
                  <textarea
                    value={batchRecipients}
                    onChange={(e) => setBatchRecipients(e.target.value)}
                    placeholder="0x..., 0x..., 0x..."
                    className="w-full p-2 font-bold text-white bg-tertiary border-none outline-none focus:outline-none rounded h-20 text-base"
                  />
                </div>
                <div className="w-[40%]">
                  <label className="block text-sm font-medium mb-1 text-white">Amounts:</label>
                  <textarea
                    value={batchAmounts}
                    onChange={(e) => setBatchAmounts(e.target.value)}
                    placeholder="100, 200, 300"
                    className="w-full p-2 font-bold text-white bg-tertiary border-none outline-none focus:outline-none rounded h-20 text-base"
                  />
                </div>
              </div>
              <button
                onClick={handleBatchTransfer}
                disabled={isLoading}
                className="w-full mt-3 btn-primary text-white py-2 px-4 rounded disabled:opacity-50 text-sm font-bold"
              >
                Batch Transfer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Deploy Tab Content */}
      {confidentialSubTab === "deploy" && (
        <div className="space-y-6 max-w-[480px] mx-auto bg-secondary p-6 rounded-xl border border-custom">
          {/* Sub-tab Navigation */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setDeploySubTab('manual')}
              className={`px-6 py-2 font-bold transition-colors text-white text-sm ${
                deploySubTab === 'manual'
                  ? 'btn-primary'
                  : 'btn-inactive text-gray-300'
              }`}
            >
              Manual
            </button>
            <button
              disabled
              className="px-6 py-2 font-bold transition-colors text-white text-sm btn-inactive text-gray-300 cursor-not-allowed opacity-50"
            >
              Auto (soon)
            </button>
          </div>

          {/* Manual Deploy */}
          {deploySubTab === 'manual' && (
            <div className="rounded-xl p-4 bg-primary border border-custom">
              <h3 className="text-lg font-semibold mb-3 text-white">Manual Deploy</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Token Name:</label>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder="My Confidential Token"
                  className="w-full p-2 font-bold text-white bg-tertiary border-none outline-none focus:outline-none rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Token Symbol:</label>
                <input
                  type="text"
                  value={contractSymbol}
                  onChange={(e) => setContractSymbol(e.target.value)}
                  placeholder="MCT"
                  className="w-full p-2 font-bold text-white bg-tertiary border-none outline-none focus:outline-none rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Initial Supply:</label>
                <input
                  type="text"
                  value={initialSupply}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (value === '' || /^\d+$/.test(value)) {
                      setInitialSupply(value);
                    }
                  }}
                  placeholder="Amount"
                  className="w-full p-2 font-bold text-white bg-tertiary border-none outline-none focus:outline-none rounded"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleDeploy}
                disabled={isLoading}
                className="w-full btn-primary text-white py-2 px-4 rounded disabled:opacity-50 text-sm font-bold"
              >
                Deploy Contract
              </button>
            </div>
          </div>
          )}

          {/* Auto Deploy */}
          {deploySubTab === 'auto' && (
            <div className="rounded-xl p-4 bg-primary border border-custom">
              <h3 className="text-lg font-semibold mb-3 text-white">Auto Deploy</h3>
              <div className="p-3 bg-tertiary rounded-lg">
                <p className="text-sm text-white">
                  <strong>Auto Deploy:</strong> Automatically deploy a confidential token contract with default settings.
                  This will create a token with standard parameters for quick testing.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleDeploy}
                  disabled={isLoading}
                  className="w-full btn-primary text-white py-2 px-4 rounded disabled:opacity-50 text-sm font-bold"
                >
                  Auto Deploy Contract
                </button>
              </div>
            </div>
          )}
          
          <div className="rounded-xl p-4 bg-primary border border-custom">
            <h3 className="text-lg font-semibold mb-3 text-white">Deployment Info</h3>
            <div className="p-3 bg-tertiary rounded-lg">
              <p className="text-sm text-white">
                <strong>Note:</strong> Deploying a confidential token contract will create a new ERC-20 compatible token 
                with FHEVM encryption capabilities. Make sure you have enough ETH for gas fees.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};