const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // 1. GET ACCOUNTS
    // We expect Hardhat to provide ~20 accounts by default
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];

    // Roles
    const whale = deployer;                    // Account 0: Provides liquidity
    const safeBorrowers = signers.slice(1, 4);  // Accounts 1-3: Safe borrowers (HF > 1.5)
    const riskyBorrowers = signers.slice(4, 6); // Accounts 4-5: Risky borrowers (HF ~ 1.0 - 1.1)
    const suppliers = signers.slice(6, 8);      // Accounts 6-7: Supply Tokens (not ETH)
    const activeTrader = signers[8];            // Account 8: Do everything

    console.log("-------------------------------------------------");
    console.log("🌱 ENHANCED SEEDING STARTED");
    console.log("-------------------------------------------------");
    console.log("  Whale:", whale.address);
    console.log("  Safe Borrowers:", safeBorrowers.map(s => s.address));
    console.log("  Risky Borrowers:", riskyBorrowers.map(s => s.address));
    console.log("  Suppliers:", suppliers.map(s => s.address));
    console.log("  Active Trader:", activeTrader.address);

    // 2. LOAD CONTRACTS
    console.log("\n[1/5] 📥 LOADING CONTRACTS...");
    const addressesPath = path.join(__dirname, "../deployed_addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("❌ deployed_addresses.json not found. Run 'npm run deploy' first.");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = MockToken.attach(addresses.mockToken); // MCK

    const LendingPool = await hre.ethers.getContractFactory("LendingPool");
    const lendingPool = LendingPool.attach(addresses.lendingPool);

    console.log("  📍 LendingPool:", lendingPool.target);
    console.log("  📍 MockToken:", mockToken.target);

    // 3. WHALE FUNDING (Initial Liquidity)
    console.log("\n[2/5] 🐋 WHALE FUNDING POOL...");
    const fundAmount = hre.ethers.parseEther("50000"); // 50,000 MCK

    // Check allowance first to avoid errors if re-running without redeploy
    const allowance = await mockToken.allowance(whale.address, lendingPool.target);
    if (allowance < fundAmount) {
        await mockToken.connect(whale).approve(lendingPool.target, fundAmount);
    }

    // Check if checks/balances allow funding
    try {
        await lendingPool.connect(whale).fundPool(fundAmount);
        console.log(`  ✅ Pool funded with ${hre.ethers.formatEther(fundAmount)} MCK`);
    } catch (e) {
        console.log("  ⚠️  Pool might already be funded or error:", e.message);
    }

    // Distribute tokens to Suppliers and Active Trader so they can use them
    console.log("  💸 Distributing tokens to Suppliers & Traders...");
    const distributeAmount = hre.ethers.parseEther("5000");
    for (const supplier of [...suppliers, activeTrader]) {
        await mockToken.connect(whale).transfer(supplier.address, distributeAmount);
        console.log(`    -> Sent 5000 MCK to ${supplier.address}`);
    }


    // 4. SCENARIO EXECUTION
    console.log("\n[3/5] 🎬 EXECUTING SCENARIOS...");

    // --- Scenario A: Safe Borrowers ---
    console.log("\n  🅰️  SCENARIO: Safe Borrowers");
    for (const user of safeBorrowers) {
        // Deposit 10 ETH
        const depositAmt = hre.ethers.parseEther("10");
        console.log(`    👤 ${user.address} depositing 10 ETH...`);
        await lendingPool.connect(user).deposit({ value: depositAmt });

        // Borrow conservative amount (e.g., 20% LTV)
        // 10 ETH * 2000 = 20,000 collateral. Max borrow 16,000. Borrow 4,000.
        const borrowAmt = hre.ethers.parseEther("4000");
        console.log(`    👤 ${user.address} borrowing 4,000 MCK...`);
        await lendingPool.connect(user).borrow(borrowAmt);
    }

    // --- Scenario B: Risky Borrowers ---
    console.log("\n  🅱️  SCENARIO: Risky Borrowers (Near Liquidation)");
    for (const user of riskyBorrowers) {
        // Deposit 5 ETH
        const depositAmt = hre.ethers.parseEther("5");
        console.log(`    💀 ${user.address} depositing 5 ETH...`);
        await lendingPool.connect(user).deposit({ value: depositAmt });

        // Borrow max limit (80% LTV)
        // 5 ETH * 2000 = 10,000 collateral. Max borrow 8,000.
        // Borrow 7,900 to be very close/risky
        const borrowAmt = hre.ethers.parseEther("7800");
        console.log(`    💀 ${user.address} borrowing 7,800 MCK (High Risk!)...`);
        await lendingPool.connect(user).borrow(borrowAmt);
    }

    // --- Scenario C: Token Suppliers ---
    console.log("\n  ©️  SCENARIO: Token Suppliers (Yield Farmers)");
    for (const user of suppliers) {
        // Assume they already got tokens from Whale
        const supplyAmt = hre.ethers.parseEther("2000");

        console.log(`    🌾 ${user.address} approving & supplying 2,000 MCK...`);
        await mockToken.connect(user).approve(lendingPool.target, supplyAmt);
        await lendingPool.connect(user).supply(supplyAmt);
    }

    // --- Scenario D: Active Trader ---
    console.log("\n  🇩  SCENARIO: Active Trader (Complex Flow)");
    const trader = activeTrader;

    // 1. Deposit
    await lendingPool.connect(trader).deposit({ value: hre.ethers.parseEther("20") });
    console.log(`    🔄 Trader deposited 20 ETH`);

    // 2. Borrow
    const traderBorrow = hre.ethers.parseEther("10000");
    await lendingPool.connect(trader).borrow(traderBorrow);
    console.log(`    🔄 Trader borrowed 10,000 MCK`);

    // 3. Repay Half
    const repayAmt = hre.ethers.parseEther("5000");
    await mockToken.connect(trader).approve(lendingPool.target, repayAmt);
    await lendingPool.connect(trader).repay(repayAmt);
    console.log(`    🔄 Trader repaid 5,000 MCK`);

    // 4. Withdraw some Collateral
    const withdrawAmt = hre.ethers.parseEther("5");
    await lendingPool.connect(trader).withdraw(withdrawAmt);
    console.log(`    🔄 Trader withdrew 5 ETH`);


    // 5. SUMMARY
    console.log("\n[4/5] 📊 FINAL STATE SUMMARY");

    const poolEth = await hre.ethers.provider.getBalance(lendingPool.target);
    const poolMck = await mockToken.balanceOf(lendingPool.target);
    console.log(`  🏛️  LendingPool ETH Balance: ${hre.ethers.formatEther(poolEth)} ETH`);
    console.log(`  🏛️  LendingPool MCK Balance: ${hre.ethers.formatEther(poolMck)} MCK`);

    const borrowersList = await lendingPool.getBorrowers();
    console.log(`  📋 Active Borrowers Count: ${borrowersList.length}`);

    console.log("\n=================================================");
    console.log("🎉 SEEDING COMPLETE!");
    console.log("=================================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
