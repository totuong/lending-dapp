import { ethers } from 'ethers';

export const useWeb3 = () => {
    const account = useState<string | null>('web3_account', () => null);
    const isConnected = useState<boolean>('web3_isConnected', () => false);
    const provider = useState<ethers.BrowserProvider | null>('web3_provider', () => null);
    const signer = useState<ethers.JsonRpcSigner | null>('web3_signer', () => null);

    const connectWallet = async () => {
        if (process.client && (window as any).ethereum) {
            try {
                const _provider = new ethers.BrowserProvider((window as any).ethereum);
                const accounts = await _provider.send("eth_requestAccounts", []);

                if (accounts.length > 0) {
                    const _signer = await _provider.getSigner();

                    provider.value = _provider;
                    signer.value = _signer;
                    account.value = accounts[0];
                    isConnected.value = true;

                    // Setup listeners
                    (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
                    (window as any).ethereum.on('chainChanged', handleChainChanged);
                }
            } catch (error) {
                console.error("User denied account access or error occurred:", error);
            }
        } else {
            console.warn("MetaMask not installed or not in client environment");
        }
    };

    const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
            // User disconnected
            disconnect();
        } else {
            account.value = accounts[0];
            // Re-instantiate signer if needed, or just update account
            if (provider.value) {
                const _signer = await provider.value.getSigner();
                signer.value = _signer;
            }
        }
    };

    const handleChainChanged = (_chainId: string) => {
        // Reload page on chain change as recommended by MetaMask
        window.location.reload();
    };

    const disconnect = () => {
        account.value = null;
        isConnected.value = false;
        provider.value = null;
        signer.value = null;

        // Remove listeners if possible, but cleanup might be tricky with anonymous functions or global objects
        // window.ethereum.removeListener works if we pass the same function reference
        if (process.client && (window as any).ethereum) {
            (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
            (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        }
    };

    // Optional: Auto-connect if already authorized? 
    // For now, we only connect on explicit action or if we want to check persistance.
    // We can add an init function if needed.

    return {
        account,
        isConnected,
        provider,
        signer,
        connectWallet,
        disconnect
    };
};
