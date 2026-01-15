import { ethers } from 'ethers';
import { toRaw } from 'vue';

// Address of the deployed LendingPool contract
// TODO: Replace with actual deployed contract address
// Address of the deployed LendingPool contract
const LENDING_POOL_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;

// ABI for the LendingPool contract
import LendingPoolArtifact from '../utils/abis/LendingPool.json';
const LENDING_POOL_ABI = LendingPoolArtifact.abi;

const getContract = (signer: any) => {
    // Debug Log
    console.log("Using Contract Address:", LENDING_POOL_ADDRESS);

    // Async check (fire and forget for debug log)
    const rawSigner = toRaw(signer);
    if (rawSigner && rawSigner.provider) {
        rawSigner.provider.getNetwork().then((network: any) => {
            console.log("Connected to Network:", network.name, "ChainID:", network.chainId.toString());
        });

        rawSigner.provider.getCode(LENDING_POOL_ADDRESS).then((code: string) => {
            console.log("Code at address len:", code.length);
            if (code === "0x") console.error("CRITICAL: No code at contract address! Check network or address.");
            else console.log("Contract code exists.");
        }).catch((err: any) => console.error("Code check error:", err));
    }

    return new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, rawSigner);
};

export const lendingService = {
    async depositETH(signer: any, amount: string) {
        try {
            const contract = getContract(signer);
            const tx = await contract.deposit({ value: ethers.parseEther(amount) });
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Deposit Error:", error);
            return { success: false, error: error.message || "Deposit failed" };
        }
    },

    async borrowToken(signer: any, amount: string) {
        try {
            const contract = getContract(signer);
            const rawSigner = toRaw(signer);
            const userAddress = await rawSigner.getAddress();

            // ERC20 Minimal ABI
            const ERC20_ABI = [
                "function balanceOf(address) view returns (uint256)"
            ];

            // 1. Fetch current pool state
            const ethPrice = await contract.ethPrice();
            const deposits = await contract.deposits(userAddress);
            const currentLoan = await contract.loans(userAddress);

            // Get Pool Liquidity
            const tokenAddress = await contract.lendingToken();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);
            const poolBalance = await tokenContract.balanceOf(LENDING_POOL_ADDRESS);

            // 2. Calculate values (using BigInt for precision)
            const ethPriceBI = BigInt(ethPrice);
            const depositsBI = BigInt(deposits);
            const currentLoanBI = BigInt(currentLoan);
            const requestAmountBI = ethers.parseEther(amount);
            const poolBalanceBI = BigInt(poolBalance);

            // Check Liquidity
            if (requestAmountBI > poolBalanceBI) {
                return {
                    success: false,
                    error: `Insufficient pool liquidity. The pool only has ${ethers.formatEther(poolBalance)} MCK available.`
                };
            }

            const collateralValue = depositsBI * ethPriceBI;
            const maxBorrow = (collateralValue * 80n) / 100n; // 80% LTV

            // 3. Pre-validation
            if (currentLoanBI + requestAmountBI > maxBorrow) {
                // Calculate max available to borrow
                const available = maxBorrow > currentLoanBI ? maxBorrow - currentLoanBI : 0n;
                // If pool balance is lower than max borrow, restrict by pool balance too (optional, but good UX)
                const availableLiquidityCorrected = available > poolBalanceBI ? poolBalanceBI : available;

                return {
                    success: false,
                    error: `Insufficient collateral. You can borrow at most ${ethers.formatEther(availableLiquidityCorrected)} MCK.`
                };
            }

            // 4. Send Transaction
            const tx = await contract.borrow(requestAmountBI);
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Borrow Error:", error);

            // Re-check for Revert reason if possible (though pre-validation should catch it)
            if (error.reason === "Insufficient pool liquidity" || (error.data && error.data.message && error.data.message.includes("Insufficient pool liquidity"))) {
                return { success: false, error: "Insufficient pool liquidity. Try a smaller amount." };
            }

            // Check for User Rejection
            if (error.code === 4001 || error.code === 'ACTION_REJECTED' || (error.info && error.info.error && error.info.error.code === 4001)) {
                return { success: false, error: "Transaction rejected by user." };
            }

            return { success: false, error: error.message || "Borrow failed" };
        }
    },

    async getUserBalance(signer: any) {
        try {
            if (!signer) return { success: false, error: "Wallet not connected" };

            const contract = getContract(signer);
            // Ensure we get the correct address from signer
            const address = await toRaw(signer).getAddress();
            console.log("Address:", address);
            console.log("Contract:", contract);

            // Get deposited balance
            const balanceWei = await contract.deposits(address);

            return { success: true, data: ethers.formatEther(balanceWei) };
        } catch (error: any) {
            console.error("Get Balance Error:", error);
            return { success: false, error: error.message || "Failed to fetch balance" };
        }
    },

    async getUserBorrowBalance(signer: any) {
        try {
            if (!signer) return { success: false, error: "Wallet not connected" };

            const contract = getContract(signer);
            const address = await toRaw(signer).getAddress();

            // Get borrowed balance - 'loans' mapping in Solidity
            const borrowedWei = await contract.loans(address);

            return { success: true, data: ethers.formatEther(borrowedWei) };
        } catch (error: any) {
            console.error("Get Borrow Balance Error:", error);
            // Return 0 if fails (e.g. mapping doesn't exist yet) to not break UI
            return { success: false, error: error.message || "Failed to fetch borrow balance" };
        }
    },

    async repayToken(signer: any, amount: string) {
        try {
            const contract = getContract(signer);
            const rawSigner = toRaw(signer);
            const userAddress = await rawSigner.getAddress();

            // ERC20 Minimal ABI for Approve
            const ERC20_ABI = [
                "function balanceOf(address) view returns (uint256)",
                "function approve(address, uint256) returns (bool)",
                "function allowance(address, address) view returns (uint256)"
            ];

            const tokenAddress = await contract.lendingToken();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);

            const amountBI = ethers.parseEther(amount);

            // 1. Check Balance
            const balance = await tokenContract.balanceOf(userAddress);
            if (balance < amountBI) {
                return { success: false, error: "Insufficient MockToken balance to repay" };
            }

            // 2. Check Allowance
            const allowance = await tokenContract.allowance(userAddress, LENDING_POOL_ADDRESS);
            if (allowance < amountBI) {
                console.log("Approving tokens for repay...");
                const txApprove = await tokenContract.approve(LENDING_POOL_ADDRESS, amountBI);
                await txApprove.wait();
            }

            // 3. Repay
            const tx = await contract.repay(amountBI);
            await tx.wait();

            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Repay Error:", error);
            // Check for User Rejection
            if (error.code === 4001 || error.code === 'ACTION_REJECTED' || (error.info && error.info.error && error.info.error.code === 4001)) {
                return { success: false, error: "Transaction rejected by user." };
            }
            return { success: false, error: error.message || "Repay failed" };
        }
    },

    async liquidateUser(signer: any, borrowerAddress: string) {
        try {
            const rawSigner = toRaw(signer);
            const contract = getContract(rawSigner);
            const userAddress = await rawSigner.getAddress();

            // ERC20 Minimal ABI
            const ERC20_ABI = [
                "function balanceOf(address) view returns (uint256)",
                "function approve(address, uint256) returns (bool)",
                "function allowance(address, address) view returns (uint256)"
            ];

            // 1. Check debt amount
            const loanAmount = await contract.loans(borrowerAddress);
            if (loanAmount <= 0) throw new Error("User has no debt");

            // 2. Check liquidator Balance
            const tokenAddress = await contract.lendingToken();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);
            const balance = await tokenContract.balanceOf(userAddress);

            if (balance < loanAmount) {
                return { success: false, error: "Insufficient MockToken balance to liquidate" };
            }

            // 3. Check Allowance
            const allowance = await tokenContract.allowance(userAddress, LENDING_POOL_ADDRESS);
            if (allowance < loanAmount) {
                const txApprove = await tokenContract.approve(LENDING_POOL_ADDRESS, loanAmount);
                await txApprove.wait();
            }

            // 4. Liquidate
            const tx = await contract.liquidate(borrowerAddress);
            await tx.wait();

            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Liquidation Error:", error);
            return { success: false, error: error.message || "Liquidation failed" };
        }
    },

    async getBorrowersData(signer: any) {
        try {
            const rawSigner = toRaw(signer);
            const contract: any = getContract(rawSigner);

            // Note: Ensure your contract ABI includes getBorrowers()
            const borrowers = await contract.getBorrowers();
            const ethPrice = await contract.ethPrice();

            const results = [];
            for (const borrower of borrowers) {
                const deposits = await contract.deposits(borrower);
                const loans = await contract.loans(borrower);

                let healthFactor = 999;
                // Convert to BigInt explicitly to handle potential type mismatches
                const loansBI = BigInt(loans);
                const depositsBI = BigInt(deposits);
                const ethPriceBI = BigInt(ethPrice);

                if (loansBI > 0n) {
                    const collateralValue = depositsBI * ethPriceBI;
                    // Scale: Deposits(18) * Price(0) * 0.8
                    const maxBorrow = (collateralValue * 80n) / 100n;

                    // Calculation:
                    healthFactor = Number(maxBorrow) / Number(loansBI);
                }

                results.push({
                    address: borrower,
                    deposits: ethers.formatEther(deposits),
                    loans: ethers.formatEther(loans),
                    healthFactor: healthFactor
                });
            }
            return { success: true, data: results };
        } catch (error: any) {
            console.error("Fetch Borrowers Error:", error);
            return { success: false, error: error.message };
        }
    }
};
