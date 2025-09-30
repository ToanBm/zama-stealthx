"use client";

import { useTab } from "@/contexts/TabContext";
import { useFhevmContext } from "../contexts/FhevmContext";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { ConfidentialToken } from "@/components/ConfidentialToken";
import { Faucet } from "@/components/Faucet";

export default function Home() {
  const { activeTab, setActiveTab } = useTab(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const {
    instance: fhevmInstance, // eslint-disable-line @typescript-eslint/no-unused-vars
    ethersSigner, // eslint-disable-line @typescript-eslint/no-unused-vars
    ethersReadonlyProvider, // eslint-disable-line @typescript-eslint/no-unused-vars
    chainId, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useFhevmContext();

  return (
    <>
      {/* Tab Content */}
      {activeTab === "faucet" && <Faucet />}
      {activeTab === "confidential-token" && <ConfidentialToken />}
    </>
  );
}
