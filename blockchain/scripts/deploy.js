const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

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
    const ethPrice = 2000;
    const LendingPool = await hre.ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(mockTokenAddress, ethPrice);
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    console.log("LendingPool deployed to:", lendingPoolAddress);

    // 3. Cấp vốn cho Pool
    const fundAmount = hre.ethers.parseEther("10000");
    await mockToken.approve(lendingPoolAddress, fundAmount);
    await lendingPool.fundPool(fundAmount);
    console.log(`LendingPool funded with ${hre.ethers.formatEther(fundAmount)} tokens`);

    console.log("\n=================================================");
    console.log("LENDING_POOL_ADDRESS:", lendingPoolAddress);
    console.log("MOCK_TOKEN_ADDRESS:", mockTokenAddress);
    console.log("=================================================");

    // --- SAVE DEPLOYED ADDRESSES ---
    const addressesFile = path.join(__dirname, "../deployed_addresses.json");
    const addresses = {
        mockToken: mockTokenAddress,
        lendingPool: lendingPoolAddress
    };

    fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));
    console.log(`Saved deployed addresses to ${addressesFile}`);

    // --- TỰ ĐỘNG CẬP NHẬT ABI CHO FRONTEND ---
    // Lưu ý: Kiểm tra đường dẫn này có đúng với cấu trúc thư mục của bạn không
    const frontendAbiDir = path.join(__dirname, "../../web-ui/utils/abis");

    if (!fs.existsSync(frontendAbiDir)) {
        fs.mkdirSync(frontendAbiDir, { recursive: true });
    }

    const lendingPoolArtifact = await hre.artifacts.readArtifact("LendingPool");
    const mockTokenArtifact = await hre.artifacts.readArtifact("MockToken");

    fs.writeFileSync(
        path.join(frontendAbiDir, "LendingPool.json"),
        JSON.stringify(lendingPoolArtifact, null, 2)
    );
    fs.writeFileSync(
        path.join(frontendAbiDir, "MockToken.json"),
        JSON.stringify(mockTokenArtifact, null, 2)
    );

    console.log("✅ ABI files automatically copied to frontend!");
}

// CHỈ GỌI HÀM MAIN MỘT LẦN DUY NHẤT Ở ĐÂY
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deploy Error:", error);
        process.exit(1);
    });