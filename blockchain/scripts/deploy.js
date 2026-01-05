const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy MockToken
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy();

    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();

    console.log("MockToken deployed to:", mockTokenAddress);

    // 2. Deploy LendingPool
    // Initial ETH Price: 2000 MockTokens per 1 ETH
    const ethPrice = 2000;

    const LendingPool = await hre.ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(mockTokenAddress, ethPrice);

    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();

    console.log("LendingPool deployed to:", lendingPoolAddress);

    // 3. Fund the Lending Pool with some tokens so users can borrow
    // Mint 1,000,000 tokens to the deployer (already done in constructor)
    // Approve LendingPool to spend deployer's tokens (not strictly needed for fundPool but good practice if using transferFrom)
    // However, fundPool uses transferFrom, so we need to approve first.

    const fundAmount = hre.ethers.parseEther("10000"); // Fund with 10,000 tokens
    await mockToken.approve(lendingPoolAddress, fundAmount);
    await lendingPool.fundPool(fundAmount);

    console.log(`LendingPool funded with ${hre.ethers.formatEther(fundAmount)} tokens`);

    console.log("\n=================================================");
    console.log("COPY THESE ADDRESSES TO YOUR FRONTEND:");
    console.log("LENDING_POOL_ADDRESS:", lendingPoolAddress);
    console.log("MOCK_TOKEN_ADDRESS:", mockTokenAddress);
    console.log("=================================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
