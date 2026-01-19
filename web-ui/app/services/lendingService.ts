import { ethers } from 'ethers';
import { toRaw } from 'vue';

// Address of the deployed LendingPool contract
// TODO: Replace with actual deployed contract address
// Address of the deployed LendingPool contract
const LENDING_POOL_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;

// ABI for the LendingPool contract
import LendingPoolArtifact from '../../utils/abis/LendingPool.json';
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
            const tx = await (contract as any).deposit({ value: ethers.parseEther(amount) });
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
            const ethPrice = await (contract as any).ethPrice();
            const deposits = await (contract as any).deposits(userAddress);
            const currentLoan = await (contract as any).loans(userAddress);

            // Get Pool Liquidity
            const tokenAddress = await (contract as any).lendingToken();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);
            const poolBalance = await (tokenContract as any).balanceOf(LENDING_POOL_ADDRESS);

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
            const tx = await (contract as any).borrow(requestAmountBI);
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

    async withdrawETH(signer: any, amount: string) {
        try {
            const contract = getContract(signer);
            const rawSigner = toRaw(signer);
            const address = await rawSigner.getAddress();
            
            // 1. Pre-Check: On-chain Balance
            const currentDepositBI = await (contract as any).deposits(address);
            const requestAmountBI = ethers.parseEther(amount);

            if (currentDepositBI < requestAmountBI) {
                 return {
                    success: false,
                    error: `Insufficient on-chain balance. You have ${ethers.formatEther(currentDepositBI)} ETH deposited, but are trying to withdraw ${amount} ETH.`
                 }
            }

            // Cast to any to avoid TS error until ABI is updated
            const tx = await (contract as any).withdraw(requestAmountBI);
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Withdraw Error:", error);
            return { success: false, error: error.message || "Withdraw failed" };
        }
    },

    async getWalletBalance(signer: any) {
        try {
            if (!signer) return { success: false, error: "Wallet not connected" };
            const rawSigner = toRaw(signer);
            const address = await rawSigner.getAddress();
            const balance = await rawSigner.provider.getBalance(address);
            return { success: true, data: ethers.formatEther(balance) };
        } catch (error: any) {
            console.error("Get Wallet Balance Error:", error);
            return { success: false, error: error.message || "Failed to fetch wallet balance" };
        }
    },

    // Gets the amount of ETH deposited in the contract
    async getUserBalance(signer: any) {
        try {
            if (!signer) return { success: false, error: "Wallet not connected" };

            const contract = getContract(signer);
            // Ensure we get the correct address from signer
            const address = await toRaw(signer).getAddress();
            console.log("Address:", address);
            console.log("Contract:", contract);

            // Get deposited balance
            const balanceWei = await (contract as any).deposits(address);

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
            const borrowedWei = await (contract as any).loans(address);

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

            const tokenAddress = await (contract as any).lendingToken();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);

            const amountBI = ethers.parseEther(amount);

            // 1. Check Balance
            const balance = await (tokenContract as any).balanceOf(userAddress);
            if (balance < amountBI) {
                return { success: false, error: "Insufficient MockToken balance to repay" };
            }

            // 2. Check Allowance
            const allowance = await (tokenContract as any).allowance(userAddress, LENDING_POOL_ADDRESS);
            if (allowance < amountBI) {
                console.log("Approving tokens for repay...");
                const txApprove = await (tokenContract as any).approve(LENDING_POOL_ADDRESS, amountBI);
                await txApprove.wait();
            }

            // 3. Repay
            const tx = await (contract as any).repay(amountBI);
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
            const loanAmount = await (contract as any).loans(borrowerAddress);
            if (loanAmount <= 0) throw new Error("User has no debt");

            // 2. Check liquidator Balance
            const tokenAddress = await (contract as any).lendingToken();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);
            const balance = await (tokenContract as any).balanceOf(userAddress);

            if (balance < loanAmount) {
                return { success: false, error: "Insufficient MockToken balance to liquidate" };
            }

            // 3. Check Allowance
            const allowance = await (tokenContract as any).allowance(userAddress, LENDING_POOL_ADDRESS);
            if (allowance < loanAmount) {
                const txApprove = await (tokenContract as any).approve(LENDING_POOL_ADDRESS, loanAmount);
                await txApprove.wait();
            }

            // 4. Liquidate
            const tx = await (contract as any).liquidate(borrowerAddress);
            await tx.wait();

            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Liquidation Error:", error);
            return { success: false, error: error.message || "Liquidation failed" };
        }
    },

    async getWalletTokenBalance(signer: any) {
        try {
            if (!signer) return { success: false, error: "Wallet not connected" };
            const rawSigner = toRaw(signer);
            const userAddress = await rawSigner.getAddress();
            const contract = getContract(rawSigner);
            
            // ERC20 Minimal ABI
            const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
            const tokenAddress = await (contract as any).lendingToken();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);

            const balance = await (tokenContract as any).balanceOf(userAddress);
            return { success: true, data: ethers.formatEther(balance) };
        } catch (error: any) {
            console.error("Get Wallet Token Balance Error:", error);
            return { success: false, error: error.message };
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
    },

    // --- Supply Liquidity (ERC20) ---
    async supplyToken(signer: any, amount: string) {
        try {
            const contract = getContract(signer);
            const rawSigner = toRaw(signer);
            const userAddress = await rawSigner.getAddress();

            // ERC20 Minimal ABI
            const ERC20_ABI = [
                "function balanceOf(address) view returns (uint256)",
                "function approve(address, uint256) returns (bool)",
                "function allowance(address, address) view returns (uint256)"
            ];

            const tokenAddress = await (contract as any).lendingToken();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);

            const amountBI = ethers.parseEther(amount);

            // 1. Check Token Balance
            const balance = await (tokenContract as any).balanceOf(userAddress);
            if (balance < amountBI) {
                return { success: false, error: "Insufficient MockToken balance to supply" };
            }

            // 2. Check Allowance
            const allowance = await (tokenContract as any).allowance(userAddress, LENDING_POOL_ADDRESS);
            if (allowance < amountBI) {
                console.log("Approving tokens for supply...");
                const txApprove = await (tokenContract as any).approve(LENDING_POOL_ADDRESS, amountBI);
                await txApprove.wait();
            }

            // 3. Supply
            const tx = await (contract as any).supply(amountBI);
            await tx.wait();

            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Supply Error:", error);
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                return { success: false, error: "Transaction rejected by user." };
            }
            return { success: false, error: error.message || "Supply failed" };
        }
    },

    async withdrawSupplyToken(signer: any, amount: string) {
        try {
            const contract = getContract(signer);
            const amountBI = ethers.parseEther(amount);

            const tx = await (contract as any).withdrawSupply(amountBI);
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Withdraw Supply Error:", error);
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                 return { success: false, error: "Transaction rejected by user." };
            }
            return { success: false, error: error.message || "Withdraw supply failed" };
        }
    },

    async getUserSupplyTokenBalance(signer: any) {
        try {
             if (!signer) return { success: false, error: "Wallet not connected" };
             const contract = getContract(signer);
             const address = await toRaw(signer).getAddress();
             
             // Check if suppliedTokens exists in ABI (it might not if not re-compiled yet, but accessing via ethers works if dynamic)
             // However, types might complain if using a typed contract which we are not (using as any).
             if (!(contract as any).suppliedTokens) {
                 return { success: true, data: "0.0" };
             }

             const supplyWei = await (contract as any).suppliedTokens(address);
             return { success: true, data: ethers.formatEther(supplyWei) };
        } catch (error: any) {
             console.error("Get User Supply Token Balance Error:", error);
             return { success: false, error: error.message || "Failed to fetch supply token balance" };
        }
    },

    async getPoolETHBalance(signer: any) {
        try {
            const rawSigner = toRaw(signer);
            const provider = rawSigner.provider;
            if (!provider) return { success: false, error: "Provider not found" };
            
            const balance = await provider.getBalance(LENDING_POOL_ADDRESS);
            return { success: true, data: ethers.formatEther(balance) };
        } catch (error: any) {
            console.error("Get Pool ETH Balance Error:", error);
            return { success: false, error: error.message || "Failed to fetch pool ETH balance" };
        }
    },

    async getETHPrice(signer: any) {
        try {
            const rawSigner = toRaw(signer);
            const contract = getContract(rawSigner);
            const price = await (contract as any).ethPrice();
            return { success: true, data: price.toString() };
        } catch (error: any) {
            console.error("Get ETH Price Error:", error);
            return { success: false, error: error.message || "Failed to fetch ETH price" };
        }
    },

    async updateETHPrice(signer: any, newPrice: string) {
        try {
            const rawSigner = toRaw(signer);
            const contract = getContract(rawSigner);
            
            const tx = await (contract as any).updatePrice(newPrice);
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Update ETH Price Error:", error);
            return { success: false, error: error.message || "Update price failed" };
        }
    },

    async setInterestParameters(signer: any, baseRate: string, multiplier: string) {
        try {
            const contract = getContract(signer);
            
            // Note: Contract expects 1e18 scaled "per second" rates.
            // Input here should be raw strings representing the big integers.
            // It is up to the UI to calculate APY % -> Per Second BigInt.
            
            const tx = await (contract as any).setInterestParameters(baseRate, multiplier);
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Set Interest Params Error:", error);
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                 return { success: false, error: "Transaction rejected by user." };
            }
            return { success: false, error: error.message || "Setting parameters failed" };
        }
    },

    async getMarketDetails(signer: any) {
        try {
            const contract = getContract(signer);
            const rawSigner = toRaw(signer);
            
            // 1. Fetch Contract Params
            // Use try-catch for these calls individually or Promise.allSettled if unsure of contract version, 
            // but we assume updated contract here.
            const baseRateStr = await (contract as any).BASE_RATE_PER_SECOND();
            const multiStr = await (contract as any).MULTIPLIER_PER_SECOND();
            const totalBorrowsStr = await (contract as any).totalBorrowsGlobal();
            
            // 2. Fetch Pool Liquidity (Cash)
            const tokenAddress = await (contract as any).lendingToken();
             const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, rawSigner);
            const cashStr = await (tokenContract as any).balanceOf(LENDING_POOL_ADDRESS);
            
            // 3. Calculate Rates
            const WAD = 1000000000000000000n; // 1e18
            const SECONDS_PER_YEAR = 31536000n;
            
            const baseRate = BigInt(baseRateStr);
            const multiplier = BigInt(multiStr);
            const totalBorrows = BigInt(totalBorrowsStr);
            const cash = BigInt(cashStr);
            const totalSup = totalBorrows + cash;
            
            let util = 0n;
            if (totalSup > 0n) {
                util = (totalBorrows * WAD) / totalSup;
            }
            
            // Borrow Rate = Base + (Multiplier * Util)
            const borrowRatePerSec = baseRate + (multiplier * util) / WAD;
            
            // Supply Rate = Borrow Rate * Util
            const supplyRatePerSec = (borrowRatePerSec * util) / WAD;
            
            // Convert to APY % (Simple APR calculation matching contract logic)
            // Rate * SecondsPerYear * 100 
            // Scale: (Rate(1e18) * Seconds * 100) / 1e18 = Percent
            const borrowAPY = (Number(borrowRatePerSec) * Number(SECONDS_PER_YEAR) * 100) / Number(WAD);
            const supplyAPY = (Number(supplyRatePerSec) * Number(SECONDS_PER_YEAR) * 100) / Number(WAD);
            
            // Format Large Numbers
            const totalBorrowsFmt = parseFloat(ethers.formatEther(totalBorrows));
            const totalSupplyFmt = parseFloat(ethers.formatEther(totalSup));
            
            return {
                success: true,
                data: {
                    totalBorrows: totalBorrowsFmt,
                    totalSupply: totalSupplyFmt,
                    borrowAPY: borrowAPY, // Number, e.g. 5.2
                    supplyAPY: supplyAPY, // Number, e.g. 2.1
                    utilization: Number(util) / Number(WAD) * 100 // Percent
                }
            };
        } catch (error: any) {
            console.error("Get Market Details Error:", error);
            return { success: false, error: error.message };
        }
    }
};

