# StealthX - Confidential Token Platform

StealthX is a confidential token platform built on Zama's FHEVM technology, enabling private transactions and confidential smart contracts on Ethereum.

## 1. Introduction to Zama FHE Technology and StealthX

### What is Zama FHEVM?

**FHEVM (Fully Homomorphic Encryption Virtual Machine)** is a breakthrough technology by Zama that enables:

- **Fully Homomorphic Encryption**: Perform computations on encrypted data without decryption
- **Absolute Security**: Data remains encrypted even during processing
- **Ethereum Compatibility**: Works on Ethereum network with standard smart contracts
- **Private Transactions**: Hide balances and transaction amounts

### StealthX Platform

StealthX leverages the power of FHEVM to create:

- **Confidential Tokens**: Tokens with encrypted balances and transactions
- **Private Transactions**: Untraceable transactions
- **Confidential Smart Contracts**: Protected contract logic
- **Multi-token Support**: Support for multiple confidential tokens (zUSD, zBTC, zETH)

### Key Features

- 🔒 **Mint Tokens**: Create new confidential tokens
- 🔄 **Transfer Tokens**: Transfer tokens with privacy
- 🔥 **Burn Tokens**: Burn tokens to reduce supply
- 🏗️ **Deploy Contracts**: Deploy confidential smart contracts
- 💧 **Token Faucet**: Get free test tokens
- 📊 **Balance Check**: Check encrypted balances

## 2. Contract Deployment Guide from /packages/fhevm-hardhat-template

### System Requirements

- Node.js >= 18
- Git
- MetaMask extension
- Hardhat environment variables

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/your-repo/zama-confident.git
cd zama-confident

# Install dependencies
npm install
```

### Step 2: Configure Hardhat

1. **Create `.env` file** in `/packages/fhevm-hardhat-template/`:

```env
# Mnemonic phrase for development
MNEMONIC="your twelve word mnemonic phrase here..."

# Infura API key (for Sepolia testnet)
INFURA_API_KEY="your_infura_api_key_here"

# Etherscan API key (for verification)
ETHERSCAN_API_KEY="your_etherscan_api_key_here"
```

2. **Configure networks** in `hardhat.config.ts`:

```typescript
networks: {
  sepolia: {
    url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.MNEMONIC,
    },
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
  },
}
```

### Step 3: Deploy Contracts

#### Deploy to Local Hardhat Node

```bash
# Terminal 1: Start Hardhat node
cd packages/fhevm-hardhat-template
npx hardhat node --verbose

# Terminal 2: Deploy contracts
npx hardhat deploy --network localhost
```

#### Deploy to Sepolia Testnet

```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify contracts on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Step 4: Configure MetaMask

**Add Local Hardhat Network:**
- Network Name: `Hardhat`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

**Add Sepolia Testnet:**
- Network Name: `Sepolia`
- RPC URL: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`
- Chain ID: `11155111`
- Currency Symbol: `ETH`

### Step 5: Test Contracts

```bash
# Run tests
npx hardhat test

# Test with coverage
npx hardhat coverage
```

## 3. App Build Guide from /packages/site

### Project Structure

```
packages/site/
├── app/                    # Next.js App Router
├── components/            # React components
├── hooks/                 # Custom hooks
├── contexts/              # React contexts
├── abi/                   # Contract ABIs and addresses
├── public/                # Static assets
└── styles/                # CSS files
```

### Step 1: Install Dependencies

```bash
cd packages/site
npm install
```

### Step 2: Configure Environment

Create `.env.local` file:

```env
# Next.js environment
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract addresses (auto from deployment)
NEXT_PUBLIC_CONTRACT_ADDRESSES='{"zUSD":"0x...","zBTC":"0x...","zETH":"0x..."}'
```

### Step 3: Development Mode

```bash
# Run development server
npm run dev

# Or with mock mode (no blockchain needed)
npm run dev:mock
```

Access: `http://localhost:3000`

### Step 4: Production Build

```bash
# Build for production
npm run build

# Start production server
npm start

# Or export static files
npm run export
```

### Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or deploy from GitHub
# Connect repository with Vercel and auto-deploy
```

### Troubleshooting

#### MetaMask Nonce Mismatch Error

1. Open MetaMask
2. Select Hardhat network
3. Settings > Advanced
4. Click "Clear Activity Tab"

#### View Function Cache Error

1. Restart entire browser
2. Clear browser cache
3. Reset MetaMask

#### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

## Reference Documentation

- [Zama FHEVM Documentation](https://docs.zama.ai/protocol/solidity-guides/)
- [FHEVM Hardhat Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [Relayer SDK Documentation](https://docs.zama.ai/protocol/relayer-sdk-guides/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MetaMask Development Guide](https://docs.metamask.io/wallet/how-to/run-devnet/)

## License

BSD-3-Clause-Clear License - See LICENSE file for details.