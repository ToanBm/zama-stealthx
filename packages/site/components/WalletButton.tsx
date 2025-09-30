"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

export const WalletButton = () => {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Auto switch to Sepolia after connecting
  useEffect(() => {
    if (isConnected && chainId && chainId !== sepolia.id && switchChain) {
      try {
        switchChain({ chainId: sepolia.id });
      } catch (error) {
        // Failed to auto switch to Sepolia
      }
    }
  }, [isConnected, chainId, switchChain]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <div className="font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  if (isConnected) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="btn-primary text-white font-bold h-10 px-4 rounded-lg min-w-[120px] text-sm"
        >
          <div className="font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 bg-secondary shadow-lg z-50 border border-custom" style={{borderRadius: '8px', padding: '14px', minWidth: '200px', marginTop: '40px'}}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Wallet Address</span>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-tertiary" style={{borderRadius: '8px'}}>
                <span className="font-mono text-sm flex-1 text-white">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-white hover:text-gray-400 p-1"
                  title="Copy address"
                >
                  <Image src="/copy.svg" alt="Copy" width={16} height={16} className="invert" />
                </button>
              </div>
              
              <button
                onClick={() => {
                  disconnect();
                  setIsDropdownOpen(false);
                }}
                className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 text-sm"
                style={{borderRadius: '8px'}}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => {
          // Chỉ dùng connector đầu tiên (injected)
          if (connectors[0]) {
            connect({ connector: connectors[0] });
          }
        }}
        disabled={isPending}
        className="btn-primary disabled:bg-gray-400 text-white font-bold h-10 px-4 rounded-lg min-w-[120px] text-sm"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};
