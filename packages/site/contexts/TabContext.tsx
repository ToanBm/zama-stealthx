"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type TabType = "faucet" | "confidential-token";
type ConfidentialSubTabType = "mint" | "sent" | "deploy";

interface TabContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  confidentialSubTab: ConfidentialSubTabType;
  setConfidentialSubTab: (subTab: ConfidentialSubTabType) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("confidential-token");
  const [confidentialSubTab, setConfidentialSubTab] = useState<ConfidentialSubTabType>("mint");

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab, confidentialSubTab, setConfidentialSubTab }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error("useTab must be used within a TabProvider");
  }
  return context;
}
