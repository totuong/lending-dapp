import { ethers } from 'ethers';
import { useWeb3 } from '../composables/useWeb3';

// Address of the deployed LendingPool contract
// TODO: Replace with actual deployed contract address
// Address of the deployed LendingPool contract
const LENDING_POOL_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;

// ABI for the LendingPool contract
import LendingPoolArtifact from '../utils/abis/LendingPool.json';
const LENDING_POOL_ABI = LendingPoolArtifact.abi;

const getContract = async () => {
    const { signer } = useWeb3();
    if (!signer.value) throw new Error("Wallet not connected");
    return new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer.value);
};

export const lendingService = {
    async depositETH(amount: string) {
        try {
            const contract = await getContract();
            const tx = await contract.deposit({ value: ethers.parseEther(amount) });
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Deposit Error:", error);
            return { success: false, error: error.message || "Deposit failed" };
        }
    },

    async borrowToken(amount: string) {
        try {
            const contract = await getContract();
            // Borrow amount is in Token units. Assuming Token has 18 decimals like ETH for simplicity in this example
            // If Token has different decimals, we need to handle that. 
            // The user prompt said: "ethers.parseEther when sending". 
            // Usually tokens use parseUnits, but if it's 18 decimals, parseEther works.
            const tx = await contract.borrow(ethers.parseEther(amount));
            await tx.wait();
            return { success: true, data: tx.hash };
        } catch (error: any) {
            console.error("Borrow Error:", error);
            return { success: false, error: error.message || "Borrow failed" };
        }
    },

    async getUserBalance() {
        try {
            const { signer } = useWeb3();
            if (!signer.value) return { success: false, error: "Wallet not connected" };

            const contract = await getContract();
            const address = await signer.value.getAddress();

            // Get deposited balance
            const balanceWei = await contract.deposits(address);

            return { success: true, data: ethers.formatEther(balanceWei) };
        } catch (error: any) {
            console.error("Get Balance Error:", error);
            return { success: false, error: error.message || "Failed to fetch balance" };
        }
    }
};
