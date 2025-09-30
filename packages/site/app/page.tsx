"use client";

import { useTab } from "@/contexts/TabContext";
import { useFhevmContext } from "../contexts/FhevmContext";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { ConfidentialToken } from "@/components/ConfidentialToken";
import { Faucet } from "@/components/Faucet";

export default function Home() {
  const { activeTab, setActiveTab } = useTab();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    instance: fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  } = useFhevmContext();

  return (
    <>
      {/* Tab Content */}
      {activeTab === "faucet" && <Faucet />}
      {activeTab === "confidential-token" && <ConfidentialToken />}
    </>
  );
}
