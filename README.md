# Lending DApp

A decentralized lending application connecting lenders and borrowers using Ethereum smart contracts. This project consists of a Hardhat-based blockchain environment and a NuxtJS 3 web interface.

## Project Structure

*   **`blockchain/`**: Contains Solidity smart contracts, tests, and deployment scripts.
*   **`web-ui/`**: A modern web dashboard built with Nuxt 3, Tailwind CSS, PrimeVue, Chart.js, and Ethers.js.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v16.0.0 or later recommended)
*   [MetaMask](https://metamask.io/) browser extension

## Getting Started

### 1. Blockchain Setup (Backend)

Run a local blockchain node and deploy contracts.

1.  Open a terminal and navigate to the `blockchain` folder:
    ```bash
    cd blockchain
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the local Hardhat node (keep this terminal running):
    ```bash
    npx hardhat node
    ```

4.  Open a **new** terminal window and deploy the contracts:
    ```bash
    cd blockchain
    npm run deploy
    ```
    *Note: Copy the `LendingPool` contract address printed in the console.*

### Option 2: Deploy & Seed Data (Recommended for Dev)

To start with a pre-populated environment (contracts deployed + user deposits/loans):
```bash
cd blockchain
# Runs the seed script (deploys contracts + seeds data)
npm run seed -- --network localhost
```
*Use the addresses printed by this script in your frontend.*

### Quickstart (Combined)
To deploy and seed (running both scripts sequentially):
```bash
cd blockchain
npm run deploy-full
```

### 2. Web UI Setup (Frontend)

Run the user interface.

1.  Navigate to the `web-ui` folder:
    ```bash
    cd web-ui
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure the environment:
    *   The project uses `web-ui/.env`.
    *   Ensure `VITE_CONTRACT_ADDRESS` matches your deployed address.
    *   Example `.env`:
        ```properties
        VITE_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
        VITE_CHAIN_ID=1337
        ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Open your browser at `http://localhost:3000`.

## Connecting MetaMask

> **Video Tutorial**: For a visual guide on setting up the local network, verify from [in this video](https://www.youtube.com/watch?v=bYD9gaU_n6M).

**Important Note**: If you see "Failed to connect" or "No code at contract address", please ensure:
1.  **Network**: You are connected to **Hardhat Localhost** (ChainID 1337), not Mainnet.
2.  **Permissions**: If you previously rejected the connection, click the MetaMask extension icon to manually connect the site.
3.  **Reset**: If you restarted the Hardhat node, you must **Settings > Advanced > Clear Activity Tab Data** (Reset Account) in MetaMask to fix nonce errors.

1.  Open MetaMask and add a custom network:
    *   **Network Name**: Hardhat Local (or Localhost 8545)
    *   **RPC URL**: `http://127.0.0.1:8545/`
    *   **Chain ID**: `1337` (or `31337` if `1337` doesn't work)
    *   **Currency Symbol**: ETH
2.  Import an Account:
    *   Use one of the private keys displayed when you started `npx hardhat node` (e.g., Account #0).
    *   Paste the private key into MetaMask -> Import Account to access test funds (10,000 ETH).

### Troubleshooting
*   **"No code at contract address"**:
    *   This means the contract address in your `.env` does not exist on the current blockchain.
    *   **Fix**: Restart deployment (`npm run deploy -- --network localhost`) and update new address in `.env`.
*   **"Nonce too high"**:
    *   Happens when Hardhat node restarts but MetaMask remembers old transaction count.
    *   **Fix**: MetaMask -> Settings -> Advanced -> Clear Activity Tab Data.

## Features

*   **Deposit**: Deposit ETH into the pool to earn interest (mock logic).
*   **Borrow**: Borrow tokens (MCK) using your ETH as collateral (80% LTV).
*   **Dashboard**: Real-time view of deposits, wallet status, and Health Factor.
*   **My Assets**: Detailed breakdown of supplied and borrowed positions.
*   **Guide**: Integrated user documentation and feature explanations.
*   **Settings**: Dark mode toggle and multi-language support (English/Vietnamese).
*   **Repay**: Repay borrowed tokens to recover collateral and improve Health Factor.
*   **Liquidation**: Visual indicator for undercollateralized positions (Health Factor < 1.0).
*   **Withdraw**: Withdraw supplied assets when they are not locked as collateral.

## Interest Rate Model

The protocol uses a **Linear Interest Rate Model** to dynamically adjust rates based on pool utilization.

*   **Utilization Rate ($U$)**: Calculated as `Total Borrows / Total Supply`.
    *   $U = 0\%$: Low demand, low rates.
    *   $U = 100\%$: High demand, high rates.
*   **Borrow APY**: Increases linearly with utilization.
    *   Formula: $Rate = Base + (Multiplier \times U)$
    *   Base Rate: ~5% APY
    *   Multiplier: ~20% (at 100% utilization, rate is ~25%)
*   **Supply APY**: Derived from Borrow APY and Utilization.
    *   Formula: $Supply Rate = Borrow Rate \times U$
    *   Suppliers earn a share of the interest paid by borrowers. As utilization rises, Supply APY increases.
*   **Accrual**: Interest accrues every second and is compounded whenever a user interacts with the pool (deposit, borrow, repay, etc.).

## Development Accounts (Hardhat Localhost)

These accounts are pre-funded with 10,000 ETH on the local network (ChainID: 1337/31337).

| Account | Address | Private Key |
| :--- | :--- | :--- |
| #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| #3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| #4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |
| #5 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |
| #6 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e` |
| #7 | `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955` | `0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356` |
| #8 | `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` | `0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97` |
| #9 | `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` | `0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6` |
| #10 | `0xBcd4042DE499D14e55001CcbB24a551F3b954096` | `0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897` |
| #11 | `0x71bE63f3384f5fb98995898A86B02Fb2426c5788` | `0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82` |
| #12 | `0xFABB0ac9d68B0B445fB7357272Ff202C5651694a` | `0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1` |
| #13 | `0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec` | `0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd` |
| #14 | `0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097` | `0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa` |
| #15 | `0xcd3B766CCDd6AE721141F452C550Ca635964ce71` | `0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61` |
| #16 | `0x2546BcD3c84621e976D8185a91A922aE77ECEc30` | `0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0` |
| #17 | `0xbDA5747bFD65F08deb54cb465eB87D40e51B197E` | `0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd` |
| #18 | `0xdD2FD4581271e230360230F9337D5c0430Bf44C0` | `0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0` |
| #19 | `0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199` | `0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e` |

