// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingPool is ReentrancyGuard, Ownable {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public loans;

    IERC20 public lendingToken;
    uint256 public ethPrice; // Price of 1 ETH in LendingToken units (e.g. 2000 Tokens)

    address[] public borrowers;
    mapping(address => bool) public hasBorrowed;

    function getBorrowers() external view returns (address[] memory) {
        return borrowers;
    }

    event Deposit(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event PriceUpdated(uint256 newPrice);

    constructor(address _lendingToken, uint256 _initialEthPrice) {
        lendingToken = IERC20(_lendingToken);
        ethPrice = _initialEthPrice;
    }

    /**
     * @dev User deposits ETH into the pool.
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        deposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev User borrows tokens based on 80% LTV of their ETH deposit.
     * @param amount The amount of tokens to borrow.
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        uint256 ethValue = deposits[msg.sender];
        // Calculate max borrowable amount: (ETH Amount * Price * 80) / 100
        // We assume ethPrice has same decimals handling as the token for simplicity,
        // or effectively: 1 ETH * Price = Value in Token.
        // real-world oracles require careful decimal handling.
        uint256 collateralValueInToken = ethValue * ethPrice;
        uint256 maxBorrow = (collateralValueInToken * 80) / 100;

        require(
            loans[msg.sender] + amount <= maxBorrow,
            "Insufficient collateral"
        );
        require(
            lendingToken.balanceOf(address(this)) >= amount,
            "Insufficient pool liquidity"
        );

        loans[msg.sender] += amount;

        if (!hasBorrowed[msg.sender]) {
            borrowers.push(msg.sender);
            hasBorrowed[msg.sender] = true;
        }

        require(lendingToken.transfer(msg.sender, amount), "Transfer failed");

        emit Borrow(msg.sender, amount);
    }

    /**
     * @dev User repays tokens to reduce debt.
     * @param amount The amount of tokens to repay.
     */
    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(loans[msg.sender] >= amount, "Amount exceeds debt");

        // Decrement the loan balance
        loans[msg.sender] -= amount;

        // Transfer tokens from user to contract
        require(
            lendingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        emit Repay(msg.sender, amount);
    }

    /**
     * @dev Mock Oracle function to update ETH price.
     * @param _newPrice New price of 1 ETH in Token.
     */
    function updatePrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be > 0");
        ethPrice = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    // Function to fund the contract with lending tokens (for testing purposes)
    function fundPool(uint256 amount) external onlyOwner {
        require(
            lendingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
    }

    /**
     * @dev Liquidate a user's position if Health Factor < 1.
     * @param user The address of the borrower to liquidate.
     */
    function liquidate(address user) external nonReentrant {
        uint256 totalDebt = loans[user];
        require(totalDebt > 0, "No debt to liquidate");

        uint256 ethValue = deposits[user];
        uint256 collateralValueInToken = ethValue * ethPrice;
        // Max borrow allowed is 80% of collateral value
        uint256 maxBorrow = (collateralValueInToken * 80) / 100;

        require(totalDebt > maxBorrow, "Health Factor is >= 1");

        // Calculate collateral to seize: (Debt / Price) + 10% bonus
        // Debt in Token / Price = ETH value of Debt
        uint256 baseCollateralETH = totalDebt / ethPrice;
        uint256 bonusETH = (baseCollateralETH * 10) / 100;
        uint256 totalCollateralToSeize = baseCollateralETH + bonusETH;

        require(
            deposits[user] >= totalCollateralToSeize,
            "Insufficient collateral to seize"
        );

        // Repay debt: Liquidator pays Token
        require(
            lendingToken.transferFrom(msg.sender, address(this), totalDebt),
            "Token transfer failed"
        );

        // Update state
        loans[user] = 0;
        deposits[user] -= totalCollateralToSeize;

        // Send seized ETH to liquidator
        (bool success, ) = msg.sender.call{value: totalCollateralToSeize}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @dev User withdraws ETH from their deposit.
     * @param amount The amount of ETH to withdraw.
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(deposits[msg.sender] >= amount, "Insufficient balance");

        // Check Health Factor after withdrawal
        uint256 totalDebt = loans[msg.sender];
        if (totalDebt > 0) {
            uint256 remainingCollateral = deposits[msg.sender] - amount;
            uint256 collateralValueInToken = remainingCollateral * ethPrice;
            uint256 maxBorrow = (collateralValueInToken * 80) / 100;
            
            require(totalDebt <= maxBorrow, "Cannot withdraw: Health Factor would depend drop below 1");
        }

        deposits[msg.sender] -= amount;
        
        emit Withdraw(msg.sender, amount);

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    event Withdraw(address indexed user, uint256 amount);

    // --- Supply Liquidity Feature ---
    mapping(address => uint256) public suppliedTokens;
    event Supply(address indexed user, uint256 amount);
    event WithdrawSupply(address indexed user, uint256 amount);

    /**
     * @dev User supplies Lending Tokens (MCK) to the pool.
     * @param amount The amount of tokens to supply.
     */
    function supply(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user to contract
        require(
            lendingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        suppliedTokens[msg.sender] += amount;
        emit Supply(msg.sender, amount);
    }

    /**
     * @dev User withdraws supplied Lending Tokens.
     * @param amount The amount of tokens to withdraw.
     */
    function withdrawSupply(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(suppliedTokens[msg.sender] >= amount, "Insufficient supply balance");
        
        // Check if there is enough liquidity (liquidity might be borrowed)
        require(
            lendingToken.balanceOf(address(this)) >= amount,
            "Insufficient pool liquidity to withdraw"
        );

        suppliedTokens[msg.sender] -= amount;

        require(
            lendingToken.transfer(msg.sender, amount),
            "Transfer failed"
        );

        emit WithdrawSupply(msg.sender, amount);
    }
}
