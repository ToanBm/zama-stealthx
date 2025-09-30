import { useState, useCallback } from 'react';
import { useFhevmContext } from '../contexts/FhevmContext';
import { getTokenABI, getTokenAddresses, TOKEN_REGISTRY } from '../abi/TokenRegistry';

export interface ConfidentialTokenHook {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Functions
  mintConfidential: (to: string, amount: bigint) => Promise<void>;
  batchMintConfidential: (recipients: string[], amounts: bigint[]) => Promise<void>;
  burnConfidential: (from: string, amount: bigint) => Promise<void>;
  batchTransferConfidential: (recipients: string[], amounts: bigint[]) => Promise<void>;
  faucet: (amount: bigint) => Promise<void>;
  getConfidentialBalance: (account: string) => Promise<any>;
  allowSelfBalanceDecrypt: () => Promise<void>;
}

export const useMyConfidentialToken = (): ConfidentialTokenHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { instance: fhevmInstance, ethersSigner } = useFhevmContext();
  
  // Get contract address from TokenRegistry (will be passed as parameter)
  const getContractAddress = async (tokenSymbol: string = 'zUSD') => {
    const addresses = await getTokenAddresses(tokenSymbol);
    return addresses?.["11155111"]?.address;
  };
  
  // Get decimals from TokenRegistry (will be passed as parameter)
  const getDecimals = (tokenSymbol: string = 'zUSD') => {
    return TOKEN_REGISTRY[tokenSymbol]?.decimals || 0;
  };
  
  const getScale = (tokenSymbol: string = 'zUSD') => {
    const decimals = getDecimals(tokenSymbol);
    return BigInt(10) ** BigInt(decimals);
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: any) => {
    setError(err.message || 'An error occurred');
  }, []);

  const createEncryptedInput = useCallback(async (amount: bigint, tokenSymbol: string = 'zUSD') => {
    if (!fhevmInstance || !ethersSigner) {
      throw new Error('FHEVM instance or ethersSigner not available');
    }

    const contractAddress = await getContractAddress(tokenSymbol);
    
    if (!contractAddress || typeof contractAddress !== 'string' || contractAddress.length !== 42) {
      throw new Error(`Invalid contract address: ${contractAddress}`);
    }

    const scale = getScale(tokenSymbol);
    const scaledAmount = amount * scale;
    const userAddress = await ethersSigner.getAddress();
    
    console.log('=== CREATE ENCRYPTED INPUT ===');
    console.log('tokenSymbol:', tokenSymbol);
    console.log('userAddress (encryptor):', userAddress);
    console.log('contractAddress:', contractAddress);
    console.log('amount:', amount);
    console.log('scaledAmount:', scaledAmount);
    
    const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
    input.add64(scaledAmount);
    const enc = await input.encrypt();
    
    return {
      handle: enc.handles[0],
      proof: enc.inputProof
    };
  }, [fhevmInstance, ethersSigner, getContractAddress, getScale]);

  const mintConfidential = useCallback(async (to: string, amount: bigint) => {
    if (!ethersSigner) {
      throw new Error('Signer not available');
    }

    setIsLoading(true);
    clearError();

    try {
      const { handle, proof } = await createEncryptedInput(amount);
      
      const contractAddress = await getContractAddress();
      if (!contractAddress) {
        throw new Error('Contract address not found');
      }
      
      const tokenABI = getTokenABI('zUSD');
      const contract = new (await import('ethers')).Contract(
        contractAddress,
        tokenABI.abi,
        ethersSigner
      );

      const tx = await contract.mintConfidential(to, handle, proof);
      await tx.wait();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ethersSigner, getContractAddress, createEncryptedInput, clearError, handleError]);

  const batchMintConfidential = useCallback(async (recipients: string[], amounts: bigint[]) => {
    if (!ethersSigner) {
      throw new Error('Signer not available');
    }

    if (recipients.length !== amounts.length) {
      throw new Error('Recipients and amounts length mismatch');
    }

    setIsLoading(true);
    clearError();

    try {
      const handles: any[] = [];
      const proofs: any[] = [];

      for (let i = 0; i < recipients.length; i++) {
        const { handle, proof } = await createEncryptedInput(amounts[i]);
        handles.push(handle);
        proofs.push(proof);
      }

      const contractAddress = await getContractAddress();
      if (!contractAddress) {
        throw new Error('Contract address not found');
      }
      
      const tokenABI = getTokenABI('zUSD');
      const contract = new (await import('ethers')).Contract(
        contractAddress,
        tokenABI.abi,
        ethersSigner
      );

      const tx = await contract.batchMintConfidential(recipients, handles, proofs);
      await tx.wait();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ethersSigner, getContractAddress, createEncryptedInput, clearError, handleError]);

  const burnConfidential = useCallback(async (from: string, amount: bigint) => {
    if (!ethersSigner) {
      throw new Error('Signer not available');
    }

    setIsLoading(true);
    clearError();

    try {
      const { handle, proof } = await createEncryptedInput(amount);
      
      const contractAddress = await getContractAddress();
      if (!contractAddress) {
        throw new Error('Contract address not found');
      }
      
      const tokenABI = getTokenABI('zUSD');
      const contract = new (await import('ethers')).Contract(
        contractAddress,
        tokenABI.abi,
        ethersSigner
      );

      const tx = await contract.burnConfidential(from, handle, proof);
      await tx.wait();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ethersSigner, getContractAddress, createEncryptedInput, clearError, handleError]);

  const batchTransferConfidential = useCallback(async (recipients: string[], amounts: bigint[], tokenSymbol: string = 'zUSD') => {
    if (!ethersSigner) {
      throw new Error('Signer not available');
    }

    if (recipients.length !== amounts.length) {
      throw new Error('Recipients and amounts length mismatch');
    }

    setIsLoading(true);
    clearError();

    try {
      const handles: any[] = [];
      const proofs: any[] = [];

      for (let i = 0; i < recipients.length; i++) {
        const { handle, proof } = await createEncryptedInput(amounts[i], tokenSymbol);
        handles.push(handle);
        proofs.push(proof);
      }

      const contractAddress = await getContractAddress(tokenSymbol);
      if (!contractAddress) {
        throw new Error('Contract address not found');
      }
      
      const tokenABI = getTokenABI(tokenSymbol);
      const contract = new (await import('ethers')).Contract(
        contractAddress,
        tokenABI.abi,
        ethersSigner
      );

      const tx = await contract.batchConfidentialTransfer(recipients, handles, proofs);
      await tx.wait();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ethersSigner, getContractAddress, createEncryptedInput, clearError, handleError]);

  const faucet = useCallback(async (amount: bigint) => {
    if (!ethersSigner) {
      throw new Error('Signer not available');
    }

    setIsLoading(true);
    clearError();

    try {
      const { handle, proof } = await createEncryptedInput(amount);
      
      const contractAddress = await getContractAddress();
      if (!contractAddress) {
        throw new Error('Contract address not found');
      }
      
      const tokenABI = getTokenABI('zUSD');
      const contract = new (await import('ethers')).Contract(
        contractAddress,
        tokenABI.abi,
        ethersSigner
      );

      const tx = await contract.faucet(handle, proof);
      await tx.wait();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ethersSigner, getContractAddress, createEncryptedInput, clearError, handleError]);

  const getConfidentialBalance = useCallback(async (account: string) => {
    if (!ethersSigner) {
      throw new Error('Signer not available');
    }

    try {
      const contractAddress = await getContractAddress();
      if (!contractAddress) {
        throw new Error('Contract address not found');
      }
      
      const tokenABI = getTokenABI('zUSD');
      const contract = new (await import('ethers')).Contract(
        contractAddress,
        tokenABI.abi,
        ethersSigner
      );

      console.log('Checking balance for account:', account);
      console.log('Contract address:', contractAddress);
      console.log('Contract methods:', Object.keys(contract.interface.fragments));
      
      // Check if account is valid
      if (!account || account === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid account address');
      }
      
      // Try direct call instead of estimateGas
      const balance = await contract.getFunction('confidentialBalanceOf')(account);
      console.log('Balance result:', balance);
      return balance;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [ethersSigner, getContractAddress, handleError]);

  const allowSelfBalanceDecrypt = useCallback(async () => {
    if (!ethersSigner) {
      throw new Error('Signer not available');
    }

    setIsLoading(true);
    clearError();

    try {
      const contractAddress = await getContractAddress();
      if (!contractAddress) {
        throw new Error('Contract address not found');
      }
      
      const tokenABI = getTokenABI('zUSD');
      const contract = new (await import('ethers')).Contract(
        contractAddress,
        tokenABI.abi,
        ethersSigner
      );

      // Lấy encrypted balance của chính mình
      const userAddress = await ethersSigner.getAddress();
      const encryptedBalance = await contract.confidentialBalanceOf(userAddress);
      
      // Sử dụng discloseEncryptedAmount để cho phép decrypt
      const tx = await contract.discloseEncryptedAmount(encryptedBalance);
      await tx.wait();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ethersSigner, getContractAddress, clearError, handleError]);

  return {
    isLoading,
    error,
    mintConfidential,
    batchMintConfidential,
    burnConfidential,
    batchTransferConfidential,
    faucet,
    getConfidentialBalance,
    allowSelfBalanceDecrypt
  };
};
