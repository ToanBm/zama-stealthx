"use client";

import { useEffect, useState } from "react";
import { useFhevmContext } from "../contexts/FhevmContext";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useFaucet } from "../hooks/useFaucet";
import { useAccount } from 'wagmi';
import { Balance } from './Balance';
import Image from 'next/image';

/*
 * Faucet React component
 * - "Mint Token" button: allows user to mint confidential tokens
 * - Shows token balance
 * - Displays contract address and connection status
 */
export const Faucet = () => {
  const [mounted, setMounted] = useState(false);
  const [, setMessage] = useState<string>(""); // eslint-disable-line @typescript-eslint/no-unused-vars
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  
  
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
    provider,
    chainId,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
  } = useFhevmContext();
  
  const { address } = useAccount(); // eslint-disable-line @typescript-eslint/no-unused-vars


  //////////////////////////////////////////////////////////////////////////////
  // useTokenFaucet hook chứa tất cả logic cho ConfidentialToken
  // Contract address sẽ được lấy tự động từ chainId
  //////////////////////////////////////////////////////////////////////////////

  // Create separate hook instances for each token
  const zUSDFaucet = useFaucet({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    tokenSymbol: 'zUSD',
  });

  const zBTCFaucet = useFaucet({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    tokenSymbol: 'zBTC',
  });

  const zETHFaucet = useFaucet({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    tokenSymbol: 'zETH',
  });

  useEffect(() => {
    setMounted(true);
  }, []);






  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg">Loading Token Faucet...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
        <p className="text-gray-600">Use the wallet button above</p>
      </div>
    );
  }

  if (fhevmStatus === "error") {
    return <p className="text-red-600">FHEVM Error: {fhevmError?.message || "Unknown error"}</p>;
  }

  if (zUSDFaucet.isDeployed === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-gray-500 text-lg">Loading contract...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto mt-[50px] p-6 bg-secondary rounded-2xl shadow-md space-y-6">
      {/* Faucet Tab */}
      <div className="flex gap-2 mb-4">
        <button className="px-6 py-2 font-bold transition-colors text-white btn-primary text-sm">
          Faucet
        </button>
      </div>

      {/* Check Balance */}
      <Balance isLoading={zUSDFaucet.isMinting} />

      {/* Faucet Card */}
      <div className="border border-custom rounded-xl p-4 bg-primary">
        <h3 className="text-lg font-semibold mb-3 text-white">Token Faucet</h3>
        
        {/* Token Rows */}
        <div className="space-y-3">
          {/* zUSD Row */}
          <div className="flex items-center gap-4 rounded-lg">
            <div className="flex items-center gap-3 w-[50%] h-10 px-3 bg-tertiary" style={{borderRadius: '8px'}}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                <Image src="/usdc.svg" alt="USDC" width={32} height={32} />
              </div>
              <div>
                <div className="font-medium text-white">zUSD</div>
              </div>
            </div>
            <div className="ml-auto">
              {zUSDFaucet.hasClaimed ? (
                <div className="btn-inactive text-white py-2 px-4 text-center">
                  ✅ Claimed
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Claim zUSD tokens
                    const claimAmount = BigInt(1000); // 1000 tokens
                    zUSDFaucet.airDropToken(claimAmount);
                  }}
                  disabled={zUSDFaucet.isMinting}
                  className="btn-primary text-white py-2 px-6 disabled:opacity-50 transition-colors text-sm font-bold"
                >
                  {zUSDFaucet.isMinting ? 'Claiming...' : 'Claim'}
                </button>
              )}
            </div>
          </div>

          {/* zBTC Row */}
          <div className="flex items-center gap-4 rounded-lg">
            <div className="flex items-center gap-3 w-[50%] h-10 px-3 bg-tertiary" style={{borderRadius: '8px'}}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                <Image src="/btc.svg" alt="BTC" width={32} height={32} />
              </div>
              <div>
                <div className="font-medium text-white">zBTC</div>
              </div>
            </div>
            <div className="ml-auto">
              {zBTCFaucet.hasClaimed ? (
                <div className="btn-inactive text-white py-2 px-4 text-center">
                  ✅ Claimed
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Claim zBTC tokens
                    const claimAmount = BigInt(1000); // 1000 tokens
                    zBTCFaucet.airDropToken(claimAmount);
                  }}
                  disabled={zBTCFaucet.isMinting}
                  className="btn-primary text-white py-2 px-6 disabled:opacity-50 transition-colors text-sm font-bold"
                >
                  {zBTCFaucet.isMinting ? 'Claiming...' : 'Claim'}
                </button>
              )}
            </div>
          </div>

          {/* zETH Row */}
          <div className="flex items-center gap-4 rounded-lg">
            <div className="flex items-center gap-3 w-[50%] h-10 px-3 bg-tertiary" style={{borderRadius: '8px'}}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                <Image src="/eth.svg" alt="ETH" width={32} height={32} />
              </div>
              <div>
                <div className="font-medium text-white">zETH</div>
              </div>
            </div>
            <div className="ml-auto">
              {zETHFaucet.hasClaimed ? (
                <div className="btn-inactive text-white py-2 px-4 text-center">
                  ✅ Claimed
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Claim zETH tokens
                    const claimAmount = BigInt(1000); // 1000 tokens
                    zETHFaucet.airDropToken(claimAmount);
                  }}
                  disabled={zETHFaucet.isMinting}
                  className="btn-primary text-white py-2 px-6 disabled:opacity-50 transition-colors text-sm font-bold"
                >
                  {zETHFaucet.isMinting ? 'Claiming...' : 'Claim'}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
