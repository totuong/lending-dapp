import { ethers } from 'ethers';
import { useToast } from 'primevue/usetoast';

// Module-level variables to track active event listeners
// This ensures we can remove the EXACT function reference that was added,
// even if disconnect() is called from a different component setup instance.
let activeAccountsChangedCallback: ((accounts: string[]) => void) | null = null;
let activeChainChangedCallback: ((chainId: string) => void) | null = null;

export const useWeb3 = () => {
    const account = useState<string | null>('web3_account', () => null);
    const isConnected = useState<boolean>('web3_isConnected', () => false);
    const provider = useState<ethers.BrowserProvider | null>('web3_provider', () => null);
    const signer = useState<ethers.JsonRpcSigner | null>('web3_signer', () => null);

    const router = useRouter();
    const toast = useToast();

    // Define handlers (these capture the current useState refs)
    const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
            disconnect();
        } else {
            console.log("Updating account from event:", accounts[0]);
            account.value = accounts[0];
            isConnected.value = true; // Ensure status reflects account presence
            if (provider.value) {
                const _signer = await provider.value.getSigner();
                signer.value = _signer; 
                router.push('/dashboard');
            }
        }
    };

    const handleChainChanged = (_chainId: string) => {
        window.location.reload();
    };

    const setupListeners = () => {
        if (process.client && (window as any).ethereum) {
            // Remove existing if any (cleanup safety)
            if (activeAccountsChangedCallback) {
                (window as any).ethereum.removeListener('accountsChanged', activeAccountsChangedCallback);
            }
            if (activeChainChangedCallback) {
                (window as any).ethereum.removeListener('chainChanged', activeChainChangedCallback);
            }

            // Assign new references
            activeAccountsChangedCallback = handleAccountsChanged;
            activeChainChangedCallback = handleChainChanged;

            // Add listeners
            (window as any).ethereum.on('accountsChanged', activeAccountsChangedCallback);
            (window as any).ethereum.on('chainChanged', activeChainChangedCallback);
        }
    };

    const removeListeners = () => {
        if (process.client && (window as any).ethereum) {
            if (activeAccountsChangedCallback) {
                (window as any).ethereum.removeListener('accountsChanged', activeAccountsChangedCallback);
                activeAccountsChangedCallback = null;
            }
            if (activeChainChangedCallback) {
                (window as any).ethereum.removeListener('chainChanged', activeChainChangedCallback);
                activeChainChangedCallback = null;
            }
        }
    };

    const connectWallet = async () => {
        console.log("Attempting to connect wallet...");
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
                    router.push('/dashboard');
                    toast.add({ severity: 'success', summary: 'Connected', detail: 'Wallet connected successfully!', life: 3000 });

                    // Persistence: user explicitly connected
                    localStorage.setItem('isExplicitlyDisconnected', 'false');

                    setupListeners();
                    console.log("Wallet connected successfully:", accounts[0]);
                }
            } catch (error) {
                console.error("User denied account access or error occurred:", error);
                toast.add({ severity: 'error', summary: 'Connection Failed', detail: 'User denied account access.', life: 3000 });
            }
        } else {
           // ... (MetaMask check code) ...
           console.warn("MetaMask not installed");
           toast.add({ severity: 'warn', summary: 'Wallet Missing', detail: 'MetaMask not found', life: 3000 });
        }
    };

    const disconnect = () => {
        console.log("Disconnecting wallet...");
        account.value = null;
        isConnected.value = false;
        provider.value = null;
        signer.value = null;
        router.push('/');
        toast.add({ severity: 'info', summary: 'Disconnected', detail: 'Wallet disconnected.', life: 3000 });

        // Persistence: user explicitly disconnected
        localStorage.setItem('isExplicitlyDisconnected', 'true');

        removeListeners();
        console.log("Wallet disconnected, Listeners removed.");
    };

    const initWallet = async () => {
        console.log("Initializing wallet (persistence check)...");
        
        // If user explicitly disconnected, do not auto-connect
        if (localStorage.getItem('isExplicitlyDisconnected') === 'true') {
            console.log("User explicitly disconnected previously. Skipping auto-connect.");
            return;
        }

        if (process.client && (window as any).ethereum) {
            try {
                const _provider = new ethers.BrowserProvider((window as any).ethereum);
                const accounts = await _provider.send("eth_accounts", []);
                console.log("Found accounts:", accounts);

                if (accounts.length > 0) {
                     const _signer = await _provider.getSigner();
                     provider.value = _provider;
                     signer.value = _signer;
                     account.value = accounts[0];
                     isConnected.value = true;
                     
                     setupListeners();
                     console.log("Wallet auto-connected.");
                }
            } catch (error) {
                console.error("Auto-connect failed:", error);
            }
        }
    };

    return {
        account,
        isConnected,
        provider,
        signer,
        connectWallet,
        disconnect,
        initWallet
    };
};
