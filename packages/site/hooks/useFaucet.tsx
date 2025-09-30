"use client";

import { ethers, Contract } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "../fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "../fhevm/GenericStringStorage";

// ABI và addresses được import từ genabi script
import { getTokenAddresses, getTokenABI } from "../abi/TokenRegistry";
import toast from 'react-hot-toast';

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type TokenInfoType = {
  abi: any;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

/**
 * Lấy thông tin ConfidentialToken contract từ chainId
 */
async function getConfidentialTokenByChainId(
  chainId: number | undefined,
  tokenSymbol: string = 'zUSD'
): Promise<TokenInfoType> {
  if (!chainId) {
    const tokenABI = getTokenABI(tokenSymbol);
    return { abi: tokenABI.abi };
  }

  try {
    const addresses = await getTokenAddresses(tokenSymbol);
    const tokenABI = getTokenABI(tokenSymbol);
    const entry = addresses?.[chainId.toString()];

    if (!entry || !entry.address || entry.address === ethers.ZeroAddress) {
      return { abi: tokenABI.abi, chainId };
    }

    return {
      address: entry.address as `0x${string}`,
      chainId: entry.chainId ?? chainId,
      chainName: entry.chainName,
      abi: tokenABI.abi,
    };
  } catch (error) {
    const tokenABI = getTokenABI(tokenSymbol);
    return { abi: tokenABI.abi, chainId };
  }
}

/**
 * Hook để quản lý ConfidentialToken
 * Cho phép user mint token với FHE encryption
 */
export const useFaucet = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  tokenSymbol?: string; // Optional token symbol, defaults to 'zUSD'
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    tokenSymbol = 'zUSD', // Default to zUSD
  } = parameters;

  //////////////////////////////////////////////////////////////////////////////
  // States + Refs
  //////////////////////////////////////////////////////////////////////////////

  const [balance, setBalance] = useState<bigint | undefined>(undefined);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);

  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isMintingRef = useRef<boolean>(isMinting);

  //////////////////////////////////////////////////////////////////////////////
  // Contract Info
  //////////////////////////////////////////////////////////////////////////////

  const [token, setToken] = useState<TokenInfoType>({ abi: [] });

  useEffect(() => {
    const loadToken = async () => {
      const tokenInfo = await getConfidentialTokenByChainId(chainId, tokenSymbol);
      console.log(`[DEBUG] Hook ${tokenSymbol} loaded:`, {
        tokenSymbol,
        contractAddress: tokenInfo.address,
        chainId: tokenInfo.chainId,
        hasAddress: !!tokenInfo.address
      });
      if (!tokenInfo.address) {
        setMessage(`ConfidentialToken deployment not found for chainId=${chainId} and token=${tokenSymbol}.`);
      }
      setToken(tokenInfo);
    };
    loadToken();
  }, [chainId, tokenSymbol]);

  const isDeployed = useMemo(() => {
    return Boolean(token.address);
  }, [token.address]);

  const canMint = useMemo(() => {
    return (
      token.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isMinting
    );
  }, [
    token.address,
    instance,
    ethersSigner,
    isRefreshing,
    isMinting,
  ]);

  //////////////////////////////////////////////////////////////////////////////
  // Get Balance
  //////////////////////////////////////////////////////////////////////////////

  const refreshBalance = useCallback(() => {
    if (isRefreshingRef.current) {
      return;
    }

    if (!token.address || !ethersReadonlyProvider || !ethersSigner) {
      setBalance(undefined);
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisTokenAddress = token.address;
    const thisEthersSigner = ethersSigner;

    // Tạo contract instance để gọi balanceOf
    const tokenContract = new ethers.Contract(
      thisTokenAddress,
      token.abi,
      ethersReadonlyProvider
    );

    tokenContract
      .confidentialBalanceOf(thisEthersSigner.address)
      .then((value) => {
        if (thisTokenAddress === token.address) {
          // confidentialBalanceOf trả về encrypted data, không thể hiển thị trực tiếp
          // Chỉ cần biết có balance hay không (không phải 0)
          setBalance(value ? BigInt(1) : BigInt(0));
        }

        isRefreshingRef.current = false;
        setIsRefreshing(false);
      })
      .catch((e) => {
        setMessage("Token balance check failed! error=" + e);

        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [token.address, token.abi, ethersReadonlyProvider, ethersSigner, chainId]);

  //////////////////////////////////////////////////////////////////////////////
  // Decrypt Balance
  //////////////////////////////////////////////////////////////////////////////

  const decryptBalance = useCallback(async () => {
    if (!instance || !ethersSigner || !token.address) {
      setMessage("Cannot decrypt: missing required information");
      toast.error("Cannot decrypt: missing required information");
      return;
    }

    try {
      setMessage("Decrypting balance...");
      
      // Lấy địa chỉ user hiện tại
      const userAddr = await ethersSigner.getAddress();
      
      // Tạo contract instance với signer để có thể gọi write functions
      const contractWithSigner = new Contract(token.address, token.abi, ethersSigner);
      const contractReadOnly = new Contract(token.address, token.abi, ethersReadonlyProvider);
      
      // Bước 1: Allow decrypt cho chính mình
      setMessage("Allowing decrypt...");
      const allowTx = await contractWithSigner.allowSelfBalanceDecrypt();
      await allowTx.wait();
      
      // Bước 2: Lấy balance encrypted từ contract
      setMessage("Getting encrypted balance...");
      const balanceEncrypted = await contractReadOnly.confidentialBalanceOf(userAddr);
      
      // Lấy handle từ ciphertext
      const handle = balanceEncrypted?.handle || balanceEncrypted;
      if (!handle) {
        setMessage("Cannot get encrypted balance");
        return;
      }

      // Tạo keypair để ký yêu cầu decrypt
      const { privateKey, publicKey } = instance.generateKeypair();
      
      // Chuẩn bị EIP-712 và ký
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [token.address];
      
      const eip712 = instance.createEIP712(
        publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );
      
      const signature = await (ethersSigner as any).signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );
      
      // Bước 3: Gọi userDecrypt
      setMessage("Decrypting...");
      const result = await instance.userDecrypt(
        [{ handle, contractAddress: token.address }],
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
        setMessage("Invalid balance value");
        return;
      }
      const formattedBalance = ethers.formatUnits(weiBn, 6); // 6 decimals
      setDecryptedBalance(formattedBalance);
      setMessage(`✅ Balance decrypted: ${formattedBalance} tokens`);
      toast.success(`🔓 Balance decrypted: ${formattedBalance} tokens`);
      
    } catch (error: any) {
      console.error("Decrypt balance error:", error);
      setMessage(`Decrypt failed: ${error.message}`);
      toast.error(`❌ Decrypt failed: ${error.message}`);
    }
  }, [instance, ethersSigner, token.address, token.abi, ethersReadonlyProvider]);

  // Check claim status
  const checkClaimStatus = useCallback(async () => {
    if (!token.address || !ethersReadonlyProvider || !ethersSigner) {
      setHasClaimed(false);
      return;
    }

    try {
      const tokenContract = new ethers.Contract(
        token.address,
        token.abi,
        ethersReadonlyProvider
      );
      const userHasClaimed = await tokenContract.hasClaimed(ethersSigner.address);
      console.log(`[DEBUG] checkClaimStatus for ${tokenSymbol}:`, userHasClaimed, 'address:', ethersSigner.address);
      setHasClaimed(userHasClaimed);
    } catch (error) {
      console.error("Error checking claim status:", error);
      setHasClaimed(false);
    }
  }, [token.address, token.abi, ethersReadonlyProvider, ethersSigner, tokenSymbol]);

  // Auto refresh balance and check claim status
  useEffect(() => {
    refreshBalance();
    checkClaimStatus();
  }, [refreshBalance, checkClaimStatus]);

  //////////////////////////////////////////////////////////////////////////////
  // AirDrop Token (User claim)
  //////////////////////////////////////////////////////////////////////////////

  /**
   * AirDrop token với FHE encryption (User claim tokens)
   */
  const airDropToken = useCallback((amount: bigint) => {
    if (isRefreshingRef.current || isMintingRef.current) {
      return;
    }

    if (!token.address || !instance || !ethersSigner) {
      return;
    }

    const thisChainId = chainId;
    const thisTokenAddress = token.address;
    const thisEthersSigner = ethersSigner;

    isMintingRef.current = true;
    setIsMinting(true);
    setMessage("Preparing airdrop token...");

    const run = async () => {
      const isStale = () =>
        thisTokenAddress !== token.address;

      try {
        // Kiểm tra xem user đã claim chưa
        setMessage("Checking claim status...");
        const tokenContractForCheck = new ethers.Contract(
          thisTokenAddress,
          token.abi,
          ethersReadonlyProvider
        );
        
        const userHasClaimed = await tokenContractForCheck.hasClaimed(thisEthersSigner.address);
        console.log(`[DEBUG] hasClaimed for ${tokenSymbol}:`, userHasClaimed, 'address:', thisEthersSigner.address);
        setHasClaimed(userHasClaimed);
        if (userHasClaimed) {
          setMessage(`You have already claimed ${tokenSymbol} tokens!`);
          toast.error(`❌ You have already claimed ${tokenSymbol} tokens! Each token can only be claimed once.`);
          return;
        }

        // Tạo encrypted input cho airdrop amount
        const input = instance.createEncryptedInput(
          thisTokenAddress,
          thisEthersSigner.address
        );
        
        // Thêm airdrop amount
        input.add64(amount);

        setMessage("Encrypting data...");

        // Mã hóa input
        const enc = await input.encrypt();

        if (isStale()) {
          setMessage("Skipping airdrop token");
          return;
        }

        setMessage("Sending airdrop transaction...");

        // Tạo contract instance với user signer
        const tokenContractForClaim = new ethers.Contract(
          thisTokenAddress,
          token.abi,
          thisEthersSigner
        );

        // Gọi faucet function (user claim)
        const tx: ethers.TransactionResponse = await tokenContractForClaim.faucet(
          enc.handles[0],
          enc.inputProof
        );

        setMessage("Waiting for transaction confirmation...");
        await tx.wait();

        if (isStale()) {
          setMessage("Skipping airdrop token");
          return;
        }

        setMessage("✅ AirDrop token successful!");
        toast.success("🎉 Tokens claimed successfully!");
        
        // Refresh lại balance sau khi airdrop
        refreshBalance();
      } catch (error: any) {
        setMessage(`Airdrop failed: ${error.message}`);
        toast.error(`❌ Claim failed: ${error.message}`);
      } finally {
        isMintingRef.current = false;
        setIsMinting(false);
      }
    };

    run();
  }, [
    token.address,
    token.abi,
    instance,
    ethersSigner,
    chainId,
    refreshBalance,
  ]);

  //////////////////////////////////////////////////////////////////////////////
  // Mint Token (Owner only)
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Mint token với FHE encryption (Owner mint cho user)
   */
  const mintToken = useCallback((amount: bigint) => {
    if (isRefreshingRef.current || isMintingRef.current) {
      return;
    }

    if (!token.address || !instance || !ethersSigner) {
      return;
    }

    const thisChainId = chainId;
    const thisTokenAddress = token.address;
    const thisEthersSigner = ethersSigner;

    isMintingRef.current = true;
    setIsMinting(true);
    setMessage("Preparing mint token...");

    const run = async () => {
      const isStale = () =>
        thisTokenAddress !== token.address;

      try {
        // Tạo encrypted input cho mint amount
        const input = instance.createEncryptedInput(
          thisTokenAddress,
          thisEthersSigner.address
        );
        
        // Thêm mint amount
        input.add64(amount);

        setMessage("Encrypting data...");

        // Mã hóa input
        const enc = await input.encrypt();

        if (isStale()) {
          setMessage("Skipping mint token");
          return;
        }

        setMessage("Sending mint transaction...");

        // Tạo contract instance để gọi mintConfidential
        const tokenContract = new ethers.Contract(
          thisTokenAddress,
          token.abi,
          thisEthersSigner
        );

        // Gọi mintConfidential function
        const tx: ethers.TransactionResponse = await tokenContract.mintConfidential(
          thisEthersSigner.address,
          enc.handles[0],
          enc.inputProof
        );

        setMessage(`Waiting for transaction: ${tx.hash}...`);

        const receipt = await tx.wait();

        setMessage(`Mint token successful! Status: ${receipt?.status}`);

        if (isStale()) {
          setMessage("Skipping mint token");
          return;
        }

        // Refresh lại balance
        refreshBalance();
      } catch (error: any) {
        setMessage(`Mint token failed: ${error.message}`);
      } finally {
        isMintingRef.current = false;
        setIsMinting(false);
      }
    };

    run();
  }, [
    token.address,
    token.abi,
    instance,
    ethersSigner,
    chainId,
    refreshBalance,
  ]);

  return {
    contractAddress: token.address,
    canMint,
    airDropToken,
    mintToken,
    refreshBalance,
    decryptBalance,
    balance,
    decryptedBalance,
    message,
    isMinting,
    isRefreshing,
    isDeployed,
    hasClaimed,
    checkClaimStatus,
  };
};
