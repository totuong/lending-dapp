# Lending DApp

A decentralized lending application connecting lenders and borrowers using Ethereum smart contracts. This project consists of a Hardhat-based blockchain environment and a NuxtJS 3 web interface.

## Project Structure

*   **`blockchain/`**: Contains Solidity smart contracts, tests, and deployment scripts.
*   **`web-ui/`**: A modern web dashboard built with Nuxt 3, Tailwind CSS, and Ethers.js.

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
    npx hardhat run scripts/deploy.js --network localhost
    ```
    *Note: Copy the `LendingPool` contract address printed in the console.*

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

> **Video Tutorial**: For a visual guide on setting up the local network, verify from [4:02 in this video](https://www.youtube.com/watch?v=bYD9gaU_n6M).

1.  Open MetaMask and add a custom network:
    *   **Network Name**: Hardhat Local (or Localhost 8545)
    *   **RPC URL**: `http://127.0.0.1:8545/`
    *   **Chain ID**: `1337` (or `31337` if `1337` doesn't work)
    *   **Currency Symbol**: ETH
2.  Import an Account:
    *   Use one of the private keys displayed when you started `npx hardhat node` (e.g., Account #0).
    *   Paste the private key into MetaMask -> Import Account to access test funds (10,000 ETH).

## Features

*   **Deposit**: Deposit ETH into the pool to earn interest (mock logic).
*   **Borrow**: Borrow tokens (MCK) using your ETH as collateral (80% LTV).
*   **Dashboard**: Real-time view of your deposits and wallet status.
