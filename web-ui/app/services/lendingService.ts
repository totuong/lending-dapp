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
            // Borrow amount is in Token units. Assuming Token has 18 decimals like ETH for simplicity in this example
            // If Token has different decimals, we need to handle that. 
            // The user prompt said: "ethers.parseEther when sending". 
            // Usually tokens use parseUnits, but if it'18 decimals, parseEther works.
            const tx = await contract.borrow(ethers.parseEther(amount));
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Borrow Error:", error);
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
    }
};
