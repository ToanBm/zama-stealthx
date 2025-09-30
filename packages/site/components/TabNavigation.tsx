"use client";

import { useState, useRef, useEffect } from "react";
import { useTab } from "@/contexts/TabContext";

export const TabNavigation = () => {
  const { activeTab, setActiveTab, confidentialSubTab, setConfidentialSubTab } = useTab();


  // Dropdown state for Confidential Token
  const [isConfidentialDropdownOpen, setIsConfidentialDropdownOpen] = useState(false);
  const confidentialDropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown state for More
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  const confidentialOptions = [
    { value: "mint", label: "Issue" },
    { value: "sent", label: "Transfer" },
    { value: "deploy", label: "Deploy" }
  ] as const;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close Confidential dropdown
      if (confidentialDropdownRef.current && !confidentialDropdownRef.current.contains(target)) {
        setIsConfidentialDropdownOpen(false);
      }
      
      // Close More dropdown
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(target)) {
        setIsMoreDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleConfidentialOptionClick = (value: "mint" | "sent" | "deploy") => {
    setConfidentialSubTab(value);
    setActiveTab("confidential-token");
    setIsConfidentialDropdownOpen(false);
  };
  
  return (
    <div className="flex gap-2">
      <div className="relative" ref={confidentialDropdownRef}>
        <button
          onClick={() => setIsConfidentialDropdownOpen(!isConfidentialDropdownOpen)}
          className="font-bold h-10 px-4 transition-colors min-w-[120px] flex items-center justify-between text-white btn-transparent text-sm"
        >
          <span>Confidential Token</span>
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${isConfidentialDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isConfidentialDropdownOpen && (
          <div className="absolute top-full left-0 w-full bg-secondary shadow-lg z-50 space-y-1 mt-10 border border-custom" style={{borderRadius: '8px', padding: '14px'}}>
            {confidentialOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleConfidentialOptionClick(option.value)}
                className={`w-full text-left px-4 py-2 transition-colors text-sm ${
                  activeTab === "confidential-token" && confidentialSubTab === option.value ? "btn-primary text-white" : "text-white hover:bg-gray-600"
                }`}
                style={{borderRadius: '8px'}}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trade (soon) button */}
      <button
        className="font-bold h-10 px-4 transition-colors text-white btn-transparent text-sm"
      >
        Trade (soon)
      </button>

      {/* More button with dropdown */}
      <div className="relative" ref={moreDropdownRef}>
        <button
          onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
          className="font-bold h-10 px-4 transition-colors min-w-[80px] flex items-center justify-between text-white btn-transparent text-sm"
        >
          <span>More</span>
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${isMoreDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMoreDropdownOpen && (
          <div className="absolute top-full left-0 bg-secondary shadow-lg z-50 space-y-1 mt-10 border border-custom" style={{borderRadius: '8px', padding: '14px', minWidth: '200px'}}>
            <a
              href="#"
              className="w-full text-left px-4 py-2 transition-colors text-white hover:bg-gray-600 block text-sm"
              style={{borderRadius: '8px'}}
            >
              Docs
            </a>
            <a
              href="#"
              className="w-full text-left px-4 py-2 transition-colors text-white hover:bg-gray-600 block text-sm"
              style={{borderRadius: '8px'}}
            >
              Tutorial
            </a>
            <a
              href="#"
              className="w-full text-left px-4 py-2 transition-colors text-white hover:bg-gray-600 block text-sm"
              style={{borderRadius: '8px'}}
            >
              Contact
            </a>
            <a
              href="#"
              className="w-full text-left px-4 py-2 transition-colors text-white hover:bg-gray-600 block text-sm"
              style={{borderRadius: '8px'}}
            >
              Feedback
            </a>
            
            {/* Social Icons */}
            <div className="flex gap-6 justify-center pt-3 mt-3 border-t-2 border-custom">
              {/* X (Twitter) */}
              <a
                href="https://x.com/buiminhtoan1985"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.com/channels/@me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/ToanBm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const FaucetButton = () => {
  const { activeTab, setActiveTab } = useTab(); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  return (
    <button
      onClick={() => setActiveTab("faucet")}
      className="font-bold h-10 px-4 rounded-lg transition-colors min-w-[100px] btn-primary text-white text-sm"
    >
      Faucet
    </button>
  );
};

