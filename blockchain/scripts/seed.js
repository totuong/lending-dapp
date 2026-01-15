const hre = require("hardhat");

async function main() {
    // Get signers (accounts)
    // deployer: deploys contracts and funds the pool
    // user1, user2: simulate active users
    const [deployer, user1, user2] = await hre.ethers.getSigners();

    console.log("-------------------------------------------------");
    console.log("🌱 SEEDING DATA WITH ACCOUNT:", deployer.address);
    console.log("-------------------------------------------------");

    // --- 1. LOAD DEPLOYED CONTRACTS ---
    console.log("\n[1/4] 📥 LOADING DEPLOYED CONTRACTS...");

    const fs = require("fs");
    const path = require("path");
    const addressesPath = path.join(__dirname, "../deployed_addresses.json");

    if (!fs.existsSync(addressesPath)) {
        throw new Error("❌ deployed_addresses.json not found. Please run 'npm run deploy' first.");
    }

    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const lendingPoolAddress = addresses.lendingPool;
    const mockTokenAddress = addresses.mockToken;

    console.log("  📍 Loaded LendingPool:", lendingPoolAddress);
    console.log("  📍 Loaded MockToken:", mockTokenAddress);

    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = MockToken.attach(mockTokenAddress);

    const LendingPool = await hre.ethers.getContractFactory("LendingPool");
    const lendingPool = LendingPool.attach(lendingPoolAddress);


    // --- 2. SETUP ---
    console.log("\n[2/4] ⚙️  SETUP INITIAL STATE...");

    // Fund the pool so it has tokens to lend
    // Note: fundPool fails if allowance is already used, check allowance first?
    // Or just approve again.
    const fundAmount = hre.ethers.parseEther("10000"); // Fund with 10,000 tokens

    await mockToken.approve(lendingPoolAddress, fundAmount);
    await lendingPool.fundPool(fundAmount);
    console.log(`  🔹 LendingPool funded with ${hre.ethers.formatEther(fundAmount)} MCK`);

    // --- 3. SEEDING USER DATA ---
    console.log("\n[3/4] 👥 SEEDING USER INTERACTIONS...");

    // === USER 1 ACTIVITY ===
    // User 1 Deposits ETH
    // We assume test accounts have sufficient ETH (Hardhat default accounts have 10000 ETH)
    const depositAmount1 = hre.ethers.parseEther("5"); // 5 ETH
    console.log(`  🔹 User1 (${user1.address}) depositing 5 ETH...`);
    await lendingPool.connect(user1).deposit({ value: depositAmount1 });

    // User 1 Borrows Tokens
    // Collateral Value = 5 ETH * 2000 = 10,000 MCK
    // Max Borrow (80% LTV) = 8,000 MCK
    const borrowAmount1 = hre.ethers.parseEther("1000"); // Borrow 1000 MCK
    console.log(`  🔹 User1 borrowing 1000 MCK...`);
    await lendingPool.connect(user1).borrow(borrowAmount1);


    // === USER 2 ACTIVITY ===
    // User 2 Deposits ETH
    const depositAmount2 = hre.ethers.parseEther("50"); // 50 ETH
    console.log(`  🔹 User2 (${user2.address}) depositing 50 ETH...`);
    await lendingPool.connect(user2).deposit({ value: depositAmount2 });

    // User 2 Borrows Tokens
    // Collateral Value = 50 * 2000 = 100,000 MCK
    // Max Borrow = 80,000 MCK
    // Let's borrow a larger amount
    const borrowAmount2 = hre.ethers.parseEther("5000"); // Borrow 5000 MCK
    console.log(`  🔹 User2 borrowing 5000 MCK...`);
    await lendingPool.connect(user2).borrow(borrowAmount2);

    // --- 4. VERIFYING STATE ---
    console.log("\n[4/4] 🔍 VERIFYING STATE...");

    const poolBalance = await mockToken.balanceOf(lendingPoolAddress);
    const user1Loan = await lendingPool.loans(user1.address);
    const user2Loan = await lendingPool.loans(user2.address);

    console.log("  📊 Pool Token Balance:", hre.ethers.formatEther(poolBalance), "MCK");
    console.log("  📊 User1 Loan:", hre.ethers.formatEther(user1Loan), "MCK");
    console.log("  📊 User2 Loan:", hre.ethers.formatEther(user2Loan), "MCK");

    console.log("\n=================================================");
    console.log("🎉 SEEDING COMPLETE! USE THESE ADDRESSES:");
    console.log("LENDING_POOL_ADDRESS:", lendingPoolAddress);
    console.log("MOCK_TOKEN_ADDRESS:", mockTokenAddress);
    console.log("=================================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
