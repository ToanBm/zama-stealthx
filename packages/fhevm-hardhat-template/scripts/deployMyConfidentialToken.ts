import hre from "hardhat";

async function main() {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const tokens = [
    {
      name: "Zama Confidential USD",
      symbol: "zUSD",
      uri: "https://zama.ai/zUSD",
      supply: 1_000_000_000 * 1e6, // 1 tỷ zUSD với 6 chữ số ảo
    },
    {
      name: "Zama Confidential BTC",
      symbol: "zBTC",
      uri: "https://zama.ai/zBTC",
      supply: 21_000_000 * 1e8, // 21 triệu BTC với 8 chữ số ảo
    },
    {
      name: "Zama Confidential ETH",
      symbol: "zETH",
      uri: "https://zama.ai/zETH",
      supply: 120_000_000 * 1e6, // 120 triệu ETH với 6 chữ số ảo
    },
  ];

  for (const token of tokens) {
    const deployedToken = await deploy(`MyConfidentialToken-${token.symbol}`, {
      contract: "MyConfidentialToken",
      from: deployer,
      args: [token.name, token.symbol, token.uri, token.supply, deployer],
      log: true,
    });

    console.log(`✅ ${token.symbol} deployed at: ${deployedToken.address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
