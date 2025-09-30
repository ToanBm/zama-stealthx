import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { WalletButton } from "@/components/WalletButton";
import { TabNavigation, FaucetButton } from "@/components/TabNavigation";
import { Toaster } from "react-hot-toast";
import { Chakra_Petch } from "next/font/google";

const chakraPetch = Chakra_Petch({ 
  subsets: ["latin"],
  weight: ["700"]
});

export const metadata: Metadata = {
  title: "StealthX - Confidential Token Platform",
  description: "StealthX is a confidential token platform built on FHEVM, enabling private transactions and confidential smart contracts on Ethereum.",
  keywords: "confidential tokens, FHEVM, privacy, blockchain, Ethereum, StealthX",
  authors: [{ name: "StealthX Team" }],
  openGraph: {
    title: "StealthX - Confidential Token Platform",
    description: "StealthX is a confidential token platform built on FHEVM, enabling private transactions and confidential smart contracts on Ethereum.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/@zama-fhe/relayer-sdk@0.2.0/dist/index.umd.js" async></script>
      </head>
      <body className="bg-primary text-foreground antialiased">
        <div className="fixed inset-0 w-full h-full bg-primary z-[-20] min-w-[850px]" />
        
        <main className="flex flex-col w-full min-h-screen">
          <Providers>
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-fit py-5 flex justify-center items-center bg-secondary text-white z-50">
              <div className="w-[90%] flex justify-between items-center">
                <div className="flex items-center gap-6">
                <h1 className={`text-4xl font-bold text-white ${chakraPetch.className}`}>StealthX</h1>
                <TabNavigation />
              </div>
                <div className="flex items-center gap-4">
                  <FaucetButton />
                  <WalletButton />
                </div>
              </div>
            </header>

            {/* Main */}
            <div className="main flex-1 w-full overflow-y-auto pt-20">
              <div className="max-w-screen-lg mx-auto px-3 md:px-6">
                {children}
              </div>
            </div>

          </Providers>
        </main>
        
        {/* Toast Container */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid #475569',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              fontSize: '14px',
              fontWeight: '500',
              padding: '16px 20px',
              maxWidth: '400px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
              style: {
                background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                border: '1px solid #10B981',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
              style: {
                background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                border: '1px solid #EF4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
